from functools import wraps

from flask import jsonify, redirect, request, url_for
from flask_login import current_user, login_required


def admin_required(view):
    @wraps(view)
    @login_required
    def wrapped_view(*args, **kwargs):
        if current_user.role != "admin":
            if request.method == "GET":
                return redirect(url_for("main.dashboard_home"))

            return jsonify({"message": "Admin access required."}), 403

        return view(*args, **kwargs)

    return wrapped_view