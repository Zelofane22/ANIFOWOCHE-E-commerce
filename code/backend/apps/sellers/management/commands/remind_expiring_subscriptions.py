"""Envoie un rappel aux vendeurs dont l'abonnement expire dans la semaine
(1 rappel tous les 2 jours). À exécuter quotidiennement (cron), comme
expire_subscriptions.
"""
from django.core.management.base import BaseCommand

from apps.sellers.services import remind_expiring_subscriptions


class Command(BaseCommand):
    help = "Envoie un rappel d'expiration aux abonnements vendeurs qui expirent bientôt."

    def handle(self, *args, **options):
        sent = remind_expiring_subscriptions()
        if sent:
            self.stdout.write(self.style.SUCCESS(f"{sent} rappel(s) envoyé(s)."))
        else:
            self.stdout.write("Aucun rappel à envoyer.")
