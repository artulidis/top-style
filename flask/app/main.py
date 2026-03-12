from flask import Blueprint, render_template
from flask import redirect, request, url_for
from flask_login import current_user, login_required
from .models import User, HomeAboutSection, HomeServicesSection, HomeStylistsSection, HomeBridalSection, Service, ServicesImage, Stylist
from .stats import increment_stat, get_website_stats
from .utils.auth import admin_required

main = Blueprint("main", __name__)


def _get_services_page_context():
    services = Service.query.order_by(Service.category.asc(), Service.order.asc(), Service.id.asc()).all()
    images = ServicesImage.query.order_by(ServicesImage.category.asc(), ServicesImage.id.asc()).all()

    services_by_category = {}
    for service in services:
        services_by_category.setdefault(service.category, []).append(service)

    images_by_category = {image.category: image.uri for image in images}

    return {
        "services_by_category": services_by_category,
        "images_by_category": images_by_category,
    }


def _get_stylists_page_context():
    stylists = Stylist.query.order_by(Stylist.order.asc(), Stylist.id.asc()).all()
    stylists_by_order = {stylist.order: stylist for stylist in stylists}
    return {
        "stylists": stylists,
        "stylists_by_order": stylists_by_order,
    }

# Routing Logic

@main.before_request
def clear_trailing_slashes():
    if request.path != '/' and request.path.endswith('/'):
            return redirect(request.path[:-1])

@main.route("/")
def index():
    home_about_section = HomeAboutSection.query.first()
    home_services_section = HomeServicesSection.query.first()
    home_stylists_section = HomeStylistsSection.query.first()
    home_bridal_section = HomeBridalSection.query.first()
    return render_template(
        "main/index.html",
        home_about_section=home_about_section,
        home_services_section=home_services_section,
        home_stylists_section=home_stylists_section,
        home_bridal_section=home_bridal_section,
    )

@main.route("/dashboard")
@login_required
def dashboard():
    if current_user.role == "admin":
        return redirect(url_for("main.dashboard_main"))

    return redirect(url_for("main.dashboard_home"))


@main.route("/dashboard/main")
@admin_required
def dashboard_main():
    permitted_users = User.query.order_by(User.id.asc()).all()
    seeded_admin = User.query.filter_by(role="admin").order_by(User.id.asc()).first()
    seeded_admin_id = seeded_admin.id if seeded_admin else None
    website_stats = get_website_stats()

    return render_template(
        "/dashboard/main.html",
        permitted_users=permitted_users,
        seeded_admin_id=seeded_admin_id,
        website_stats=website_stats,
    )


@main.route("/dashboard/home")
@login_required
def dashboard_home():
    home_about_section = HomeAboutSection.query.first()
    home_services_section = HomeServicesSection.query.first()
    home_stylists_section = HomeStylistsSection.query.first()
    home_bridal_section = HomeBridalSection.query.first()
    return render_template(
        "/dashboard/home.html",
        home_about_section=home_about_section,
        home_services_section=home_services_section,
        home_stylists_section=home_stylists_section,
        home_bridal_section=home_bridal_section,
    )

@main.route("/dashboard/services")
@login_required
def dashboard_services():
    return render_template("/dashboard/services.html", **_get_services_page_context())


@main.route("/dashboard/bridal")
@login_required
def dashboard_bridal():
    return render_template("/dashboard/bridal.html", **_get_services_page_context())


@main.route("/dashboard/stylists")
@login_required
def dashboard_stylists():
    return render_template("/dashboard/stylists.html", **_get_stylists_page_context())


@main.route("/services")
def services_page():
    increment_stat("visitors")
    return render_template("main/services.html", **_get_services_page_context())


@main.route("/stylists")
def stylists_page():
    increment_stat("visitors")
    return render_template("main/stylists.html", **_get_stylists_page_context())


@main.route("/bridal")
def bridal_page():
    increment_stat("visitors")
    return render_template("main/bridal.html", **_get_services_page_context())