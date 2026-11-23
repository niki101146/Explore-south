"""Django email backend that sends through Resend's HTTPS API.

Render's free plan blocks outgoing SMTP (Gmail), so SMTP connections hang and the request dies.
HTTPS works. Enabled automatically when the RESEND_API_KEY environment variable is set.
"""
import json
import logging
import urllib.error
import urllib.request

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


class ResendEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        sent = 0
        for message in email_messages:
            try:
                self._send(message)
                sent += 1
            except Exception:
                logger.exception("Resend could not send %r to %s", message.subject, message.to)
                if not self.fail_silently:
                    raise
        return sent

    def _send(self, message):
        payload = {
            "from": settings.RESEND_FROM,
            "to": list(message.to),
            "subject": message.subject,
            "text": message.body,
        }
        for content, mimetype in getattr(message, "alternatives", []):
            if mimetype == "text/html":
                payload["html"] = content
        if message.cc:
            payload["cc"] = list(message.cc)
        if message.reply_to:
            payload["reply_to"] = list(message.reply_to)
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "exploresouth-backend/1.0",
            },
        )
        try:
            urllib.request.urlopen(req, timeout=10).read()
        except urllib.error.HTTPError as exc:  # include Resend's reason (e.g. unverified recipient)
            raise RuntimeError(f"Resend {exc.code}: {exc.read().decode(errors='replace')}") from exc