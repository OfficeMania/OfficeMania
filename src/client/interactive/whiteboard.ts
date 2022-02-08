import { Room } from "colyseus.js";
import { MessageType, State } from "../../common";
import {
    createCloseInteractionButton,
    getPlayers,
    getRoom,
    loadImage,
    PlayerRecord,
    removeCloseInteractionButton
} from "../util";
import {
    blackButton,
    blueButton,
    clearButton,
    eraserButton,
    greenButton,
    orangeButton,
    penButton,
    pinkButton,
    redButton,
    saveButton,
    size10Button,
    size5Button,
    whiteboardPanel,
    yellowButton,
    interactiveWhiteboardCanvas
} from "../static";
import { ArraySchema } from "@colyseus/schema";
import { Interactive } from "./interactive";
import { checkInputMode } from "../main"; 

export class Whiteboard extends Interactive{

    private isPen: boolean = true;
    private isVisible: boolean = false;
    private x: number = 0;
    private y: number = 0;
    private oldX: number = 0;
    private oldY: number = 0;
    private offsetX: number = 100;
    private offsetY: number = 100;
    stretchX: number = 1;
    stretchY: number = 1;
    private room: Room<State>;
    private players: PlayerRecord;
    private whiteboardPlayer: { [key: string]: number } = {};
    wID: number = 0;
    static whiteboardCount: number = 0;
    static currentWhiteboard: number = 0;
    currentColor: number = 0; //black
    private size: number = 5;
    private numberOfDrawnPixel: number = 0;
    private currentlyDrawing: boolean = false;

    changeSize = (size) => {
        this.size = size;
    }

    mousemove = (e) => this.useTool(e, this)
    mousedown = (e) => this.mouseDown(e, this)
    mouseup = (e) => this.mouseUp(e, this)
    mouseenter = (e) => this.mouseEnter(e, this)
    clearCommand = () => this.clearPressed(this)
    drawPressed = () => {
        this.room.send(MessageType.WHITEBOARD_DRAW, this.wID);
        this.draw(this.currentColor);
    }
    erasePressed = () => {
        this.room.send(MessageType.WHITEBOARD_ERASE, this.wID);
        this.erase();
    }
    savePressed = () => {
        this.room.send(MessageType.WHITEBOARD_SAVE, this.wID);
        this.save(this, this.wID);
    }
    redPressed = () => {
        this.room.send(MessageType.WHITEBOARD_DRAW, this.wID);
        this.draw(2);
    }
    pinkPressed = () => {
        this.room.send(MessageType.WHITEBOARD_DRAW, this.wID);
        this.draw(3);
    }
    orangePressed = () => {
        this.room.send(MessageType.WHITEBOARD_DRAW, this.wID);
        this.draw(4);
    }
    yellowPressed = () => {
        this.room.send(MessageType.WHITEBOARD_DRAW, this.wID);
        this.draw(5);
    }
    greenPressed = () => {
        this.room.send(MessageType.WHITEBOARD_DRAW, this.wID);
        this.draw(6);
    }
    bluePressed = () => {
        this.room.send(MessageType.WHITEBOARD_DRAW, this.wID);
        this.draw(7);
    }
    blackPressed = () => {
        this.room.send(MessageType.WHITEBOARD_DRAW, this.wID);
        this.draw(0);
    }


    resized = () => this.resize(this);

    constructor() {

        super("whiteboard", false, 1, interactiveWhiteboardCanvas)

        this.wID = Whiteboard.whiteboardCount;
        Whiteboard.whiteboardCount++;

        this.room = getRoom();
        this.players = getPlayers();

        this.room.send(MessageType.WHITEBOARD_CREATE, this.wID);

        this.room.onMessage(MessageType.WHITEBOARD_REDRAW, (client) => this.drawOthers(client.sessionId, this));

        this.room.onMessage(MessageType.WHITEBOARD_CLEAR, (message) => this.clear(this, message));

        this.room.onMessage(MessageType.WHITEBOARD_SAVE, (message) => this.save(this, message));

        this.room.onMessage(MessageType.WHITEBOARD_DRAW, () => this.draw(this.currentColor));

        this.room.onMessage(MessageType.WHITEBOARD_ERASE, () => this.erase());

        this.resize(this);
    }

