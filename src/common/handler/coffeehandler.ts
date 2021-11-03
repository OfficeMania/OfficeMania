
import { Client, Room } from "colyseus";
import { State } from "../rooms/schema/state";
import { MessageType } from "../util";
import { Handler } from "./handler";

export class CoffeeHandler implements Handler {

    counter: number = 0;
    lastOutputs: string[];
    room: Room<State>;
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

    init(room: Room<State>) {
        this.room = room;
    }
    onCreate(options: any) {
        console.log("created listener")
        this.room.onMessage(MessageType.COFFEE_INTERACT, (client, message) => this.searchText(this.room, client))
        //change size of backlog here
        this.lastOutputs = [];
        for (let i = 0; i < 3; i++) {
            this.lastOutputs[i] = "";
        }
    }
    onJoin() {

    }
    onLeave() {

    }
    onDispose() {

    }

    searchText(room: Room<State>, client: Client) {

        let text;
        let index = this.getRandomInt(0, this.outputs.length + 1);

        if (this.lastOutputs.includes(text)) {
            this.searchText(room, client);
            return;
        }

        text = this.outputs[index];

        this.lastOutputs.unshift(text);
        this.lastOutputs.length > 3 && this.lastOutputs.pop();
        this.room.send(client, MessageType.COFFEE_MESSAGE, text);
    }

    getRandomInt(min:number, max: number){
        min = Math.ceil(min) + 1;
        max = Math.floor(max) ;
        return (Math.floor(Math.random() * (max - min)) + min) - 1;
    }
}
