import {Interactive} from "./interactive";
import {getInputMode, setInputMode} from "../input";
import {createCloseInteractionButton, InputMode, removeCloseInteractionButton} from "../util";
import { checkInputMode } from "../main";

export class CoffeeMachine extends Interactive {

    counter: number = 0;
    ctx: CanvasRenderingContext2D;
    lastOutputs: string[];

    //TODO Giulia does not good english speaking
    //TODO More options
    outputs = ["Please refill water.",
        "Please enter the secret code.",
        "Who stole all the coffee beans?",
        "Why is the coffee always empty?",
        "Machine is calcified. Please clean.",
        "Only sparkling water available. \nNo more coffee for you.",
        "You already had ten cups of coffee today. \nJunkie!",
        "Please select sufficient amount of milk!",
        "Lorem ipsum.",
        "Lisää kahvia! \n(automatically translated to finnish)",
        "Pleas kofee fill now to get koffe.",
        "Do change the filter, please?",
        "Please refill coffee beans.",
        "Please refill sugar.",
        "Please refill uranium oxide.",
        "Display broken. \nCould not display error message.",
        "Look! Behind you! Turn around now!",
        //"Have you ever had a dreams, thats... you- erm- you hads- you'd- you would- you could- you'd do- \nyou would- you want's- you- you could do so- you- you'd do- you could- you- you wanted- \nyou want them to do you so much you could do anything?",
        "Please restart.",
        "Try again, loser!",
        "Please try turning off and on again."
    ];

    constructor(){
        super("Coffee Machine", false, 1);
        this.ctx = this.canvas.getContext("2d");
        this.lastOutputs = [];
        for (let i = 0; i < 3; i++) {
            this.lastOutputs[i] = "";
        }
    }

    loop() {}

    onInteraction() {
        if(getInputMode() !== InputMode.INTERACTION) {
            this.canvas.style.visibility = "visible";
            this.canvas.getContext("2d").textAlign = "center";
            createCloseInteractionButton(() => this.leave());
            checkInputMode();
            this.searchText();
        }
        else this.leave();
        
    }

    searchText() {

        let text;
        let index = this.getRandomInt(0, this.outputs.length + 1);

        if (this.lastOutputs.includes(text)) {
            this.searchText();
            return;
        }

        text = this.outputs[index];

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