    onInteraction(){
        if (this.isVisible) {
            this.hide()
        } else {
            this.show()
            createCloseInteractionButton(() => this.leave());
        }
    }

    hide(){
        this.canvas.removeEventListener('mousemove',this.mousemove);
        this.canvas.removeEventListener('mousedown',this.mousedown);
        this.canvas.removeEventListener('mouseup',this.mouseup);
        this.canvas.removeEventListener('mouseenter',this.mouseenter);
        clearButton.removeEventListener("click", this.clearCommand);
        saveButton.removeEventListener("click", this.savePressed);
        eraserButton.removeEventListener("click", this.erasePressed);
        penButton.removeEventListener("click", this.drawPressed);
        size5Button.removeEventListener("click", (e) => {this.changeSize(5);});
        size10Button.removeEventListener("click", (e) => {this.changeSize(10);});
        redButton.removeEventListener("click", this.redPressed);
        pinkButton.removeEventListener("click", this.pinkPressed);
        orangeButton.removeEventListener("click", this.orangePressed);
        yellowButton.removeEventListener("click", this.yellowPressed);
        greenButton.removeEventListener("click", this.greenPressed);
        blueButton.removeEventListener("click", this.bluePressed);
        blackButton.removeEventListener("click", this.blackPressed);


        window.removeEventListener('resize', this.resized);

        removeCloseInteractionButton();

        this.isVisible = false;
        this.canvas.style.visibility = "hidden";
        clearButton.style.visibility = "hidden";
        clearButton.setAttribute("aria-label", "");
        clearButton.innerHTML ="";
        eraserButton.style.visibility = "hidden";
        eraserButton.setAttribute("aria-label", "");
        eraserButton.innerHTML ="";
        penButton.style.visibility = "hidden";
        penButton.setAttribute("aria-label", "");
        penButton.innerHTML ="";
        size5Button.style.visibility = "hidden";
        size5Button.setAttribute("aria-label", "");
        size5Button.innerHTML ="";
        size10Button.style.visibility = "hidden";
        size10Button.setAttribute("aria-label", "");
        size10Button.innerHTML ="";
        saveButton.style.visibility = "hidden";
        saveButton.setAttribute("aria-label", "");
        saveButton.innerHTML ="";
        redButton.style.visibility = "hidden";
        redButton.setAttribute("aria-label", "");
        redButton.innerHTML ="";
        pinkButton.style.visibility = "hidden";
        pinkButton.setAttribute("aria-label", "");
        pinkButton.innerHTML ="";
        orangeButton.style.visibility = "hidden";
        orangeButton.setAttribute("aria-label", "");
        orangeButton.innerHTML ="";
        yellowButton.style.visibility = "hidden";
        yellowButton.setAttribute("aria-label", "");
        yellowButton.innerHTML ="";
        greenButton.style.visibility = "hidden";
        greenButton.setAttribute("aria-label", "");
        greenButton.innerHTML ="";
        blueButton.style.visibility = "hidden";
        blueButton.setAttribute("aria-label", "");
        blueButton.innerHTML ="";
        blackButton.style.visibility = "hidden";
        blackButton.setAttribute("aria-label", "");
        blackButton.innerHTML ="";
        whiteboardPanel.style.visibility = "hidden";

        checkInputMode()

        if(Whiteboard.currentWhiteboard === this.wID){
            Whiteboard.currentWhiteboard = -1;
        }
    }

    leave() {
        this.canvas.getContext("2d").clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hide();
    }

