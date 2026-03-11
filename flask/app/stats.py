from flask import Blueprint
from . import db
from .models import SiteStat
from .models import StatsMeta
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

stats = Blueprint("stats", __name__)


def _get_or_create_stat(name):
	stat = SiteStat.query.filter_by(name=name).first()
	if not stat:
		stat = SiteStat(name=name, value=0)
		db.session.add(stat)
		db.session.commit()
	return stat


def _get_meta(key):
	return StatsMeta.query.filter_by(key=key).first()


def _set_meta(key, value):
	meta = _get_meta(key)
	if not meta:
		meta = StatsMeta(key=key, value=value)
		db.session.add(meta)
	else:
		meta.value = value
	db.session.commit()


def _ensure_monthly_rollover():
	# Reset monthly counters if month changed since last reset.
	now = datetime.now()
	ym = now.strftime("%Y-%m")
	meta = _get_meta("stats_last_reset")
	if meta and meta.value == ym:
		return

	# perform reset for tracked counters
	for name in ("visitors", "appointments_booked", "emails_sent"):
		stat = SiteStat.query.filter_by(name=name).first()
		if stat:
			stat.value = 0
		else:
			stat = SiteStat(name=name, value=0)
			db.session.add(stat)

	_set_meta("stats_last_reset", ym)
	db.session.commit()


def increment_stat(name, amount=1):
	_ensure_monthly_rollover()
	stat = _get_or_create_stat(name)
	stat.value += amount
	db.session.commit()
	return stat.value


def get_stat(name):
	stat = SiteStat.query.filter_by(name=name).first()
	return stat.value if stat else 0


def get_website_stats():
	_ensure_monthly_rollover()
	return {
		"visitors": get_stat("visitors"),
		"appointments_booked": get_stat("appointments_booked"),
		"emails_sent": get_stat("emails_sent"),
	}


@stats.route("/stats/appointments-click", methods=["POST"])
def track_appointment_click():
	increment_stat("appointments_booked")
	return "", 204


@stats.route("/stats/email-sent", methods=["POST"])
def track_email_sent():
	increment_stat("emails_sent")
	return "", 204
