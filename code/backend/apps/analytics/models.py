from django.db import models


class PageView(models.Model):
    """Une vue de page côté frontend, envoyée par un petit signal de tracking.

    Base minimale pour de futures évolutions analytics (sources de trafic,
    pages populaires, taux de conversion) — pas de PII collectée : pas
    d'adresse IP ni d'identifiant utilisateur, seulement le chemin visité et
    une clé de session anonyme pour dédupliquer.
    """

    path = models.CharField(max_length=255)
    referrer = models.CharField(max_length=255, blank=True)
    session_key = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["created_at"])]

    def __str__(self):
        return f"{self.path} — {self.created_at:%Y-%m-%d %H:%M}"