    show(){
        this.canvas.addEventListener('mousemove',this.mousemove);
        this.canvas.addEventListener('mousedown',this.mousedown);
        this.canvas.addEventListener('mouseup',this.mouseup);
        this.canvas.addEventListener('mouseenter',this.mouseenter);
        clearButton.addEventListener("click", this.clearCommand);
        saveButton.addEventListener("click", this.savePressed);
        eraserButton.addEventListener("click", this.erasePressed);
        penButton.addEventListener("click", this.drawPressed);
        size5Button.addEventListener("click", (e) => {this.changeSize(5);});
        size10Button.addEventListener("click", (e) => {this.changeSize(10);});
        redButton.addEventListener("click", this.redPressed);
        pinkButton.addEventListener("click", this.pinkPressed);
        orangeButton.addEventListener("click", this.orangePressed);
        yellowButton.addEventListener("click", this.yellowPressed);
        greenButton.addEventListener("click", this.greenPressed);
        blueButton.addEventListener("click", this.bluePressed);
        blackButton.addEventListener("click", this.blackPressed);


        //size changed
        window.addEventListener('resize', this.resized);

        clearButton.setAttribute("aria-label", "Clear Whiteboard");
        clearButton.innerHTML = "<em class=\"fa fa-trash\"></em>"
        this.isVisible = true;
        this.canvas.style.visibility = "visible";
        clearButton.style.visibility = "visible";

        penButton.setAttribute("aria-label", "Draw");
        penButton.innerHTML = "<em class=\"fa fa-pen\"></em>"
        penButton.style.visibility = "visible";

        size5Button.setAttribute("aria-label", "Size");
        size5Button.innerHTML = "<em class=\"fas fa-circle\"></em>";
        size5Button.style.visibility = "visible";

        size10Button.setAttribute("aria-label", "Size");
        size10Button.innerHTML = "<em class=\"fas fa-circle fa-lg\"></em>";
        size10Button.style.visibility = "visible";

        eraserButton.setAttribute("aria-label", "Erase");
        eraserButton.innerHTML = "<em class=\"fa fa-eraser\"></em>"
        eraserButton.style.visibility = "visible";

        saveButton.setAttribute("aria-label", "Save");
        saveButton.innerHTML = "<em class=\"fa fa-save\"></em>"
        saveButton.style.visibility = "visible";

        redButton.setAttribute("aria-label", "Draw");
        redButton.innerHTML = "<em></em>"
        redButton.style.visibility = "visible";
        redButton.style.backgroundColor = "red";

        pinkButton.setAttribute("aria-label", "Draw");
        pinkButton.innerHTML = "<em></em>"
        pinkButton.style.visibility = "visible";
        pinkButton.style.backgroundColor = "magenta";

        orangeButton.setAttribute("aria-label", "Draw");
        orangeButton.innerHTML = "<em></em>"
        orangeButton.style.visibility = "visible";
        orangeButton.style.backgroundColor = "orange";

        yellowButton.setAttribute("aria-label", "Draw");
        yellowButton.innerHTML = "<em></em>"
        yellowButton.style.visibility = "visible";
        yellowButton.style.backgroundColor = "yellow";

        greenButton.setAttribute("aria-label", "Draw");
        greenButton.innerHTML = "<em></em>"
        greenButton.style.visibility = "visible";
        greenButton.style.backgroundColor = "green";

        blueButton.setAttribute("aria-label", "Draw");
        blueButton.innerHTML = "<em></em>"
        blueButton.style.visibility = "visible";
        blueButton.style.backgroundColor = "blue";

        blackButton.setAttribute("aria-label", "Draw");
        blackButton.innerHTML = "<em></em>"
        blackButton.style.visibility = "visible";
        blackButton.style.backgroundColor = "black";

        whiteboardPanel.style.visibility = "vsible";

        checkInputMode()

        Whiteboard.currentWhiteboard = this.wID

        this.resize(this);
        this.setup(this.canvas);
        this.redraw(this);
    }

    loop(){}

    setup(canvas) {
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black"
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.stroke();
    }

    redraw(whiteboard: Whiteboard){
        whiteboard.setup(whiteboard.canvas)
        for (const [player] of whiteboard.room.state.whiteboard.at(whiteboard.wID).whiteboardPlayer) {
            whiteboard.resetPlayer(player);
            whiteboard.drawOthers(player, whiteboard);
        }
    }

