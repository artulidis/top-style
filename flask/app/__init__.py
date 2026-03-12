import firebase_admin
from firebase_admin import credentials
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
import os, secrets

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = secrets.token_hex(32)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite"
    app.config["SQLACHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    migrate.init_app(app, db)

    firebase_cert = os.getenv("FIREBASE_CERTIFICATE")
    if firebase_cert and not firebase_admin._apps:
        cred = credentials.Certificate(firebase_cert)
        firebase_admin.initialize_app(cred)

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    from . import models

    with app.app_context():
        db.create_all()

    @login_manager.user_loader
    def load_user(user_id):
        return models.User.query.get(int(user_id))
    
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from .stats import stats as stats_blueprint
    app.register_blueprint(stats_blueprint)

    from .cms import cms as cms_blueprint
    app.register_blueprint(cms_blueprint)

    app.url_map.strict_slashes = False

    return app
