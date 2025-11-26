import { io } from "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.esm.min.js";
const divUsers = document.getElementById("users")
document.addEventListener('DOMContentLoaded', async () => {

})
const mainTab = document.getElementById("mainBody")
const categoryList = document.getElementById("Category-List")
const topicList = document.getElementById("Topic-List")
const newMessageArea = document.getElementById('newMessageArea')
const socket = io()
let isDrawing = false
let category_cache = []
let topic_cache = []
let ctx = undefined
let topic_type = "nothing"
let canvas = undefined
let draw_glob = []
let topic_id = ""
// We are all brendan on this blessed day
const default_image = "https://lh3.googleusercontent.com/a/ACg8ocJZ7j2OPKQR9bv0eP5lchq80qpKKpA_GQzbWARM5CF29Xdh-OF-zQ=s96-c"
//global variabels wiht default values
let prevMouseX, prevMouseY, snapshot,
    selectedTool = "brush",
    brushWidth = 5,
    selectedColor = "#000";


const startDraw = (e) => {
    isDrawing = true;
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;
    draw_glob = [{ "x": prevMouseX, "y": prevMouseY }]

    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedColor;
    ctx.fillStyle = selectedColor;
    snapshot = ctx.getImageData(0, 0, canvas.width,
        canvas.height);
}

const drawing = (e) => {
    if (!isDrawing) return;
    ctx.putImageData(snapshot, 0, 0);
    draw_glob.push({ "x": e.offsetX, "y": e.offsetY })

    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
}

const stopDrawing = (e) => {
    socket.send(topic_id, JSON.stringify(draw_glob))
    isDrawing = false
    draw_glob = []
}

function drawFeed(art, color, mybrushWidth) {

    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedColor;
    ctx.fillStyle = selectedColor;
    snapshot = ctx.getImageData(0, 0, canvas.width,
        canvas.height);
    ctx.beginPath();
    for (let coordinate of art) {
        ctx.putImageData(snapshot, 0, 0);
        ctx.lineTo(coordinate.x, coordinate.y)
        ctx.stroke();
    }



}


// This won't persist, but I'm using it right now as a crutch
function chatHTML(username, image, text) {
    return "<div class='grid grid-cols-2'>\
          <div><img src='"+ image + "' style='height: 32px;' class='w-12, h-12 object-contain'/></div>\
          <div class='grid grid-cols-1'><strong>"+ username + "</strong> <span>" + text + "</span></div>\
        </div></br>";
}

function parseMessage(username, image, text) {
    if (topic_type == "drawing") {
        drawFeed(JSON.parse(text), selectedColor, brushWidth)
    }
    if (topic_type == "chat" || topic_type == "general") {
        chatFeed.innerHTML += chatHTML(username, image, text)
    }
}

socket.on('message', (data) => {
    parseMessage(data.username, data.picture, data.text)
});

const resetCanvasBackground = (current_canvas) => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, current_canvas.width, current_canvas.height);
    ctx.fillStyle = "#fff";
}
// This should be called load Topic, or something smarter, right now it's not that great
async function switchTopic(nextTopic) {
    topic_id = nextTopic["_id"]
    chatFeed.innerHTML = ""
    if (topic_type == "drawing") {
        // Starting canvas for the initial drawing app
        chatFeed.innerHTML = "<canvas id=\"Drawing\" width=\"500\" height=\"500\"></canvas>"
        canvas = document.getElementById("Drawing");
        newMessageArea.hidden = "Yes I'm Hidden";
        ctx = canvas.getContext("2d");
        resetCanvasBackground(canvas);
        canvas.addEventListener("mousedown", startDraw);
        canvas.addEventListener("mousemove", drawing);
        canvas.addEventListener("mouseup", stopDrawing);
        await fetch("/stream").then(response => response.json())
            .then(data => {
                let messages = data.messages
                if (messages) {
                    if (messages.length > 0) {
                        for (var i in messages) {
                            let art_thing = JSON.parse(messages[i].text)
                            if (art_thing.length > 0 && "x" in art_thing[0]) {
                                drawFeed(art_thing, "", "")
                            }
                        }
                    }
                }
                socket.emit("join", nextTopic["_id"])

            })
    }
    else if (topic_type == "chat" || topic_type == "general") {
        await fetch("/stream").then(response => response.json())
            .then(data => {
                newMessageArea.hidden = undefined
                let messages = data.messages
                chatFeed.innerHTML = ""
                if (messages) {
                    if (messages.length > 0) {
                        for (var i in messages) {
                            let picture = default_image
                            if ('picture' in messages[i]) {
                                picture = messages[i].picture
                            }
                            chatFeed.innerHTML += chatHTML(messages[i].username, picture, messages[i].text)
                        }
                    }

                }
                console.log("here")
                socket.emit("join", nextTopic["_id"])
            })
            .catch(error => {console.log(error)})
    }
    else {
        console.log(topic_type)
    }
}
async function switchCategory(event) {

    let category_id = event.target.name
    fetch("/switch_category", {
        method: 'POST', // Specify the method as POST
        headers: {
            'Content-Type': 'application/json', // Indicate that the body is JSON
            'Accept': 'application/json', // Specify the expected response type
        },
        body: JSON.stringify({ category_id: category_id })
    })
        .then(response => {
            if (!response.ok) {

            }
        })
        .then(data => {
            loadTopics()
            return response
        })
        .catch(error => {
        });
}
async function switchTopics(event) {
    if (topic_id != "")
        socket.emit("leave", topic_id)
    else 
        socket.emit("leaveSession")
    let topic = event.target.name
    let nextTopic = JSON.parse(topic.replaceAll("'", '"')) // Again, this is bad, but better is for later
    topic_type = nextTopic["type"]
    await fetch("/switch_topic", {
        method: 'POST', // Specify the method as POST
        headers: {
            'Content-Type': 'application/json', // Indicate that the body is JSON
            'Accept': 'application/json', // Specify the expected response type
        },
        body: topic.replaceAll("'", '"') // This will need to be much better written
    })
        .then(response => {

            if (!response.ok) {

            }
            return response.json()
        })
        .then(data => {
            console.log(data)
            switchTopic(nextTopic)
        })
        .catch(error => {
            console.log(error)
        });
}

