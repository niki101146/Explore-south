"""Django email backend that sends through Mailjet's HTTPS API (v3.1).

Render's free plan blocks outgoing SMTP (Gmail), so SMTP connections hang and the request dies.
HTTPS works. Enabled automatically when MAILJET_API_KEY and MAILJET_SECRET_KEY are set.
"""
import base64
import json
import logging
import urllib.error
import urllib.request

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


def _addr(email):
    return {"Email": email}


class MailjetEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        sent = 0
        for message in email_messages:
            try:
                self._send(message)
                sent += 1
            except Exception:
                logger.exception("Mailjet could not send %r to %s", message.subject, message.to)
                if not self.fail_silently:
                    raise
        return sent

    def _send(self, message):
        item = {
            "From": {"Email": settings.MAIL_FROM_EMAIL, "Name": settings.MAIL_FROM_NAME},
            "To": [_addr(e) for e in message.to],
            "Subject": message.subject,
            "TextPart": message.body,
        }
        for content, mimetype in getattr(message, "alternatives", []):
            if mimetype == "text/html":
                item["HTMLPart"] = content
        if message.cc:
            item["Cc"] = [_addr(e) for e in message.cc]
        if message.reply_to:
            item["ReplyTo"] = _addr(message.reply_to[0])

        token = base64.b64encode(
            f"{settings.MAILJET_API_KEY}:{settings.MAILJET_SECRET_KEY}".encode()
        ).decode()
        req = urllib.request.Request(
            "https://api.mailjet.com/v3.1/send",
            data=json.dumps({"Messages": [item]}).encode(),
            headers={"Authorization": f"Basic {token}", "Content-Type": "application/json"},
        )
        try:
            body = urllib.request.urlopen(req, timeout=10).read()
        except urllib.error.HTTPError as exc:  # include Mailjet's reason (e.g. sender not verified)
            raise RuntimeError(f"Mailjet {exc.code}: {exc.read().decode(errors='replace')}") from exc
        result = json.loads(body or b"{}")
        status = (result.get("Messages") or [{}])[0].get("Status")
        if status != "success":
            raise RuntimeError(f"Mailjet rejected the message: {result}")