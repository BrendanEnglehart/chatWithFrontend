"""Main Flask runner for the Chat application"""

import datetime
import json
from os import environ as env
from urllib.parse import quote_plus, urlencode
import requests as external_requests
from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
from flask import Flask, redirect, render_template, session, url_for, request
from flask_socketio import join_room, leave_room, SocketIO, emit
from routes.basic_functions import BasicBlueprint

ENV_FILE = find_dotenv()

LANDING_PAGE = "default_landing.html"

app = Flask(__name__)
app.config["SESSION_TYPE"] = "filesystem"
app.config["DEVELOPMENT_MODE"] = False
app.config["DEFAULT_TIMEOUT"] = (
    15  # default timeout for server requests. Most requests are less than a second.
)
app.register_blueprint(BasicBlueprint)
oauth = OAuth(app)
socketio = SocketIO()

app.config["API_ENDPOINT"] = "http://127.0.0.1:5001"
if ENV_FILE:
    load_dotenv(ENV_FILE)
    app.secret_key = env.get("APP_SECRET_KEY")
    app.config["API_ENDPOINT"] = env.get("API_ENDPOINT")
    if env.get("CUSTOM_LANDING"):
        LANDING_PAGE = env.get("CUSTOM_LANDING_PAGE")
    if env.get("CUSTOM_ROUTES"):
        try:
            from custom_routes.custom_routes import CustomBlueprint

            app.register_blueprint(CustomBlueprint)
        except ImportError as exc:
            raise ImportError("Failed to import Custom Routes") from exc

    oauth.register(
        "auth0",
        client_id=env.get("AUTH0_CLIENT_ID"),
        client_secret=env.get("AUTH0_CLIENT_SECRET"),
        client_kwargs={
            "scope": "openid profile email",
        },
        server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration',
    )
else:
    app.config["DEVELOPMENT_MODE"] = True
    app.config["DEV_MODE_CHAT_STACK"] = []


@socketio.on("message")
def handle_message(room, data):
    """Socket Handler for message sending"""

    text = data
    if app.config["DEVELOPMENT_MODE"]:
        emit(
            "message",
            {
                "username": "test",
                "picture": "https://s.gravatar.com/avatar/a36cdd3b39f985b18b729fbe84863cae?s=480&am"
                + "p;r=pg&amp;d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fbr.png",
                "topic": "general",
                "text": text,
            },
            json=True,
            to="general",
            include_self=True,
        )

        return

    # On Reload, the room is stored in the session
    # otherwise, it isn't the source of truth
    user_id = session.get("user_id")
    if room == "":
        room = session.get("topic")["_id"]
    message = (
        {
            "user_id": user_id,
            "picture": session.get("user")["userinfo"]["picture"],
            "topic": room,
            "text": text,
        },
    )
    ret = external_requests.post(
        app.config["API_ENDPOINT"] + "/message/" + room,
        json={
            "user_id": user_id,
            "picture": session.get("user")["userinfo"]["picture"],
            "topic": room,
            "text": text,
        },
        timeout=app.config["DEFAULT_TIMEOUT"],
    )
    emit("message", message, json=True, to=room, include_self=True)
    if ret.ok:
        pass
    else:
        app.logger.error(ret.raise_for_status())


@app.route("/sendMessage", methods=["POST"])
def send_message():
    """Send the message written in the text block to the server"""
    text = request.get_json()["text"]
    user_id = session.get("user_id")
    if app.config["DEVELOPMENT_MODE"]:
        app.config["DEV_MODE_CHAT_STACK"].append(
            {
                "user_id": "test",
                "picture": "https://s.gravatar.com/avatar/a36cdd3b39f985b18b729fbe84863cae?s=480&amp;r=pg&amp;d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fbr.png",
                "topic": "general",
                "text": text,
            }
        )
        return {}

    topic = session.get("topic")

    ret = external_requests.post(
        app.config["API_ENDPOINT"] + "/message/" + topic["_id"],
        json={
            "user_id": user_id,
            "picture": session.get("user")["userinfo"]["picture"],
            "topic": topic["_id"],
            "text": text,
        },
        timeout=app.config["DEFAULT_TIMEOUT"],
    )
    if ret.ok:
        pass  # Changing out print message for something else
    else:
        app.logger.error(ret.raise_for_status())
    return ret.content


@app.route("/")
def default_landing():
    """Default Landing page"""
    if app.config["DEVELOPMENT_MODE"]:
        return redirect("/chat")
    return render_template(LANDING_PAGE)


@app.route("/chat")
def home():
    """Base Route"""
    if not app.config["DEVELOPMENT_MODE"]:
        session["stream_latest"] = datetime.datetime.min
        return render_template(
            "index.html",
            session=session.get("user"),
            pretty=json.dumps(session.get("user"), indent=4),
        )
    render_template("index.html", session=app.config["DEVELOPMENT_MODE"])


@app.route("/login")
def login():
    """redirect to the Oauth"""
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )


@app.route("/callback", methods=["GET", "POST"])
def callback():
    """Handle the return from the oauth"""
    try:
        token = oauth.auth0.authorize_access_token()
        session["user"] = token
        id_token = session.get("user")["userinfo"]["sub"]
        args = "/user/login"
        login_request = external_requests.post(
            app.config["API_ENDPOINT"] + args,
            json={
                "username": session.get("user")["userinfo"]["nickname"],
                "picture": session.get("user")["userinfo"]["picture"],
                "auth_id": id_token,
                "email": session.get("user")["userinfo"]["email"],
            },
            timeout=app.config["DEFAULT_TIMEOUT"],
        )
        data = json.loads(login_request.content)
        session["user_id"] = data["_id"]
    except Exception as e:
        app.logger.error(e)
    return redirect("/chat")


@app.route("/logout")
def logout():
    """Clear the session and return home"""
    session.clear()
    return redirect(
        "https://"
        + env.get("AUTH0_DOMAIN")
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home", _external=True),
                "client_id": env.get("AUTH0_CLIENT_ID"),
            },
            quote_via=quote_plus,
        )
    )




@socketio.on("join")
def on_join(topic_id):
    """User Joins a topic"""
    if app.config["DEVELOPMENT_MODE"]:
        join_room("general")
        return

    join_room(topic_id)


@socketio.on("joinSession")
def on_join_session():
    """User Joins a topic"""
    if app.config["DEVELOPMENT_MODE"]:
        join_room("general")
        return
    topic = session.get("topic")

    join_room(topic["_id"])


@socketio.on("leave")
def on_leave(topic_id):
    """User leaves a topic"""
    if app.config["DEVELOPMENT_MODE"]:
        leave_room("general")
        return
    leave_room(topic_id)


@socketio.on("leaveSession")
def on_leave_session():
    """User leaves a topic"""
    if app.config["DEVELOPMENT_MODE"]:
        leave_room("general")
        return

    topic = session.get("topic")
    leave_room(topic["_id"])


if __name__ == "__main__":
    socketio.init_app(app)
    socketio.run(app, port=5000, host="0.0.0.0")
else:
    socketio.init_app(app)
    gunicorn = app
