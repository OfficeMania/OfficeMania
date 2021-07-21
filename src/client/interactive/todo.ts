import {Room} from "colyseus.js";
import {State} from "../../common";
import {MessageType} from "../../common/util";
import {Interactive} from "./interactive";
import {setInputMode} from "../input";
import {createCloseInteractionButton, getOurPlayer, getRoom, InputMode, removeCloseInteractionButton} from "../util";
import { checkInputMode } from "../main";

export class Todo extends Interactive {

    id:number = 0;
    static todoId: number = 0;
    content: string = "";
    ctx: CanvasRenderingContext2D;
    contentBeforeEdit : string = "";

    inputLam = (e) => {
        this.getInput(e)
    };
    marker: number = 0; //marks the char in the String you currently are
    private room: Room<State>;

    inputs = [" ", "A", "a", "B", "b", "C", "c", "D", "d", "E", "e", "F", "f", "G", "g", "H", "h", "I", "i", "J", "j", "K", "k", "L", "l",
    "M", "m", "N", "n", "O", "o", "P", "p", "Q", "q", "R", "r", "S", "s", "T", "t", "U", "u", "V", "v", "W", "w", "X", "x", "Y", "y", "Z", "z",
    "Ä", "ä", "Ü", "ü", "Ö", "ö", "-", "_", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "'", "#", "+", "=", "*", "/", ".", ":", ",", ";",
    "?", "!", "%", "&", "(", ")", "<", ">", "|"];
    //gibt es eine schönere Lösung als das Array? Das ist ja ziemlich kagge, aber wollte mich daran jetzt nicht aufhalten
    //Gleiches gilt für den neuen InputMode



    constructor(){
        super("sticky notes", false, 1);
        this.id = Todo.todoId;
        Todo.todoId++;
        this.ctx = this.canvas.getContext("2d");
        this.room = getRoom();
        this.room.send(MessageType.LIST_CREATE, this.id.toString());
    }

    onInteraction(){
        if(this.room.state.todoState[this.id.toString()].isUsed){
            //TODO output for user
            console.log("used");
            return;
        }
        this.content = this.room.state.todoState[this.id.toString()].content;
        this.contentBeforeEdit = this.content;
        this.room.send(MessageType.LIST_USE, this.id.toString())
        this.ctx.textAlign = "left";
        this.canvas.style.visibility = "visible";
        createCloseInteractionButton(() => this.leave());
        this.marker = this.content.length;
        this.paint();
        checkInputMode();

        document.addEventListener("keydown", this.inputLam);
    }

    leave(){
        removeCloseInteractionButton();
        document.removeEventListener("keydown", this.inputLam);

        if (this.content !== this.contentBeforeEdit) {
            this.content = this.content + " '@" + getOurPlayer().name + "'";
        }
        
        this.syncServer();
        this.room.send(MessageType.LIST_STOPUSE, this.id.toString());

        this.canvas.style.visibility = "hidden";
        setInputMode(InputMode.NORMAL);
    }

    syncServer(){
        let message = [this.id.toString(), this.content];
        this.room.send(MessageType.LIST_UPDATE, message);
    }

    getInput(e:KeyboardEvent){
        //TDOD dont draw more then 12 lines
        let i = 0;
        while(this.inputs[i]){
            if(this.inputs[i] === e.key){
                if(this.marker === this.content.length){
                    this.content = this.content.concat(e.key);
                } else {
                    this.content = this.content.slice(0, this.marker - this.content.length) + e.key + this.content.slice(this.marker - this.content.length, this.content.length);
                }
                this.marker++;
                this.paint();
                return;
            }
            i++;
        }
        if(e.key === "Enter") {
            if(this.marker === this.content.length){
                this.content = this.content.concat("\n");
            } else {
                this.content = this.content.slice(0, this.marker - this.content.length) + "\n" + this.content.slice(this.marker - this.content.length, this.content.length);
            }
            this.marker++;
        }
        else if(e.key === "Backspace") {
            if(this.marker === 0) {
                return;
            } else if(this.marker === this.content.length) {
                this.content = this.content.slice(0, -1);
            } else {
                this.content = this.content.slice(0, this.marker - this.content.length - 1) + this.content.slice(this.marker - this.content.length, this.content.length);
            }
            this.marker = this.marker - 1;
        }


        else if(e.key === "ArrowLeft") {
            if(this.marker > 0){
                this.marker--;
            }
        }
        else if(e.key === "ArrowRight") {
            if(this.marker < this.content.length){
                this.marker++;
            }
        }
        this.paint();
        this.syncServer();
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

        this.drawText();
    }

    drawText(){
        let buffer;
        if(this.marker === this.content.length) {
            buffer = this.content + '\u2502';
        }
        else {
            buffer = this.content.slice(0, this.marker - this.content.length) + '\u2502' + this.content.slice(this.marker - this.content.length, this.content.length);
        }

        var subs = buffer.split('\n');

        this.ctx.fillStyle = "black";
        this.ctx.font = "25px DejaVu Sans Mono";
        this.ctx.lineWidth = 3;

        let i = 0;
        let j = 0;
        while(subs[i] && j < 12) {
            if(subs[i].length > 70){
                for (let k = 0; k < subs[i].length; k++) {
                    if(k % 70 === 0 && k !== 0) {
                        this.ctx.fillText("text", 0, 0);
                    }else if(subs[i].length - k < 70) {
                        this.ctx.fillText(subs[i].slice(k, subs[i].length), 100, 100 + (50 * j));
                        j++;
                    }
                }
                console.log("sehr langer abschnitt");
                let text1 = subs[i].slice(0, 70);
                this.ctx.fillText(text1, 100, 100 + (50 * j));
                j++;
            } else{
                this.ctx.fillText(subs[i], 100, 100 + (50*j));
                j++;
            }
            i++;
        }

    }

    loop(){}
}
