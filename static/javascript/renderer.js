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

// We are all brendan on this blessed day
const default_image = "https://lh3.googleusercontent.com/a/ACg8ocJZ7j2OPKQR9bv0eP5lchq80qpKKpA_GQzbWARM5CF29Xdh-OF-zQ=s96-c"


// This won't persist, but I'm using it right now as a crutch
function chatHTML(username, image, text){
        return "<div class='grid grid-cols-2'>\
          <div><img src='"+image+"' style='height: 32px;' class='w-12, h-12 object-contain'/></div>\
          <div class='grid grid-cols-1'><strong>"+username+"</strong> <span>"+text+"</span></div>\
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
        await fetch( "/stream").then(response=>response.json())
        .then(data => {
            messages = data.messages
            if (messages) {
                if (messages.length > 0) {
                    for (i in messages) {
                        if ('picture' in messages[i]){
                            picture = messages[i].picture
                        }
                        else{
                            picture = default_image
                        }
                        chatFeed.innerHTML += chatHTML(messages[i].username, picture, messages[i].text)
                    }
                }

        }
        })
        // await fetch( "/category/category/").then(response=>response.json())
        // .then(data => {
        //     categories = data.categories
        //     if (categories) {
        //         if (categories.length > 0) {
        //             for (i in categories) {
        //                 categoryList.innerHTML = "<div>" + categories[i].name
        //                 if (category_id == undefined && categories[i].name == "general")
        //                 {
        //                     category_id = categories[i]._id
        //                     fetch( "/topic/"+category_id).then(response=>response.json())
        //                     .then(data => {
        //                         topics = data.topics
        //                         if (topics) {
        //                             if (topics.length > 0) {
        //                                 for (i in topics) {
        //                                     topicList.innerHTML += "<div>" + topics[i].name + "</div>"
        //                                 }
        //                             }
        //                             latest=messages[messages.length-1].time
        //                     }
        //                     })

        //                 }
        //             }
        //         }
        //         latest=messages[messages.length-1].time
        // }
        // })

}

// We'll need to come back to this one TODO
async function streamTopic() {
        // I'm not putting too much effort into the api requests now because they need to be moved from the renderer to the app.py area
        if (!mainTab.hidden){
            response = await fetch( "/stream").then(response=>response.json())
            .then(data => {
                messages = data.messages
                if (messages && messages.length > 0) {
                    latest=messages[messages.length-1].time
                    if (messages.length > 0) {
                        for (i in messages) {
                            if ('picture' in messages[i]){
                                picture = messages[i].picture
                            }
                            else{
                                picture = default_image
                            }
                            chatFeed.innerHTML += chatHTML(messages[i].username, picture, messages[i].text)
                        }
                    }          
                }
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
            body: JSON.stringify({text: messageText.value})}) 
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


const chatFeed = document.getElementById("chatFeed")

var sleep = duration => new Promise(resolve => setTimeout(resolve, duration))
var poll = (promiseFn, duration) => promiseFn().then(
    sleep(duration).then(() => poll(promiseFn, duration)))

// Greet the World every second
/// let refresh = 1000
let refresh = 100000000
poll(() => new Promise(() => streamTopic() ), refresh)

