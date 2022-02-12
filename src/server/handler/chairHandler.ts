import { Handler } from "./handler";
import { Client, Room } from "colyseus";
import { MessageType, State } from "../../common";
import { ChairState } from "../../common/states/chair-state";

export class ChairHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.CHAIR_NEW, ((client, message) => onNew(this.room, client, message)));
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

export function changeSitting(room: Room<State>, client: Client, message) {
    console.log(message);
    let chair = room.state.chairStates[message];
    if(chair.isUsed === false) {
        chair.isUsed = true;
        chair.playerId = client.id;
        console.log(chair.isUsed + " | " + message);
    } else {
        chair.isUsed = false;
        chair.playerId = "";
    }

}