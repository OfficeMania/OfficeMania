import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {State, WhiteboardPlayerState, WhiteboardState} from "../rooms/schema/state";
import {MessageType} from "../util";
import {ArraySchema} from "@colyseus/schema";

const whiteboardCount = 6

export class WhiteboardHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.WHITEBOARD_CLEAR, (client, message) => onClear(this.room, client, message));
        this.room.onMessage(MessageType.WHITEBOARD_PATH, (client, message) => onPath(this.room, client, message));
        for(var i = 0; i < whiteboardCount; i++){
            this.room.state.whiteboard.push(new WhiteboardState());
        }
    }

    onJoin(client: Client) {
        for(var i = 0; i < whiteboardCount; i++){
            this.room.state.whiteboard.at(i).whiteboardPlayer[client.sessionId] = new WhiteboardPlayerState();
        }
    }

    onLeave(client: Client, consented: boolean) {
        //Nothing
    }

    onDispose() {
        //Nothing?
    }

}

function onClear(room: Room<State>, client: Client, wID: number) {
    for (const [, player] of room.state.whiteboard.at(wID).whiteboardPlayer) {
        player.paths = new ArraySchema<number>();
    }
    room.broadcast(MessageType.WHITEBOARD_CLEAR, wID, {except: client});
}

function onPath(room: Room<State>, client: Client, message: number[]) {           //message: [wID, x, y]
    var wID: number = message.shift();
    if (message[0] === -1) {
        room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.push(-1);
    } else {
        room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.push(...message);
    }
    room.broadcast(MessageType.WHITEBOARD_REDRAW, client, {except: client});
}
