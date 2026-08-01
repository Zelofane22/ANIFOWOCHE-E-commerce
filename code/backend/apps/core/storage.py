from django.core.files.storage import FileSystemStorage
from cloudinary_storage.storage import MediaCloudinaryStorage


class ReadOnlyCloudinaryStorage(MediaCloudinaryStorage):
    """Cloudinary storage that only reads — writes go to local disk.

    In dev we want to display images already uploaded to Cloudinary in
    production, but any new upload must stay on the local disk so that
    tests never mutate the production bucket.

    * ``url()`` / ``_open()`` → Cloudinary (read path).
    * ``save()`` / ``delete()`` → local ``FileSystemStorage``.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._local = FileSystemStorage()

    # ── Write path (local only) ──────────────────────────────────────────
    def save(self, name, content, max_length=None):
        return self._local.save(name, content, max_length=max_length)

    def delete(self, name):
        return self._local.delete(name)

    def exists(self, name):
        if self._local.exists(name):
            return True
        return super().exists(name)

    def get_valid_name(self, name):
        return self._local.get_valid_name(name)

    def path(self, name):
        return self._local.path(name)

    # ── Read path (Cloudinary) ───────────────────────────────────────────
    def url(self, name):
        if self._local.exists(name):
            from django.conf import settings
            return settings.MEDIA_URL + name
        return super().url(name)

    def _open(self, name, mode="rb"):
        if self._local.exists(name):
            return self._local._open(name, mode)
        return super()._open(name, mode)
