import datetime
from flask import Flask, render_template, request, session
from os import environ as env
from urllib.parse import quote_plus, urlencode
import requests as external_requests

from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
import json
from flask import Flask, redirect, render_template, session, url_for

from pprint import pprint

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

app = Flask(__name__)
app.config['SESSION_TYPE'] = 'filesystem'
"""
session('user)
dict_keys(['access_token', 'expires_at', 'expires_in', 'id_token', 'scope', 'token_type', 'userinfo'])
session('user).userinfo
dict_keys(['aud', 'email', 'email_verified', 'exp', 'family_name', 'given_name', 'iat', 'iss', 'name', 'nickname', 'nonce', 'picture', 'sid', 'sub', 'updated_at'])
"""



app.secret_key = env.get("APP_SECRET_KEY")
oauth = OAuth(app)
topic = "general"
category = "general"
oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration'
)

# Prod API endpoint
api_endpoint=env.get("API_ENDPOINT")
# api_endpoint="http://127.0.0.1:5001"
print(api_endpoint)

@app.route('/sendMessage',methods = ['POST'])
def sendMessage():
    text = request.get_json()['text']
    pprint(text)
    pprint(session.get('user'))
    ret = external_requests.post(api_endpoint+"/message/" + topic, 
                                  json={"username":session.get('user')['userinfo']['nickname'], "session":"id", "topic": topic, "text":text})
    if ret.ok:
        print ("ok")
    else:
        print(ret.raise_for_status())
    return ret.content
    
@app.route('/stream',methods = ['get'])
def stream():
    ## I think topic should be part of session, so every time we switch topic we just set session->topic_id to blah and call stream
    text = request.cookies.get('topic')
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
    session['stream_latest'] = datetime.datetime.min
    return render_template("index.html", session=session.get('user'), pretty=json.dumps(session.get('user'), indent=4)) 


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
    # If we are running in Dev
    api_endpoint="http://127.0.0.1:5001"
    app.run(debug=True)   
else:
    gunicorn = app