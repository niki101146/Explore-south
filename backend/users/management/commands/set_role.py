from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from config.roles import ROLE_CHOICES, set_role


class Command(BaseCommand):
    help = "Set a user's role: python manage.py set_role <username> <admin|editor|user>"

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("role", choices=ROLE_CHOICES)

    def handle(self, *args, username, role, **opts):
        try:
            user = get_user_model().objects.get(username=username)
        except get_user_model().DoesNotExist:
            raise CommandError(f"No user named {username!r}")
        set_role(user, role)
        self.stdout.write(self.style.SUCCESS(f"{username} is now {role}"))
