import os, re, smtplib
from . import db
from email.message import EmailMessage
from firebase_admin import auth as firebase_auth
from flask import Blueprint, render_template, request, jsonify, url_for, redirect
from flask_login import login_user, login_required, logout_user, current_user
from .models import User
from .utils.auth import admin_required
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

auth = Blueprint("auth", __name__)

@auth.route("/dashboard/login")
def login():
    return render_template("dashboard/login.html")
    

@auth.route("/dashboard/login-session", methods=["POST"])
def login_session():
    data = request.get_json() or {}
    id_token = data.get("idToken")
    remember = data.get("remember", False)

    if not id_token:
        return jsonify({"message": "Missing ID token"}), 400

    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
    except Exception:
        return jsonify({"message": "Invalid or expired token"}), 401

    firebase_uid = decoded_token["uid"]

    user = User.query.filter_by(firebase_uid=firebase_uid).first()

    if not user:
        return jsonify({"message": "User not authorized"}), 403

    # Activate invited users on first verified login
    if user.status == "invited":
        user.status = "active"
        db.session.commit()

    login_user(user, remember=remember)

    redirect_url = url_for("main.dashboard_main") if user.role == "admin" else url_for("main.dashboard_home")

    return jsonify({
        "name": user.name,
        "role": user.role,
        "redirectUrl": redirect_url,
    }), 200


@auth.route("/dashboard/login-fallback", methods=["POST"])
def login_fallback():
    data = request.get_json()
    email = data["email"]

    if not email:
        return jsonify({"message": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "User not authorized"}), 403

    if user.status == "invited":
        return jsonify({"message": "Please complete your registration from the invitation email before logging in."}), 409

    return jsonify({"message": "Unable to authenticate. Check your credentials and try again."}), 401


@auth.route("/dashboard/invite", methods=["POST"])
@admin_required
def invite_user():
    data = request.get_json()

    name = data["name"]
    email = data["email"]

    # Check if user already exists in DB
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "User already invited or exists."}), 200
    
    try:
        # Create Firebase user (no password)
        firebase_user = firebase_auth.create_user(
            email=email,
        )

        # Generate password reset link
        reset_link = firebase_auth.generate_password_reset_link(email)

        # Save user to SQLite
        new_user = User(
            firebase_uid=firebase_user.uid,
            email=email,
            name=name,
            role="editor",
            status="invited"
        )

        db.session.add(new_user)
        db.session.commit()

        # Send invite email
        send_invite_email(email, name, reset_link)

        return jsonify({
            "message": "Invitation email sent.",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "status": new_user.status,
                "role": new_user.role,
            }
        }), 200

    except Exception as e:
        print(str(e))
        return jsonify({"message": f"Error: {str(e)}"}), 500


def send_invite_email(to_email, name, reset_link):
    EMAIL_ADDRESS = "artulidis@gmail.com"
    SEND_GRID_PASSWORD = os.getenv("SEND_GRID_PASSWORD")

    html_content = f"""
    <html>
      <body>
        <p>Hello {name},</p>
        <p>You have been invited to access the dashboard.</p>
        <p>Click the following <a href="{reset_link}">link</a> to create your password.</p>
        <p>If you did not expect this email, ignore it.</p>
      </body>
    </html>
    """

    message = Mail(
        from_email=EMAIL_ADDRESS,
        to_emails=to_email,
        subject="You're invited to the Dashboard",
        html_content=html_content
    )

    try:
        sg = SendGridAPIClient(SEND_GRID_PASSWORD)
        sg.send(message)
    except Exception as e:
        print(e)


@auth.route("/dashboard/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    user_to_delete = User.query.get(user_id)

    if not user_to_delete:
        return jsonify({"message": "User not found."}), 404

    try:
        firebase_auth.delete_user(user_to_delete.firebase_uid)
    except Exception as e:
        err = str(e)
        # If the Firebase user is already missing, continue; otherwise return error
        if "user-not-found" in err.lower() or "no user record" in err.lower():
            pass
        else:
            return jsonify({"message": f"Failed to delete Firebase user: {err}"}), 500

    db.session.delete(user_to_delete)
    db.session.commit()

    return jsonify({"message": "User deleted successfully.", "userId": user_id}), 200


@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("main.index"))