    resetPlayer(player: string) {
        this.whiteboardPlayer[player] = 0;
    }

    clearPressed(whiteboard: Whiteboard) {
        whiteboard.room.send(MessageType.WHITEBOARD_CLEAR, whiteboard.wID);
        whiteboard.clear(whiteboard, whiteboard.wID);
    }

    clear(whiteboard: Whiteboard, message: number) {
        if(whiteboard.wID !== message){
            return;
        }
        for (var id in whiteboard.whiteboardPlayer) {
            whiteboard.whiteboardPlayer[id] = 0;
        }
        whiteboard.setup(whiteboard.canvas)
    }

    save(whiteboard: Whiteboard, message: number) {
        if (whiteboard.wID != message) {
            return;
        }
        // This code will automatically save the current canvas as a .png file.
        var canvas = <HTMLCanvasElement> document.getElementById("interactive");
        // Convert the canvas to data
        var image = canvas.toDataURL();
        // Create a link
        var aDownloadLink = document.createElement('a');
        // Add the name of the file to the link
        aDownloadLink.download = 'whiteboard_image.png';
        // Attach the data to the link
        aDownloadLink.href = image;
        // Get the code to click the download link
        aDownloadLink.click();
    }

    resize(whiteboard: Whiteboard) {
        var rect: DOMRect = whiteboard.canvas.getBoundingClientRect();

        whiteboard.offsetX = rect.left
        whiteboard.offsetY = rect.top

        whiteboard.stretchX = 1280 / rect.width
        whiteboard.stretchY = 720 / rect.height

        if (parseInt(this.canvas.style.width) > window.innerWidth) {
            this.canvas.style.width = String(parseInt(this.canvas.style.height) * 2)
        } else if (parseInt(this.canvas.style.height) > window.innerHeight) {
            this.canvas.style.height = String(parseInt(this.canvas.style.width) / 2)
        }

        // clearButton.style.top = rect.top + "px";
    }

    drawOthers(clientID: string, whiteboard: Whiteboard) {
        if(Whiteboard.currentWhiteboard !== this.wID){
            return;
        }
        var max: number = whiteboard.room.state.whiteboard.at(whiteboard.wID).whiteboardPlayer[clientID].paths.length;
        var start: number = whiteboard.whiteboardPlayer[clientID]
        var paths: ArraySchema<number> = whiteboard.room.state.whiteboard.at(whiteboard.wID).whiteboardPlayer[clientID].paths;
        var color: ArraySchema<string> = whiteboard.room.state.whiteboard.at(whiteboard.wID).whiteboardPlayer[clientID].color;
        var sizes: ArraySchema<number> = whiteboard.room.state.whiteboard.at(whiteboard.wID).whiteboardPlayer[clientID].sizes;
        var j = 0;
        var ctx = whiteboard.canvas.getContext("2d");

        ctx.lineCap = 'round';

        let indexOfStroke = 0;

        for (var i: number = start; i + 3 < max; i++) {
            if (paths[i] === -1) {
                indexOfStroke++;
                j = 0;
                continue;
            } else if (paths[i + 1] === -1) {
                i = i + 1
                j = 0;
                continue;
            } else if (paths[i + 2] === -1) {
                i = i + 2
                j = 0;
                continue;
            } else if (paths[i + 3] === -1) {
                i = i + 3
                j = 0;
                continue;
            }
            if (j === 0) {
                ctx.beginPath(); // begin
                ctx.lineWidth = sizes.at(indexOfStroke);
                ctx.strokeStyle = color.at(indexOfStroke);
                whiteboard.makeLine(paths[i], paths[i + 1], paths[i + 2], paths[i + 3], ctx);
                ctx.closePath();
                ctx.stroke();
                j++;
            } else {
                j = 0;
            }
        }
        //ctx.stroke(); // draw it!


        whiteboard.whiteboardPlayer[clientID] = max - 2;

    }

