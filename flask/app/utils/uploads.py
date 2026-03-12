import os
import uuid

from flask import current_app


def save_upload(file, subdirectory):
	"""Save an uploaded file and return its URL path.

	The file is written to ``static/uploads/<subdirectory>/<uuid>.<ext>``
	and the returned string is the absolute URL path that both Flask (in
	development) and nginx (in Docker) can serve.
	"""
	upload_dir = os.path.join(current_app.static_folder, "uploads", subdirectory)
	os.makedirs(upload_dir, exist_ok=True)

	ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".bin"
	filename = f"{uuid.uuid4().hex}{ext}"
	filepath = os.path.join(upload_dir, filename)
	file.save(filepath)

	return f"/static/uploads/{subdirectory}/{filename}"
