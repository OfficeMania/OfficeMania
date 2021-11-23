
import { Room } from "colyseus.js";
import { State } from "../../common";
import { MessageType } from "../../common/util";
import { checkInputMode } from "../main";
import { createCloseInteractionButton, getOurPlayer, getRoom, removeCloseInteractionButton } from "../util";
import { Interactive } from "./interactive";

export class Notes extends Interactive {

    inputs = [" ", "A", "a", "B", "b", "C", "c", "D", "d", "E", "e", "F", "f", "G", "g", "H", "h", "I", "i", "J", "j", "K", "k", "L", "l",
    "M", "m", "N", "n", "O", "o", "P", "p", "Q", "q", "R", "r", "S", "s", "T", "t", "U", "u", "V", "v", "W", "w", "X", "x", "Y", "y", "Z", "z",
    "Ä", "ä", "Ü", "ü", "Ö", "ö", "-", "_", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "'", "#", "+", "=", "*", "/", ".", ":", ",", ";",
    "?", "!", "%", "&", "(", ")", "<", ">", "|", "Backspace", "Enter", "ArrowLeft", "ArrowRight"];
    ctx: CanvasRenderingContext2D;
    static notesID: number = 0;

    id: number = 0;
    content: string = "";

    marker: number = 0;
    
    room: Room<State>;
    ourPlayer;
    inputLam = (e) => {
        if (this.inputs.includes(e.key)) {
            this.room.send(MessageType.NOTES_ENTER, e.key);
        }
        else {
            //console.log("Cannot type " + e.key);
        }
        
        //console.log("sent request to add key");
    }
    constructor() {
        super("notes", false, 1);
        this.id = Notes.notesID;
        Notes.notesID++;
        this.ctx = this.canvas.getContext("2d");
        this.room = getRoom();
        this.room.send(MessageType.NOTES_CREATE);
        this.ourPlayer = getOurPlayer();
        //this.room.send(MessageType.NOTES_SET, [this.id, ""]);
    }

    onInteraction() {
        this.canvas.style.visibility = "visible";
        this.paint();
        createCloseInteractionButton(() => this.leave());

        checkInputMode();
        this.loop();

        //this.room.send(MessageType.NOTES_ENTER, "B");
        document.addEventListener("keydown", this.inputLam);
    }

    loop() {
        this.paint();
        this.drawText();
    }

    leave() {
        removeCloseInteractionButton();
        this.canvas.style.visibility = "hidden";
        checkInputMode();
        document.removeEventListener("keydown", this.inputLam);
    }
    paint() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgb(239, 245, 203)";
        this.ctx.fillRect(5, 5, (this.canvas.width / 2) - 5, (this.canvas.height / 2) - 5);
        this.ctx.fillStyle = "rgb(216, 245, 203)";
        this.ctx.fillRect((this.canvas.width / 2), 5, (this.canvas.width / 2) - 5, (this.canvas.height / 2) - 5);
        this.ctx.fillStyle = "rgb(250, 182, 177)";
        this.ctx.fillRect(5, (this.canvas.height / 2), (this.canvas.width / 2) - 5, (this.canvas.height / 2) - 5);
        this.ctx.fillStyle = "rgb(188, 247, 247)";
        this.ctx.fillRect((this.canvas.width/ 2), (this.canvas.height / 2), (this.canvas.width / 2) - 5, (this.canvas.height / 2) - 5);
    }

    drawText(){
        let buffer;
        this.marker = this.room.state.notesState.markers[this.ourPlayer.id];
        this.content = this.room.state.notesState.content;

        let subs: string[] = [];
        let lineCounter: number = 0;
        let prevPos: number = 0;
        this.room.state.notesState.lengths.forEach((length) => {
            subs[lineCounter] = this.content.substr(prevPos, length);
            prevPos += length;
        });

        this.ctx.fillStyle = "black";
        this.ctx.font = "25px DejaVu Sans Mono";
        this.ctx.lineWidth = 3;

        let i = 0;
        let j = 0;
        while(i < subs.length) {
            this.ctx.fillText(subs[i], 100, 100 + (50 * j));
            j++;
            i++;
        }
    
        

    }
}