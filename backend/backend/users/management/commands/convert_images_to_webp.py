"""Convert images that were uploaded before WebP conversion existed.

Usage:  python manage.py convert_images_to_webp [--dry-run]
New uploads are converted automatically (config/webp.py); this command fixes the old ones.
"""
from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import models

from config.webp import to_webp


class Command(BaseCommand):
    help = "Re-encode existing uploaded images (JPEG/PNG) as WebP and update the database."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Only list what would change.")

    def handle(self, *args, dry_run=False, **options):
        done = failed = 0
        for model in apps.get_models():
            fields = [f for f in model._meta.fields if isinstance(f, models.ImageField)]
            if not fields:
                continue
            for obj in model.objects.all().iterator():
                for field in fields:
                    value = getattr(obj, field.name)
                    if not value or value.name.lower().endswith(".webp"):
                        continue
                    old = value.name
                    if dry_run:
                        self.stdout.write(f"would convert {model.__name__} #{obj.pk}: {old}")
                        continue
                    try:
                        converted = to_webp(value.file)
                        value.save(converted.name, converted, save=False)
                        model.objects.filter(pk=obj.pk).update(**{field.name: value.name})
                        value.storage.delete(old)
                        done += 1
                    except Exception as exc:  # missing file, not an image, ...
                        failed += 1
                        self.stderr.write(f"skipped {model.__name__} #{obj.pk} ({old}): {exc}")
        self.stdout.write(self.style.SUCCESS(f"Converted {done} image(s); {failed} skipped."))
