import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {State, TodoState} from "../rooms/schema/state";
import {MessageType} from "../util";
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
        //Nothing
    }

    onDispose() {
        //Nothing?
    }
}

function onCreate(room: Room<State>, client: Client, ID: string) {

    if(!room.state.todoState[ID]){
        room.state.todoState[ID] = new TodoState();
        room.state.todoState[ID].isUsed = false;
        room.state.todoState[ID].content = "";
    }

}

function onUpdate(room: Room<State>, client: Client, message: string[]) { //message = [ID, String]

    room.state.todoState[message[0]].content = message[1];

}

function onUse(room: Room<State>, client: Client, ID: string) {

    room.state.todoState[ID].isUsed = true;

}

function onStopUse(room: Room<State>, client: Client, ID: string){

    room.state.todoState[ID].isUsed = false;

}
