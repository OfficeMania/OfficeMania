import { Room } from "colyseus.js";
import { MessageType, State } from "../../common";
import { Interactive } from "./interactive";
import { setInputMode } from "../input";
import { createCloseInteractionButton, getOurPlayer, getRoom, InputMode, removeCloseInteractionButton } from "../util";
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
            this.canvas.style.visibility = "visible";
            createCloseInteractionButton(() => this.leave());
            this.paint();

            this.ctx.fillStyle = "black";
            this.ctx.font = "25px DejaVu Sans Mono";
            this.ctx.lineWidth = 3;
            this.ctx.fillText("Someone else is using these sticky notes.", 100, 100);
            this.ctx.fillText("Please come back later or use other sticky notes.", 100, 150);
            checkInputMode();
        } else{
            this.content = this.room.state.todoState[this.id.toString()].content;
            this.contentBeforeEdit = this.content;
            this.room.send(MessageType.LIST_USE, this.id.toString())
            this.ctx.textAlign = "left";
            this.canvas.style.visibility = "visible";
            createCloseInteractionButton(() => this.leave());
            this.marker = this.content.length;
            this.paint();
            this.drawText();
            checkInputMode();

            document.addEventListener("keydown", this.inputLam);
        }
    }

    leave(){
        removeCloseInteractionButton();
        document.removeEventListener("keydown", this.inputLam);

        if (this.content !== this.contentBeforeEdit && this.content !== "") {
            this.content = this.content + "\n    '@" + getOurPlayer().displayName + "'";
        }

        this.syncServer();
        this.room.send(MessageType.LIST_STOPUSE, this.id.toString());
        this.canvas.getContext("2d").clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.visibility = "hidden";
        setInputMode(InputMode.NORMAL);
    }

    syncServer(){
        let message = [this.id.toString(), this.content];
        this.room.send(MessageType.LIST_UPDATE, message);
    }

    getInput(e:KeyboardEvent){
        let i = 0;
        while(this.inputs[i] && this.checkForSpace(e)){
            if(this.inputs[i] === e.key){
                if(this.marker === this.content.length){
                    this.content = this.content.concat(e.key);
                } else {
                    this.content = this.content.slice(0, this.marker - this.content.length) + e.key + this.content.slice(this.marker - this.content.length, this.content.length);
                }
                this.marker++;
                this.paint();
                this.drawText();
                return;
            }
            i++;
        }
        if(e.key === "Enter" && this.checkForSpace(e)) {
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
        this.drawText();
        this.syncServer();
    }

    checkForSpace(e:KeyboardEvent): boolean{
            var subs = this.content.split('\n');
            let i = 0;
            let lineCounter = 0;
            let last: string;
            while(i < subs.length) {
                let times = Math.floor(subs[i]?.length / 70);
                lineCounter += times + 1;
                last = subs[i]?.slice(70 * times, subs[i]?.length)
                i++;
            }
        if(e.key === "Enter" && lineCounter < 12) {
            return true;
        }else if (e.key === "Enter") {
            return false;
        } else if(lineCounter < 12 ||lineCounter === 12 && last.length < 69) {
            return true;
        }
        return false;
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
        while(i < subs.length) {
            let times = Math.floor(subs[i]?.length / 70);
            for(let k = 0; k <= times; k++) {
                if(k === times){
                    this.ctx.fillText(subs[i]?.slice(70 * k, subs[i]?.length), 100, 100 + (50 * j));
                    j++;
                } else {
                    this.ctx.fillText(subs[i]?.slice(70 * k, (70 * k) + 70), 100, 100 + (50 * j));
                    j++;
                }
            }
            i++;
        }

    }

    loop(){}
}
