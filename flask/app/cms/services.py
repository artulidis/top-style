from flask import request, jsonify
from flask_login import login_required

from .. import db
from ..models import Service, ServicesImage
from ..utils.uploads import save_upload
from . import cms


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_or_create_service(service_id=None, category=None, service_order=None):
	service = Service.query.get(service_id) if service_id else None

	if service is None and category and service_order is not None:
		service = Service.query.filter_by(category=category, order=service_order).first()

	if service is None:
		service = Service()
		db.session.add(service)

	return service


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
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
def upsert_service_image():
	category = request.form.get("category")
	file = request.files.get("file")

	if not category:
		return jsonify({"message": "category is required."}), 400
	if not file:
		return jsonify({"message": "file is required."}), 400

	image_record = ServicesImage.query.filter_by(category=category).first()
	if image_record is None:
		image_record = ServicesImage()
		db.session.add(image_record)

	image_record.category = category
	image_record.uri = save_upload(file, "services")

	db.session.commit()

	return jsonify({
		"message": "Image successfully updated.",
		"image": {
			"id": image_record.id,
			"category": image_record.category,
			"uri": image_record.uri,
		},
	}), 200
