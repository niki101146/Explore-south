from rest_framework.permissions import SAFE_METHODS, BasePermission

from .roles import is_admin, is_editor_or_admin


class IsAdminRole(BasePermission):
    """Admins only (any method)."""

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsAdminOrReadOnly(BasePermission):
    """Anyone can read; only admins can create, update or delete."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_admin(request.user)


class IsEditorOrReadOnly(BasePermission):
    """Anyone can read; editors and admins can create, update or delete."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_editor_or_admin(request.user)


class EditorWriteAdminDelete(BasePermission):
    """Anyone can read; editors and admins can create/update; only admins can delete."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if request.method == "DELETE":
            return is_admin(request.user)
        return is_editor_or_admin(request.user)
