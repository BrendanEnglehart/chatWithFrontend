"""Basic Chat and Website Functions here. 
This file should only include functions that don't use complex logic, 
only functions that have a few lines of code. 
"""

from flask import request, session, Blueprint, current_app as app
import requests as external_requests

BasicBlueprint = Blueprint("basic", __name__)

@BasicBlueprint.route("/category", methods=["get"])
def get_categories():
    """Retrieve all Public Categories"""
    if app.config["DEVELOPMENT_MODE"]:
        return {"text": 200}
    args = "/category/category/"
    ret = external_requests.get(app.config["API_ENDPOINT"] + args, timeout=app.config["DEFAULT_TIMEOUT"])
    return ret.content

@BasicBlueprint.route("/topic", methods=["get"])
def get_topics():
    """Get the Topics in the Category"""
    if app.config["DEVELOPMENT_MODE"]:
        return {"text": 200}
    if session.get("category") is None:
        topic = external_requests.get(
            app.config["API_ENDPOINT"] + "/landing/generalLanding", timeout=app.config["DEFAULT_TIMEOUT"]
        ).json()
        session["topic"] = topic
        session["category"] = topic["category_id"]
        session.update()

    args = "/topic/" + session.get("category")
    ret = external_requests.get(app.config["API_ENDPOINT"] + args, timeout=app.config["DEFAULT_TIMEOUT"])
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
