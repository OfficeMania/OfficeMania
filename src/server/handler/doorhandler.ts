import { Handler } from "./handler";
import { Client, Room } from "colyseus";
import { DoorState, MessageType, State } from "../../common";

export class DoorHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.DOOR_NEW, ((client, message) => onNew(this.room, client, message)));
        this.room.onMessage(MessageType.DOOR_LOCK, ((client, message) => onLock(this.room, client, message)));
        this.room.onMessage(MessageType.DOOR_UNLOCK, ((client, message) => onUnlock(this.room, client, message)));
        this.room.onMessage(MessageType.DOOR_KNOCK, ((client, message) => this.onKnock(this.room, client, message)));
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

    onKnock(room: Room<State>, client: Client, message) {
        this.room.clients.forEach(client => {
            if(message.includes(client.sessionId)) {
                client.send(MessageType.DOOR_NOTIFICATION, "knock knock");
            }
        });
    }

}

function onNew(room: Room<State>, client: Client, message) {
    if (!room.state.doorStates[message]) {
        room.state.doorStates[message] = new DoorState();
        room.state.doorStates[message].isClosed = false;
        room.state.doorStates[message].playerId = "";
    }
}

function onLock(room: Room<State>, client: Client, message) { //message = [id, playerId]
    room.state.doorStates[message[0]].isClosed = true;
    room.state.doorStates[message[0]].playerId = message[1];
}

function onUnlock(room: Room<State>, client: Client, message) { //message = id
    room.state.doorStates[message].isClosed = false;
    room.state.doorStates[message].playerId = "";
}
