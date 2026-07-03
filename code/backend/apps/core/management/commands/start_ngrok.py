import time

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "Ouvre un tunnel ngrok public vers le backend (port 8000), pour tester en "
        "local les webhooks externes (ex. FedaPay) qui ne peuvent pas atteindre "
        "localhost. Nécessite NGROK_AUTHTOKEN dans .env — voir "
        "https://dashboard.ngrok.com/get-started/your-authtoken."
    )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "Commande désactivée hors développement (DEBUG=False) : elle "
                "exposerait ce serveur publiquement. Outil de test local uniquement."
            )

        try:
            from pyngrok import conf, ngrok
            from pyngrok.exception import PyngrokNgrokError
        except ImportError as exc:
            raise CommandError(
                "pyngrok n'est pas installé (dépendance de dev uniquement, voir "
                "requirements-dev.txt). Reconstruisez l'image locale : "
                "docker compose up --build backend."
            ) from exc

        if not settings.NGROK_AUTHTOKEN:
            raise CommandError(
                "NGROK_AUTHTOKEN manquant dans .env. Créez un compte gratuit sur "
                "ngrok.com puis copiez votre authtoken depuis "
                "https://dashboard.ngrok.com/get-started/your-authtoken."
            )

        conf.get_default().auth_token = settings.NGROK_AUTHTOKEN

        try:
            tunnel = ngrok.connect(8000, "http")
        except PyngrokNgrokError as exc:
            raise CommandError(f"Échec d'ouverture du tunnel ngrok : {exc}") from exc

        self.stdout.write(self.style.SUCCESS(f"Tunnel ouvert : {tunnel.public_url}"))
        self.stdout.write(f"Webhook FedaPay à configurer sur : {tunnel.public_url}/api/payments/webhook/")
        self.stdout.write("Ctrl+C pour fermer le tunnel.")

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stdout.write("Fermeture du tunnel…")
            ngrok.disconnect(tunnel.public_url)