    // new position from mouse event
    private setPosition(e, whiteboard: Whiteboard) {
        whiteboard.oldX = whiteboard.x;
        whiteboard.oldY = whiteboard.y;
        whiteboard.x = (e.clientX - whiteboard.offsetX) * whiteboard.stretchX;
        whiteboard.y = (e.clientY - whiteboard.offsetY) * whiteboard.stretchY;
    }

    private useTool(e, whiteboard: Whiteboard) {
        // mouse left button must be pressed
        if (e.buttons !== 1) return;
        whiteboard.setPosition(e, whiteboard);

        this.drawLine(whiteboard.oldX, whiteboard.oldY, whiteboard.x, whiteboard.y, whiteboard)

        if (this.numberOfDrawnPixel % 4 === 0) { //only send each eth pixel to server => draw short lines rather than each pixel
            whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, this.currentColor, this.size, whiteboard.x, whiteboard.y]);
        }
        this.numberOfDrawnPixel++;
        this.currentlyDrawing = true;
    }

    makeLine(firstX: number, firstY: number, secondX: number, secondY: number, ctx) {
        ctx.moveTo(firstX, firstY); // from
        ctx.lineTo(secondX, secondY); // to
    }

    drawLine(firstX: number, firstY: number, secondX: number, secondY: number, whiteboard: Whiteboard) {
        var ctx = whiteboard.canvas.getContext("2d");
        ctx.beginPath(); // begin

        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        if (this.isPen) {
            switch (this.currentColor) {
                case 2:
                    ctx.strokeStyle = "red";
                    break;
                case 3:
                    ctx.strokeStyle = "magenta";
                    break;
                case 4:
                    ctx.strokeStyle = "orange";
                    break;
                case 5:
                    ctx.strokeStyle = "yellow";
                    break;
                case 6:
                    ctx.strokeStyle = "green";
                    break;
                case 7:
                    ctx.strokeStyle = "blue";
                    break;
                default: //case 0
                    ctx.strokeStyle = "black";
                    break;
            }
        } else {
            ctx.strokeStyle = 'white';
        }

        ctx.moveTo(firstX, firstY); // from
        ctx.lineTo(secondX, secondY); // to

        ctx.stroke(); // draw it!
    }


    mouseUp(e, whiteboard: Whiteboard) {
        if (this.currentlyDrawing) { //send last pixel of stroke to server
            this.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, this.currentColor, this.size, this.x, this.y]);
            this.currentlyDrawing = false;
        }
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, this.currentColor, this.size, -1])
    }

    mouseDown(e, whiteboard: Whiteboard){
        this.setPosition(e, whiteboard);
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, this.currentColor, this.size, -2]) //-2: dont save color again (already saved)
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, this.currentColor, this.size, whiteboard.x, whiteboard.y])
    }

    mouseEnter(e, whiteboard: Whiteboard){
        this.setPosition(e, whiteboard);
        if (e.buttons !== 1) return;
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, this.currentColor, this.size, -1])
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, this.currentColor, this.size, whiteboard.x, whiteboard.y])
    }

    private draw(color: number) {
        this.isPen = true;
        this.currentColor = color; //0=black, 1=white, 2=red, 3=pink, 4=orange, 5=yellow, 6=green, 7=blue
    }

    private erase() {
        this.isPen = false;
        this.currentColor = 1;
    }

    //doesnt really work
    async resize2(width: number, height: number) {
        var imageSrc = this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        var oldWidth = this.canvas.width;
        var oldHeight = this.canvas.height;
        this.canvas.width = width - 200;
        this.canvas.height = height - 200;
        var ctx = this.canvas.getContext("2d");
        var image = await loadImage(imageSrc)
        ctx.drawImage(image, 0, 0, oldWidth, oldHeight, 0, 0, width - 200, height - 200);
    }

}

export function drawWhiteboard(canvas: HTMLCanvasElement, whiteboard: HTMLCanvasElement) {

}
