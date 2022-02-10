import { Handler } from "./handler";
import { Client, Room } from "colyseus";
import { MessageType, State } from "../../common";
import { ChairState } from "../../common/states/chair-state";

export class DoorHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.CHAIR_NEW, ((client, message) => onNew(this.room, client, message)));
        this.room.onMessage(MessageType.CHAIR_NEW, ((client, message) => changeSitting(this.room, client, message)));
    }

    onJoin(client: Client) {
        //Nothing
    }

    onLeave(client: Client, consented: boolean) {
        this.room.state.chairStates.forEach((value, key) =>{
            if(value.playerId && value.playerId === client.id) {
                value.playerId = "";
                value.isUsed = false;
            }
        });
    }

    onDispose() {
        //Nothing?
    }

}

function onNew(room: Room<State>, client: Client, message) {
    if (!room.state.chairStates[message]) {
        room.state.chairStates[message] = new ChairState;
        room.state.chairStates[message].isUsed = false;
        room.state.chairStates[message].playerId = "";
    }
}

function changeSitting(room: Room<State>, client: Client, message) {
    if(room.state.chairStates[message[0]].isUsed === false) {
        room.state.chairStates[message[0]].isUsed = true;
        room.state.chairStates[message[0]].playerId = message[1];
        return;
    }
    room.state.chairStates[message[0]].isUsed = false;
    room.state.chairStates[message[0]].playerId = "";

}