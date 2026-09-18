"""Basic Chat and Website Functions here.
This file should only include functions that don't use complex logic,
only functions that have a few lines of code.
"""

import datetime
from flask import request, session, Blueprint, current_app as app
import requests as external_requests

BasicBlueprint = Blueprint("basic", __name__)


@BasicBlueprint.route("/category", methods=["get"])
def get_categories():
    """Retrieve all Public Categories"""
    if app.config["DEVELOPMENT_MODE"]:
        return {"text": 200}
    args = "/category/category/"
    ret = external_requests.get(
        app.config["API_ENDPOINT"] + args, timeout=app.config["DEFAULT_TIMEOUT"]
    )
    return ret.content

@BasicBlueprint.route("/current_user", methods=["get"])
def get_current_user_id():
    """Retrieve the current user id if available"""
    return { "user_id" : session.get("user_id")}


@BasicBlueprint.route("/restream", methods=["get"])
def restream():
    """Reset the session["stream_latest"] to be datetime.datetime.min"""
    session["stream_latest"] = datetime.datetime.min
    return {"text": 200}


@BasicBlueprint.route("/topic", methods=["get"])
def get_topics():
    """Get the Topics in the Category"""
    if app.config["DEVELOPMENT_MODE"]:
        return {"text": 200}
    if session.get("category") is None:
        topic = external_requests.get(
            app.config["API_ENDPOINT"] + "/landing/generalLanding",
            timeout=app.config["DEFAULT_TIMEOUT"],
        ).json()
        session["topic"] = topic
        session["category"] = topic["category_id"]
        session.update()

    args = "/topic/" + session.get("category")
    ret = external_requests.get(
        app.config["API_ENDPOINT"] + args, timeout=app.config["DEFAULT_TIMEOUT"]
    )
    return ret.content


@BasicBlueprint.route("/new_topic", methods=["post"])
def new_topic():
    """Create a new topic"""
    if app.config["DEVELOPMENT_MODE"]:
        return {}
    topic_name = request.get_json()["name"]
    topic_type = request.get_json()["topic_type"]
    return external_requests.post(
        app.config["API_ENDPOINT"] + "/topic/",
        json={
            "category_id": session.get("category"),
            "name": topic_name,
            "type": topic_type,
            "metadata": "",
        },
        timeout=app.config["DEFAULT_TIMEOUT"],
    ).content


@BasicBlueprint.route("/new_category", methods=["post"])
def new_category():
    """Create a new category"""
    if app.config["DEVELOPMENT_MODE"]:
        return {}
    category_name = request.get_json()["name"]
    return external_requests.post(
        app.config["API_ENDPOINT"] + "/category/category/",
        json={"name": category_name, "joinable": True},
        timeout=app.config["DEFAULT_TIMEOUT"],
    ).content

@BasicBlueprint.route("/delete_message", methods=["post"])
def delete_message():
    """delete message"""
    if app.config["DEVELOPMENT_MODE"]:
        return {}
    message_id = request.get_json()["message_id"]
    return external_requests.post(
        app.config["API_ENDPOINT"] + "/message/delete/message",
        json={"_id": message_id, "user_id": session.get("user_id")},
        timeout=app.config["DEFAULT_TIMEOUT"],
    ).content


@BasicBlueprint.route("/switch_topic", methods=["post"])
def switch_topic():
    """Switch The topic the user is subscribing to"""
    if app.config["DEVELOPMENT_MODE"]:
        return {"text": 200}
    topic = request.get_json()
    session["topic"] = topic
    session.update()
    session["stream_latest"] = datetime.datetime.min
    session.update()
    return {"text": 200}


@BasicBlueprint.route("/update_username", methods=["post"])
def update_username():
    """Update Username"""
    if app.config["DEVELOPMENT_MODE"]:
        return {"text": 200}
    username = request.get_json()["userName"]
    id_token = session.get("user")["userinfo"]["sub"]
    return external_requests.post(
        app.config["API_ENDPOINT"] + "/user/update_username",
        json={"_id": id_token, "username": username, "email": "", "picture": ""},
        timeout=app.config["DEFAULT_TIMEOUT"],
    ).content


@BasicBlueprint.route("/users", methods=["get"])
def get_all_users():
    """Retrieve all Public Users"""
    if app.config["DEVELOPMENT_MODE"]:
        return {"text": 200}
    args = "/user/list"
    ret = external_requests.get(
        app.config["API_ENDPOINT"] + args, timeout=app.config["DEFAULT_TIMEOUT"]
    )
    return ret.content


@BasicBlueprint.route("/load_self", methods=["get"])
def load_self():
    """On initial page load, acquire current configuration"""
    if app.config["DEVELOPMENT_MODE"]:
        return {"response": 200}
    topic = session.get("topic")

    if topic is None or topic == "":
        topic = external_requests.get(
            app.config["API_ENDPOINT"] + "/landing/generalLanding",
            timeout=app.config["DEFAULT_TIMEOUT"],
        ).json()
        session["topic"] = topic
        session["category"] = topic["category_id"]

    session["stream_latest"] = datetime.datetime.min
    session.update()
    return topic


@BasicBlueprint.route("/switch_category", methods=["post"])
def switch_category():
    """This is called on the category switch, as noted elsewhere, this will be refactored"""
    if app.config["DEVELOPMENT_MODE"]:
        return {"text": 200}
    category_id = request.get_json()["category_id"]
    session["category"] = category_id
    session.update()
    return {"text": 200}

# Deprecate me
@BasicBlueprint.route("/stream", methods=["get"])
def stream():
    """Stream the chat feed"""
    if app.config["DEVELOPMENT_MODE"]:
        app.config["DEV_MODE_CHAT_STACK"] = []
        return {"messages": app.config["DEV_MODE_CHAT_STACK"]}

    topic = session.get("topic")

    if topic is None or topic == "":
        topic = external_requests.get(
            app.config["API_ENDPOINT"] + "/landing/generalLanding", timeout=app.config["DEFAULT_TIMEOUT"]
        ).json()
        session["topic"] = topic
        session["category"] = topic["category_id"]

    time = session.get("stream_latest")
    if time is None:
        time = datetime.datetime.min
    session["stream_latest"] = datetime.datetime.now()
    session.update()
    args = f"/message/stream/topic={topic['_id']}&time={time}"
    ret = external_requests.get(app.config["API_ENDPOINT"] + args, timeout=app.config["DEFAULT_TIMEOUT"])
    if ret.ok:
        pass # Changing out print message
    else:
        app.logger.error(ret.raise_for_status())

    return ret.content
