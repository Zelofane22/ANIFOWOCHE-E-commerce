import csv
import io
import json
from datetime import datetime, timedelta

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse
from django.shortcuts import render
from django.urls import reverse
from django.utils import timezone

from apps.core.models import SettingChangeRequest
from apps.core.saas_metrics import build_saas_report
from apps.notifications.models import NotificationSettings
from apps.payments.models import PaymentSettings

from .models import StoreSettings

REPORT_PERIODS = {"7": 7, "30": 30, "90": 90}


def _report_period(request):
    period = request.GET.get("period", "30")
    today = timezone.localdate()
    if period == "custom":
        try:
            start_date = datetime.strptime(request.GET["start"], "%Y-%m-%d").date()
            end_date = datetime.strptime(request.GET["end"], "%Y-%m-%d").date()
            if start_date <= end_date:
                return period, start_date, end_date
        except (KeyError, TypeError, ValueError):
            pass
        period = "30"
    days = REPORT_PERIODS.get(period, REPORT_PERIODS["30"])
    return period, today - timedelta(days=days - 1), today


class StoreStatusView(APIView):
    """Lecture publique de l'état de la boutique (Sprint 6) : mode maintenance
    et moyens de paiement actifs — le frontend s'en sert pour adapter le
    checkout, sans exposer le mécanisme de demande/validation lui-même."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Lit l'état courant de la boutique et des moyens de paiement.
        store_settings = StoreSettings.get_solo()
        payment_settings = PaymentSettings.get_solo()
        return Response(
            {
                "maintenance_mode": store_settings.maintenance_mode,
                "online_payment_enabled": payment_settings.online_payment_enabled,
                "payment_methods": {
                    "mtn": payment_settings.mtn_enabled,
                    "moov": payment_settings.moov_enabled,
                    "card": payment_settings.card_enabled,
                    "cash_on_delivery": payment_settings.cash_on_delivery_enabled,
                },
            }
        )


def _as_text(value):
    """Valeur CSV : vide si None, sinon texte brut."""
    return "" if value is None else value


@staff_member_required
def reports_view(request):
    """Page « Rapports » du backoffice : métriques SaaS ANIF Seller uniquement.

    Les statistiques de vente de la boutique officielle sont consultables dans
    son espace seller : ce rapport ne couvre que les abonnements, les boutiques
    vendeur et l'activation de la plateforme.
    """
    period, start_date, end_date = _report_period(request)
    start = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
    end = timezone.make_aware(datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    report = build_saas_report(start, end)

    if request.GET.get("export") == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Rapport SaaS ANIF Seller", f"{start_date:%d/%m/%Y} - {end_date:%d/%m/%Y}"])
        writer.writerow([])
        writer.writerow(["Indicateur", "Valeur"])
        writer.writerow(["CA abonnements encaissés (FCFA)", report["revenue"]])
        writer.writerow(["Abonnements payés", report["subscriptions_approved"]])
        writer.writerow(["Abonnements créés (tous statuts)", report["subscriptions_created"]])
        writer.writerow(["MRR (FCFA)", report["mrr"]])
        writer.writerow(["ARPU (FCFA)", _as_text(report["arpu"])])
        writer.writerow(["Taux de churn (%)", _as_text(report["churn_rate"])])
        writer.writerow(["Vendeurs payants", report["paying_vendors"]])
        writer.writerow(["Boutiques vendeur (total)", report["shops_total"]])
        writer.writerow(["Boutiques vendeur créées", report["shops_created"]])
        writer.writerow(["Taux d'activation (%)", _as_text(report["activation_rate"])])
        writer.writerow([])
        writer.writerow(["CA abonnements par jour", "Montant (FCFA)"])
        writer.writerows([[row["day"], row["total"]] for row in report["sales_by_day"]])
        writer.writerow([])
        writer.writerow(["Plan", "Abonnements payés"])
        writer.writerows([[row["plan"], row["count"]] for row in report["plan_mix"]])
        response = HttpResponse(output.getvalue(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = (
            f"attachment; filename=rapports-saas-{start_date:%Y%m%d}-{end_date:%Y%m%d}.csv"
        )
        return response

    context = {
        **admin.site.each_context(request),
        "title": "Rapports",
        "period": period,
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "period_label": f"du {start_date:%d/%m/%Y} au {end_date:%d/%m/%Y}",
        **report,
        "sales_chart_labels_json": json.dumps([row["day"] for row in report["sales_by_day"]]),
        "sales_chart_values_json": json.dumps([row["total"] for row in report["sales_by_day"]]),
        "plan_mix_labels_json": json.dumps([row["plan"] for row in report["plan_mix"]]),
        "plan_mix_values_json": json.dumps([row["count"] for row in report["plan_mix"]]),
    }
    return render(request, "admin/reports.html", context)


@staff_member_required
def settings_hub_view(request):
    """Page « Réglages boutique » de l'admin : état des réglages et demandes en attente."""
    # Lecture des réglages singleton de la boutique, des paiements et des notifications.
    store_settings = StoreSettings.get_solo()
    payment_settings = PaymentSettings.get_solo()
    notification_settings = NotificationSettings.get_solo()

    # Demandes de changement encore en attente de validation.
    pending_requests = SettingChangeRequest.objects.filter(status=SettingChangeRequest.Status.PENDING)

    # Assemblage du contexte et des liens admin de la page.
    context = {
        **admin.site.each_context(request),
        "title": "Réglages boutique",
        "store_settings": store_settings,
        "payment_settings": payment_settings,
        "notification_settings": notification_settings,
        "pending_requests_count": pending_requests.count(),
        "recent_requests": SettingChangeRequest.objects.select_related("requested_by", "reviewed_by")[:5],
        "links": {
            "store_settings": reverse("admin:core_storesettings_changelist"),
            "payment_settings": reverse("admin:payments_paymentsettings_changelist"),
            "notification_settings": reverse("admin:notifications_notificationsettings_changelist"),
            "setting_requests": reverse("admin:core_settingchangerequest_changelist"),
            "setting_request_add": reverse("admin:core_settingchangerequest_add"),
        },
    }
    return render(request, "admin/settings_hub.html", context)
