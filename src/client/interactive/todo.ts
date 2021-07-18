import {Room} from "colyseus.js";
import {State} from "../../common";
import {MessageType} from "../../common/util";
import {Interactive} from "./interactive";
import {setInputMode} from "../input";
import {createCloseInteractionButton, getRoom, InputMode, removeCloseInteractionButton} from "../util";
import { checkInputMode } from "../main";

export class Todo extends Interactive {

    id:number = 0;
    static todoId: number = 0;
    content: string = "";
    ctx: CanvasRenderingContext2D;
    inputLam = (e) => {
        this.getInput(e)
    };
    marker: number = 0; //marks the char in the String you currently are
    private room: Room<State>;

    inputs = [" ", "A", "a", "B", "b", "C", "c", "D", "d", "E", "e", "F", "f", "G", "g", "H", "h", "I", "i", "J", "j", "K", "k", "L", "l",
    "M", "m", "N", "n", "O", "o", "P", "p", "Q", "q", "R", "r", "S", "s", "T", "t", "U", "u", "V", "v", "W", "w", "X", "x", "Y", "y", "Z", "z",
    "Ä", "ä", "Ü", "ü", "Ö", "ö", "-", "_", "1", "2", "3", "4", "5", "6", "7", "8", "9", "'", "#", "+", "=", "*", "/", ".", ":", ",", ";",
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
            //error Text?
            console.log("used");
            return;
        }
        this.content = this.room.state.todoState[this.id.toString()].content;
        this.room.send(MessageType.LIST_USE, this.id.toString())
        this.ctx.textAlign = "left";
        this.canvas.style.visibility = "visible";
        createCloseInteractionButton(() => this.leave());
        this.paint();
        checkInputMode();

        document.addEventListener("keydown", this.inputLam);
    }

    leave(){
        removeCloseInteractionButton();
        document.removeEventListener("keydown", this.inputLam);

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
        console.log("Marker:" + this.marker + "Text:" + this.content.length);
        let i = 0;
        while(this.inputs[i]){
            if(this.inputs[i] === e.key){
                console.log(this.content.length);
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
    }

    paint() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.lineWidth = 10;
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.stroke();
        this.drawText();
    }

    drawText(){
        let buffer;
        if(this.marker === this.content.length) {
            buffer = this.content + "|";
        }
        else {
            buffer = this.content.slice(0, this.marker - this.content.length) + "|" + this.content.slice(this.marker - this.content.length, this.content.length);
        }

        //TODO make a \n every x chars
        var subs = buffer.split('\n');

        this.ctx.fillStyle = "black";
        this.ctx.font = "25px sans-serif"; //TODO monospaced so you now how musch characters are ok for one line
        this.ctx.lineWidth = 3;

        let i = 0;
        while(subs[i] && i < 12) {
            this.ctx.fillText(subs[i], 100, 100 + (50*i));
            i++;
        }
    }

    loop(){}
}
