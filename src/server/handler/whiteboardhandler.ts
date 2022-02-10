import { Handler } from "./handler";
import { Client, Room } from "colyseus";
import { MessageType, State, WhiteboardPlayerState, WhiteboardState } from "../../common";
import { ArraySchema } from "@colyseus/schema";

let whiteboardCount = 300
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
        this.room.onMessage(MessageType.WHITEBOARD_DRAW, (client, message) => onDraw(this.room, client, message));
        this.room.onMessage(MessageType.WHITEBOARD_ERASE, (client, message) => onErase(this.room, client, message));
        for(var i = 0; i < whiteboardCount; i++){
            this.room.state.whiteboard.push(new WhiteboardState());
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

function onNewWhiteboard(room: Room<State>, client: Client, wID: number){
    if(wID > whiteboardCount){
        room.state.whiteboard.push(new WhiteboardState());
        whiteboardCount++;
    }
    room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId] = new WhiteboardPlayerState();
}

function onClear(room: Room<State>, client: Client, wID: number) {
    for (const [, player] of room.state.whiteboard.at(wID).whiteboardPlayer) {
        player.paths = new ArraySchema<number>();
        player.sizes = new ArraySchema<number>();
        player.color = new ArraySchema<string>();
    }
    room.broadcast(MessageType.WHITEBOARD_CLEAR, wID, {except: client});
}

function onSave(room:Room<State>, client: Client, wID: number) {
    //nothing?
}

function onDraw(room:Room<State>, client: Client, wID: number) {
    //nothing?
}

function onErase(room:Room<State>, client: Client, wID: number) {
    //nothing?
}

function onPath(room: Room<State>, client: Client, message: number[]) {           //message: [wID, color, size, x, y]
    var wID: number = message.shift();
    var color: number = message.shift();
    var colorStr: string = colors[color];
    var size: number = message.shift();
    if (message[0] < 0) {
        let length = room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.length;
        if (room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.at(length-2) > -1) { // only push -1 if last element is not already -1
            room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.push(-1); //-1 means end of line/beginning of new line
        }
        if (message[0] === -1) {
            room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].color.push(colorStr);
            room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].sizes.push(size);
        }
    } else {
        room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.push(...message);
    }
    room.broadcast(MessageType.WHITEBOARD_REDRAW, client, {except: client});
}
