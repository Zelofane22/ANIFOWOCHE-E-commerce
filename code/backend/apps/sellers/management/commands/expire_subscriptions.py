"""Rétrograde les vendeurs dont l'abonnement payant a expiré (plan FREE).

À exécuter périodiquement (cron) pour appliquer la fin de période des
abonnements : la bascule de plan ne doit dépendre d'aucune action utilisateur.
"""
from django.core.management.base import BaseCommand

from apps.sellers.services import expire_subscriptions


class Command(BaseCommand):
    help = "Rétrograde au plan FREE les vendeurs dont l'abonnement payant a expiré."

    def handle(self, *args, **options):
        downgraded = expire_subscriptions()
        if downgraded:
            self.stdout.write(self.style.SUCCESS(f"{downgraded} vendeur(s) rétrogradé(s) au plan FREE."))
        else:
            self.stdout.write("Aucun abonnement expiré.")
