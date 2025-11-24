from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(32), unique=True)
    password = db.Column(db.String(32))
    name = db.Column(db.String(32))

    def __repr__(self):
            return '<User %r>' % self.username

auth = Blueprint("auth", __name__)

@auth.route("/admin-login")
def login():
    return render_template("admin/login.html")

@auth.route("/login", methods=["POST"])
def login_post():
    username = request.form.get("username")
    password = request.form.get("password")
    remember = True if request.form.get("remember") else False

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        flash("Please try again with different credentials.")
        return redirect(url_for("auth.login"))
    
    login_user(user, remember=remember)
    return redirect(url_for("main.admin"))

@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("main.index"))