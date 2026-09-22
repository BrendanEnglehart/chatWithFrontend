/*
I'm moving this with the hope that the rewrite of the less properly
designed spaces becomes simpler and doesn't change up the logic for the entire application
to redesign one or two parts

Chat Feed will handle the logic for interacting with the feed. 
Clearing the feed should reset it from any additional configurations
*/
export class ChatFeed {
    chat;
    constructor(chat) {
        this.chat = chat;
    }

    /**
     * Repurpose the active chat feed for something 
     * outside the bounds of what it should do
     * @param {*} newFeed
     *  
     */
    repurposeFeed(newFeed) {
        this.chat.innerHTML = newFeed
    }


    /**
     * Prepares the default canvas for drawing
     */
    repurposeFeedForDrawing() {
        this.repurposeFeed( "<canvas id=\"Drawing\" width=\"500\" height=\"500\" style=\"touch-action: none;\"></canvas>")
    }

    /**
     * Parse a message to add to the feed
     * This should only contain the render side
     * 
     * @param {*} username 
     * @param {*} image 
     * @param {*} text 
     */
    parseMessage(username, image, text, message_id) {
        this.chat.innerHTML += this.chatHTML(username, image, text, message_id)
    }



    /**
     * Parse a message to add to the feed
     * This should only contain the render side
     * 
     * @param {*} username 
     * @param {*} image 
     * @param {*} text 
     */
    parseOwnedMessage(username, image, text, message_id) {
        this.chat.innerHTML += this.ownedChatHTML(username, image, text, message_id)
    }


    /**
     * Clear the feed to prepare it for another purpose
     * re-hide all the extraneous elements
     */
    clear() {
        this.chat.innerHTML = ""
        let colorPickerArea = document.getElementById("color-picker-area")
        colorPickerArea.hidden = "clear"
        let sizePickerArea = document.getElementById('brush-size-area')
        sizePickerArea.hidden = "clear"
    }

/**
 * The Raw HTML we send to the chat feed. 
 * Ideally this will be replaced with less
 * raw html in the code, but for now, it's 
 * just the work I need to get the app out
 * @param {*} username 
 * @param {*} image 
 * @param {*} text 
 * @returns 
 */
    chatHTML(username, image, text, message_id) {
        return "<div id=\'"+message_id+"\' class='chat-message grid grid-cols-2'>\
          <div><img src='"+ image + "' style='height: 32px;' class='w-12, h-12 object-contain'/></div>\
          <div class='grid grid-cols-1'><strong>"+ username + "</strong> <span>" + text + "</span></div>\
        </div>";
    }
    ownedChatHTML(username, image, text, message_id) {
    return "<div id=\'"+message_id+"\' class='chat-message grid grid-cols-2'>\
        <div>\
        <img src='"+ image + "' style='height: 32px;'\
         class='w-12, h-12 object-contain'/>\
        </div>\
        <div class='grid grid-cols-1'>\
        <strong>"+ 
        username
         + "<button class=\"delete\" data-id=\'"+message_id+"\')\">X</button>\
          <button id=\"edit-"+message_id+"\" class=\"edit\" data-id=\'"+message_id+"\')\"> Edit</button></strong>\
        <span id=\'text-"+message_id+"\'>" + text + "</span>\
        <textarea hidden=\'update_textarea\' id=\'update-text-"+message_id+"\'>" + text + "</textarea>\
                  <button id=\"update-text-"+message_id+"-submit\" hidden=\"update_send\" class=\"update\" data-id=\'"+message_id+"\')\"> Update</button>\
        </strong>\
        </div>\
    </div>";
}

    /**
     * Parse each of the messages recieved
     * @param {*} messages 
     */
    streamMessages(messages, user_id) {
        if (messages.length > 0) {
            for (var i in messages) {
                if (messages[i].user_id == user_id)
                    this.parseOwnedMessage(messages[i].username, messages[i].picture, messages[i].text, messages[i]._id)
                else 
                    this.parseMessage(messages[i].username, messages[i].picture, messages[i].text, messages[i]._id)
            }
        }
    }
}