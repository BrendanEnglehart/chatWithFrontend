from flask import Flask, render_template, request, session

app = Flask(__name__)

@app.route('/')
def index():
    if 'session_id' in session:
        pass
    return render_template('index.html')



if __name__ == '__main__':
    app.run(debug=True)
else:
    gunicorn = app