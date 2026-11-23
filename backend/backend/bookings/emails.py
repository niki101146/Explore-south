import logging
from datetime import date

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import escape

logger = logging.getLogger(__name__)


def inr(n):
    """Rupees with Indian digit grouping, e.g. 1234567 -> ₹12,34,567."""
    s = str(int(round(n)))
    if len(s) <= 3:
        return f"₹{s}"
    head, tail, parts = s[:-3], s[-3:], []
    while len(head) > 2:
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return "₹" + ",".join(parts + [tail])


def fmt_date(iso):
    d = date.fromisoformat(iso)
    return f"{d.day} {d.strftime('%b %Y')}"


def _text(booking):
    plan = booking.plan
    s = plan["summary"]
    name = booking.user.first_name or booking.user.username
    lines = [
        f"Hi {name},", "",
        f"Your booking {booking.reference} for {booking.destination_name} is confirmed.", "",
        f"Dates: {fmt_date(plan['start_date'])} to {fmt_date(plan['end_date'])} ({plan['num_days']} day{'s' if plan['num_days'] > 1 else ''})",
        f"Travelers: {plan['travelers']}", "", "YOUR PLAN", "",
    ]
    for d in plan["days"]:
        lines.append(f"Day {d['day']} - {fmt_date(d['date'])}: {d['label']}")
        for i in d["items"]:
            lines.append(f"   - {i['title']}: {inr(i['amount'])}" if i["amount"] else f"   - {i['title']}")
        lines.append("")
    lines += [
        "COST SUMMARY",
        f"   Accommodation: {inr(s['accommodation'])}",
        f"   Food: {inr(s['food'])}",
        f"   Local travel: {inr(s['local_travel'])}",
        f"   Entry fees: {inr(s['entry_fees'])}",
        f"   TOTAL: {inr(s['total'])}  ({inr(s['per_person'])} per person)", "",
        "Please note: amounts are estimates based on typical costs. No payment has been taken.", "",
        "Booking reference: " + booking.reference, "", "Thank you for planning with ExploreSouth!",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------- shared HTML layout
BROWN, ACCENT, CREAM, LINE, MUTED, INK = "#3b2417", "#f2b84b", "#fbf5ec", "#eadfce", "#7a6a5c", "#2b1a10"
FONT = "Segoe UI,Helvetica,Arial,sans-serif"


def site_url():
    return getattr(settings, "SITE_URL", "http://localhost:5173").rstrip("/")


def layout(title, preheader, body_html, footer_note=""):
    """Branded, table-based email shell (works in Gmail, Outlook and phone clients)."""
    return f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#f3ece2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f3ece2;">{escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ece2;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid {LINE};font-family:{FONT};color:{INK};">
    <tr><td style="background:{BROWN};padding:22px 28px;border-bottom:4px solid {ACCENT};">
      <div style="font-size:22px;font-weight:700;letter-spacing:.2px;color:#ffffff;">Explore<span style="color:{ACCENT};">South</span></div>
      <div style="margin-top:2px;font-size:10px;letter-spacing:2.5px;color:#d9c3a5;text-transform:uppercase;">Discover &middot; Explore &middot; Experience</div>
    </td></tr>
    <tr><td style="padding:28px 28px 8px;">
      <h1 style="margin:0 0 4px;font-size:20px;line-height:1.3;color:{BROWN};">{title}</h1>
    </td></tr>
    <tr><td style="padding:8px 28px 28px;font-size:14px;line-height:1.6;">{body_html}</td></tr>
    <tr><td style="background:{CREAM};padding:16px 28px;border-top:1px solid {LINE};font-size:12px;line-height:1.5;color:{MUTED};">
      {footer_note}<div>&copy; ExploreSouth &middot; Travel guide for Tamil Nadu, Kerala, Karnataka, Andhra Pradesh and Telangana.</div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>"""


def button(label, url):
    return (f'<a href="{escape(url)}" style="display:inline-block;background:{ACCENT};color:{BROWN};'
            f'font-weight:700;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;">{escape(label)}</a>')


def info_rows(rows):
    """Label / value table inside a cream card. rows: [(label, html_value)]."""
    body = "".join(
        f'<tr><td style="padding:7px 0;color:{MUTED};width:38%;vertical-align:top;border-bottom:1px solid {LINE};">{label}</td>'
        f'<td style="padding:7px 0;font-weight:600;vertical-align:top;border-bottom:1px solid {LINE};">{value}</td></tr>'
        for label, value in rows
    )
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
            f'style="background:{CREAM};border-radius:10px;padding:6px 16px;margin:14px 0;border-collapse:separate;">{body}</table>')


def cost_table(s):
    rows = "".join(
        f'<tr><td style="padding:6px 0;color:{MUTED};">{label}</td><td style="padding:6px 0;text-align:right;">{inr(val)}</td></tr>'
        for label, val in [("Accommodation", s["accommodation"]), ("Food", s["food"]),
                           ("Local travel", s["local_travel"]), ("Entry fees", s["entry_fees"])]
    )
    return f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0;">
{rows}
<tr><td colspan="2" style="border-top:2px solid {BROWN};padding-top:0;"></td></tr>
<tr><td style="padding:10px 0 2px;font-size:16px;font-weight:700;color:{BROWN};">Total</td>
<td style="padding:10px 0 2px;text-align:right;font-size:18px;font-weight:700;color:{BROWN};">{inr(s['total'])}</td></tr>
<tr><td style="color:{MUTED};font-size:12px;">Per person</td><td style="text-align:right;color:{MUTED};font-size:12px;">{inr(s['per_person'])}</td></tr>
</table>"""


def itinerary_html(plan):
    out = ""
    for d in plan["days"]:
        items = "".join(
            f'<tr><td style="padding:4px 0 4px 12px;border-left:3px solid {ACCENT};">{escape(i["title"])}</td>'
            f'<td style="padding:4px 0;text-align:right;white-space:nowrap;color:{MUTED};">{inr(i["amount"]) if i["amount"] else ""}</td></tr>'
            for i in d["items"]
        )
        out += (f'<p style="margin:18px 0 6px;font-weight:700;color:{BROWN};">Day {d["day"]} &middot; {fmt_date(d["date"])} '
                f'<span style="font-weight:400;color:{MUTED};">&middot; {escape(d["label"])}</span></p>'
                f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{items}</table>')
    return out


def section(title):
    return (f'<p style="margin:26px 0 4px;font-size:11px;font-weight:700;letter-spacing:1.5px;'
            f'text-transform:uppercase;color:{MUTED};">{title}</p>')


def _html(booking):
    """Confirmation email for the traveller."""
    plan = booking.plan
    s = plan["summary"]
    name = escape(booking.user.first_name or booking.user.username)
    days = plan["num_days"]
    travelers = plan["travelers"]
    body = f"""
<p style="margin:0 0 12px;">Hi {name},</p>
<p style="margin:0 0 4px;">Thank you for planning with ExploreSouth. Your trip to <b>{escape(booking.destination_name)}</b> is confirmed.</p>
{info_rows([
    ("Booking reference", escape(booking.reference)),
    ("Destination", escape(booking.destination_name)),
    ("Dates", f"{fmt_date(plan['start_date'])} to {fmt_date(plan['end_date'])}"),
    ("Duration", f"{days} day{'s' if days > 1 else ''}"),
    ("Travelers", str(travelers)),
])}
{section("Your day-by-day plan")}
{itinerary_html(plan)}
{section("Cost summary")}
{cost_table(s)}
<p style="margin:18px 0 0;padding:12px 14px;background:{CREAM};border-radius:8px;font-size:12px;color:{MUTED};">
  Amounts are estimates based on typical costs. <b>No payment has been taken.</b>
</p>
<p style="margin:22px 0 0;text-align:center;">{button("View my trip", site_url() + "/trips")}</p>
"""
    return layout("Your booking is confirmed", f"{booking.destination_name}, {fmt_date(plan['start_date'])} - {booking.reference}", body,
                  footer_note=f'<div style="margin-bottom:6px;">Booking reference: <b>{escape(booking.reference)}</b>. Questions? Just reply to this email.</div>')


def _owner_text(booking):
    s = booking.plan["summary"]
    p = booking.plan
    return "\n".join([
        f"NEW BOOKING {booking.reference}", "",
        f"Customer:    {booking.user.username} <{booking.email}>",
        f"Destination: {booking.destination_name}",
        f"Dates:       {fmt_date(p['start_date'])} to {fmt_date(p['end_date'])} ({p['num_days']} day{'s' if p['num_days'] > 1 else ''})",
        f"Travelers:   {booking.num_travelers}",
        f"Total:       {inr(s['total'])} ({inr(s['per_person'])} per person)", "",
        f"Review it in the admin: {site_url()}/admin/bookings",
    ])


def _owner_html(booking):
    """Notification email for the site owner."""
    plan = booking.plan
    s = plan["summary"]
    username = escape(booking.user.username)
    email = escape(booking.email)
    body = f"""
<p style="margin:0 0 4px;">A traveller has just confirmed a trip on ExploreSouth.</p>
{info_rows([
    ("Reference", escape(booking.reference)),
    ("Customer", f"{username}<br><a href='mailto:{email}' style='color:{BROWN};font-weight:400;'>{email}</a>"),
    ("Destination", escape(booking.destination_name)),
    ("Dates", f"{fmt_date(plan['start_date'])} to {fmt_date(plan['end_date'])}"),
    ("Duration", f"{plan['num_days']} day{'s' if plan['num_days'] > 1 else ''}"),
    ("Travelers", str(booking.num_travelers)),
    ("Estimated total", f"<span style='font-size:16px;color:{BROWN};'>{inr(s['total'])}</span> <span style='font-weight:400;color:{MUTED};'>({inr(s['per_person'])} per person)</span>"),
    ("Status", "Confirmed"),
])}
{section("Plan overview")}
{itinerary_html(plan)}
<p style="margin:24px 0 0;text-align:center;">{button("Open in admin", site_url() + "/admin/bookings")}</p>
<p style="margin:14px 0 0;text-align:center;font-size:12px;color:{MUTED};">Reply to this email to contact the customer directly.</p>
"""
    return layout("New booking received", f"{booking.destination_name} - {inr(s['total'])} - {booking.reference}", body)


def contact_html(msg):
    """Owner notification for a Contact us message."""
    email = escape(msg.email)
    text = escape(msg.message).replace("\n", "<br>")
    body = f"""
<p style="margin:0 0 4px;">You have a new message from the Contact us page.</p>
{info_rows([("From", escape(msg.name)), ("Email", f"<a href='mailto:{email}' style='color:{BROWN};font-weight:400;'>{email}</a>")])}
{section("Message")}
<div style="padding:14px 16px;background:{CREAM};border-left:4px solid {ACCENT};border-radius:6px;">{text}</div>
<p style="margin:24px 0 0;text-align:center;">{button("Reply by email", "mailto:" + msg.email)}</p>
"""
    return layout("New message from your website", f"{msg.name}: {msg.message[:80]}", body)


def _send(subject, text, to, html=None, reply_to=None):
    try:
        msg = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [to], reply_to=reply_to)
        if html:
            msg.attach_alternative(html, "text/html")
        msg.send(fail_silently=False)
        return True
    except Exception:
        logger.exception("Could not send email %r to %s", subject, to)
        return False


def send_booking_emails(booking):
    """Email the traveller a confirmation, and the site owner a copy.

    Returns True only if the traveller's email was handed to a real mail server.
    """
    sent = _send(
        f"Booking confirmed: {booking.destination_name} ({booking.reference})",
        _text(booking), booking.email, html=_html(booking),
    )
    if settings.CONTACT_RECEIVER_EMAIL:
        s = booking.plan["summary"]
        _send(
            f"New booking {booking.reference}: {booking.destination_name} ({inr(s['total'])})",
            _owner_text(booking), settings.CONTACT_RECEIVER_EMAIL,
            html=_owner_html(booking), reply_to=[booking.email],
        )
    return sent and getattr(settings, "EMAIL_DELIVERY_READY", False)
