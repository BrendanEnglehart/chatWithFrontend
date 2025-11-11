const divUsers = document.getElementById("users")
document.addEventListener('DOMContentLoaded', async () => {
    // users = window.users;
    // console.log(users)
    // const luas = await users.getUsers()
    // console.log(luas)
    // console.log(divUsers.innerHtml )
    // divUsers.textContent = luas
    // console.log(divUsers.innerHtml )

})
console.log("loaded render")
var loginButton = document.getElementById("LoginButton")
var createButton = document.getElementById("Create")
const username = document.getElementById("Username")
const email = document.getElementById("Email")
const password = document.getElementById("Password")
const loginTab = document.getElementById("login")
const mainTab = document.getElementById("mainBody")
let latest = 0
// These are the document fields that control when the fields are hidden
const confirmCreate = document.getElementById("ConfirmCreate")
const confirmPassword = document.getElementById("Confirm Field")
const confirmEmailBox = document.getElementById("Email Box")
const categoryList = document.getElementById("Category-List")
const topicList = document.getElementById("Topic-List")

//dev // TODO, make this not static
const apiEndpoint = "http://127.0.0.1:5001"


const confirmPasswordContent = document.getElementById("Confirm Password")
let cookie = document.cookie
let category_id = undefined
// TODO: Topic logic
let topic = "general"
if (cookie != null && cookie != "")
{
    try {
    cookie = (JSON.parse(cookie))
        if (cookie.username != null){
                loginTab.hidden = "hey"
                mainTab.hidden = undefined
        }
        
    } catch (error) {
    // The cookie read failed    
    }


}

// This should be called load Topic, or something smarter, right now it's not that great
async function switchTopic() {
        await fetch(apiEndpoint + "/message/"+topic).then(response=>response.json())
        .then(data => {
            messages = data.messages
            if (messages) {
                if (messages.length > 0) {
                    for (i in messages) {
                        chatFeed.innerHTML += "<div>" + messages[i].username + ":" + messages[i].text + "</div>"
                    }
                }
                latest=messages[messages.length-1].time
        }
        })
        await fetch(apiEndpoint + "/category/category/").then(response=>response.json())
        .then(data => {
            categories = data.categories
            if (categories) {
                if (categories.length > 0) {
                    for (i in categories) {
                        categoryList.innerHTML = "<div>" + categories[i].name
                        if (category_id == undefined && categories[i].name == "general")
                        {
                            category_id = categories[i]._id
                            fetch(apiEndpoint + "/topic/"+category_id).then(response=>response.json())
                            .then(data => {
                                topics = data.topics
                                if (topics) {
                                    if (topics.length > 0) {
                                        for (i in topics) {
                                            topicList.innerHTML += "<div>" + topics[i].name + "</div>"
                                        }
                                    }
                                    latest=messages[messages.length-1].time
                            }
                            })

                        }
                    }
                }
                latest=messages[messages.length-1].time
        }
        })

}

// We'll need to come back to this one TODO
async function streamTopic() {
        // I'm not putting too much effort into the api requests now because they need to be moved from the renderer to the app.py area
        if (!mainTab.hidden){
            if (latest != 0){

        response = await fetch(apiEndpoint + "/message/stream/topic="+topic+"&time="+latest).then(response=>response.json())
        .then(data => {
            messages = data.messages
            if (messages && messages.length > 0) {
                latest=messages[messages.length-1].time
                if (messages.length > 0) {
                    for (i in messages) {
                        chatFeed.innerHTML += "<div>" + messages[i].username + ":" + messages[i].text + "</div>"
                    }
                }          
            }
            })
        }
        else {
            switchTopic()
        }
    }

}


loginButton.addEventListener('click', async () => {

            fetch(apiEndpoint + "/login/", {
            method: 'POST', // Specify the method as POST
            headers: {
                'Content-Type': 'application/json', // Indicate that the body is JSON
                'Accept': 'application/json', // Specify the expected response type
            },
            body: JSON.stringify({"username" : username.value, password: password.value})}) 
        .then(response=>response.json())
        .then(data => {
            if (data["_id"]!= undefined){
            loginTab.hidden = "hey"
            mainTab.hidden = undefined
            document.cookie= JSON.stringify(data)
            switchTopic()
            }
            else { 
                loginButton.textContent = "Bad Username or Password -- Login"
            }
        })
        .catch(error => {

        });

    // session = users.login(username.value, password.value)
    // await session.then((result) => {
    //     loginTab.hidden = "hey"
    //     mainTab.hidden = undefined
    // })
})

createButton.addEventListener('click', async () => {
    createButton.hidden = "hey"
    loginButton.hidden = "hey"
    confirmPassword.hidden = undefined
    confirmCreate.hidden = undefined
    confirmEmailBox.hidden = undefined
})
confirmCreate.addEventListener('click', async () => {
    if (password.value != confirmPasswordContent.value) {
        confirmCreate.textContent = "Passwords don't match!"
    }
    else {
        fetch(apiEndpoint + "/user", {
            method: 'POST', // Specify the method as POST
            headers: {
                'Content-Type': 'application/json', // Indicate that the body is JSON
                'Accept': 'application/json', // Specify the expected response type
            },
            body: JSON.stringify({"username" : username.value, password: password.value, email: email.value})}) 
        .then(response => {
            if (!response.ok) {
        
            }

        })
        .then(data => {
            loginButton.hidden = undefined
            confirmPassword.hidden = "hey"
            confirmCreate.hidden = "hey"
        })
        .catch(error => {
               confirmCreate.textContent = "User Already Exists"
        });

   }
})



const sendMessage = document.getElementById('sendMessage')
const messageText = document.getElementById('newMessage')
sendMessage.addEventListener('click', async () => {
    fetch(apiEndpoint + "/message/" + topic, {
            method: 'POST', // Specify the method as POST
            headers: {
                'Content-Type': 'application/json', // Indicate that the body is JSON
                'Accept': 'application/json', // Specify the expected response type
            },
            body: JSON.stringify({"username" : cookie.username, text: messageText.value, session: cookie._id})}) 
        .then(response => {
            if (!response.ok) {
        
            }

        })
        .then(data => {
            messageText.value = ""
        })
        .catch(error => {
               confirmCreate.textContent = "User Already Exists"
        });

})


const chatFeed = document.getElementById("chatFeed")

var sleep = duration => new Promise(resolve => setTimeout(resolve, duration))
var poll = (promiseFn, duration) => promiseFn().then(
    sleep(duration).then(() => poll(promiseFn, duration)))

// Greet the World every second
poll(() => new Promise(() => streamTopic() ), 1000)

