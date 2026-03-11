from flask import Blueprint, request, jsonify
from flask_login import login_required
from . import db
from .models import HomeAboutSection, HomeServicesSection, HomeStylistsSection, HomeBridalSection, Service, ServicesImage, Stylist

cms = Blueprint("cms", __name__)


def _get_or_create_section_content(section_model):
	content = section_model.query.first()
	if not content:
		content = section_model()
		db.session.add(content)
		db.session.commit()
	return content


def _build_message(text_updated, static_updated, text_message, static_message, both_message):
	if text_updated and static_updated:
		return both_message
	if text_updated:
		return text_message
	if static_updated:
		return static_message
	return both_message


def _get_or_create_service(service_id=None, category=None, service_order=None):
	service = Service.query.get(service_id) if service_id else None

	if service is None and category and service_order is not None:
		service = Service.query.filter_by(category=category, order=service_order).first()

	created = service is None
	if created:
		service = Service()
		db.session.add(service)

	return service


def _normalize_stylist_payload(data):
	name = (data.get("name") or "").strip()
	bio = data.get("bio")
	image = data.get("image")
	stylist_id = data.get("id")
	order = data.get("order")

	if not name:
		return None, "name is required."

	if bio is not None:
		bio = bio.strip() if isinstance(bio, str) else bio

	if image is not None and isinstance(image, str):
		image = image.strip()

	if order is not None:
		try:
			order = int(order)
		except (TypeError, ValueError):
			return None, "order must be an integer."

	return {
		"id": stylist_id,
		"order": order,
		"name": name,
		"bio": bio,
		"image": image,
	}, None


def _get_next_stylist_order():
	last_stylist = Stylist.query.order_by(Stylist.order.desc(), Stylist.id.desc()).first()
	if last_stylist is None or last_stylist.order is None:
		return 1
	return last_stylist.order + 1


@cms.route("/cms/home/about", methods=["POST"])
@login_required
def upsert_home_about_section():
	data = request.get_json() or {}
	content = _get_or_create_section_content(HomeAboutSection)
	text_updated = False
	static_updated = False

	if "heading" in data:
		content.heading = data.get("heading")
		text_updated = True
	if "text" in data:
		content.text = data.get("text")
		text_updated = True

	gallery_updates = data.get("gallery_images")
	if isinstance(gallery_updates, list) and gallery_updates:
		static_updated = True
		for item in gallery_updates:
			if not isinstance(item, dict):
				continue
			index = item.get("index")
			value = item.get("data")
			if not index or not value:
				continue
			if 1 <= index <= 9:
				setattr(content, f"gallery_image{index}", value)

	db.session.commit()
	base_message = _build_message(
		text_updated,
		static_updated,
		"Mission statement successfully updated.",
		"Gallery images successfully updated.",
		"Home About section successfully updated."
	)

	return jsonify({"message": base_message}), 200


@cms.route("/cms/home/services", methods=["POST"])
@login_required
def upsert_home_services_section():
	data = request.get_json() or {}
	content = _get_or_create_section_content(HomeServicesSection)
	text_updated = False
	static_updated = False

	if "heading" in data:
		content.heading = data.get("heading")
		text_updated = True
	if "text" in data:
		content.text = data.get("text")
		text_updated = True

	static_content = data.get("static_content")
	if isinstance(static_content, dict):
		video_data = static_content.get("data")
		if video_data:
			content.salon_video = video_data
			static_updated = True

	db.session.commit()
	base_message = _build_message(
		text_updated,
		static_updated,
		"Services section text successfully updated.",
		"Salon video successfully updated.",
		"Services section successfully updated."
	)

	return jsonify({"message": base_message}), 200


@cms.route("/cms/home/stylists", methods=["POST"])
@login_required
def upsert_home_stylists_section():
	data = request.get_json() or {}
	content = _get_or_create_section_content(HomeStylistsSection)
	text_updated = False
	static_updated = False

	if "heading" in data:
		content.heading = data.get("heading")
		text_updated = True
	if "text" in data:
		content.text = data.get("text")
		text_updated = True

	static_content = data.get("static_content")
	if isinstance(static_content, dict):
		image_data = static_content.get("data")
		if image_data:
			content.stylists_image = image_data
			static_updated = True

	db.session.commit()
	base_message = _build_message(
		text_updated,
		static_updated,
		"Stylists section text successfully updated.",
		"Stylists image successfully updated.",
		"Stylists section successfully updated."
	)

	return jsonify({"message": base_message}), 200


@cms.route("/cms/home/bridal", methods=["POST"])
@login_required
def upsert_home_bridal_section():
	data = request.get_json() or {}
	content = _get_or_create_section_content(HomeBridalSection)
	text_updated = False
	static_updated = False

	if "heading" in data:
		content.heading = data.get("heading")
		text_updated = True
	if "text" in data:
		content.text = data.get("text")
		text_updated = True

	gallery_updates = data.get("gallery_images")
	if isinstance(gallery_updates, list) and gallery_updates:
		static_updated = True
		for item in gallery_updates:
			if not isinstance(item, dict):
				continue
			index = item.get("index")
			value = item.get("data")
			if not index or not value:
				continue
			if 1 <= index <= 4:
				setattr(content, f"bridal_image{index}", value)

	db.session.commit()
	base_message = _build_message(
		text_updated,
		static_updated,
		"Bridal section text successfully updated.",
		"Bridal gallery successfully updated.",
		"Bridal section successfully updated."
	)

	return jsonify({"message": base_message}), 200


