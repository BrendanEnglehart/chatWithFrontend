const divUsers = document.getElementById("users")
document.addEventListener('DOMContentLoaded', async () => {

})
console.log("loaded render")
const mainTab = document.getElementById("mainBody")
let latest = 0
// Topic logic should all be handled in the app, not in the renderer
const topic = "general"
const categoryList = document.getElementById("Category-List")
const topicList = document.getElementById("Topic-List")
let category_cache = []
let topic_cache = []
// We are all brendan on this blessed day
const default_image = "https://lh3.googleusercontent.com/a/ACg8ocJZ7j2OPKQR9bv0eP5lchq80qpKKpA_GQzbWARM5CF29Xdh-OF-zQ=s96-c"


// This won't persist, but I'm using it right now as a crutch
function chatHTML(username, image, text) {
    return "<div class='grid grid-cols-2'>\
          <div><img src='"+ image + "' style='height: 32px;' class='w-12, h-12 object-contain'/></div>\
          <div class='grid grid-cols-1'><strong>"+ username + "</strong> <span>" + text + "</span></div>\
        </div></br>";
}

// if (cookie != null && cookie != "")
// {
//     try {
//     cookie = (JSON.parse(cookie))
//         if (cookie.username != null){
//                 loginTab.hidden = "hey"
//                 mainTab.hidden = undefined
//         }

//     } catch (error) {
//     // The cookie read failed    
//     }


// }

// This should be called load Topic, or something smarter, right now it's not that great
async function switchTopic() {
    await fetch("/stream").then(response => response.json())
        .then(data => {
            messages = data.messages
            chatFeed.innerHTML = ""
            if (messages) {
                if (messages.length > 0) {
                    for (i in messages) {
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
        })

}
async function switchCategory(event) {
    console.log(event.target.name)
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
    console.log(event.target.name)
    let topic = event.target.name
    fetch("/switch_topic", {
        method: 'POST', // Specify the method as POST
        headers: {
            'Content-Type': 'application/json', // Indicate that the body is JSON
            'Accept': 'application/json', // Specify the expected response type
        },
        body: topic.replaceAll("'", '"')
    })
        .then(response => {

            if (!response.ok) {

            }
        })
        .then(data => {
            switchTopic()
            return response
        })
        .catch(error => {
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
                    for (i in topics) {
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
            categories = data.categories
            if (categories) {
                if (categories.length > 0 && category_cache != categories) {
                    category_cache = categories
                    // it's going to look real annoying at first, I need to dynamically load these better
                    categoryList.innerHTML = ""
                    for (i in categories) {
                        let newCategory = document.createElement("div")
                        let newButton = document.createElement("button")
                        newButton.name = categories[i]._id
                        newButton.textContent = categories[i].name
                        console.log(categories[i]._id)
                        category_id = categories[i]._id
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
        response = await fetch("/stream").then(response => response.json())
            .then(data => {
                messages = data.messages
                if (messages && messages.length > 0) {
                    latest = messages[messages.length - 1].time
                    if (messages.length > 0) {
                        for (i in messages) {
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
            })

    }

}
const sendMessage = document.getElementById('sendMessage')
const messageText = document.getElementById('newMessage')
sendMessage.addEventListener('click', async () => {
    fetch("/sendMessage", {
        method: 'POST', // Specify the method as POST
        headers: {
            'Content-Type': 'application/json', // Indicate that the body is JSON
            'Accept': 'application/json', // Specify the expected response type
        },
        body: JSON.stringify({ text: messageText.value })
    })
        .then(response => {
            if (!response.ok) {

            }
        })
        .then(data => {
            messageText.value = ""
            streamTopic()
        })
        .catch(error => {
        });
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
    response = await fetch("/new_topic", {
        method: 'POST', // Specify the method as POST
        headers: {
            'Content-Type': 'application/json', // Indicate that the body is JSON
            'Accept': 'application/json', // Specify the expected response type
        },
        body: JSON.stringify({ name: name, topic_type: type })
    }).then(response => response.json())
        .then(data => {
            loadTopics()
        }
        )
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

var sleep = duration => new Promise(resolve => setTimeout(resolve, duration))
var poll = (promiseFn, duration) => promiseFn().then(
    sleep(duration).then(() => poll(promiseFn, duration)))

/// This needs to be rewritten to a proper datastream
/// let refresh = 1000
let refresh = 100000000
poll(() => new Promise(() => streamTopic()), refresh)

