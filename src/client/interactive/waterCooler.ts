import {Interactive} from "./interactive";
import {getInputMode, setInputMode} from "../input";
import {createCloseInteractionButton, InputMode, removeCloseInteractionButton} from "../util";
import { checkInputMode } from "../main";

export class WaterCooler extends Interactive{

    counter: number = 0;
    ctx: CanvasRenderingContext2D;
    lastOutputs: string[];

    //TODO WaterCoolerOutputs
    outputs = ["DAMN, I wanted sparkling water!", "Glug glug glug", "Splash!", "Refreshing...", "You feel refreshed", "OH NO! I spilled...", "Thirsty...", "Water! What a great taste.", "H2O", "A bottle of water can't quench the thirst of a bird but Tou-can", "Ice cold...", "Cling", "I hope I win thirst price", "There is nothing more refreshing than a cold beverage!", "Why did the worker at the Pepsi factory get fired? He tested positive for Coke!", "How do you make holy water? You boil the hell out of it!", "What? Im just a water dispenser...", "Hi, how are you? Water you doing today?"

    ];

    constructor(){
        super("Water cooler", false, 1);
        this.ctx = this.canvas.getContext("2d");
        this.lastOutputs = [];
        for (let i = 0; i < 3; i++) {
            this.lastOutputs[i] = "";
        }
    }

    loop() {}

    onInteraction() {
        if (getInputMode() !== InputMode.INTERACTION) {
            this.canvas.style.visibility = "visible";
            this.canvas.getContext("2d").textAlign = "center";
            createCloseInteractionButton(() => this.leave());
            checkInputMode();
            this.searchText();
        }
        else this.leave();
        
    }

    searchText() {

        let text: string;
        let index: number;
        index = this.getRandomInt(0, this.outputs.length + 1);

        text = this.outputs[index];

        if (this.lastOutputs.includes(text) || index === 3) {
            this.searchText();
            return;
        }
        if (this.lastOutputs[0] === this.outputs[2]) {
            index = 3;
            text = this.outputs[index];
        }

        this.lastOutputs.unshift(text);
        this.lastOutputs.length > 3 && this.lastOutputs.pop();
        this.print(text);
    }

    leave() {
        removeCloseInteractionButton();
        this.canvas.style.visibility = "hidden";
        setInputMode(InputMode.NORMAL);
    }

    print(text: string) {
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgb(0, 4, 120)";
        this.ctx.fillRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);

        this.ctx.fillStyle = "white";
        this.ctx.font = "50px MobileFont"; 
        this.ctx.lineWidth = 3;

        var subs = text.split('\n');
        let i = 0;
        while(subs[i] && i < 12) {
            this.ctx.fillText(subs[i], 100, 100 + (50*i));
            i++;
        }
    }

    getRandomInt(min:number, max: number){
        min = Math.ceil(min) + 1;
        max = Math.floor(max) ;
        return (Math.floor(Math.random() * (max - min)) + min) - 1;
    }

}
