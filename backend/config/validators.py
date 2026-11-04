from rest_framework import serializers

MAX_IMAGE_MB = 5
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def validate_image_file(file):
    """Reject oversized files and formats other than JPG, PNG or WebP."""
    if file is None:
        return file
    if file.size > MAX_IMAGE_MB * 1024 * 1024:
        raise serializers.ValidationError(f"Image must be {MAX_IMAGE_MB} MB or smaller.")
    content_type = getattr(file, "content_type", None)
    if content_type and content_type not in ALLOWED_TYPES:
        raise serializers.ValidationError("Only JPG, PNG or WebP images are allowed.")
    return file
