from django.db import models


class Banner(models.Model):
    """Bannière affichée sur la page d'accueil du site (image + texte + lien)."""

    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to="banners/", blank=True, null=True)
    link_url = models.CharField(max_length=255, blank=True)
    is_published = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title
