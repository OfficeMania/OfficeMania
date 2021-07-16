import {Room} from "colyseus.js";
import {State} from "../../common";
import {getRoom, loadImage, PlayerRecord, getPlayers} from "../util";
import {ArraySchema} from "@colyseus/schema";
import {MessageType} from "../../common/util";
import { Interactive } from "./interactive";
import { checkInputMode } from "../main";


export class Whiteboard extends Interactive{

    private isVisible: boolean = false;
    private x: number = 0;
    private y: number = 0;
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

    private clearButton = <HTMLButtonElement>document.getElementById("button-clear-whiteboard");


    constructor() {

        super("whiteboard", false, 1)

        this.wID = Whiteboard.whiteboardCount;
        Whiteboard.whiteboardCount++;

        this.room = getRoom();
        this.players = getPlayers();

        this.clearButton.addEventListener("click", () => this.clearPressed(this));
        this.clearButton.style.top = "20%"
        this.clearButton.style.left = "20%"

        this.room.send(MessageType.WHITEBOARD_CREATE, this.wID);

        this.room.onMessage(MessageType.WHITEBOARD_REDRAW, (client) => this.drawOthers(client.sessionId, this));

        this.room.onMessage(MessageType.WHITEBOARD_CLEAR, (message) => this.clear(this, message));

        //draw events
        this.canvas.addEventListener('mousemove', (e) => {
            this.draw(e, this)
        });
        this.canvas.addEventListener('mousedown', (e) => {
            this.setPosition(e, this)
        });
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseup(e, this)
        });
        this.canvas.addEventListener('mouseenter', (e) => {
            this.setPosition(e, this)
        });

        //size
        window.addEventListener('resize', () => {
            this.resize(this)
        });

        this.canvas.width = 1280;
        this.canvas.height = 720;

        this.resize(this);
    }

    onInteraction(){
        if (this.isVisible === true) {
            this.hide()
        } else {
            this.show()
        }
    }

    hide(){
        this.isVisible = false;
        this.canvas.style.visibility = "hidden";
        this.clearButton.style.visibility = "hidden";
            
        checkInputMode()

        if(Whiteboard.currentWhiteboard === this.wID){
            Whiteboard.currentWhiteboard = -1;
        }
    }

    show(){
        this.isVisible = true;
        this.canvas.style.visibility = "visible";
        this.clearButton.style.visibility = "visible";

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
        if(Whiteboard.currentWhiteboard !== whiteboard.wID){
            return;
        }
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

    getIsVisible() {
        return this.isVisible;
    }

    getCanvas() {
        return this.canvas
    }

    resize(whiteboard: Whiteboard) {
        if(Whiteboard.currentWhiteboard !== whiteboard.wID){
            return;
        }

        var rect: DOMRect = whiteboard.canvas.getBoundingClientRect();

        whiteboard.offsetX = rect.left
        whiteboard.offsetY = rect.top

        whiteboard.stretchX = 1280 / rect.width 
        whiteboard.stretchY = 720 / rect.height
    }

    // new position from mouse event
    private setPosition(e, whiteboard: Whiteboard) {
        if(Whiteboard.currentWhiteboard !== whiteboard.wID){
            return;
        }
        whiteboard.x = (e.clientX - whiteboard.offsetX) * whiteboard.stretchX;
        whiteboard.y = (e.clientY - whiteboard.offsetY) * whiteboard.stretchY;
    }

    private draw(e, whiteboard: Whiteboard) {
        if(Whiteboard.currentWhiteboard !== whiteboard.wID){
            return;
        }
        // mouse left button must be pressed
        if (e.buttons !== 1) return;

        var oldX = whiteboard.x;
        var oldY = whiteboard.y;
        whiteboard.setPosition(e, whiteboard);

        this.drawLine(oldX, oldY, whiteboard.x, whiteboard.y, whiteboard)

        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, oldX, oldY])
    }

    drawOthers(clientID: string, whiteboard: Whiteboard) {
        if(Whiteboard.currentWhiteboard !== whiteboard.wID){
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
                i = i + 1
                continue;
            } else if (paths[i + 1] === -1) {
                i = i + 2
                continue;
            } else if (paths[i + 2] === -1) {
                i = i + 3
                continue;
            } else if (paths[i + 3] === -1) {
                i = i + 4
                continue;
            }
            if (j === 0) {
                whiteboard.makeLine(paths[i], paths[i + 1], paths[i + 2], paths[i + 3], whiteboard, ctx);
                j++;
            } else {
                j = 0;
            }
        }
        ctx.stroke(); // draw it!


        whiteboard.whiteboardPlayer[clientID] = max - 2;

    }

    makeLine(firstX: number, firstY: number, secondX: number, secondY: number, whiteboard: Whiteboard, ctx) {
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


    private mouseup(e, whiteboard: Whiteboard) {
        if(Whiteboard.currentWhiteboard !== whiteboard.wID){
            return;
        }
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, whiteboard.x, whiteboard.y])
        whiteboard.room.send(MessageType.WHITEBOARD_PATH, [whiteboard.wID, -1])
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
