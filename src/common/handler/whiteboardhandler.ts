import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {State} from "../rooms/schema/state";
import {MessageType} from "../util";
import {ArraySchema} from "@colyseus/schema";

export class WhiteboardHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.WHITEBOARD_CLEAR, (client) => onClear(this.room, client));
        this.room.onMessage(MessageType.WHITEBOARD_PATH, (client, message) => onPath(this.room, client, message));
    }

    onJoin(client: Client) {
        //Nothing
    }

    onLeave(client: Client, consented: boolean) {
        //Nothing
    }

    onDispose() {
        //Nothing?
    }

}

function onClear(room: Room<State>, client: Client) {
    for (const [, player] of room.state.whiteboardPlayer) {
        player.paths = new ArraySchema<number>();
    }
    room.broadcast(MessageType.WHITEBOARD_CLEAR, null, {except: client});
}

function onPath(room: Room<State>, client: Client, message) {
    if (message === -1) {
        room.state.whiteboardPlayer[client.sessionId].paths.push(-1);
    } else {
        room.state.whiteboardPlayer[client.sessionId].paths.push(...message);
    }
    room.broadcast(MessageType.WHITEBOARD_REDRAW, client, {except: client});
}
