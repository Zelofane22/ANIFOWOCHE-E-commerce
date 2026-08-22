import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import m2m_changed, pre_delete, pre_save
from django.dispatch import receiver

from apps.notifications.services import notify_sensitive_action

from .middleware import get_current_user
from .middleware import FORCE_PASSWORD_CHANGE_SESSION_KEY

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(user_logged_in)
def flag_default_password_on_login(sender, request, user, **kwargs):
    # Marque la session si le superadmin utilise encore le mot de passe par défaut
    # (le middleware le forcera alors à changer de mot de passe).
    if user.check_password(settings.DEFAULT_SUPERUSER_PASSWORD):
        request.session[FORCE_PASSWORD_CHANGE_SESSION_KEY] = True


def _get_actor():
    """Récupère l'utilisateur courant depuis le thread-local du middleware."""
    return get_current_user()


# ── pre_delete : objets critiques ──────────────────────────────────────────

@receiver(pre_delete, sender="products.Product")
def notify_product_deleted(sender, instance, **kwargs):
    actor = _get_actor()
    notify_sensitive_action(action="Suppression de produit", obj=instance, actor=actor)


@receiver(pre_delete, sender="orders.Order")
def notify_order_deleted(sender, instance, **kwargs):
    actor = _get_actor()
    notify_sensitive_action(action="Suppression de commande", obj=instance, actor=actor)


@receiver(pre_delete, sender=User)
def notify_staff_user_deleted(sender, instance, **kwargs):
    if not instance.is_staff:
        return
    actor = _get_actor()
    notify_sensitive_action(action="Suppression d'un compte staff", obj=instance, actor=actor)


# ── pre_save User : changements de permissions (is_staff / is_superuser) ────

@receiver(pre_save, sender=User)
def notify_user_permission_changed(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old = User.objects.get(pk=instance.pk)
    except User.DoesNotExist:
        return

    changes = []
    if old.is_staff != instance.is_staff:
        label = "activé" if instance.is_staff else "désactivé"
        changes.append(f"is_staff {label}")
    if old.is_superuser != instance.is_superuser:
        label = "activé" if instance.is_superuser else "désactivé"
        changes.append(f"is_superuser {label}")

    if changes:
        actor = _get_actor()
        notify_sensitive_action(
            action=f"Changement de permissions ({', '.join(changes)})",
            obj=instance,
            actor=actor,
        )


# ── m2m_changed User.groups : changement de groupes ───────────────────────

@receiver(m2m_changed, sender=User.groups.through)
def notify_user_groups_changed(sender, instance, action, **kwargs):
    if action not in ("post_add", "post_remove", "post_clear"):
        return
    actor = _get_actor()
    notify_sensitive_action(
        action="Changement de permissions (groupes modifiés)",
        obj=instance,
        actor=actor,
    )


# ── pre_save Product : changement de prix ──────────────────────────────────

@receiver(pre_save, sender="products.Product")
def notify_product_price_changed(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_price = sender.objects.filter(pk=instance.pk).values_list("price_xof", flat=True).get()
    except sender.DoesNotExist:
        return
    if old_price != instance.price_xof:
        actor = _get_actor()
        notify_sensitive_action(
            action=f"Changement de prix ({old_price} → {instance.price_xof} XOF)",
            obj=instance,
            actor=actor,
        )
