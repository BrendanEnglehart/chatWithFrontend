"""Main Flask runner for the Chat application"""

import datetime
import json
import copy
from pprint import pprint
from os import environ as env
from urllib.parse import quote_plus, urlencode
import requests as external_requests
from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
from flask import Flask, redirect, render_template, session, url_for, request


DEVELOPMENT_MODE = True
ENV_FILE = find_dotenv()
DEFAULT_TIMEOUT = (
    15  # default timeout for server requests. Most requests are less than a second.
)

app = Flask(__name__)
app.config["SESSION_TYPE"] = "filesystem"
oauth = OAuth(app)

API_ENDPOINT = "http://127.0.0.1:5001"
if ENV_FILE:
    load_dotenv(ENV_FILE)
    app.secret_key = env.get("APP_SECRET_KEY")
    API_ENDPOINT = env.get("API_ENDPOINT")
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
    DEVELOPMENT_MODE = True


# TODO
# Mock Users should at least have these values
# session('user)
# dict_keys(['access_token', 'expires_at', 'expires_in', 'id_token', 'scope', 'token_type', 'userinfo'])
# session('user).userinfo
# dict_keys(['email', 'email_verified','nickname', 'picture', 'updated_at'])
dev_mode_chat_stack = []


# Prod API endpoint #


@app.route("/sendMessage", methods=["POST"])
def send_message():
    """Send the message written in the text block to the server"""
    text = request.get_json()["text"]
    if DEVELOPMENT_MODE:
        dev_mode_chat_stack.append(
            {
                "username": "test",
                "picture": "https://s.gravatar.com/avatar/a36cdd3b39f985b18b729fbe84863cae?s=480&amp;r=pg&amp;d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fbr.png",
                "topic": "general",
                "text": text,
            }
        )
        return {}

    pprint(session.get("user"))
    topic = session.get("topic")
    pprint(topic)
    ret = external_requests.post(
        API_ENDPOINT + "/message/" + topic["_id"],
        json={
            "username": session.get("user")["userinfo"]["nickname"],
            "picture": session.get("user")["userinfo"]["picture"],
            "topic": topic["_id"],
            "text": text,
        },
        timeout=DEFAULT_TIMEOUT,
    )
    if ret.ok:
        print("ok")
    else:
        print(ret.raise_for_status())
    return ret.content


@app.route("/switch_category", methods=["post"])
def switch_category():
    """This is called on the category switch, as noted elsewhere, this will be refactored"""
    if DEVELOPMENT_MODE:
        return {"text": 200}
    category_id = request.get_json()["category_id"]
    session["category"] = category_id
    session.update()
    return {"text": 200}


@app.route("/switch_topic", methods=["post"])
def switch_topic():
    """Switch The topic the user is subscribing to"""
    if DEVELOPMENT_MODE:
        return {"text": 200}
    topic = request.get_json()
    session["topic"] = topic
    session["stream_latest"] = datetime.datetime.min
    session.update()
    return {"text": 200}


@app.route("/new_topic", methods=["post"])
def new_topic():
    """Create a new topic"""
    if DEVELOPMENT_MODE:
        return {}
    topic_name = request.get_json()["name"]
    topic_type = request.get_json()["topic_type"]
    return external_requests.post(
        API_ENDPOINT + "/topic/",
        json={
            "category_id": session.get("category"),
            "name": topic_name,
            "type": topic_type,
            "metadata": "",
        },
        timeout=DEFAULT_TIMEOUT,
    ).content


@app.route("/new_category", methods=["post"])
def new_category():
    """Create a new category"""
    if DEVELOPMENT_MODE:
        return {}
    category_name = request.get_json()["name"]
    return external_requests.post(
        API_ENDPOINT + "/category/category/",
        json={"name": category_name, "joinable": True},
        timeout=DEFAULT_TIMEOUT,
    ).content


@app.route("/stream", methods=["get"])
def stream():
    """Stream the chat feed"""
    if DEVELOPMENT_MODE:
        global dev_mode_chat_stack
        ret = copy.deepcopy(dev_mode_chat_stack)
        dev_mode_chat_stack = []
        return {"messages": ret}

    ## I think topic should be part of session, so every time we switch topic we just set session->topic_id to blah and call stream
    topic = session.get("topic")

    if topic == "general" or topic == None or topic == "":
        topic = external_requests.get(
            API_ENDPOINT + "/landing/generalLanding", timeout=DEFAULT_TIMEOUT
        ).json()
        session["topic"] = topic
        session["category"] = topic["category_id"]

    pprint(topic)
    time = session.get("stream_latest")
    if time is None:
        time = datetime.datetime.min
    session["stream_latest"] = datetime.datetime.now()
    session.update()
    args = f"/message/stream/topic={topic['_id']}&time={time}"
    pprint(topic)
    ret = external_requests.get(API_ENDPOINT + args, timeout=DEFAULT_TIMEOUT)
    if ret.ok:
        print("ok")
    else:
        print(ret.raise_for_status())
    return ret.content


@app.route("/topic", methods=["get"])
def get_topics():
    """Get the Topics in the Category"""
    if DEVELOPMENT_MODE:
        return {"text": 200}
    if session.get("category") is None:
        topic = external_requests.get(
            API_ENDPOINT + "/landing/generalLanding", timeout=DEFAULT_TIMEOUT
        ).json()
        session["topic"] = topic
        session["category"] = topic["category_id"]
        session.update()

    args = f"/topic/" + session.get("category")
    ret = external_requests.get(API_ENDPOINT + args, timeout=DEFAULT_TIMEOUT)
    return ret.content


@app.route("/category", methods=["get"])
def get_categories():
    """Retrieve all Public Categories"""
    if DEVELOPMENT_MODE:
        return {"text": 200}
    args = "/category/category/"
    ret = external_requests.get(API_ENDPOINT + args, timeout=DEFAULT_TIMEOUT)
    pprint(ret.content)
    return ret.content


@app.route("/")
def home():
    """Base Route"""
    if not DEVELOPMENT_MODE:
        session["stream_latest"] = datetime.datetime.min
        return render_template(
            "index.html",
            session=session.get("user"),
            pretty=json.dumps(session.get("user"), indent=4),
        )
    else:
        return render_template("index.html", session=DEVELOPMENT_MODE)


@app.route("/login")
def login():
    """redirect to the Oauth"""
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )


@app.route("/callback", methods=["GET", "POST"])
def callback():
    """Handle the return from the oauth"""
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    return redirect("/")


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


if __name__ == "__main__":
    app.run(debug=True)
else:
    gunicorn = app
