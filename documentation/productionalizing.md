# Productionalizing your Server
This is a step by step guide to productionalize your chat server. This will only help you spin up the front end. A separate guide is available for the REST API side if you are planning on using that. 

## Before you start
1. Make sure you have run the service in Development mode on whatever you plan on launching the service with. If you can't access the Development Mode, you might have trouble with future steps.
2. Create an account on Auth0 https://auth0.com/ and complete setup.

## Authentication Setup
Currently this application only supports Auth0 https://auth0.com/, follow the instructions available at the Auth0 website to setup your domain and acquire your Client_ID and Client_Secret
1. Create a `.env` file in the main directory. 
2. Set your `AUTH0_CLIENT_ID` `AUTH0_CLIENT_SECRET` `AUTH0_DOMAIN` in the `.env` file it should look something like
```
AUTH0_DOMAIN=dev-id.country.auth0.com
AUTH0_CLIENT_ID=abcd1234drinkwater
AUTH0_CLIENT_SECRET=secretvalue
```
3. in your `.env` file set `API_ENDPOINT` to your API endpoint location, it should look something like, note that this one needs to be in quotes ""
```
API_ENDPOINT="http://127.0.0.1:5001"
```
## Running on a VM or BareMetal
Run `gunicorn --bind 0.0.0.0:$PORT app:gunicorn` replacing the $PORT with your port number

## Running in a Container
If you are using containers, build the docker file in the main directory. The container uses port 5000 by default. The `.yaml` file for K8s Should look similar to the below, but you'll need to produce your own and validate it yourself.
```
apiVersion: apps/v1
kind: Deployment
...
spec:
  template:
    spec:
      containers:
      - name: toroidMessage
        image: $IMAGE_NAME
        ports: 
        - containerPort: $PORT

---

apiVersion: v1
kind: Service
spec:
  ports:
    - name: $SERVICE_NAME
      port: $PORT
      targetPort: $PORT
```
