
import { Room } from "colyseus.js";
import { State } from "../../common";
import { MessageType } from "../../common/util";
import { checkInputMode } from "../main";
import { Player } from "../player";
import { createCloseInteractionButton, getOurPlayer, getRoom, removeCloseInteractionButton } from "../util";
import { Interactive } from "./interactive";

export class Notes extends Interactive {

    inputs = [" ", "A", "a", "B", "b", "C", "c", "D", "d", "E", "e", "F", "f", "G", "g", "H", "h", "I", "i", "J", "j", "K", "k", "L", "l",
    "M", "m", "N", "n", "O", "o", "P", "p", "Q", "q", "R", "r", "S", "s", "T", "t", "U", "u", "V", "v", "W", "w", "X", "x", "Y", "y", "Z", "z",
    "Ä", "ä", "Ü", "ü", "Ö", "ö", "-", "_", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "'", "#", "+", "=", "*", "/", ".", ":", ",", ";",
    "?", "!", "%", "&", "(", ")", "<", ">", "|", "Backspace", "Enter", "ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Delete"];
    ctx: CanvasRenderingContext2D;
    static notesID: number = 0;

    id: number = 0;

    room: Room<State>;
    ourPlayer: Player;

    inputLam = (e) => {
        if (this.inputs.includes(e.key)) {
            this.room.send(MessageType.NOTES_ENTER, e.key);
        }
        else {
            console.log("Cannot type " + e.key);
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
    }

    onInteraction() {
        this.canvas.style.visibility = "visible";
        this.paint();
        createCloseInteractionButton(() => this.leave());

        checkInputMode();
        this.loop();

        document.addEventListener("keydown", this.inputLam);

        this.room.state.notesState.onChange = () => {
            this.paint();
            this.drawText();
        };
    }

    loop() { 
    }

    leave() {
        removeCloseInteractionButton();
        this.canvas.style.visibility = "hidden";
        checkInputMode();
        document.removeEventListener("keydown", this.inputLam);
        this.room.state.notesState.onChange = () => {};
    }

    //paint background
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

    //darw text on top of background
    drawText(){
        let markerX = this.room.state.notesState.markersX.get(this.ourPlayer.roomId);
        let markerY = this.room.state.notesState.markersY.get(this.ourPlayer.roomId);
        let contents: string[] = [];
        this.room.state.notesState.contents.forEach(content => contents.push(content));

        contents[markerY] = contents[markerY].substring(0, markerX) + "|" + contents[markerY].substring(markerX);

        this.ctx.fillStyle = "black";
        this.ctx.font = "25px DejaVu Sans Mono";
        this.ctx.lineWidth = 3;

        let i = 0;
        let j = 0;
        let lineheight = 30;
        while(i < contents.length) {
            let l = contents[i].length;
            let c = 1;
            while (l > 0) {
                if (l > 80) {
                    this.ctx.fillText(contents[i].substring(80 * (c - 1), 80), 100, 100 + (lineheight * j));
                    j++;
                    c++;
                }
                else {
                    this.ctx.fillText(contents[i].substring(80 * (c - 1)), 100, 100 + (lineheight * j));
                }
                l -= 80;

            }
            j++;
            i++;
        }
    
        

    }
}