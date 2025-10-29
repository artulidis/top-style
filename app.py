import os, json
from flask import Flask, jsonify, redirect, render_template, abort, request
from jinja2 import TemplateNotFound

app = Flask(__name__)
app.url_map.strict_slashes = False

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


@app.context_processor
def inject_cms():
    return {"cms": load_content()}

@app.route("/admin/save", methods=["POST"])
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

@app.before_request
def clear_trailing_slashes():
    if request.path != '/' and request.path.endswith('/'):
            return redirect(request.path[:-1])

@app.route("/")
def index():
    return render_template("main/index.html")

@app.route("/admin")
def admin():
     return render_template("/admin/cms.html")

@app.route("/<path:page>")
def render_page(page):
    try:
        return render_template(f"main/{page}.html")
    
    except TemplateNotFound:
        abort(404)


if __name__ == "__main__":
    app.run()