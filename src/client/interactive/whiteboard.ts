import {Room} from "colyseus.js";
import {State} from "../../common";
import {
    consumeInteractionClosed,
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
    penButton,
    size5Button,
    size10Button,
    whiteboardPanel
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
    private players: PlayerRecord = getPlayers();
    private whiteboardPlayer: { [key: string]: number } = {}; //(new) code where multiple players should be able to draw at once
    wID: number = 0;
    static whiteboardCount: number = 0;
    static currentWhiteboard: number = 0;
    currentColor: number = 0;
    private size: number = 5;
    private numberOfDrawnPixel: number = 0;
    private currentlyPainting: boolean = false;


    changeSize = (size) => {
        this.size = size;
    }

    //define events
    resized = () => this.resize(this);

    useTool = (e) => {
        
        if (e.buttons !== 1) return;
        var ctx = this.canvas.getContext("2d");
        ctx.lineWidth = this.size;
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

        this.makeLine(this.oldX, this.oldY, this.x, this.y, ctx); //from oldX,oldY to x,y
        ctx.closePath();
        ctx.stroke(); // draw it!

        if (this.numberOfDrawnPixel % 4 === 0) { //only send each 4th pixel to server => draw short lines rather than each pixel
            this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.currentColor, this.size, this.x, this.y])
        }
        this.numberOfDrawnPixel++;
        this.currentlyPainting = true;
    }

    mouseDown = (e) => {
        this.setPosition(e, this);
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.currentColor, this.size, -2]); //-2: dont save color again (already saved)
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.currentColor, this.size, this.x, this.y])
    }

    mouseEnter = (e) => {
        this.setPosition(e, this);
        if (e.buttons !== 1) return;
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.currentColor, this.size, -1])
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.currentColor, this.size, this.x, this.y])
    }

    mouseUp = (e) => {
        if (this.currentlyPainting) { //send last pixel of stroke to server
            this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.currentColor, this.size, this.x, this.y]);
            this.currentlyPainting = false;
        }
        this.room.send(MessageType.WHITEBOARD_PATH, [this.wID, this.currentColor, this.size, -1]);
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
/*
        clearButton.style.top = "35%"
        clearButton.style.left = "25%"

        saveButton.style.top = "60%"
        saveButton.style.left = "70%"

        eraserButton.style.top = "55%"
        eraserButton.style.left = "55%"

        penButton.style.top = "33%"
        penButton.style.left = "33%"

        size5Button.style.top = "33%"
        size5Button.style.left = "33%"

        size10Button.style.top = "37%"
        size10Button.style.left = "33%"
*/
        this.room.send(MessageType.WHITEBOARD_CREATE, this.wID);
        //(new) code where multiple players should be able to draw at once
        //this.room.onMessage(MessageType.WHITEBOARD_REDRAW, (client) => this.drawOthers(client.sessionId, this));

        //================================new Code ==============================================
        //this.clientIDs = this.room.state.whiteboard.at(this.wID).clientIDs;
        //this.room.onMessage(MessageType.WHITEBOARD_REDRAW, (client) => this.drawOthers(client, this));
        //"same" (old) code where only one player can draw at a time
        this.room.onMessage(MessageType.WHITEBOARD_REDRAW, (client) => this.drawOthers(this));
        this.room.onMessage(MessageType.WHITEBOARD_CLEAR, (message) => this.clear(this, message));
        this.room.onMessage(MessageType.WHITEBOARD_SAVE, (message) => this.save(this, message));
        this.room.onMessage(MessageType.WHITEBOARD_DRAW, () => this.draw());
        this.room.onMessage(MessageType.WHITEBOARD_ERASE, () => this.erase());

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

    loop() {}

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
        size5Button.addEventListener("click", (e) => {this.changeSize(5);});
        size10Button.addEventListener("click", (e) => {this.changeSize(10);});

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

        size5Button.innerHTML = "<em class=\"fas fa-circle\"></em>"
        size5Button.style.visibility = "visible";

        size10Button.innerHTML = "<em class=\"fas fa-circle fa-lg\"></em>"
        size10Button.style.visibility = "visible";
        
        whiteboardPanel.style.visibility = "visible";

        checkInputMode()

        Whiteboard.currentWhiteboard = this.wID

        this.resize(this);
        //this.setup(this.canvas); //unnecessary because redraw calls setup
        this.redraw(this);
        //=================================new Code=================================
        //this.clientIDs = this.room.state.whiteboard.at(this.wID).clientIDs; //sync in case a client went/joint
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
        size5Button.removeEventListener("click", (e) => {this.changeSize(5);});
        size10Button.removeEventListener("click", (e) => {this.changeSize(10);});
        window.removeEventListener('resize', this.resized);

        removeCloseInteractionButton();

        this.canvas.style.visibility = "hidden";
        clearButton.style.visibility = "hidden";
        saveButton.style.visibility = "hidden";
        eraserButton.style.visibility = "hidden";
        penButton.style.visibility = "hidden";
        size5Button.style.visibility = "hidden";
        size10Button.style.visibility = "hidden";
        whiteboardPanel.style.visibility = "hidden";
        
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
        ctx.lineWidth = 5;
        this.size = 5;0
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.stroke();
        ctx.closePath();
        this.drawPressed; //because if nothing is pressed in the beginning, you can still draw
    }

    redraw(whiteboard: Whiteboard){
        whiteboard.setup(whiteboard.canvas);
        //(new) code where multiple players should be able to draw at once
        /*for (const [player] of whiteboard.room.state.whiteboard.at(this.wID).whiteboardPlayer) {
            whiteboard.resetPlayer(player);
            whiteboard.drawOthers(player, whiteboard);
        }*/

        //"same" (old) code where only one player can draw at a time
        //=========================================old==============================================
        whiteboard.drawOthers(whiteboard);

        //======================================new Code=============================================
        //for (let i = 0; i < whiteboard.room.state.whiteboard.at(whiteboard.wID).numberOfClients; i++) {
        //    whiteboard.drawOthers(i, whiteboard);
        //}
    }

    /*resetPlayer(player: string) {
        this.whiteboardPlayer[player] = 0;
    }*/

    clear(whiteboard: Whiteboard, message: number) {
        if(whiteboard.wID !== message){
            return;
        }

        //(new) code where multiple players should be able to draw at once
        /*for (var id in whiteboard.whiteboardPlayer) {
            whiteboard.whiteboardPlayer[id] = 0;
        }*/

        whiteboard.setup(whiteboard.canvas)
    }

    save(whiteboard: Whiteboard, message: number) {
        if(whiteboard.wID !== message){
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
/*
        clearButton.style.top = rect.top + "px";
        saveButton.style.top = rect.top + "px";
        eraserButton.style.top = rect.top + "px";
        penButton.style.top = rect.top + "px";
    */  }

    //(new) code where multiple players should be able to draw at once
    //drawOthers(clientID: string, whiteboard: Whiteboard) {

    //"same" (old) code where only one player can draw at a time
    drawOthers(whiteboard: Whiteboard) {
    //========================new Code==================================
    //drawOthers(clientID: number, whiteboard: Whiteboard) {
        if(Whiteboard.currentWhiteboard !== this.wID){
            return;
        }
        //(new) code where multiple players should be able to draw at once
        /*var paths: ArraySchema<number> = whiteboard.room.state.whiteboard.at(whiteboard.wID).whiteboardPlayer[clientID].paths;
        var color: ArraySchema<string> = whiteboard.room.state.whiteboard.at(whiteboard.wID).whiteboardPlayer[clientID].color;*/
        
        //============================================old==========================================
        //"same" (old) code where only one player can draw at a time
        var paths: ArraySchema<number> = whiteboard.room.state.whiteboard.at(whiteboard.wID).paths;
        var color: ArraySchema<string> = whiteboard.room.state.whiteboard.at(whiteboard.wID).color;
        var sizes: ArraySchema<number> = whiteboard.room.state.whiteboard.at(whiteboard.wID).size;

        //=======================================new Code=========================================
        //var path: ArraySchema<ArraySchema<number>> = whiteboard.room.state.whiteboard.at(whiteboard.wID).playerPaths;
        //var pathsProxy = new Proxy(path, {
        //    set: function (target, key, value) {
        //        console.log(`${String(key)} set to ${value}`);
        //        target[key] = value;
        //        return true;
        //    }
        //  });
        ////next 2 lines just for debugging (dont have any function)
        //console.log(pathsProxy); //Proxy {$changes: ChangeTree, $items: Map(0), $indexes: Map(0), $refId: 0, $proxy: true}
        ////TODO: why is playerPaths (and playerColors and playerSizes) always empty?!?!?!?!???
        //var paths: ArraySchema<number> = pathsProxy[clientID];
        //if (paths !== undefined) { //avoid errors
            //var color: ArraySchema<string> = whiteboard.room.state.whiteboard.at(whiteboard.wID).playerColors[clientID];
            //console.log(color);
            //console.log("DEEEEEEEBBBBUUUUUUUUUUUGGGGGGGGGG"); //never... -> paths always undefined?
            //var sizes: ArraySchema<number> = whiteboard.room.state.whiteboard.at(whiteboard.wID).playerSizes[clientID];
        
        var max: number = paths.length;

        //(new) code where multiple players should be able to draw at once
        //var start: number = whiteboard.whiteboardPlayer[clientID];

        var ctx = whiteboard.canvas.getContext("2d");

        ctx.lineCap = 'round';
        var j = 0;
        let indexOfStroke = 0;

        //(new) code where multiple players should be able to draw at once
        //for (var i: number = start; i < max - 3; i++) {
        //"same" (old) code where only one player can draw at a time
        for (var i: number = 0; i < max - 3; i++) {    
            if (paths.at(i) === -1) {
                indexOfStroke++;
                j = 0;
                continue;
            } else if (paths.at(i + 1) === -1) { //paths: [...,-1,firstX,firstY,secondX,secondY,thirdX,thirdY,...,-1,firstX,...]
                i = i + 1;
                j = 0;
                continue;
            } else if (paths.at(i + 2) === -1) {
                i = i + 2;
                j = 0;
                continue;
            } else if (paths.at(i + 3) === -1) {
                i = i + 3;
                j = 0;
                continue;
            }
            if (j === 0) {
                ctx.beginPath(); 
                ctx.lineWidth = sizes.at(indexOfStroke);
                ctx.strokeStyle = color.at(indexOfStroke);
                whiteboard.makeLine(paths.at(i), paths.at(i + 1), paths.at(i + 2), paths.at(i + 3), ctx);
                ctx.closePath();
                ctx.stroke();
                j++;
            } else {
                j = 0;
            }
            //}
        }
        
        //(new) code where multiple players should be able to draw at once
        //whiteboard.whiteboardPlayer[clientID] = max - 2;

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
        this.currentColor = 0;
    }

    private erase() {
        this.isPen = false;
        this.currentColor = 1;
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
