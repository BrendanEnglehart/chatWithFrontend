import { io } from "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.esm.min.js";
import { Drawing } from './drawTopic.js'
import { ChatFeed } from "./chatFeed.js";
const divUsers = document.getElementById("users")
document.addEventListener('DOMContentLoaded', async () => {

})
const mainTab = document.getElementById("mainBody")
const categoryList = document.getElementById("Category-List")
const topicList = document.getElementById("Topic-List")
const newMessageArea = document.getElementById('newMessageArea')
const socket = io()
let drawing;
let isDrawing = false
let category_cache = []
let topic_cache = []
let topic_type = "nothing"
let topic_id = ""
// We are all brendan on this blessed day
const default_image = "https://lh3.googleusercontent.com/a/ACg8ocJZ7j2OPKQR9bv0eP5lchq80qpKKpA_GQzbWARM5CF29Xdh-OF-zQ=s96-c"
//global variabels wiht default values
let brushWidth = 5,
    selectedColor = "#000";

function parseMessage(username, image, text) {
    if (topic_type == "drawing") {
        drawing.drawFeed(JSON.parse(text), JSON.parse(text)[0].color, JSON.parse(text)[0].width)
    }
    if (topic_type == "chat" || topic_type == "general") {
        chatFeed.parseMessage(username, image, text)
    }
}

socket.on('message', (data) => {
    parseMessage(data.username, data.picture, data.text)
});

// This should be called load Topic, or something smarter, right now it's not that great
async function switchTopic(nextTopic) {
    topic_id = nextTopic["_id"]
    topic_type = nextTopic["type"]
    chatFeed.clear()
    if (topic_type == "drawing") {
        // Starting canvas for the initial drawing app
        chatFeed.repurposeFeedForDrawing()
        newMessageArea.hidden = "Yes I'm Hidden";
        drawing = new Drawing(document.getElementById("Drawing"), socket, topic_id)
        await fetch("/stream").then(response => response.json())
            .then(data => {
                let messages = data.messages
                if (messages) {
                    drawing.streamDrawing(messages)
                }
                socket.emit("join", nextTopic["_id"])

            })
    }
    else if (topic_type == "chat" || topic_type == "general") {
        await fetch("/stream").then(response => response.json())
            .then(data => {
                newMessageArea.hidden = undefined
                let messages = data.messages
                chatFeed.clear()
                if (messages) {
                    chatFeed.streamMessages(messages)
                }
                socket.emit("join", nextTopic["_id"])
            })
            .catch(error => { console.log(error) })
    }
    else {
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
    await fetch("/new_category", {
        method: 'POST', // Specify the method as POST
        headers: {
            'Content-Type': 'application/json', // Indicate that the body is JSON
            'Accept': 'application/json', // Specify the expected response type
        },
        body: JSON.stringify({ name: name })
    }).then(response => response.json())
        .then(data => {
            newCategoryName.value = ""
            document.getElementById('newCategoryForm').hidden = true
            addCategoryButton.textContent = "+"
            loadCategory()
        }
        )
})


const chatFeed = new ChatFeed(document.getElementById("chatFeed"))

async function loadSelf() {
    loadCategory()
    await fetch("/load_self").then(response => response.json()).then(data => {
        switchTopic(data)
    })
}


loadSelf()

document.onkeydown=function(e){
    let keycode =  e ? (e.which ? e.which : evt.keyCode) : e.keyCode;
    if(topic_type != "drawing" && keycode == 13)
    {
        socket.send(topic_id, messageText.value)
        messageText.value = ""
    }
}