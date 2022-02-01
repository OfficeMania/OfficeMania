import { Client, Room } from "colyseus";
import { State } from "../../common/schema/state";
import { MessageType } from "../../common/util";
import { Handler } from "./handler";
import { MachineType } from "../../common/handler/machine";

export class MachineHandler implements Handler {


    room: Room<State>;
    //TODO Giulia does not good english speaking
    //TODO More options
    outputsCoffee = ["Please refill water.",
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
    lastOutputsC: number[];


    outputsVending = ["You really enjoyed your sip. \nBut then you dropped your bottle :(",
    "Want s'more Coke? Pay up.",
    "The coins are too grimy.",
    /*"butts lol"*/
    "Well I don't remember you inserting that money...",
    "Was that a dollar, or a penny?",
    "Better get the maintainance guy!",
    "Have you seen my cousin, the coffee maker? \nGive him my best.",
    "Sorry, all out of that.",
    "Out of order.",
    ];
    lastOutputsV: number[];
    specialDiaV = "... and now they are too shiny.";


    outputsWater = ["DAMN, I wanted sparkling water!",
    "Glug glug glug", "Splash!", "Refreshing...",
    "You feel refreshed", "OH NO! I spilled...",
    "Thirsty...",
    "Water! What a great taste.",
    "H2O",
    "A bottle of water can't quench the thirst of a bird \nbut Tou-can.",
    "Ice cold...",
    "Cling",
    "I hope I win thirst price",
    "There is nothing more refreshing than a cold beverage!",
    "Why did the worker at the Pepsi factory get fired? \nHe tested positive for Coke!",
    "How do you make holy water? You boil the hell out of it!",
    "What? Im just a water dispenser...",
    "Hi, how are you? Water you doing today?",
    "Remember to stay hydrated!",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    ];
    lastOutputsW: number[];


    init(room: Room<State>) {
        this.room = room;
    }
    onCreate(options: any) {
        this.room.onMessage(MessageType.MACHINE_INTERACT, (client, message) => this.searchText(this.room, client, message))
        this.lastOutputsC = [];
        this.lastOutputsC[0] = -1;
        this.lastOutputsV = [];
        this.lastOutputsV[0] = -1;
        this.lastOutputsW = [];
        this.lastOutputsW[0] = -1;
    }
    onJoin() {

    }
    onLeave() {

    }
    onDispose() {

    }

    searchText(room: Room<State>, client: Client, message: MachineType) {
        //console.log("searching");
        let text: string;

        if (message === MachineType.COFFEE) {
            text = this.searchTextCoffee(room, client);
            client.send(MessageType.MACHINE_COFFEE, text);
        }
        else if (message === MachineType.VENDING) {
            text = this.searchTextVending(room, client);
            client.send(MessageType.MACHINE_VENDING, text);
        }
        else if (message === MachineType.WATER) {
            text = this.searchTextWater(room, client);
            client.send(MessageType.MACHINE_WATER, text);
        }
        //console.log(text);


    }


    searchTextCoffee(room: Room<State>, client: Client): string  {

        //CHANGE SIZE OF BACKLOG HERE
        this.lastOutputsC.length > 3 && this.lastOutputsC.pop();

        let index = this.getRandomInt(0, this.outputsCoffee.length);
        /**
         * console.log("previous outputs:")
         * this.lastOutputs.forEach(element => {
         *     console.log(this.outputs[element])
         * });
         */

        if (this.lastOutputsC.includes(index)) {
            /**
             * console.log("duplicate, recalculating");
             * console.log("dupe: " + this.outputs[index]);
             */
            let text = this.searchTextCoffee(room, client);

            return text;
        }
        this.lastOutputsC.unshift(index);

        return this.outputsCoffee[index];;
    }
    searchTextVending(room: Room<State>, client: Client): string  {

        //CHANGE SIZE OF BACKLOG HERE
        this.lastOutputsV.length > 3 && this.lastOutputsV.pop();

        //Special condition for dialogue

        if(this.lastOutputsV[0] === 2) {
            this.lastOutputsV.unshift(-1);
            return this.specialDiaV;
        }
        let index = this.getRandomInt(0, this.outputsVending.length);
        if (this.lastOutputsV.includes(index)) {

            let text = this.searchTextVending(room, client);
            return text;
        }
        this.lastOutputsV.unshift(index);

        return this.outputsVending[index];;
    }


    searchTextWater(room: Room<State>, client: Client): string  {

        //CHANGE SIZE OF BACKLOG HERE
        this.lastOutputsW.length > 3 && this.lastOutputsW.pop();

        let index = this.getRandomInt(0, this.outputsWater.length);

        if (this.lastOutputsW.includes(index)) {

            let text = this.searchTextWater(room, client);
            return text;
        }
        this.lastOutputsW.unshift(index);

        return this.outputsWater[index];;
    }


    getRandomInt(min:number, max: number){
        min = Math.ceil(min) + 1;
        max = Math.floor(max) ;
        let i = (Math.floor(Math.random() * (max - min)) + min);
        return (i - 1);
    }
}
