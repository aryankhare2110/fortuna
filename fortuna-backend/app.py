from flask import Flask, jsonify
from flask_cors import CORS
from db import init_db_pool
from routes.authRoutes import auth_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object("config.Config")

    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}})

    init_db_pool()

    app.register_blueprint(auth_bp)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "project": "Fortuna"}), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)