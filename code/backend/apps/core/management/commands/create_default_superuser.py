from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Crée le superadmin par défaut s'il n'existe pas encore (idempotent, pensé pour le déploiement)."

    def handle(self, *args, **options):
        # Lecture des identifiants du superadmin par défaut depuis l'environnement.
        User = get_user_model()
        username = settings.DEFAULT_SUPERUSER_USERNAME
        password = settings.DEFAULT_SUPERUSER_PASSWORD

        # Idempotence : ne rien faire si le compte existe déjà.
        if User.objects.filter(username=username).exists():
            self.stdout.write(f"Superadmin '{username}' déjà présent, rien à faire.")
            return

        # Création du superadmin par défaut (le changement de mot de passe sera exigé au login).
        User.objects.create_superuser(username=username, email="", password=password)
        self.stdout.write(
            self.style.SUCCESS(
                f"Superadmin '{username}' créé avec le mot de passe par défaut. "
                "Un changement de mot de passe sera exigé à la première connexion."
            )
        )
