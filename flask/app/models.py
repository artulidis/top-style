from . import db
from flask_login import UserMixin

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    firebase_uid = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    role = db.Column(db.String(20), default="editor", nullable=False)
    status = db.Column(db.String(20), default="invited", nullable=False)

    def __repr__(self):
        return f"<User {self.email}>"


class SiteStat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Integer, nullable=False, default=0)

    def __repr__(self):
        return f"<SiteStat {self.name}={self.value}>"


class StatsMeta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f"<SiteMeta {self.key}={self.value}>"


class HomeAboutSection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    heading = db.Column(db.Text, nullable=True)
    text = db.Column(db.Text, nullable=True)

    gallery_image1 = db.Column(db.Text, nullable=True)
    gallery_image2 = db.Column(db.Text, nullable=True)
    gallery_image3 = db.Column(db.Text, nullable=True)
    gallery_image4 = db.Column(db.Text, nullable=True)
    gallery_image5 = db.Column(db.Text, nullable=True)
    gallery_image6 = db.Column(db.Text, nullable=True)
    gallery_image7 = db.Column(db.Text, nullable=True)
    gallery_image8 = db.Column(db.Text, nullable=True)
    gallery_image9 = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<HomeAboutSection id={self.id}>"


class HomeServicesSection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    heading = db.Column(db.Text, nullable=True)
    text = db.Column(db.Text, nullable=True)
    salon_video = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<HomeServicesSection id={self.id}>"


class HomeStylistsSection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    heading = db.Column(db.Text, nullable=True)
    text = db.Column(db.Text, nullable=True)
    stylists_image = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<HomeStylistsSection id={self.id}>"


class HomeBridalSection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    heading = db.Column(db.Text, nullable=True)
    text = db.Column(db.Text, nullable=True)
    bridal_image1 = db.Column(db.Text, nullable=True)
    bridal_image2 = db.Column(db.Text, nullable=True)
    bridal_image3 = db.Column(db.Text, nullable=True)
    bridal_image4 = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<HomeBridalSection id={self.id}>"


class Service(db.Model):
    __table_args__ = (
        db.UniqueConstraint("category", "order", name="uq_service_category_order"),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False)
    price = db.Column(db.Text, nullable=False)
    details = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=False, index=True)
    order = db.Column(db.Integer, nullable=False, default=1)

    def __repr__(self):
        return f"<Service id={self.id} category={self.category} order={self.order}>"


class ServicesImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uri = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=False, unique=True)

    def __repr__(self):
        return f"<ServicesImage id={self.id} category={self.category}>"


class Stylist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order = db.Column(db.Integer, nullable=False, default=1)
    name = db.Column(db.Text, nullable=False)
    bio = db.Column(db.Text, nullable=True)
    image = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<Stylist order={self.order} name={self.name}>"