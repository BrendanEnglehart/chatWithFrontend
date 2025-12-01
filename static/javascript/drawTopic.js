/*
* Drawing will handle all of the drawing logic for the drawing functionality
This will end up a very dense file and very much needs to be off the main renderer
*/
export class Drawing {
    ctx = undefined;
    canvas = undefined;
    draw_glob = []
    prevMouseX;
    prevMouseY;
    snapshot;
    isDrawing = false;
    selectedTool = "brush";
    brushWidth = 1;
    selectedColor = "#000";
    topic_id;
    sizePicker;
    colorPicker;

    /**
     * Initialize the Color Picker Area
     * Doesn't take arguments but assumes there are some html
     * elements on the page
     */
    initializeColorPicker() {
        this.colorPicker = document.getElementById("color-picker")
        let colorPickerArea = document.getElementById("color-picker-area")
        colorPickerArea.hidden = undefined
        this.colorPicker.removeEventListener("change", this.changeColor())
        this.colorPicker.addEventListener("change",
            this.changeColor()
        )
    }

    /**
     * Initialize the Brush Size Area
     * Doesn't take arguments but assumes there are some html
     * elements on the page
     */
    initializeSizePicker() {
        this.sizePicker = document.getElementById('size-picker')
        let sizePickerArea = document.getElementById('brush-size-area')
        sizePickerArea.hidden = undefined
    }

    constructor(newCanvas, socket, topic_id) {
        this.canvas = newCanvas
        this.ctx = this.canvas.getContext("2d");
        this.canvas.addEventListener("mousedown", this.startDraw);
        this.canvas.addEventListener("mousemove", this.drawing);
        this.canvas.addEventListener("mouseup", this.stopDrawing);
        this.socket = socket
        this.resetCanvasBackground()
        this.topic_id = topic_id
        this.initializeColorPicker()
        this.initializeSizePicker()
    }

    /**
     * 
     * @param {Object} art -> Array of X/Y coordinates in the direction of the brushstroke
     * @param {String} color -> Color of the brushstroke
     * @param {String} mybrushWidth -> Size of the Brushstroke
     */
    drawFeed(art, color, mybrushWidth) {
        this.ctx.lineWidth = mybrushWidth;
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width,
            this.canvas.height);
        this.ctx.beginPath();
        for (let coordinate of art) {
            this.ctx.putImageData(this.snapshot, 0, 0);
            this.ctx.lineTo(coordinate.x, coordinate.y)
            this.ctx.stroke();
        }

    }

    /**
     * Change the color to the current color picker value
     * Useful for the callback
     */
    changeColor() {
        this.colorPicker.parentElement.click();
    }

    /** 
     * Start recording drawing
     */
    startDraw = (e) => {
        this.isDrawing = true;
        this.prevMouseX = e.offsetX;
        this.prevMouseY = e.offsetY;
        this.draw_glob = [{ "x": this.prevMouseX, "y": this.prevMouseY, "color": this.colorPicker.value, "width": this.sizePicker.value }]

        this.ctx.beginPath();
        this.ctx.lineWidth = this.sizePicker.value;
        this.ctx.strokeStyle = this.colorPicker.value;
        this.ctx.fillStyle =  this.colorPicker.value;
        this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width,
            this.canvas.height);
    }

    /**
     * Continue recording drawing
     * @param {*} e 
     *
     */
    drawing = (e) => {
        if (!this.isDrawing) return;
        this.ctx.putImageData(this.snapshot, 0, 0);
        this.draw_glob.push({ "x": e.offsetX, "y": e.offsetY })

        this.ctx.lineTo(e.offsetX, e.offsetY);
        this.ctx.stroke();
    }

    /**
     * Stop recording drawing
     * @param {*} e 
     */
    stopDrawing = (e) => {
        this.socket.send(this.topic_id, JSON.stringify(this.draw_glob))
        this.isDrawing = false
        this.draw_glob = []
    }

    /**
     * reset the canvas to clear
     */
    resetCanvasBackground = () => {
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#fff";
    }
    /**
     * Parse each brush stroke recieved from the server
     */
    streamDrawing(messages) {
        if (messages.length > 0) {
            for (var i in messages) {
                let art_object = JSON.parse(messages[i].text)
                if (art_object.length > 0 && "x" in art_object[0]) {
                    let color = "#000"
                    let width = 5
                    if ("color" in art_object[0])
                        color = art_object[0].color
                    if ("width" in art_object[0])
                        width = art_object[0].width


                    this.drawFeed(art_object, color, width)
                }
            }
        }
    }
}
