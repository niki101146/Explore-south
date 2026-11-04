"""Convert every uploaded image to WebP (smaller files, faster pages).

Hooked up as a pre_save signal in users/apps.py, so it covers the React admin,
the API and the Django admin alike.
"""
import os
from io import BytesIO

from django.core.files.base import ContentFile
from django.db import models
from PIL import Image, ImageOps

MAX_SIDE = 2000  # longest edge in pixels; bigger photos are scaled down
QUALITY = 82


def to_webp(file):
    """Return a ContentFile holding `file` re-encoded as WebP."""
    stem = os.path.splitext(os.path.basename(getattr(file, "name", "") or "image"))[0] or "image"
    try:
        file.seek(0)
    except Exception:
        pass
    img = Image.open(file)
    img = ImageOps.exif_transpose(img)
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    img = img.convert("RGBA" if has_alpha else "RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    buf = BytesIO()
    img.save(buf, format="WEBP", quality=QUALITY, method=4)
    return ContentFile(buf.getvalue(), name=f"{stem}.webp")


def convert_uploaded_images(sender, instance, **kwargs):
    """pre_save receiver: re-encode any newly uploaded ImageField file as WebP."""
    for field in instance._meta.fields:
        if not isinstance(field, models.ImageField):
            continue
        value = getattr(instance, field.name, None)
        if not value or getattr(value, "_committed", True):
            continue  # empty, or already stored
        if value.name.lower().endswith(".webp"):
            continue
        try:
            setattr(instance, field.name, to_webp(value.file))
        except Exception:
            # Not an image Pillow can read: leave it to the field's own validation.
            pass
