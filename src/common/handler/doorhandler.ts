import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {DoorState, State} from "../rooms/schema/state";
import {MessageType} from "../util";

export class DoorHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.NEW_DOOR, ((client, message) => onNewDoor(this.room, client, message)));
        this.room.onMessage(MessageType.OPEN_DOOR, ((client, message) => onOpenDoor(this.room, client, message)));
        this.room.onMessage(MessageType.CLOSE_DOOR, ((client, message) => onCloseDoor(this.room, client, message)));
    }

    onJoin(client: Client) {
        //Nothing
    }

    onLeave(client: Client, consented: boolean) {
        this.room.state.doorStates.forEach((value, key) =>{
            if(value.playerId && value.playerId === client.id) {
                value.playerId = "";
                value.isClosed = false;
            }
        });
    }

    onDispose() {
        //Nothing?
    }

}

function onNewDoor(room: Room<State>, client: Client, message) {
    if (!room.state.doorStates[message]) {
        room.state.doorStates[message] = new DoorState();
        room.state.doorStates[message].isClosed = false;
        room.state.doorStates[message].playerId = "";
    }
}

function onOpenDoor(room: Room<State>, client: Client, message) { //message = id
    room.state.doorStates[message].isClosed = false;
    room.state.doorStates[message].playerId = "";
}

function onCloseDoor(room: Room<State>, client: Client, message) { //message = [id, playerId]
    room.state.doorStates[message[0]].isClosed = true;
    room.state.doorStates[message[0]].playerId = message[1];
}
