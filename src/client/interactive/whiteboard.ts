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
    clearButton
} from "../static";
import {ArraySchema} from "@colyseus/schema";
import {MessageType} from "../../common/util";
import {Interactive} from "./interactive";
import {checkInputMode} from "../main";

export class Whiteboard extends Interactive{

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

    mousemove = (e) => this.draw(e, this)
    mousedown = (e) => this.mouseDown(e, this)
    mouseup = (e) => this.mouseUp(e, this)
    mouseenter = (e) => this.mouseEnter(e, this)
    clearCommand = () => this.clearPressed(this)
    saveCommand = () => this.savePressed(this)
    resized = () => this.resize(this);

    constructor() {

        super("whiteboard", false, 1)

        this.wID = Whiteboard.whiteboardCount;
        Whiteboard.whiteboardCount++;

        this.room = getRoom();
        this.players = getPlayers();

        clearButton.style.top = "30%"
        clearButton.style.left = "20%"

        saveButton.style.top = "65%"
        saveButton.style.left = "76%"

        this.room.send(MessageType.WHITEBOARD_CREATE, this.wID);

        this.room.onMessage(MessageType.WHITEBOARD_REDRAW, (client) => this.drawOthers(client.sessionId, this));

        this.room.onMessage(MessageType.WHITEBOARD_CLEAR, (message) => this.clear(this, message));

        this.room.onMessage(MessageType.WHITEBOARD_SAVE, (message) => this.save(this, message));

        this.resize(this);
    }

    onInteraction(){
        if (this.isVisible) {
            this.hide();
            //this.hideButtons;
            
        } else {
            this.show();
            //this.showButtons();
           
            createCloseInteractionButton(() => this.leave());
        }
    }

    hide(){
        this.canvas.removeEventListener('mousemove',this.mousemove);
        this.canvas.removeEventListener('mousedown',this.mousedown);
        this.canvas.removeEventListener('mouseup',this.mouseup);
        this.canvas.removeEventListener('mouseenter',this.mouseenter);
        clearButton.removeEventListener("click", this.clearCommand);
        saveButton.removeEventListener("click", this.saveCommand);

        window.removeEventListener('resize', this.resized);

        removeCloseInteractionButton();

        this.isVisible = false;
        this.canvas.style.visibility = "hidden";
        clearButton.style.visibility = "hidden";
        clearButton.setAttribute("aria-label", "");
        clearButton.innerHTML ="";
        saveButton.style.visibility = "hidden";
        saveButton.setAttribute("aria-label", "");
        saveButton.innerHTML ="";

        checkInputMode()

        if(Whiteboard.currentWhiteboard === this.wID){
            Whiteboard.currentWhiteboard = -1;
        }
    }

    leave() {
        this.hide();
    }
    /*private showButtons() {
        createCloseInteractionButton(() => this.leave());
        saveButton.style.visibility = "visible";
        clearButton.style.visibility = "visible";
    }
    private hideButtons() {
        removeCloseInteractionButton();
        saveButton.style.visibility = "hidden";
        clearButton.style.visibility = "hidden";
    }*/
    show(){
        this.canvas.addEventListener('mousemove',this.mousemove);
        this.canvas.addEventListener('mousedown',this.mousedown);
        this.canvas.addEventListener('mouseup',this.mouseup);
        this.canvas.addEventListener('mouseenter',this.mouseenter);
        clearButton.addEventListener("click", this.clearCommand);
        saveButton.addEventListener("click", this.saveCommand);

        //size changed
        window.addEventListener('resize', this.resized);

        clearButton.setAttribute("aria-label", "Clear Whiteboard");
        clearButton.innerHTML = "<em class=\"fa fa-trash\"></em>"
        this.isVisible = true;
        this.canvas.style.visibility = "visible";
        clearButton.style.visibility = "visible";

        saveButton.setAttribute("aria-label", "Clear Whiteboard");
        saveButton.innerHTML = "<em class=\"fas fa-save\"></em>"
        saveButton.style.visibility = "visible";

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

    savePressed(whiteboard: Whiteboard) {
        whiteboard.room.send(MessageType.WHITEBOARD_SAVE, whiteboard.wID);
        whiteboard.save(whiteboard, whiteboard.wID);
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
        aDownloadLink.download = 'canvas_image.png';
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
    }

    drawOthers(clientID: string, whiteboard: Whiteboard) {
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

    private draw(e, whiteboard: Whiteboard) {
        // mouse left button must be pressed
        if (e.buttons !== 1) return;
        whiteboard.setPosition(e, whiteboard);

        this.drawLine(whiteboard.oldX, whiteboard.oldY, whiteboard.x, whiteboard.y, whiteboard)

        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, whiteboard.x, whiteboard.y])
    }

    makeLine(firstX: number, firstY: number, secondX: number, secondY: number, ctx) {
        ctx.moveTo(firstX, firstY); // from
        ctx.lineTo(secondX, secondY); // to
    }

    drawLine(firstX: number, firstY: number, secondX: number, secondY: number, whiteboard: Whiteboard) {
        var ctx = whiteboard.canvas.getContext("2d");
        ctx.beginPath(); // begin

        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        ctx.moveTo(firstX, firstY); // from
        ctx.lineTo(secondX, secondY); // to

        ctx.stroke(); // draw it!
    }


    mouseUp(e, whiteboard: Whiteboard) {
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, -1])
    }

    mouseDown(e, whiteboard: Whiteboard){
        this.setPosition(e, whiteboard);
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, -1])
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, whiteboard.x, whiteboard.y])
    }

    mouseEnter(e, whiteboard: Whiteboard){
        this.setPosition(e, whiteboard);
        if (e.buttons !== 1) return;
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, -1])
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, whiteboard.x, whiteboard.y])
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
