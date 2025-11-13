import datetime
from flask import Flask, render_template, request, session
from os import environ as env
from urllib.parse import quote_plus, urlencode
import requests as external_requests

from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
import json
from flask import Flask, redirect, render_template, session, url_for
import copy
from pprint import pprint
DEVELOPMENT_MODE=False
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
                                    "topic": topic,
                                    "text":text})
        return {}

    pprint(session.get('user'))

    ret = external_requests.post(api_endpoint+"/message/" + topic, 
                                  json={"username":session.get('user')['userinfo']['nickname'], "picture":session.get('user')['userinfo']['picture'], "topic": topic, "text":text})
    if ret.ok:
        print ("ok")
    else:
        print(ret.raise_for_status())
    return ret.content
    
@app.route('/stream',methods = ['get'])
def stream():
    ## I think topic should be part of session, so every time we switch topic we just set session->topic_id to blah and call stream
    text = request.cookies.get('topic')
    if DEVELOPMENT_MODE:
        global dev_mode_chat_stack
        ret = copy.deepcopy(dev_mode_chat_stack)
        dev_mode_chat_stack = []
        return {"messages":ret}

    if text==None:
        text = "general"
    time = session.get('stream_latest')
    if time==None:
        time=datetime.datetime.min
    session['stream_latest'] = datetime.datetime.now()
    session.update
    args = f"/message/stream/topic={text}&time={time}"
    pprint(text)
    ret = external_requests.get(api_endpoint+args,
                                  json={"session":"id", "topic": topic, "text":text})
    if ret.ok:
        print ("ok")
    else:
        print(ret.raise_for_status())
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