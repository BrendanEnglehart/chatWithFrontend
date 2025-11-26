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
    colorTool = 'Color: <input type="color" value="#00FF00" name="" id="color-picker">'
    sizeTool = 'Size: <input type="range" id="size-picker" min="1" max="30" value="5">'
    repurposeFeed(newFeed) {
        this.chat.innerHTML = newFeed
    }


    repurposeFeedForDrawing() {
        this.repurposeFeed(this.colorTool + this.sizeTool + "<canvas id=\"Drawing\" width=\"500\" height=\"500\"></canvas>")
    }
    parseMessage(username, image, text) {
        this.chat.innerHTML += this.chatHTML(username, image, text)
    }
    clear() {
        this.chat.innerHTML = ""
    }
    chatHTML(username, image, text) {
        return "<div class='grid grid-cols-2'>\
          <div><img src='"+ image + "' style='height: 32px;' class='w-12, h-12 object-contain'/></div>\
          <div class='grid grid-cols-1'><strong>"+ username + "</strong> <span>" + text + "</span></div>\
        </div></br>";
    }
    streamMessages(messages) {
        if (messages.length > 0) {
            for (var i in messages) {
                this.parseMessage(messages[i].username, messages[i].picture, messages[i].text)
            }
        }
    }
}