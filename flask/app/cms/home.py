import json

from flask import request, jsonify
from flask_login import login_required

from .. import db
from ..models import (
	HomeAboutSection,
	HomeServicesSection,
	HomeStylistsSection,
	HomeBridalSection,
)
from ..utils.uploads import save_upload
from . import cms


# ---------------------------------------------------------------------------
# Section configuration — encodes the differences between the four home
# sections so a single parameterized endpoint can serve them all.
# ---------------------------------------------------------------------------
SECTION_CONFIG = {
	"about": {
		"model": HomeAboutSection,
		"media_type": "gallery",
		"field_prefix": "gallery_image",
		"max_slots": 9,
		"upload_subdir": "home",
		"messages": {
			"text": "Mission statement successfully updated.",
			"media": "Gallery images successfully updated.",
			"both": "Home About section successfully updated.",
		},
	},
	"services": {
		"model": HomeServicesSection,
		"media_type": "single",
		"field_name": "salon_video",
		"upload_subdir": "home",
		"messages": {
			"text": "Services section text successfully updated.",
			"media": "Salon video successfully updated.",
			"both": "Services section successfully updated.",
		},
	},
	"stylists": {
		"model": HomeStylistsSection,
		"media_type": "single",
		"field_name": "stylists_image",
		"upload_subdir": "home",
		"messages": {
			"text": "Stylists section text successfully updated.",
			"media": "Stylists image successfully updated.",
			"both": "Stylists section successfully updated.",
		},
	},
	"bridal": {
		"model": HomeBridalSection,
		"media_type": "gallery",
		"field_prefix": "bridal_image",
		"max_slots": 4,
		"upload_subdir": "home",
		"messages": {
			"text": "Bridal section text successfully updated.",
			"media": "Bridal gallery successfully updated.",
			"both": "Bridal section successfully updated.",
		},
	},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_or_create(model):
	content = model.query.first()
	if not content:
		content = model()
		db.session.add(content)
		db.session.commit()
	return content


def _build_message(text_updated, media_updated, messages):
	if text_updated and media_updated:
		return messages["both"]
	if text_updated:
		return messages["text"]
	if media_updated:
		return messages["media"]
	return messages["both"]


# ---------------------------------------------------------------------------
# Parameterized endpoint — replaces the four individual home-section routes
# ---------------------------------------------------------------------------
@cms.route("/cms/home/<section>", methods=["POST"])
@login_required
def upsert_home_section(section):
	config = SECTION_CONFIG.get(section)
	if not config:
		return jsonify({"message": "Invalid section."}), 404

	content = _get_or_create(config["model"])
	text_updated = False
	media_updated = False

	# --- Text update (JSON body) ---
	if request.is_json:
		data = request.get_json() or {}
		if "heading" in data:
			content.heading = data["heading"]
			text_updated = True
		if "text" in data:
			content.text = data["text"]
			text_updated = True

	# --- Media upload (multipart form-data) ---
	if request.files:
		subdir = config["upload_subdir"]

		if config["media_type"] == "gallery":
			files = request.files.getlist("files")
			indices = json.loads(request.form.get("indices", "[]"))
			prefix = config["field_prefix"]
			max_slots = config["max_slots"]

			for i, file in enumerate(files):
				if i >= len(indices):
					break
				index = indices[i]
				if 1 <= index <= max_slots:
					path = save_upload(file, subdir)
					setattr(content, f"{prefix}{index}", path)
					media_updated = True

		elif config["media_type"] == "single":
			file = request.files.get("file")
			if file:
				path = save_upload(file, subdir)
				setattr(content, config["field_name"], path)
				media_updated = True

	db.session.commit()
	message = _build_message(text_updated, media_updated, config["messages"])
	return jsonify({"message": message}), 200
