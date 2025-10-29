from flask import Flask, redirect, render_template, abort, request
from jinja2 import TemplateNotFound

app = Flask(__name__)
app.url_map.strict_slashes = False

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