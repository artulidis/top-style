import firebase_admin
from firebase_admin import credentials
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from sqlalchemy import exists
import os, secrets

db = SQLAlchemy()
migrate = Migrate()


STYLIST_SEED_DATA = [
    {
        "order": 1,
        "name": "Kate Noda",
        "bio": "I’m Kate Noda — Master Stylist, Color Expert, and Owner of Top Style Salon. My love for hair and beauty started when I was a little girl, fascinated by how a touch of color or a great cut could completely transform someone’s confidence. After graduating from one of America’s top beauty schools, Paul Mitchell The School , I built my foundation behind the chair and soon found my true calling — creating personalized looks that make every guest feel radiant, empowered, and authentically themselves. In 2017, I opened my first studio salon in Tysons, and by November 2019, we proudly expanded to our current Top Style Salon by Kate Noda in Reston’s beautiful Lake Anne community. Our space reflects everything I value — warmth, artistry, teamwork, and genuine connection with our guests. As a Global Master Colorist and American Board-Certified Haircolorist, color is my specialty and my passion. Whether it’s precise , long-lasting grey coverage, soft grey blending, or multi-dimensional techniques like balayage, highlights, or AirTouch, I believe color should always enhance natural beauty and complement each client’s skin tone, lifestyle, and personality. Equally, I take pride in crafting cuts that flatter face shape and texture, creating looks that are modern, wearable, and built to last. I work with focus and speed — but never compromise on quality or the personal touch that defines my craft. I believe every guest who walks through our doors should feel at home, appreciated, and beautiful in their own unique way. At Top Style, our work goes beyond hair — it’s about connection, care, and the joy of helping you feel truly seen. ✨",
        "image": "../static/assets/stylists/Kate.jpg",
    },
    {
        "order": 2,
        "name": "Ana",
        "bio": "I’m a stylist at Top Style Salon by Kate Noda, where I’ve had the pleasure of working alongside Kate and our talented team for the past few years. With over three years of experience in the beauty industry, I’ve dedicated my career to mastering the art of cutting, coloring, and styling — and I’m continually inspired by how a great hair transformation can boost someone’s confidence. I specialize in women’s haircuts and color, with a focus on balayage, lived-in color, and dimensional blondes. Staying current with the latest trends and techniques allows me to create modern, personalized looks that reflect each client’s unique style. Outside the salon, I’m passionate about travel, adventure, and discovering life’s little joys. I can’t wait to welcome you into my chair and help you look — and feel — your absolute best! ✨",
        "image": "../static/assets/stylists/Ana.jpg",
    },
    {
        "order": 3,
        "name": "Corey",
        "bio": "Hi, I’m Corey! I’m a hairstylist with over 20 years of experience in the beauty industry, and I’m passionate about helping people feel confident and beautiful through their hair. I specialize in lived-in color, precision cuts, textured hair, and silk presses, blending artistry and technique to create styles that feel both effortless and timeless. I believe every client deserves a look that reflects who they are — something unique, flattering, and easy to maintain. I love taking the time to really listen, understand your vision, and bring it to life with detail and care. Outside the salon, I’m always exploring new trends and techniques to keep my work fresh and inspiring. I can’t wait to welcome you to my chair and create something beautiful together! ✂️✨",
        "image": "../static/assets/stylists/Corey.jpg",
    },
    {
        "order": 4,
        "name": "Mark",
        "bio": "With more than a decade behind the chair, I’ve dedicated my career to creating healthy, luxurious hair with refined technique and a personalized touch. I began my training in New York City under Aveda’s leading educators, where I developed a strong foundation in precision cutting, modern color theory, and advanced styling. That early inspiration led me beyond the salon and into editorial work, fashion collaboration, and projects where artistry and technical mastery meet. I am also a certified Ouidad specialist, which means I’ve spent years studying curl behavior, hydration, and shape. I have a genuine passion for working with natural curls and textured hair—enhancing definition, movement, and softness without compromising health. Whether I’m creating a sleek finish, designing effortless waves, or honoring a client’s natural pattern, my goal is always the same: hair that feels as good as it looks. My approach is simple—listen deeply, execute meticulously, and protect the integrity of the hair. Every guest deserves not only a beautiful result, but a tailored experience that reflects their individuality. I’m here to make sure you leave feeling confident, polished, and authentically you.",
        "image": "../static/assets/stylists/Mark.jpg",
    },
    {
        "order": 5,
        "name": "Emi",
        "bio": "Hi, I’m Emi! I have over 13 years of experience in the beauty industry and have proudly been part of the Top Style Salon team for the past 5 years. I’m a licensed cosmetologist in the U.S., specializing in bridal hair and makeup — helping brides and their parties look and feel their absolute best on such a special day. In addition to bridal styling, I also love creating beautiful color, highlights, balayage, and haircuts that enhance each client’s natural beauty. My goal is always to make every guest feel happy, confident, and completely relaxed throughout their service. I take pride in my gentle approach and attention to detail — my clients often say they feel calm and pampered in my chair. I look forward to helping you feel your most beautiful self! 💗",
        "image": "../static/assets/stylists/Emi.jpg",
    },
    {
        "order": 6,
        "name": "Lory",
        "bio": "Hi, I’m Lory! My journey in the beauty industry began backstage at fashion and special events in my hometown of Puerto Rico, where I quickly developed a keen eye for artistry and detail. That early experience sparked my passion and inspired me to pursue a career as a makeup artist and hairstylist. Being bilingual in Spanish and English allows me to connect with a diverse range of clients, creating a comfortable, fun, and welcoming environment wherever I work. Over the years, I’ve had the honor of training under several renowned artists, working with local celebrities, and participating in fashion shows both in Puerto Rico and out of state, including New York Fashion Week (NYFW). My work has been proudly featured in multiple fashion and bridal magazines, which has deepened my love for the craft even more. Now, as I expand my expertise to include all hair-related services, I’m gaining valuable hands-on salon experience that allows me to combine creativity, technical skill, and client care every day. I truly love what I do, and I’m excited for the opportunity to work with you and make you feel your most beautiful and confident self! ✨",
        "image": "../static/assets/stylists/Lory.jpg",
    },
    {
        "order": 7,
        "name": "Mary",
        "bio": "Hi, I’m Mary! I bring both creativity and care to every appointment, making clients feel at home while delivering beautiful, customized results. I specialize in color corrections, balayage and blonding, precision cutting, and curly hair — skills I have refined through years of hands-on experience and continued education. With my friendly, down-to-earth vibe, I make every visit feel like a reset. Whether you’re after a fresh new style or a total transformation, you’ll leave my chair feeling confident, cared for, and absolutely radiant.",
        "image": "../static/assets/stylists/Mary.jpg",
    },
    {
        "order": 8,
        "name": "Julia",
        "bio": "Hi, I’m Julia! I’m the front desk at Top Style, where I take care of client relations and the salon’s daily management. I’m known for my calm and cheerful personality — and my love for coffee keeps me energized throughout the day! I truly enjoy being part of a space that helps people feel confident and beautiful, while making sure everything runs smoothly behind the scenes. From welcoming clients with a smile to ensuring every appointment flows perfectly, my goal is to make every visit at Top Style an effortless and enjoyable experience.",
        "image": "../static/assets/stylists/Julia.jpg",
    },
    {
        "order": 9,
        "name": "Taylor",
        "bio": "Hi, I’m Taylor! I’m one of the smiling faces you’ll see at the front desk, making sure everything in our salon runs smoothly. While I don’t do hair or makeup, I like to think of myself as the behind-the-scenes multitasker who keeps things flowing — scheduling appointments, helping guests feel at home, and making sure every visit starts (and ends!) with a smile. I’m all about creating a welcoming, easygoing vibe — whether that means chatting about your day, offering you a cup of coffee, or simply making sure you feel comfortable and cared for from the moment you walk in. When I’m not at the salon, you can usually find me curled up with my pets, reading a good book, or catching up with friends. I love being part of a place that celebrates creativity, kindness, and connection — and I can’t wait to welcome you to Top Style! ✨",
        "image": "../static/assets/stylists/Taylor.jpg",
    },
    {
        "order": 10,
        "name": "Nisa",
        "bio": "Hi, I’m Nisa! I’ve been part of the Top Style team since 2021, where I work as a hairstylist assistant, receptionist, and social media manager. I love being part of a space that helps people look and feel their best while creating a welcoming and relaxing environment for every client who walks through our doors. My favorite part of the salon experience is the wash—it’s such a calming and refreshing moment that everyone deserves to enjoy. Whether I’m assisting stylists, greeting clients, or capturing our work for social media, I’m passionate about making every visit at Top Style something to look forward to.",
        "image": "../static/assets/stylists/Nisa.jpg",
    },
    {
        "order": 11,
        "name": "Mikayla",
        "bio": "Hi, I’m Mikayla! I work as a hairstylist assistant, social media manager, and receptionist. I truly enjoy being a part of the Top Style team. I'm beyond grateful to be able to learn about beauty each day. I’m very passionate about beauty and keeping up with the trends and working with Kate has taught me so much. I love to connect and create a positive environment with every client that walks in. I feel fulfilled at the end of each day knowing I helped make every client feel like their best self! I look forward to making your top style experience perfect!",
        "image": "../static/assets/stylists/Mikayla.jpg",
    },
]


def _seed_stylists_if_empty(models):
    has_stylists = db.session.query(exists().where(models.Stylist.id.isnot(None))).scalar()
    if has_stylists:
        return

    for item in STYLIST_SEED_DATA:
        db.session.add(models.Stylist(
            order=item["order"],
            name=item["name"],
            bio=item["bio"],
            image=item["image"],
        ))

    db.session.commit()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = secrets.token_hex(32)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite"
    app.config["SQLACHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    migrate.init_app(app, db)

    cred = credentials.Certificate(os.getenv("FIREBASE_CERTIFICATE"))
    firebase_admin.initialize_app(cred)

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    from . import models

    with app.app_context():
        db.create_all()

        user_exists = db.session.query(
            exists().where(models.User.role == "admin")
            ).scalar()

        if not user_exists:
            seeded_admin = models.User(
                firebase_uid = os.getenv("ADMIN_UID"),
                email = os.getenv("ADMIN_EMAIL"),
                name = "Arthur K",
                role = "admin",
                status = "active"
            )

            db.session.add(seeded_admin)
            db.session.commit()
            print(seeded_admin.firebase_uid)

        _seed_stylists_if_empty(models)

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