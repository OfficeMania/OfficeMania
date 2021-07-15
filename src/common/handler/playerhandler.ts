import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {PlayerData, State, WhiteboardPlayerState} from "../rooms/schema/state";
import {Direction, MessageType} from "../util";

export class PlayerHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        //receives movement from all the clients
        this.room.onMessage(MessageType.MOVE, ((client, message) => onMove(this.room, client, message)));
        //receives character changes
        this.room.onMessage(MessageType.UPDATE_CHARACTER, (client, message) => this.room.state.players[client.sessionId].character = message);
        //receives name changes
        this.room.onMessage(MessageType.UPDATE_USERNAME, (client, message) => this.room.state.players[client.sessionId].name = message);
        //receives participant id changes
        //TODO Maybe let the server join the jitsi conference too (without mic/cam) and then authenticate via the jitsi chat, that a player is linked to a participantId, so that one cannot impersonate another one.
        this.room.onMessage(MessageType.UPDATE_PARTICIPANT_ID, (client, message) => this.room.state.players[client.sessionId].participantId = message);
    }

    onJoin(client: Client) {
        this.room.state.players[client.sessionId] = new PlayerData();
        this.room.state.players[client.sessionId].name = "";
        this.room.state.players[client.sessionId].character = "Adam_48x48.png";
        this.room.state.players[client.sessionId].x = 0;
        this.room.state.players[client.sessionId].y = 0;
        this.room.state.players[client.sessionId].cooldown = 0;
        this.room.state.players[client.sessionId].participantId = null;
        this.room.broadcast("newPlayer", client); //Does this get used any where?
    }

    onLeave(client: Client, consented: boolean) {
        delete this.room.state.players[client.sessionId];
    }

    onDispose() {
        //Nothing?
    }

}

function onMove(room: Room<State>, client: Client, message: Direction) {
    if (room.state.players[client.sessionId].cooldown <= 0) {
        switch (message) {
            case Direction.DOWN: {
                room.state.players[client.sessionId].y++;
                break;
            }
            case Direction.UP: {
                room.state.players[client.sessionId].y--;
                break;
            }
            case Direction.LEFT: {
                room.state.players[client.sessionId].x--;
                break;
            }
            case Direction.RIGHT: {
                room.state.players[client.sessionId].x++;
                break;
            }
        }
    }
}
