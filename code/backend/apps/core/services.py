from django.utils import timezone

from .models import SettingChangeRequest, StoreSettings

SettingKey = SettingChangeRequest.SettingKey

# Valeur "à risque" pour chaque réglage : c'est UNIQUEMENT une demande vers
# cette valeur qui doit être justifiée et validée par un superadmin. L'autre
# sens (revenir à l'état sûr : réactiver un moyen de paiement, sortir de
# maintenance...) s'applique tout de suite, quel que soit le demandeur.
RISKY_VALUES = {
    SettingKey.MAINTENANCE_MODE: True,
    SettingKey.ONLINE_PAYMENT_ENABLED: False,
    SettingKey.PAYMENT_METHOD_MTN: False,
    SettingKey.PAYMENT_METHOD_MOOV: False,
    SettingKey.PAYMENT_METHOD_CARD: False,
}

PAYMENT_METHOD_KEYS = {
    SettingKey.PAYMENT_METHOD_MTN,
    SettingKey.PAYMENT_METHOD_MOOV,
    SettingKey.PAYMENT_METHOD_CARD,
}


def is_risky_change(setting_key, target_value):
    """Détermine si le changement visé est « à risque » (nécessite validation superadmin)."""
    return RISKY_VALUES.get(setting_key) == target_value


def _would_cause_payment_lockout(setting_key, target_value):
    """Empêche qu'une décision (même prise par un superadmin) laisse le
    paiement en ligne actif sans aucun moyen de paiement utilisable — le
    blocage total demandé par l'utilisateur pour ce triplet de réglages."""
    from apps.payments.models import PaymentSettings

    # Lecture de l'état actuel des réglages de paiement.
    payment_settings = PaymentSettings.get_solo()
    online_payment_enabled = payment_settings.online_payment_enabled
    mtn_enabled = payment_settings.mtn_enabled
    moov_enabled = payment_settings.moov_enabled
    card_enabled = payment_settings.card_enabled

    # Simulation de la nouvelle valeur sur le réglage concerné.
    if setting_key == SettingKey.ONLINE_PAYMENT_ENABLED:
        online_payment_enabled = target_value
    elif setting_key == SettingKey.PAYMENT_METHOD_MTN:
        mtn_enabled = target_value
    elif setting_key == SettingKey.PAYMENT_METHOD_MOOV:
        moov_enabled = target_value
    elif setting_key == SettingKey.PAYMENT_METHOD_CARD:
        card_enabled = target_value

    # Blocage si le paiement en ligne reste actif sans aucun moyen utilisable.
    return online_payment_enabled and not (mtn_enabled or moov_enabled or card_enabled)


def _apply(setting_key, target_value):
    from apps.payments.models import PaymentSettings

    # Application du mode maintenance sur les réglages boutique.
    if setting_key == SettingKey.MAINTENANCE_MODE:
        store_settings = StoreSettings.get_solo()
        store_settings.maintenance_mode = target_value
        store_settings.save(update_fields=["maintenance_mode"])
        return

    # Application des autres réglages sur PaymentSettings.
    payment_settings = PaymentSettings.get_solo()
    field_by_key = {
        SettingKey.ONLINE_PAYMENT_ENABLED: "online_payment_enabled",
        SettingKey.PAYMENT_METHOD_MTN: "mtn_enabled",
        SettingKey.PAYMENT_METHOD_MOOV: "moov_enabled",
        SettingKey.PAYMENT_METHOD_CARD: "card_enabled",
    }
    field = field_by_key[setting_key]
    setattr(payment_settings, field, target_value)
    payment_settings.save(update_fields=[field])


def approve_setting_change(*, change_request, reviewer, note=""):
    """Applique la demande si elle est encore en attente, sauf si elle
    provoquerait un blocage total des paiements (refus automatique dans ce
    cas, même si le demandeur ou le validateur est superadmin)."""
    # Seule une demande encore en attente peut être approuvée.
    if change_request.status != SettingChangeRequest.Status.PENDING:
        return change_request

    # Refus automatique si l'application créerait un blocage total des paiements.
    if _would_cause_payment_lockout(change_request.setting_key, change_request.target_value):
        return reject_setting_change(
            change_request=change_request,
            reviewer=reviewer,
            note=(
                "Refusée automatiquement : cette action laisserait le paiement en ligne actif "
                "sans aucun moyen de paiement disponible."
            ),
        )

    # Application effective puis marquage de la demande comme approuvée.
    _apply(change_request.setting_key, change_request.target_value)
    change_request.status = SettingChangeRequest.Status.APPROVED
    change_request.reviewed_by = reviewer
    change_request.review_note = note
    change_request.reviewed_at = timezone.now()
    change_request.save(update_fields=["status", "reviewed_by", "review_note", "reviewed_at"])
    return change_request


def reject_setting_change(*, change_request, reviewer, note=""):
    """Marque une demande de changement de réglage comme refusée."""
    change_request.status = SettingChangeRequest.Status.REJECTED
    change_request.reviewed_by = reviewer
    change_request.review_note = note
    change_request.reviewed_at = timezone.now()
    change_request.save(update_fields=["status", "reviewed_by", "review_note", "reviewed_at"])
    return change_request


def process_new_request(change_request):
    """À appeler juste après la création d'une SettingChangeRequest (encore
    PENDING) : auto-approuve si le changement n'est pas à risque ou si le
    demandeur est superadmin ; sinon notifie les superadmins (email +
    interface admin) qu'une validation est nécessaire."""
    from apps.notifications.services import notify_setting_change_requested

    # Un changement est-il risqué, et le demandeur est-il superadmin ?
    risky = is_risky_change(change_request.setting_key, change_request.target_value)
    requester_is_superuser = bool(change_request.requested_by and change_request.requested_by.is_superuser)

    # Auto-approbation pour les changements sûrs ou demandés par un superadmin.
    if not risky or requester_is_superuser:
        approve_setting_change(
            change_request=change_request,
            reviewer=change_request.requested_by,
            note="Approuvée automatiquement (changement non risqué ou demandé par un superadmin).",
        )
    else:
        # Sinon, notification des superadmins pour validation manuelle.
        notify_setting_change_requested(change_request)
