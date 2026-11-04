from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"

    def ready(self):
        from django.db.models.signals import pre_save

        from config.webp import convert_uploaded_images

        from . import signals  # noqa: F401

        # Store every uploaded picture as WebP, whichever model it belongs to.
        pre_save.connect(convert_uploaded_images, dispatch_uid="webp_uploads")
