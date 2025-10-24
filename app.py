from flask import Flask, render_template, abort
from jinja2 import TemplateNotFound

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/<path:page>")
def render_page(page):
    try:
        return render_template(f"{page}.html")
    
    except TemplateNotFound:
        abort(404)


if __name__ == "__main__":
    app.run()