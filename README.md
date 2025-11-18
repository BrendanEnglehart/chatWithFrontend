# ChatWith
The goal of ChatWith is to have an open source messaging application that is modular enought to allow different structures of communications without requiring too many third party tools or downloads.

Ideally every user will self host their own application and be able to implement their own methods by forking this branch and adding their own topic types. Currently topics aren't implemented and there is only the single chat thread available. 

## Launching Dev Mode
To launch in Dev Mode, you only need the frontend section and to either build the Dockerfile or create a python3 virtual environment

To run the app locally run 
```
python3 -m venv chatwith
source chatwith/bin/activate
pip install -r requirements.txt
python app.py
```


## Current Features

### Chat
As of right now the only feature is the main chat and this is broken into two separate repos that have to be built individually. You can run this app in Dev mode, but if you wish to run this more than locally you will need to configure https://github.com/BrendanEnglehart/chatWithRestAPI to work for your environment. The chat features the ability to have and create multiple categories containing multiple topics which you can switch through. 

# Next Steps

## Better Protocols for Chat Feeds
Currently we are sending Json and raw data back and forth between the client and server, then passing that as get and post requests to the API server for long term storage. In the future we need to follow better messaging protocols.

## New Topic Types
The ideal reason for multiple topics is to split up the ability to create multiple topic types that have different functionality, this is where I want the most extensibility 

## UI Fixes
UI is definitely a weakpoint of mine, my longterm goal is to strive for an adequete UI that is functional and mildly pleasant to look at. 