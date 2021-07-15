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
    }

    onJoin(client: Client) {
        //Nothing
    }

    onLeave(client: Client, consented: boolean) {
        //TODO Unlock all by disconnected Client locked Doors?
    }

    onDispose() {
        //Nothing
    }

}

function onNewDoor(room: Room<State>, client: Client, message: string) {
    if (room.state.doorStates[message] !== null) {
        room.state.doorStates[message] = new DoorState();
        room.state.doorStates[message].isClosed = false;
        room.state.doorStates[message].playerId = "";
    }
}
