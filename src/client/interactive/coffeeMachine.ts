import {Interactive} from "./interactive";
import { setInputMode } from "../input";
import { getRoom, InputMode } from "../util";
import { checkInputMode } from "../main";

class CoffeeMachine extends Interactive {

    counter: number = 0;
    ctx: CanvasRenderingContext2D;
    lastOutputs: string[];

    //TODO Giulia does not good english speaking
    //TODO More options
    outputs = ["Please refill Water.", "Please enter the secred Code.", "Who stole all the coffee beans?", "Why is the coffee always empty?"];

    constructor(){
        super("Coffe Machine", false, 1);
        this.ctx = this.canvas.getContext("2d");
        this.lastOutputs = [];
        for (let i = 0; i < 3; i++) {
            this.lastOutputs[i] = "";
        }
    }

    loop() {}

    onInteraction() {
        this.canvas.style.visibility = "visible";
        this.createButton();
        checkInputMode();
        this.searchText();
    }

    searchText() {

        let text;
        let index = this.getRandomInt(0, this.outputs.length + 1);

        for (let i = 0; i < 3; i++) {
            if(this.outputs[index] === this.lastOutputs[i]){
                this.searchText();
                return;
            }
        }

        this.lastOutputs[this.counter] = this.outputs[index];
        if(this.counter === 2){
            this.counter = 0;
        }
        this.counter++;

        this.print(text);
    }

    leave() {
        if(document.getElementById("close")){
            document.getElementById("close").remove();
        }
        
        this.canvas.style.visibility = "hidden";
        checkInputMode();
    }

    createButton(){
        const button = document.createElement("BUTTON");
        button.addEventListener("click", () => this.leave())
        button.innerHTML = "<em class = \"fa fa-times\"></em>";
        button.id = "close";
        this.buttonBar.appendChild(button);
    }

    print(text: string) {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.lineWidth = 10;
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.stroke();

        this.ctx.fillStyle = "black";
        this.ctx.font = "25px sans-serif"; //monospaced so you now how musch characters are ok for one line
        this.ctx.lineWidth = 3;

        //TODO center the text?
        //TODO make a \n every x chars
        var subs = text.split('\n');
        let i = 0;
        while(subs[i] && i < 12) {
            this.ctx.fillText(subs[i], 100, 100 + (50*i));
            i++;
        }
    }

    getRandomInt(min:number, max: number){
        min = Math.ceil(min);
        max = Math.floor(max);
        return (Math.floor(Math.random() * (max - min)) + min) - 1;
    }
}