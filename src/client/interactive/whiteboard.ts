import {Room} from "colyseus.js";
import {State} from "../../common";
import {
    createCloseInteractionButton,
    getPlayers,
    getRoom,
    loadImage,
    PlayerRecord,
    removeCloseInteractionButton
} from "../util";
import {
    saveButton,
    clearButton,
    eraserButton,
    penButton
} from "../static";
import {ArraySchema} from "@colyseus/schema";
import {MessageType} from "../../common/util";
import {Interactive} from "./interactive";
import {checkInputMode} from "../main";

export class Whiteboard extends Interactive {

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


    //define events
    resized = () => this.resize(this);

    useTool = (e) => {
        
        if (e.buttons !== 1) return;
        var ctx = this.canvas.getContext("2d");
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        if (this.isPen) {
            //use pen
            ctx.strokeStyle = "black";
        } else {
            //use eraser
            ctx.strokeStyle = "white";
        }
        //draw to the canvas
        this.setPosition(e, this);


        ctx.beginPath(); // begin


        ctx.moveTo(this.oldX, this.oldY); // from
        ctx.lineTo(this.x, this.y); // to
        ctx.closePath();
        ctx.stroke(); // draw it!

        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.x, this.y])
        
    }

    mouseDown = (e) => {
        this.setPosition(e, this);
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, -1])
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.x, this.y])
    }

    mouseEnter = (e) => {
        this.setPosition(e, this);
        if (e.buttons !== 1) return;
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, -1])
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.x, this.y])
    }

    mouseUp = (e) => {
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, -1])
    }

    clearPressed = () => {
        this.room.send(MessageType.WHITEBOARD_CLEAR, this.wID);
        this.clear(this, this.wID);
    }

    savePressed = () => {
        this.room.send(MessageType.WHITEBOARD_SAVE, this.wID);
        this.save(this, this.wID);
    }

    drawPressed = () => {
        this.room.send(MessageType.WHITEBOARD_DRAW, this.wID);
        this.draw();
    }

    erasePressed = () => {
        this.room.send(MessageType.WHITEBOARD_ERASE, this.wID);
        this.erase();
    }

    constructor() {

        super("whiteboard", false, 1)

        this.wID = Whiteboard.whiteboardCount;
        Whiteboard.whiteboardCount++;

        this.room = getRoom();
        this.players = getPlayers();

        clearButton.style.top = "35%"
        clearButton.style.left = "25%"

        saveButton.style.top = "60%"
        saveButton.style.left = "70%"

        eraserButton.style.top = "55%"
        eraserButton.style.left = "55%"

        penButton.style.top = "33%"
        penButton.style.left = "33%"

        this.room.send(MessageType.WHITEBOARD_CREATE, this.wID);
        this.room.onMessage(MessageType.WHITEBOARD_REDRAW, (client) => this.drawOthers(client.sessionId, this));
        this.room.onMessage(MessageType.WHITEBOARD_CLEAR, (message) => this.clear(this, message));
        this.room.onMessage(MessageType.WHITEBOARD_SAVE, (message) => this.save(this, message));
        this.room.onMessage(MessageType.WHITEBOARD_DRAW, (message) => this.draw());
        this.room.onMessage(MessageType.WHITEBOARD_ERASE, (message) => this.erase());

        this.resize(this);
    }

    //input.ts function, for exit button
    onInteraction(){
        checkInputMode()
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
            createCloseInteractionButton(() => this.hide());
        }
    }

    //input.ts function, for esc key 
    leave() {
        this.hide();
    }list

    show() {
        this.isVisible = true;

        this.canvas.addEventListener('mousemove',this.useTool);
        this.canvas.addEventListener('mousedown',this.mouseDown);
        this.canvas.addEventListener('mouseup',this.mouseUp);
        this.canvas.addEventListener('mouseenter',this.mouseEnter);
        clearButton.addEventListener("click", this.clearPressed);
        saveButton.addEventListener("click", this.savePressed);
        eraserButton.addEventListener("click", this.erasePressed);
        penButton.addEventListener("click", this.drawPressed);

        //size changed
        window.addEventListener('resize', this.resized);

        clearButton.innerHTML = "<em class=\"fa fa-trash\"></em>"
        this.canvas.style.visibility = "visible";
        clearButton.style.visibility = "visible";

        saveButton.innerHTML = "<em class=\"fas fa-save\"></em>"
        saveButton.style.visibility = "visible";
        
        eraserButton.innerHTML = "<em class=\"fas fa-eraser\"></em>"
        eraserButton.style.visibility = "visible";

        penButton.innerHTML = "<em class=\"fas fa-pen\"></em>"
        penButton.style.visibility = "visible";
        
        checkInputMode()

        Whiteboard.currentWhiteboard = this.wID

        this.resize(this);
        this.setup(this.canvas);
        this.redraw(this);
    }

    hide() {
        this.isVisible = false;

        this.canvas.removeEventListener('mousemove',this.useTool);
        this.canvas.removeEventListener('mousedown',this.mouseDown);
        this.canvas.removeEventListener('mouseup',this.mouseUp);
        this.canvas.removeEventListener('mouseenter',this.mouseEnter);
        clearButton.removeEventListener("click", this.clearPressed);
        saveButton.removeEventListener("click", this.savePressed);
        eraserButton.removeEventListener("click", this.erasePressed);
        penButton.removeEventListener("click", this.drawPressed);
        window.removeEventListener('resize', this.resized);

        removeCloseInteractionButton();

        this.canvas.style.visibility = "hidden";
        clearButton.style.visibility = "hidden";
        saveButton.style.visibility = "hidden";
        eraserButton.style.visibility = "hidden";
        penButton.style.visibility = "hidden";
        
        checkInputMode()
        
        if(Whiteboard.currentWhiteboard === this.wID){
            Whiteboard.currentWhiteboard = -1;
        }
    }
    
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
        if(whiteboard.wID !== message){
            return;
        }

        // This code will automatically save the current canvas as a .png file. 

        // Get the canvas
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

        clearButton.style.top = rect.top + "px";
        saveButton.style.top = rect.top + "px";
        eraserButton.style.top = rect.top + "px";
        penButton.style.top = rect.top + "px";
    }

    drawOthers(clientID: string, whiteboard: Whiteboard) { //TODO Nach de redraw wird die glöschte linie wieder sichtbar
        if(Whiteboard.currentWhiteboard !== this.wID){
            return;
        }
        var max: number = whiteboard.room.state.whiteboard.at(whiteboard.wID).whiteboardPlayer[clientID].paths.length;
        var start: number = whiteboard.whiteboardPlayer[clientID]
        var paths: ArraySchema<number> = whiteboard.room.state.whiteboard.at(whiteboard.wID).whiteboardPlayer[clientID].paths;
        var j = 0;
        var ctx = whiteboard.canvas.getContext("2d");

        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        ctx.beginPath(); // begin

        for (var i: number = start; i + 3 < max; i++) {
            if (paths[i] === -1) {
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
                whiteboard.makeLine(paths[i], paths[i + 1], paths[i + 2], paths[i + 3], ctx);
                j++;
            } else {
                j = 0;
            }
        }
        ctx.stroke(); // draw it!


        whiteboard.whiteboardPlayer[clientID] = max - 2;

    }

    // new position from mouse event
    private setPosition(e, whiteboard: Whiteboard) {
        whiteboard.oldX = whiteboard.x;
        whiteboard.oldY = whiteboard.y;
        whiteboard.x = (e.clientX - whiteboard.offsetX) * whiteboard.stretchX;
        whiteboard.y = (e.clientY - whiteboard.offsetY) * whiteboard.stretchY;
    }

    private draw () {
        this.isPen = true;
    }

    private erase() {
        this.isPen = false;
    }

    makeLine(firstX: number, firstY: number, secondX: number, secondY: number, ctx) {
        ctx.moveTo(firstX, firstY); // from
        ctx.lineTo(secondX, secondY); // to
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