@cms.route("/cms/services", methods=["POST"])
@login_required
def upsert_service():
	data = request.get_json() or {}
	name = data.get("name")
	price = data.get("price")
	category = data.get("category")
	service_order = data.get("order")

	if not name or not price or not category or service_order is None:
		return jsonify({"message": "name, price, category, and order are required."}), 400

	try:
		service_order = int(service_order)
	except (TypeError, ValueError):
		return jsonify({"message": "order must be an integer."}), 400

	service = _get_or_create_service(
		service_id=data.get("id"),
		category=category,
		service_order=service_order,
	)

	service.name = name
	service.price = price
	service.details = data.get("details")
	service.category = category
	service.order = service_order

	db.session.commit()

	return jsonify({
		"message": "Service successfully updated.",
		"service": {
			"id": service.id,
			"name": service.name,
			"price": service.price,
			"details": service.details,
			"category": service.category,
			"order": service.order,
		},
	}), 200


@cms.route("/cms/services/image", methods=["POST"])
@login_required
def upsert_service_category_image():
	data = request.get_json() or {}
	image_id = data.get("id")
	category = data.get("category") or data.get("name")
	uri = data.get("uri") if "uri" in data else data.get("image")

	if not category:
		return jsonify({"message": "category is required."}), 400

	image_record = ServicesImage.query.get(image_id) if image_id else None
	if image_record is None:
		image_record = ServicesImage.query.filter_by(category=category).first()

	created = image_record is None
	if created:
		image_record = ServicesImage()
		db.session.add(image_record)

	image_record.category = category
	if "uri" in data or "image" in data:
		image_record.uri = uri

	db.session.commit()

	return jsonify({
		"message": "Image successfully updated.",
		"image": {
			"id": image_record.id,
			"category": image_record.category,
			"uri": image_record.uri,
		},
	}), 200


@cms.route("/cms/stylists", methods=["POST"])
@login_required
def upsert_stylist():
	data = request.get_json() or {}
	normalized, error = _normalize_stylist_payload(data)
	if error:
		return jsonify({"message": error}), 400

	stylist_id = normalized.get("id")
	stylist = None

	if stylist_id is not None:
		try:
			stylist = Stylist.query.get(int(stylist_id))
		except (TypeError, ValueError):
			return jsonify({"message": "id must be an integer."}), 400

	if stylist is None and normalized["name"]:
		if normalized.get("order") is not None:
			stylist = Stylist.query.filter_by(order=normalized["order"]).first()
		if stylist is None:
			stylist = Stylist.query.filter_by(name=normalized["name"]).first()

	created = stylist is None
	if created:
		stylist = Stylist()
		db.session.add(stylist)

	stylist.name = normalized["name"]
	if normalized.get("order") is not None:
		stylist.order = normalized["order"]
	if "bio" in data:
		stylist.bio = normalized["bio"]
	if "image" in data:
		stylist.image = normalized["image"]

	db.session.commit()

	return jsonify({
		"message": "Stylist successfully updated.",
		"stylist": {
			"id": stylist.id,
			"order": stylist.order,
			"name": stylist.name,
			"bio": stylist.bio,
			"image": stylist.image,
		},
	}), 200


@cms.route("/cms/stylists/add", methods=["POST"])
@login_required
def add_stylist():
	data = request.get_json() or {}
	name = (data.get("name") or "").strip()
	bio = data.get("bio")
	image = data.get("image")

	if not name:
		return jsonify({"message": "name is required."}), 400

	if bio is None:
		return jsonify({"message": "bio is required."}), 400

	if not isinstance(bio, str) or not bio.strip():
		return jsonify({"message": "bio is required."}), 400

	if not isinstance(image, str) or not image.strip():
		return jsonify({"message": "image is required."}), 400

	stylist = Stylist(
		order=_get_next_stylist_order(),
		name=name,
		bio=bio.strip(),
		image=image.strip(),
	)
	db.session.add(stylist)
	db.session.commit()

	return jsonify({"message": "Stylist successfully added."}), 200


@cms.route("/cms/stylists/remove", methods=["POST"])
@login_required
def remove_stylist():
	data = request.get_json() or {}
	stylist_id = data.get("id")
	order = data.get("order")
	name = (data.get("name") or "").strip()

	stylist = None

	if stylist_id is not None:
		try:
			stylist = Stylist.query.get(int(stylist_id))
		except (TypeError, ValueError):
			return jsonify({"message": "id must be an integer."}), 400

	if stylist is None and order is not None:
		try:
			stylist = Stylist.query.filter_by(order=int(order)).first()
		except (TypeError, ValueError):
			return jsonify({"message": "order must be an integer."}), 400

	if stylist is None and name:
		stylist = Stylist.query.filter_by(name=name).first()

	if stylist is None:
		return jsonify({"message": "Stylist not found."}), 404

	db.session.delete(stylist)
	db.session.commit()

	return jsonify({"message": "Stylist successfully removed."}), 200


@cms.route("/cms/stylists/image", methods=["POST"])
@login_required
def replace_stylist_image():
	data = request.get_json() or {}
	stylist_id = data.get("id")
	image = data.get("image")

	try:
		parsed_id = int(stylist_id)
	except (TypeError, ValueError):
		return jsonify({"message": "id must be an integer."}), 400

	stylist = Stylist.query.get(parsed_id)
	if stylist is None:
		return jsonify({"message": f"stylist with id {parsed_id} was not found."}), 404

	if image is None:
		return jsonify({"message": "image is required."}), 400

	stylist.image = image

	db.session.commit()

	return jsonify({
		"message": "Stylist image successfully updated.",
		"stylist": {
			"id": stylist.id,
			"name": stylist.name,
			"bio": stylist.bio,
			"image": stylist.image,
		}
	}), 200
