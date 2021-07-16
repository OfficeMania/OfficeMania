import {Interactive} from "./interactive";
import {setInputMode} from "../input";
import {createCloseInteractionButton, InputMode, removeCloseInteractionButton} from "../util";

export class CoffeeMachine extends Interactive {

    counter: number = 0;
    ctx: CanvasRenderingContext2D;
    lastOutputs: string[];

    //TODO Giulia does not good english speaking
    //TODO More options
    outputs = ["Please refill Water.",
     "Please enter the secret Code.",
     "Who stole all the coffee beans?",
     "Why is the coffee always empty?",
     "Machine is calcified. Please clean.",
     "Only sparkling water available. No more coffee for you.",
     "You already had ten cups of coffee today. Junkie!",
     "Please select sufficient amount of milk!",
     "Lorem ipsum.",
     "Lisää kahvia! (automatically translated to finnish)",
     "Pleas kofee fill now to get koffe.",
     "Do change the filter, please?",
     "Please refill coffee beans.",
     "Please refill sugar.",
     "Please refill uranium oxide.",
     "Display broken. Could not display error message.",
     "Look! Behind you! Turn around now!",
     "Have you ever had a dreams, thats... you- erm- you hads- you'd- you would- you could- you'd do- you would- you want's- you- you could do so- you- you'd do- you could- you- you wanted- you want them to do you so much you could do anything?",
     "Please restart.",
     "Try again, loser!",
     "Please try turning off and on again."
    ];

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
        createCloseInteractionButton(() => this.leave());
        setInputMode(InputMode.WRITETODO);
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

        text = this.outputs[index];

        this.lastOutputs[this.counter] = this.outputs[index];
        if(this.counter === 2){
            this.counter = 0;
        }
        this.counter++;
        this.print(text);
    }

    leave() {
        removeCloseInteractionButton();
        this.canvas.style.visibility = "hidden";
        setInputMode(InputMode.NORMAL);
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
        min = Math.ceil(min) + 1;
        max = Math.floor(max) ;
        return (Math.floor(Math.random() * (max - min)) + min) - 1;
    }
}
