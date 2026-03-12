"""Standalone database seed script for TopStyle.

Populates the database with default content from ``seed_data.json`` so that
templates can render directly from the database without fallback values.
Copies default asset files into ``static/uploads/`` so that all media paths
are consistent with the upload system used by the CMS.

Usage:
    Local:   python seed.py
    Docker:  docker exec <container> python seed.py

The script is idempotent -- it checks for existing data before inserting and
will not overwrite content that has already been modified via the dashboard.
"""

import json
import os
import shutil

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app import create_app, db
from app.models import (
    User,
    Stylist,
    HomeAboutSection,
    HomeServicesSection,
    HomeStylistsSection,
    HomeBridalSection,
    Service,
    ServicesImage,
)

BASE_DIR = os.path.dirname(__file__)
ASSETS_DIR = os.path.join(BASE_DIR, "app", "static", "assets")
UPLOADS_DIR = os.path.join(BASE_DIR, "app", "static", "uploads")
DATA_FILE = os.path.join(BASE_DIR, "seed_data.json")


def _load_data():
    """Load and return the parsed seed_data.json."""
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _copy_asset(src_name, upload_subdir, dest_name=None):
    """Copy *src_name* from ``assets/`` into ``uploads/<upload_subdir>/``.

    Returns the URL path (e.g. ``/static/uploads/home/GalleryImage1.jpg``)
    that can be stored in the database and served by Flask / nginx.
    """
    dest_name = dest_name or os.path.basename(src_name)
    src = os.path.join(ASSETS_DIR, src_name)
    dest_dir = os.path.join(UPLOADS_DIR, upload_subdir)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, dest_name)
    if not os.path.exists(dest):
        shutil.copy2(src, dest)
    return f"/static/uploads/{upload_subdir}/{dest_name}"


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------

def seed_admin(data):
    """Seed the admin user from environment variables."""
    admin_uid = os.getenv("ADMIN_UID")
    admin_email = os.getenv("ADMIN_EMAIL")

    if not admin_uid or not admin_email:
        print("  [skip] ADMIN_UID / ADMIN_EMAIL not set -- skipping admin seed")
        return

    if User.query.filter_by(role="admin").first():
        print("  [skip] Admin user already exists")
        return

    db.session.add(User(
        firebase_uid=admin_uid,
        email=admin_email,
        name=data["admin"]["name"],
        role="admin",
        status="active",
    ))
    db.session.commit()
    print("  [done] Admin user seeded")


def seed_stylists(data):
    """Seed default stylists, copying photos into uploads/stylists/."""
    if Stylist.query.first():
        print("  [skip] Stylists already exist")
        return

    for item in data["stylists"]:
        image_path = _copy_asset(item["asset"], "stylists")
        db.session.add(Stylist(
            order=item["order"],
            name=item["name"],
            bio=item["bio"],
            image=image_path,
        ))

    db.session.commit()
    print(f"  [done] {len(data['stylists'])} stylists seeded")


def seed_home_sections(data):
    """Seed the four home-page sections with default text and media."""
    sections = data["home_sections"]

    # --- About ---
    if not HomeAboutSection.query.first():
        cfg = sections["about"]
        gallery = {}
        for i, asset in enumerate(cfg["gallery_assets"], start=1):
            gallery[f"gallery_image{i}"] = _copy_asset(asset, "home")

        db.session.add(HomeAboutSection(
            heading=cfg["heading"],
            text=cfg["text"],
            **gallery,
        ))
        print("  [done] HomeAboutSection seeded")
    else:
        print("  [skip] HomeAboutSection already exists")

    # --- Services ---
    if not HomeServicesSection.query.first():
        cfg = sections["services"]
        video_path = _copy_asset(cfg["video_asset"], "home")
        db.session.add(HomeServicesSection(
            heading=cfg["heading"],
            text=cfg["text"],
            salon_video=video_path,
        ))
        print("  [done] HomeServicesSection seeded")
    else:
        print("  [skip] HomeServicesSection already exists")

    # --- Stylists ---
    if not HomeStylistsSection.query.first():
        cfg = sections["stylists"]
        img_path = _copy_asset(cfg["image_asset"], "home")
        db.session.add(HomeStylistsSection(
            heading=cfg["heading"],
            text=cfg["text"],
            stylists_image=img_path,
        ))
        print("  [done] HomeStylistsSection seeded")
    else:
        print("  [skip] HomeStylistsSection already exists")

    # --- Bridal ---
    if not HomeBridalSection.query.first():
        cfg = sections["bridal"]
        bridal_imgs = {}
        for i, asset in enumerate(cfg["bridal_assets"], start=1):
            bridal_imgs[f"bridal_image{i}"] = _copy_asset(asset, "home")

        db.session.add(HomeBridalSection(
            heading=cfg["heading"],
            text=cfg["text"],
            **bridal_imgs,
        ))
        print("  [done] HomeBridalSection seeded")
    else:
        print("  [skip] HomeBridalSection already exists")

    db.session.commit()


def seed_services(data):
    """Seed all service categories with default names, prices, and details."""
    if Service.query.first():
        print("  [skip] Services already exist")
        return

    total = 0
    for category, items in data["services"].items():
        for order, item in enumerate(items, start=1):
            db.session.add(Service(
                name=item["name"],
                price=item["price"],
                details=item.get("details", ""),
                category=category,
                order=order,
            ))
            total += 1

    db.session.commit()
    print(f"  [done] {total} services seeded across {len(data['services'])} categories")


def seed_service_images(data):
    """Seed default category images, copying them into uploads/services/."""
    if ServicesImage.query.first():
        print("  [skip] Service images already exist")
        return

    for category, asset in data["service_images"].items():
        img_path = _copy_asset(asset, "services")
        db.session.add(ServicesImage(
            category=category,
            uri=img_path,
        ))

    db.session.commit()
    print(f"  [done] {len(data['service_images'])} service images seeded")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def seed_all():
    data = _load_data()
    print("Seeding database...")
    seed_admin(data)
    seed_stylists(data)
    seed_home_sections(data)
    seed_services(data)
    seed_service_images(data)
    print("Seeding complete.")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_all()
