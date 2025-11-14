""" Main Flask runner for the Chat application"""
import datetime
from os import environ as env
from urllib.parse import quote_plus, urlencode
import requests as external_requests

from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
import json
from flask import Flask, redirect, render_template, session, url_for, request
import copy
from pprint import pprint
DEVELOPMENT_MODE=True
ENV_FILE = find_dotenv()

app = Flask(__name__)
app.config['SESSION_TYPE'] = 'filesystem'
oauth = OAuth(app)

api_endpoint="http://127.0.0.1:5001"
if ENV_FILE:
    load_dotenv(ENV_FILE)
    app.secret_key = env.get("APP_SECRET_KEY")
    api_endpoint=env.get("API_ENDPOINT")
    oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration'
)
else:
    DEVELOPMENT_MODE=True


"""
#TODO
Mock Users should at least have these values
session('user)
dict_keys(['access_token', 'expires_at', 'expires_in', 'id_token', 'scope', 'token_type', 'userinfo'])
session('user).userinfo
dict_keys(['email', 'email_verified','nickname', 'picture', 'updated_at'])
"""
topic = "general"
category = "general"

dev_mode_chat_stack=[]


# Prod API endpoint # 

@app.route('/sendMessage',methods = ['POST'])
def sendMessage():
    text = request.get_json()['text']
    if DEVELOPMENT_MODE:
        dev_mode_chat_stack.append({"username":"test",
                                    "picture":"https://s.gravatar.com/avatar/a36cdd3b39f985b18b729fbe84863cae?s=480&amp;r=pg&amp;d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fbr.png",
                                    "topic": "general",
                                    "text":text})
        return {}

    pprint(session.get('user'))
    topic = session.get('topic')
    pprint(topic)
    ret = external_requests.post(api_endpoint+"/message/" + topic["_id"], 
                                  json={"username":session.get('user')['userinfo']['nickname'], "picture":session.get('user')['userinfo']['picture'], "topic": topic['_id'], "text":text})
    if ret.ok:
        print ("ok")
    else:
        print(ret.raise_for_status())
    return ret.content

@app.route("/switch_category", methods=["post"])
def switchCategory():
    if DEVELOPMENT_MODE:
        return {"text" : 200}
    category_id = request.get_json()['category_id']
    session["category"] = category_id
    session.update()
    return {"text" : 200}

@app.route("/switch_topic", methods=["post"])
def switchTopic():
    if DEVELOPMENT_MODE:
        return {"text" : 200}
    topic = request.get_json()
    session["topic"] = topic
    session['stream_latest'] = datetime.datetime.min
    session.update()
    return {"text" : 200}

@app.route('/new_topic',methods = ['post'])
def newTopic():
    if DEVELOPMENT_MODE:
        return {}
    topic_name = request.get_json()['name']
    topic_type = request.get_json()['topic_type']
    return external_requests.post(api_endpoint+"/topic/", 
                                  json={"category_id" : session.get('category'), "name" : topic_name, "type":topic_type, "metadata":""}).content
  
@app.route('/new_category',methods = ['post'])
def newCategory():
    if DEVELOPMENT_MODE:
        return {}
    category_name = request.get_json()['name']
    return external_requests.post(api_endpoint+"/category/category/", 
                                  json={ "name" : category_name, "joinable":True}).content
  
    


@app.route('/stream',methods = ['get'])
def stream():  
    if DEVELOPMENT_MODE:
        global dev_mode_chat_stack
        ret = copy.deepcopy(dev_mode_chat_stack)
        dev_mode_chat_stack = []
        return {"messages":ret}
    
    ## I think topic should be part of session, so every time we switch topic we just set session->topic_id to blah and call stream
    topic = session.get('topic')
 
    if topic == "general" or topic == None or topic == "":
            topic = external_requests.get(api_endpoint+"/landing/generalLanding").json()
            session['topic'] = topic
            session['category'] = topic['category_id']
  
    pprint(topic)
    time = session.get('stream_latest')
    if time==None:
        time=datetime.datetime.min
    session['stream_latest'] = datetime.datetime.now()
    session.update()
    args = f"/message/stream/topic={topic['_id']}&time={time}"
    pprint(topic)
    ret = external_requests.get(api_endpoint+args)
    if ret.ok:
        print ("ok")
    else:
        print(ret.raise_for_status())
    return ret.content
    
@app.route("/topic", methods=["get"])
def getTopics():
    if DEVELOPMENT_MODE:
        return {"text" : 200}
    if session.get("category") == None:
            topic = external_requests.get(api_endpoint+"/landing/generalLanding").json()
            session['topic'] = topic
            session['category'] = topic['category_id']
            session.update()

    args = f"/topic/"+session.get("category")
    ret = external_requests.get(api_endpoint+args)
    return ret.content

@app.route("/category", methods=["get"])
def getCategories():
    if DEVELOPMENT_MODE:
        return {"text" : 200}
    args = f"/category/category/"
    ret = external_requests.get(api_endpoint+args)
    pprint(ret.content)
    return ret.content



@app.route("/")
def home():
    if not DEVELOPMENT_MODE:
        session['stream_latest'] = datetime.datetime.min
        return render_template("index.html", session=session.get('user'), pretty=json.dumps(session.get('user'), indent=4)) 
    else:
        return render_template("index.html", session=DEVELOPMENT_MODE) 


@app.route("/login")
def login():
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )


@app.route("/callback", methods=["GET", "POST"])
def callback():
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    return redirect("/")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://" + env.get("AUTH0_DOMAIN")
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home", _external=True),
                "client_id": env.get("AUTH0_CLIENT_ID"),
            },
            quote_via=quote_plus,
        )
    )


if __name__ == '__main__':
    app.run(debug=True)   
else:
    gunicorn = app