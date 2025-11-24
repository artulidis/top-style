import os, json
from flask import Blueprint, jsonify, render_template
from flask import abort, redirect, request
from flask_login import login_required, current_user
from jinja2 import TemplateNotFound

main = Blueprint("main", __name__)

# Admin Logic

CONTENT_FILE = "content.json"

def load_content():
    if os.path.exists(CONTENT_FILE):
        with open(CONTENT_FILE, "r", encoding="UTF-8") as f:
             return json.load(f)
    
    return {}

def save_content(data):
     with open(CONTENT_FILE, "w", encoding="UTF-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


@main.context_processor
def inject_cms():
    return {"cms": load_content()}

@main.route("/admin/save", methods=["POST"])
def admin_save():
    """
        Expected Payload:
        {
        "page": "index",
        "changes": {
            "hero.h1": "New Hero Heading",
            "services.price_1": "45"
            }
        }
    """

    payload = request.get_json() or {}
    page = payload.get("page")
    changes = payload.get("changes", {})

    content = load_content()

    if page not in content:
        content[page] = {}
    
    content[page].update(changes)
    save_content(content)
    return jsonify({"status": "OK", "saved": len(changes)}), 200  


# Routing Logic

@main.before_request
def clear_trailing_slashes():
    if request.path != '/' and request.path.endswith('/'):
            return redirect(request.path[:-1])

@main.route("/")
def index():
    return render_template("main/index.html")

@main.route("/admin")
@login_required
def admin():
     return render_template("/admin/cms.html")

@main.route("/<path:page>")
def render_page(page):
    try:
        return render_template(f"main/{page}.html")
    
    except TemplateNotFound:
        abort(404)