import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {State} from "../../common/schema/state";
import { TodoState } from "../../common/schema/todo-state";
import {MessageType} from "../../common/util";
import {MapSchema} from "@colyseus/schema";

let ToDoListCount = 0;

export class TodoListHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.LIST_CREATE, (client, message) => onCreate(this.room, client, message));
        this.room.onMessage(MessageType.LIST_UPDATE, (client, message) => onUpdate(this.room, client, message));
        this.room.onMessage(MessageType.LIST_USE, (client, message) => onUse(this.room, client, message));
        this.room.onMessage(MessageType.LIST_STOPUSE,(client, message) => onStopUse(this.room, client, message));
    }

    onJoin(client: Client) {

    }

    onLeave(client: Client, consented: boolean) {
        let index: number = getStateID(this.room, client);
        if (index > -1) {
            onStopUse(this.room, client, index.toString());
        }
        //Nothing
    }

    onDispose() {
        //Nothing?
    }
}

function onCreate(room: Room<State>, client: Client, ID: string) {

    if(!room.state.todoState[ID]){
        room.state.todoState[ID] = new TodoState();
        room.state.todoState[ID].isUsed = null;
        room.state.todoState[ID].content = "";
    }

}

function onUpdate(room: Room<State>, client: Client, message: string[]) { //message = [ID, String]

    room.state.todoState[message[0]].content = message[1];

}

function onUse(room: Room<State>, client: Client, ID: string) {

    room.state.todoState[ID].isUsed = client.sessionId;
    console.log(ID);

}

function onStopUse(room: Room<State>, client: Client, ID: string){

    room.state.todoState[ID].isUsed = null;
    console.log("onstopuse");

}
function getStateID(room: Room <State>, client: Client): number {
    const states = room.state.todoState;
    for (let i = 0; i < states.size; i++) {
        if(states[i].isUsed === client.sessionId) {
            console.log(i);
            return i;
        }
    }
    return -1;
}
