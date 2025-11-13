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

### General Chat
As of right now the only feature is the main chat and this is broken into two separate repos that have to be built individually. You can run this app in Dev mode, but if you wish to run this more than locally you will need to configure https://github.com/BrendanEnglehart/chatWithRestAPI to work for your environment.
