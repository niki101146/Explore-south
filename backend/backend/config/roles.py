"""Role helpers.

Three roles:
  admin  - is_staff or is_superuser. Full access: users, reviews, deleting content.
  editor - member of the "Editor" group. Can add/edit destinations and attractions
           and upload/delete pictures, but cannot delete destinations/attractions,
           moderate reviews or manage users.
  user   - everybody else (favorites, trips, own reviews).
"""
from django.contrib.auth.models import Group

ADMIN = "admin"
EDITOR = "editor"
USER = "user"
ROLE_CHOICES = [ADMIN, EDITOR, USER]
EDITOR_GROUP = "Editor"


def get_role(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser or user.is_staff:
        return ADMIN
    if user.groups.filter(name=EDITOR_GROUP).exists():
        return EDITOR
    return USER


def is_admin(user):
    return get_role(user) == ADMIN


def is_editor_or_admin(user):
    return get_role(user) in (ADMIN, EDITOR)


def set_role(user, role):
    """Assign a role by toggling is_staff and Editor group membership."""
    group, _ = Group.objects.get_or_create(name=EDITOR_GROUP)
    if role == ADMIN:
        user.is_staff = True
        user.groups.remove(group)
    elif role == EDITOR:
        user.is_staff = False
        user.groups.add(group)
    else:
        user.is_staff = False
        user.groups.remove(group)
    user.save(update_fields=["is_staff"])
