from flask import request, jsonify
from flask_login import login_required

from .. import db
from ..models import Stylist
from ..utils.uploads import save_upload
from . import cms


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_next_order():
	last = Stylist.query.order_by(Stylist.order.desc(), Stylist.id.desc()).first()
	return 1 if last is None or last.order is None else last.order + 1


def _stylist_dict(stylist):
	return {
		"id": stylist.id,
		"order": stylist.order,
		"name": stylist.name,
		"bio": stylist.bio,
		"image": stylist.image,
	}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@cms.route("/cms/stylists", methods=["POST"])
@login_required
def upsert_stylist():
	"""Create or update a stylist.

	* Multipart with a ``file`` field  → creates a new stylist (name + bio + image).
	* JSON body with an ``id`` field   → updates an existing stylist's text fields.
	"""
	file = request.files.get("file")

	if file:
		# ---- New stylist (multipart: name, bio, file) ----
		name = (request.form.get("name") or "").strip()
		bio = (request.form.get("bio") or "").strip()

		if not name:
			return jsonify({"message": "name is required."}), 400
		if not bio:
			return jsonify({"message": "bio is required."}), 400

		stylist = Stylist(
			order=_get_next_order(),
			name=name,
			bio=bio,
			image=save_upload(file, "stylists"),
		)
		db.session.add(stylist)
		db.session.commit()

		return jsonify({
			"message": "Stylist successfully added.",
			"stylist": _stylist_dict(stylist),
		}), 200

	# ---- Update existing stylist (JSON: id, name, bio, order) ----
	data = request.get_json() or {}
	stylist_id = data.get("id")
	name = (data.get("name") or "").strip()

	if not name:
		return jsonify({"message": "name is required."}), 400
	if stylist_id is None:
		return jsonify({"message": "id is required."}), 400

	try:
		stylist = Stylist.query.get(int(stylist_id))
	except (TypeError, ValueError):
		return jsonify({"message": "id must be an integer."}), 400

	if not stylist:
		return jsonify({"message": "Stylist not found."}), 404

	stylist.name = name
	if "bio" in data:
		bio = data["bio"]
		stylist.bio = bio.strip() if isinstance(bio, str) else bio
	if data.get("order") is not None:
		try:
			stylist.order = int(data["order"])
		except (TypeError, ValueError):
			return jsonify({"message": "order must be an integer."}), 400

	db.session.commit()

	return jsonify({
		"message": "Stylist successfully updated.",
		"stylist": _stylist_dict(stylist),
	}), 200


@cms.route("/cms/stylists/remove", methods=["POST"])
@login_required
def remove_stylist():
	data = request.get_json() or {}
	stylist_id = data.get("id")

	if stylist_id is None:
		return jsonify({"message": "id is required."}), 400

	try:
		stylist = Stylist.query.get(int(stylist_id))
	except (TypeError, ValueError):
		return jsonify({"message": "id must be an integer."}), 400

	if not stylist:
		return jsonify({"message": "Stylist not found."}), 404

	db.session.delete(stylist)
	db.session.commit()

	return jsonify({"message": "Stylist successfully removed."}), 200


@cms.route("/cms/stylists/image", methods=["POST"])
@login_required
def replace_stylist_image():
	stylist_id = request.form.get("id")
	file = request.files.get("file")

	if not stylist_id:
		return jsonify({"message": "id is required."}), 400
	if not file:
		return jsonify({"message": "file is required."}), 400

	try:
		stylist = Stylist.query.get(int(stylist_id))
	except (TypeError, ValueError):
		return jsonify({"message": "id must be an integer."}), 400

	if not stylist:
		return jsonify({"message": f"stylist with id {stylist_id} was not found."}), 404

	stylist.image = save_upload(file, "stylists")
	db.session.commit()

	return jsonify({
		"message": "Stylist image successfully updated.",
		"stylist": _stylist_dict(stylist),
	}), 200
