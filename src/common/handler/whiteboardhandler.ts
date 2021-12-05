import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {State, WhiteboardPlayerState, WhiteboardState} from "../rooms/schema/state";
import {MessageType} from "../util";
import {ArraySchema} from "@colyseus/schema";

let whiteboardCount = 300
//let indexOfStroke: number = 0;

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
    room.state.whiteboard.at(wID).color = new ArraySchema<string>();
    room.state.whiteboard.at(wID).paths = new ArraySchema<number>();
}

function onClear(room: Room<State>, client: Client, wID: number) {
    /*for (const [, player] of room.state.whiteboard.at(wID).whiteboardPlayer) {
        player.paths = new ArraySchema<number>();
    }*/
    room.state.whiteboard.at(wID).paths = new ArraySchema<number>();
    room.broadcast(MessageType.WHITEBOARD_CLEAR, wID, {except: client});
    room.state.whiteboard.at(wID).color = new ArraySchema<string>();
    room.state.whiteboard.at(wID).paths = new ArraySchema<number>();
}

function onSave(room: Room<State>, client: Client, wID: number) {
    /*for (const [, player] of room.state.whiteboard.at(wID).whiteboardPlayer) {
        player.paths = new ArraySchema<number>();
    }
    room.broadcast(MessageType.WHITEBOARD_SAVE, wID, {except: client});*/
    //nothing?
}

function onPath(room: Room<State>, client: Client, message: number[]) {           //message: [wID, color, x, y]
    var wID: number = message.shift();
    var color: number = message.shift(); //colors: 0=black, 1=white
    if (message[0] === -1) {
        room.state.whiteboard.at(wID).paths.push(-1);
        if (color === 0) {
            room.state.whiteboard.at(wID).color.push('black');
        } else {
            room.state.whiteboard.at(wID).color.push('white');
        }
        //indexOfStroke++; //unnecessary??
        //if (room.state.whiteboard.at(wID).color[room.state.whiteboard.at(wID).indexOfStroke] !== 'NULL') {
            //room.state.whiteboard.at(wID).indexOfStroke++;
        //}
    } else {
        room.state.whiteboard.at(wID).paths.push(...message);
    }
    room.broadcast(MessageType.WHITEBOARD_REDRAW, client, {except: client});
}

function onDraw(room: Room<State>, client: Client, wID: number) {
    //room.broadcast(MessageType.WHITEBOARD_REDRAW, wID, {except: client});
    //let indexOfStroke = room.state.whiteboard.at(wID).indexOfStroke;
    room.state.whiteboard.at(wID).color.push('black');
    //room.state.whiteboard.at(wID).color[indexOfStroke + 1] = 'NULL';
}

function onErase(room: Room<State>, client: Client, wID: number) {
    //room.broadcast(MessageType.WHITEBOARD_REDRAW, wID, {except: client});
    //let indexOfStroke = room.state.whiteboard.at(wID).indexOfStroke;
    room.state.whiteboard.at(wID).color.push('white');
    //room.state.whiteboard.at(wID).color[indexOfStroke + 1] = 'NULL';
}
