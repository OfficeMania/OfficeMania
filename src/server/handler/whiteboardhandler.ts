import { Handler } from "./handler";
import { Client, Room } from "colyseus";
import {
    MessageType,
    State,
    WhiteboardPathSegmentMessage,
    WhiteboardPlayerPathState,
    WhiteboardPlayerState,
    WhiteboardState,
} from "../../common";

let whiteboardCount = 300;
const colors: string[] = ["black", "white", "red", "magenta", "orange", "yellow", "green", "blue"];

export class WhiteboardHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.WHITEBOARD_CLEAR, (client, message) => onClear(this.room, client, message));
        this.room.onMessage(MessageType.WHITEBOARD_SAVE, (client, message) => onSave(this.room, client, message));
        this.room.onMessage(MessageType.WHITEBOARD_PATH, (client, message) => onPath(this.room, client, message));
        this.room.onMessage(MessageType.WHITEBOARD_CREATE, (client, message) => onNewWhiteboard(this.room, client, message));
        for (let i = 0; i < whiteboardCount; i++) {
            this.room.state.whiteboards.push(new WhiteboardState());
        }
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

function onNewWhiteboard(room: Room<State>, client: Client, whiteboardId: number) {
    if (whiteboardId > whiteboardCount) {
        room.state.whiteboards.push(new WhiteboardState());
        whiteboardCount++;
    }
    room.state.whiteboards.at(whiteboardId).whiteboardPlayers[client.sessionId] = new WhiteboardPlayerState();
}

function onClear(room: Room<State>, client: Client, whiteboardId: number) {
    const whiteboard: WhiteboardState | undefined = room.state.whiteboards.at(whiteboardId);
    if (!whiteboard) {
        return;
    }
    whiteboard.whiteboardPlayers.forEach(value => {
        value.paths.clear();
        value.currentPath = null;
    });
    setTimeout(() => room.broadcast(MessageType.WHITEBOARD_CLEAR, whiteboardId, { except: client }), 110);
}

function onSave(room: Room<State>, client: Client, whiteboardId: number) {
    //nothing?
}

function onPath(room: Room<State>, client: Client, message: WhiteboardPathSegmentMessage) {
    const whiteboardIndex: number = message.whiteboardId;
    const isEnd: boolean = message.isEnd;
    const points: number[] | undefined = message.points;
    const color: string | undefined = message.color;
    const size: number | undefined = message.size;
    const whiteboard: WhiteboardState = room.state.whiteboards.at(whiteboardIndex);
    const whiteboardPlayer: WhiteboardPlayerState = whiteboard.whiteboardPlayers[client.sessionId];
    const currentPath: WhiteboardPlayerPathState = !!whiteboardPlayer.currentPath ? whiteboardPlayer.currentPath : (whiteboardPlayer.currentPath = new WhiteboardPlayerPathState());
    if (points) {
        currentPath.points.push(...points);
    }
    if (color) {
        currentPath.color = color;
    }
    if (!!size) {
        currentPath.size = size;
    }
    if (isEnd) {
        whiteboardPlayer.paths.push(whiteboardPlayer.currentPath);
        whiteboardPlayer.currentPath = null;
    }
    setTimeout(() => room.broadcast(MessageType.WHITEBOARD_REDRAW, client, { except: client }), 110);
}