async function loadTopics() {
    await fetch("/topic").then(response => response.json())
        .then(data => {
            let topics = data.topics

            topicList.innerHTML = ""
            if (topics && topic_cache != topics) {
                topic_cache = topics
                if (topics.length > 0) {
                    for (var i in topics) {
                        let newTopic = document.createElement("div")
                        let newButton = document.createElement("button")
                        newButton.name = JSON.stringify(topics[i]).replaceAll('"', "'")
                        newButton.textContent = topics[i].name
                        newButton.onclick = switchTopics
                        newTopic.append(newButton)
                        topicList.append(newTopic)
                    }
                }
            }
        })
}

async function loadCategory() {
    await fetch("/category").then(response => response.json())
        .then(data => {
            let categories = data.categories
            if (categories) {
                if (categories.length > 0 && category_cache != categories) {
                    category_cache = categories
                    // it's going to look real annoying at first, I need to dynamically load these better
                    categoryList.innerHTML = ""
                    for (var i in categories) {
                        let newCategory = document.createElement("div")
                        let newButton = document.createElement("button")
                        newButton.name = categories[i]._id
                        newButton.textContent = categories[i].name
                        newButton.onclick = switchCategory
                        newCategory.append(newButton)
                        categoryList.append(newCategory)
                    }

                }
            }

        })
    loadTopics()
}

// We'll need to come back to this one TODO
async function streamTopic() {
    // I'm not putting too much effort into the api requests now because they need to be moved from the renderer to the app.py area
    if (!mainTab.hidden) {
        let response = await fetch("/stream").then(response => response.json())
            .then(data => {
                let messages = data.messages
                if (messages && messages.length > 0) {
                    if (messages.length > 0) {
                        for (var i in messages) {
                            var picture
                            if ('picture' in messages[i]) {
                                picture = messages[i].picture
                            }
                            else {
                                picture = default_image
                            }
                            chatFeed.innerHTML += chatHTML(messages[i].username, picture, messages[i].text)
                        }
                    }
                }
                loadCategory()
                socket.emit("joinSession")
            })
    }
}

const sendMessage = document.getElementById('sendMessage')
const messageText = document.getElementById('newMessage')
sendMessage.addEventListener('click', async () => {
    socket.send(topic_id, messageText.value)
    messageText.value = ""
})

const addTopicButton = document.getElementById('addTopic')
const newTopicSubmit = document.getElementById('newTopicSubmit')
const newTopicName = document.getElementById('newTopicName')
const newTopicType = document.getElementById('newTopicType')
addTopicButton.onclick = function () {
    if (document.getElementById('newTopicForm').hidden) {
        document.getElementById('newTopicForm').hidden = undefined
        addTopicButton.textContent = "-"
    }
    else {
        document.getElementById('newTopicForm').hidden = true
        addTopicButton.textContent = "+"
    }
}

newTopicSubmit.addEventListener('click', async () => {
    let name = newTopicName.value
    let type = newTopicType.value
    newTopicName.value = ""
    await fetch("/new_topic", {
        method: 'POST', // Specify the method as POST
        headers: {
            'Content-Type': 'application/json', // Indicate that the body is JSON
            'Accept': 'application/json', // Specify the expected response type
        },
        body: JSON.stringify({ name: name, topic_type: type })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    })
    .then(data => {
            document.getElementById('newTopicForm').hidden = true
            addTopicButton.textContent = "+"
            loadTopics()
    })
    .catch(error => console.error('Error:', error));
})


const addCategoryButton = document.getElementById('addCategory')
const newCategorySubmit = document.getElementById('newCategorySubmit')
const newCategoryName = document.getElementById('newCategoryName')
addCategoryButton.onclick = function () {
    if (document.getElementById('newCategoryForm').hidden) {
        document.getElementById('newCategoryForm').hidden = undefined
        addCategoryButton.textContent = "-"
    }
    else {
        document.getElementById('newCategoryForm').hidden = true
        addCategoryButton.textContent = "+"
    }
}

newCategorySubmit.addEventListener('click', async () => {
    let name = newCategoryName.value
    document.getElementById('newCategoryForm').hidden = "yes"
    response = await fetch("/new_category", {
        method: 'POST', // Specify the method as POST
        headers: {
            'Content-Type': 'application/json', // Indicate that the body is JSON
            'Accept': 'application/json', // Specify the expected response type
        },
        body: JSON.stringify({ name: name })
    }).then(response => response.json())
        .then(data => {
            newCategoryName.value = ""
            loadCategory()
        }
        )
})


const chatFeed = document.getElementById("chatFeed")
streamTopic()

