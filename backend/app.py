import json
import os
import re
import secrets
from datetime import datetime, timezone

from functools import wraps

from flask import Flask, g, jsonify, request, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from werkzeug.security import check_password_hash, generate_password_hash

from templates import ROLES

db = SQLAlchemy()
PORTFOLIO_STYLES = {
    "glassmorphism",
    "kinetic-ui",
    "neumorphism",
    "bento-grid",
    "dark-grid",
    "claymorphism",
}
MAX_PORTFOLIOS_PER_USER = 5


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(254), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    portfolios = db.relationship("Portfolio", backref="owner", lazy=True)


def serialize_user(user):
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
    }


class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(60), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class PortfolioGeneration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    saved_portfolio_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


def create_app():
    app = Flask(__name__)
    secret_key = os.environ.get("SECRET_KEY")
    if not secret_key and os.environ.get("APP_ENV", "development").lower() == "production":
        raise RuntimeError("SECRET_KEY must be configured when APP_ENV=production.")
    app.config["SECRET_KEY"] = secret_key or "local-development-only-change-this-secret-before-deployment"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    app.config["PERMANENT_SESSION_LIFETIME"] = 60 * 60 * 24 * 14
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "sqlite:///portfolios.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "supports_credentials": True,
        }
    })
    db.init_app(app)

    with app.app_context():
        db.create_all()
        user_columns = {
            column["name"] for column in inspect(db.engine).get_columns("user")
        }
        if "first_name" not in user_columns:
            db.session.execute(text("ALTER TABLE user ADD COLUMN first_name VARCHAR(80)"))
        if "last_name" not in user_columns:
            db.session.execute(text("ALTER TABLE user ADD COLUMN last_name VARCHAR(80)"))
        if "first_name" not in user_columns or "last_name" not in user_columns:
            db.session.commit()

        portfolio_columns = {
            column["name"] for column in inspect(db.engine).get_columns("portfolio")
        }
        if "user_id" not in portfolio_columns:
            db.session.execute(
                text("ALTER TABLE portfolio ADD COLUMN user_id INTEGER REFERENCES user(id)")
            )
            db.session.commit()
        existing_portfolios = Portfolio.query.filter(
            Portfolio.user_id.isnot(None)
        ).all()
        linked_portfolio_ids = {
            generation.saved_portfolio_id
            for generation in PortfolioGeneration.query.filter(
                PortfolioGeneration.saved_portfolio_id.isnot(None)
            ).all()
        }
        legacy_portfolios = [
            portfolio for portfolio in existing_portfolios
            if portfolio.id not in linked_portfolio_ids
        ]
        if legacy_portfolios:
            db.session.add_all([
                PortfolioGeneration(
                    user_id=portfolio.user_id,
                    content=portfolio.content,
                    saved_portfolio_id=portfolio.id,
                    created_at=portfolio.created_at,
                )
                for portfolio in legacy_portfolios
            ])
            db.session.commit()

    @app.get("/api/auth/csrf")
    def get_csrf_token():
        if "csrf_token" not in session:
            session["csrf_token"] = secrets.token_urlsafe(32)
        return jsonify({"csrfToken": session["csrf_token"]})

    @app.before_request
    def protect_state_changes():
        if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
            return None
        if not request.path.startswith("/api/"):
            return None
        expected = session.get("csrf_token", "")
        supplied = request.headers.get("X-CSRF-Token", "")
        if not expected or not secrets.compare_digest(expected, supplied):
            return jsonify({"error": "Your session expired. Refresh the page and try again."}), 403
        return None

    def authenticated(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            user_id = session.get("user_id")
            user = db.session.get(User, user_id) if user_id else None
            if user is None:
                session.pop("user_id", None)
                return jsonify({"error": "Please sign in to continue."}), 401
            g.current_user = user
            return view(*args, **kwargs)

        return wrapped

    @app.post("/api/auth/signup")
    def sign_up():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "A JSON request body is required."}), 400

        email = data.get("email", "")
        password = data.get("password", "")
        first_name = data.get("firstName", "")
        last_name = data.get("lastName", "")
        if not isinstance(first_name, str) or not first_name.strip() or len(first_name.strip()) > 80:
            return jsonify({"error": "First name is required and must be 80 characters or fewer."}), 400
        if not isinstance(last_name, str) or not last_name.strip() or len(last_name.strip()) > 80:
            return jsonify({"error": "Last name is required and must be 80 characters or fewer."}), 400
        if not isinstance(email, str):
            return jsonify({"error": "Enter a valid email address."}), 400
        email = email.strip().lower()
        if len(email) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            return jsonify({"error": "Enter a valid email address."}), 400
        if not isinstance(password, str) or len(password) < 8 or len(password) > 128:
            return jsonify({"error": "Password must be between 8 and 128 characters."}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "An account with this email already exists."}), 409

        user = User(
            email=email,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.commit()
        session.clear()
        session["user_id"] = user.id
        session.permanent = True
        session["csrf_token"] = secrets.token_urlsafe(32)
        return jsonify({"user": serialize_user(user)}), 201

    @app.post("/api/auth/signin")
    def sign_in():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "A JSON request body is required."}), 400
        email = data.get("email", "")
        password = data.get("password", "")
        if not isinstance(email, str) or not isinstance(password, str):
            return jsonify({"error": "Email or password is incorrect."}), 401
        user = User.query.filter_by(email=email.strip().lower()).first()
        if user is None or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Email or password is incorrect."}), 401

        session.clear()
        session["user_id"] = user.id
        session.permanent = True
        session["csrf_token"] = secrets.token_urlsafe(32)
        return jsonify({"user": serialize_user(user)})

    @app.post("/api/auth/signout")
    @authenticated
    def sign_out():
        session.clear()
        return jsonify({"message": "Signed out."})

    @app.get("/api/auth/me")
    @authenticated
    def get_current_user():
        return jsonify({"user": serialize_user(g.current_user)})

    @app.put("/api/auth/profile")
    @authenticated
    def update_profile():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "A JSON request body is required."}), 400

        first_name = data.get("firstName", "")
        last_name = data.get("lastName", "")
        if not isinstance(first_name, str) or not first_name.strip() or len(first_name.strip()) > 80:
            return jsonify({"error": "First name is required and must be 80 characters or fewer."}), 400
        if not isinstance(last_name, str) or not last_name.strip() or len(last_name.strip()) > 80:
            return jsonify({"error": "Last name is required and must be 80 characters or fewer."}), 400

        g.current_user.first_name = first_name.strip()
        g.current_user.last_name = last_name.strip()
        db.session.commit()
        return jsonify({"user": serialize_user(g.current_user)})

    @app.get("/api/roles")
    def get_roles():
        return jsonify(list(ROLES.values()))

    @app.post("/api/portfolios")
    @authenticated
    def generate_portfolio():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "A JSON request body is required."}), 400

        name = data.get("name", "")
        role_id = data.get("role", "")
        style_id = data.get("style", "dark-grid")
        email = data.get("email", "")
        phone = data.get("phone", "")
        about = data.get("about", "")
        skills = data.get("skills", [])
        projects = data.get("projects", [])

        if not isinstance(name, str) or not name.strip() or len(name.strip()) > 120:
            return jsonify({"error": "Name is required and must be 120 characters or fewer."}), 400
        if not isinstance(role_id, str) or role_id not in ROLES:
            return jsonify({"error": "Choose a supported job role."}), 400
        if not isinstance(style_id, str) or style_id not in PORTFOLIO_STYLES:
            return jsonify({"error": "Choose a supported portfolio style."}), 400
        if not isinstance(email, str) or not email.strip() or len(email.strip()) > 254 or "@" not in email:
            return jsonify({"error": "Enter a valid email address."}), 400
        if not isinstance(phone, str) or len(phone.strip()) > 30:
            return jsonify({"error": "Contact number must be 30 characters or fewer."}), 400
        clean_phone = phone.strip()
        if clean_phone and (
            not re.fullmatch(r"[0-9+().\-\s]+", clean_phone)
            or not 7 <= sum(character.isdigit() for character in clean_phone) <= 15
        ):
            return jsonify({"error": "Enter a valid contact number, including 7 to 15 digits."}), 400
        if not isinstance(about, str) or not about.strip() or len(about.strip()) > 1200:
            return jsonify({"error": "About section is required and must be 1,200 characters or fewer."}), 400
        if not isinstance(skills, list) or len(skills) > 20:
            return jsonify({"error": "Provide up to 20 skills as a list."}), 400
        if not isinstance(projects, list) or len(projects) > 10:
            return jsonify({"error": "Provide up to 10 projects as a list."}), 400

        if any(not isinstance(skill, str) for skill in skills):
            return jsonify({"error": "Each skill must be text."}), 400

        clean_skills = [skill.strip()[:40] for skill in skills if skill.strip()]
        clean_projects = []
        for project in projects:
            if not isinstance(project, dict):
                return jsonify({"error": "Each project must include a title and description."}), 400
            title = project.get("title", "")
            description = project.get("description", "")
            link = project.get("link", "")
            if not isinstance(title, str) or not isinstance(description, str) or not isinstance(link, str):
                return jsonify({"error": "Project title, description, and link must be text."}), 400
            title = title.strip()
            description = description.strip()
            link = link.strip()
            if not title or not description:
                return jsonify({"error": "Every project needs a title and description."}), 400
            clean_projects.append({
                "title": title[:120],
                "description": description[:600],
                "link": link[:500],
            })

        generation_count = PortfolioGeneration.query.filter_by(
            user_id=g.current_user.id
        ).count()
        if generation_count >= MAX_PORTFOLIOS_PER_USER:
            return jsonify({
                "error": f"You have reached the limit of {MAX_PORTFOLIOS_PER_USER} portfolios. Visit your library to review your saved work."
            }), 409

        role_template = ROLES[role_id]
        portfolio = {
            "name": name.strip(),
            "role": role_id,
            "roleLabel": role_template["label"],
            "style": style_id,
            "email": email.strip(),
            "phone": clean_phone,
            "about": about.strip(),
            "skills": clean_skills,
            "projects": clean_projects,
            "template": role_template,
        }

        generation = PortfolioGeneration(
            user_id=g.current_user.id,
            content=json.dumps(portfolio),
        )
        db.session.add(generation)
        db.session.commit()

        return jsonify({
            "generationId": generation.id,
            "used": generation_count + 1,
            "limit": MAX_PORTFOLIOS_PER_USER,
            "portfolio": portfolio,
        }), 201

    @app.post("/api/portfolios/save")
    @authenticated
    def save_generated_portfolio():
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or not isinstance(data.get("generationId"), int):
            return jsonify({"error": "A valid generated portfolio is required."}), 400

        generation = PortfolioGeneration.query.filter_by(
            id=data["generationId"], user_id=g.current_user.id
        ).first()
        if generation is None:
            return jsonify({"error": "Generated portfolio not found."}), 404

        if generation.saved_portfolio_id is not None:
            existing = Portfolio.query.filter_by(
                id=generation.saved_portfolio_id, user_id=g.current_user.id
            ).first()
            if existing is not None:
                return jsonify({
                    "id": existing.id,
                    "portfolio": json.loads(existing.content),
                })
            generation.saved_portfolio_id = None

        portfolio = json.loads(generation.content)
        record = Portfolio(
            user_id=g.current_user.id,
            name=portfolio["name"],
            role=portfolio["role"],
            content=generation.content,
        )
        db.session.add(record)
        db.session.flush()
        generation.saved_portfolio_id = record.id
        db.session.commit()

        return jsonify({"id": record.id, "portfolio": portfolio}), 201

    @app.get("/api/portfolios/<int:portfolio_id>")
    @authenticated
    def get_portfolio(portfolio_id):
        record = Portfolio.query.filter_by(
            id=portfolio_id, user_id=g.current_user.id
        ).first()
        if record is None:
            return jsonify({"error": "Portfolio not found."}), 404
        return jsonify({"id": record.id, "portfolio": json.loads(record.content)})

    @app.delete("/api/portfolios/<int:portfolio_id>")
    @authenticated
    def delete_portfolio(portfolio_id):
        record = Portfolio.query.filter_by(
            id=portfolio_id, user_id=g.current_user.id
        ).first()
        if record is None:
            return jsonify({"error": "Portfolio not found."}), 404
        PortfolioGeneration.query.filter_by(
            user_id=g.current_user.id, saved_portfolio_id=record.id
        ).update({"saved_portfolio_id": None})
        db.session.delete(record)
        db.session.commit()
        return jsonify({"message": "Portfolio deleted."})

    @app.get("/api/portfolios/usage")
    @authenticated
    def get_portfolio_usage():
        used = PortfolioGeneration.query.filter_by(
            user_id=g.current_user.id
        ).count()
        return jsonify({
            "used": used,
            "limit": MAX_PORTFOLIOS_PER_USER,
            "remaining": max(0, MAX_PORTFOLIOS_PER_USER - used),
        })

    @app.get("/api/portfolios")
    @authenticated
    def list_portfolios():
        records = (
            Portfolio.query.filter_by(user_id=g.current_user.id)
            .order_by(Portfolio.created_at.desc(), Portfolio.id.desc())
            .all()
        )
        return jsonify([
            {
                "id": record.id,
                "name": record.name,
                "role": record.role,
                "createdAt": record.created_at.isoformat(),
                "portfolio": json.loads(record.content),
            }
            for record in records
        ])

    @app.delete("/api/portfolios")
    @authenticated
    def delete_all_portfolios():
        PortfolioGeneration.query.filter_by(
            user_id=g.current_user.id
        ).update({"saved_portfolio_id": None})
        Portfolio.query.filter_by(user_id=g.current_user.id).delete()
        db.session.commit()
        return jsonify({"message": "All portfolios deleted."})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
