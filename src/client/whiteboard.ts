import {Room} from "colyseus.js";
import {State} from "../common";
import {loadImage, PlayerRecord} from "./util";
import {ArraySchema} from "@colyseus/schema";


export class Whiteboard {

    private isVisible: boolean = false;
    private canvas: HTMLCanvasElement;
    private x: number = 0;
    private y: number = 0;
    private offsetX: number = 100;
    private offsetY: number = 100;
    private room: Room<State>;
    private players: PlayerRecord;
    private whiteboardPlayer: { [key: string]: number } = {};

    private clearButton = <HTMLButtonElement>document.getElementById("button-clear-whiteboard");


    constructor(canvas: HTMLCanvasElement, room: Room<State>, players: PlayerRecord) {
        this.room = room;
        this.players = players;
        this.canvas = canvas;
        let ctx = canvas.getContext("2d");

        this.clearButton.addEventListener("click", () => this.clearPressed(this));

        room.onMessage("redraw", (client) => {
            this.drawOthers(client.sessionId, this)
        })
        room.onMessage("clearWhiteboard", (message) => {
            this.clear(this)
        })


        canvas.addEventListener('mousemove', (e) => {
            this.draw(e, this)
        });
        canvas.addEventListener('mousedown', (e) => {
            this.setPosition(e, this)
        });
        canvas.addEventListener('mouseup', (e) => {
            this.mouseup(e, this)
        });
        canvas.addEventListener('mouseenter', (e) => {
            this.setPosition(e, this)
        });

        canvas.width = 1280;
        canvas.height = 720;


        this.setup(canvas);
    }

    private setup(canvas) {
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black"
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.stroke();
    }

    addPlayer(player: string) {
        this.whiteboardPlayer[player] = 0;
    }

    clearPressed(whiteboard: Whiteboard) {
        whiteboard.room.send("clearWhiteboard")
        whiteboard.clear(whiteboard);
    }

    clear(whiteboard: Whiteboard) {
        for (var id in whiteboard.whiteboardPlayer) {
            whiteboard.whiteboardPlayer[id] = 0;
        }
        whiteboard.setup(whiteboard.canvas)
    }

    getIsVisible() {
        return this.isVisible;
    }

    toggelIsVisible() {
        if (this.isVisible === true) {
            this.isVisible = false;
            this.canvas.style.visibility = "hidden";
            this.clearButton.style.visibility = "hidden";
        } else {
            this.isVisible = true;
            this.canvas.style.visibility = "visible";
            this.clearButton.style.visibility = "visible";
        }
    }

    getCanvas() {
        return this.canvas
    }

    resize(width: number, height: number) {
        this.offsetX = Math.round(width / 2) - Math.round(this.canvas.width / 2);
        this.offsetY = Math.round(height / 2) - Math.round(this.canvas.height / 2);

        this.canvas.style.left = this.offsetX + "px";
        this.canvas.style.top = this.offsetY + "px";

        this.clearButton.style.left = this.offsetX + 4 + "px";
        this.clearButton.style.top = this.offsetY + 4 + "px";
    }

    // new position from mouse event
    private setPosition(e, whiteboard: Whiteboard) {
        whiteboard.x = e.clientX - whiteboard.offsetX;
        whiteboard.y = e.clientY - whiteboard.offsetY;
    }

    private draw(e, whiteboard: Whiteboard) {
        // mouse left button must be pressed
        if (e.buttons !== 1) return;

        var oldX = whiteboard.x;
        var oldY = whiteboard.y;
        whiteboard.setPosition(e, whiteboard);

        this.drawLine(oldX, oldY, whiteboard.x, whiteboard.y, whiteboard)

        whiteboard.room.send("path", [oldX, oldY])
    }

    drawOthers(clientID: string, whiteboard: Whiteboard) {
        var max: number = whiteboard.room.state.whiteboardPlayer[clientID].paths.length;
        var start: number = whiteboard.whiteboardPlayer[clientID]
        var paths: ArraySchema<number> = whiteboard.room.state.whiteboardPlayer[clientID].paths;
        console.log(paths);
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
        whiteboard.room.send("path", [whiteboard.x, whiteboard.y])
        whiteboard.room.send("path", -1)
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
