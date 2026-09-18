"""Relance par email les clients dont le panier n'a pas été finalisé.

À exécuter quotidiennement (cron) : recherche les paniers abandonnés éligibles,
vérifie une dernière fois qu'aucune commande n'a été créée, envoie l'email et
pose ``reminder_sent_at`` uniquement après succès Resend. Les erreurs sont
journalisées sans interrompre les autres envois.
"""
from django.core.management.base import BaseCommand

from apps.orders.services import send_abandoned_cart_reminders


class Command(BaseCommand):
    help = "Relance par email les paniers abandonnés éligibles."

    def handle(self, *args, **options):
        sent = send_abandoned_cart_reminders()
        if sent:
            self.stdout.write(self.style.SUCCESS(f"{sent} relance(s) de panier abandonné envoyée(s)."))
        else:
            self.stdout.write("Aucune relance de panier abandonné à envoyer.")
