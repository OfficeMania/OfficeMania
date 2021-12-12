import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {State, WhiteboardState} from "../rooms/schema/state";
import {MessageType} from "../util";
import {ArraySchema} from "@colyseus/schema";

let whiteboardCount = 300

export class WhiteboardHandler implements Handler {
    //TODO: refactor: do we need all the empty functions?
    
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
        //Nothing?
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
    //(new) code where multiple players should be able to draw at once
    //!!!!!!!!!!Fehlermeldung: Property 'color' does not exist on type 'WhiteboardPlayerState'.!!!!!!!!!!!!!!!!!
    /*room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].color = new ArraySchema<string>(); //not working! (???)
    room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths = new ArraySchema<number>();*/

    //more or less same (new) code without error (i'm not sure it works)
    /*for (const [, player] of room.state.whiteboard.at(wID).whiteboardPlayer) {
        player.color = new ArraySchema<string>();
        player.paths = new ArraySchema<number>();
    }*/

    //"same" (old) code where only one player can draw at a time
    room.state.whiteboard.at(wID).color = new ArraySchema<string>(); //not working! (???)
    room.state.whiteboard.at(wID).size = new ArraySchema<number>();
    room.state.whiteboard.at(wID).paths = new ArraySchema<number>();
}

function onClear(room: Room<State>, client: Client, wID: number) {
    //(new) code where multiple players should be able to draw at once (no error here)
    /*for (const [, player] of room.state.whiteboard.at(wID).whiteboardPlayer) {
        player.color = new ArraySchema<string>();
        player.color.push('black'); //first line is black
        player.paths = new ArraySchema<number>();
    }*/
    room.broadcast(MessageType.WHITEBOARD_CLEAR, wID, {except: client});

    //"same" (old) code where only one player can draw at a time
    room.state.whiteboard.at(wID).color = new ArraySchema<string>(); //not working! (???)
    room.state.whiteboard.at(wID).paths = new ArraySchema<number>();
    room.state.whiteboard.at(wID).size = new ArraySchema<number>();
}

function onSave(room: Room<State>, client: Client, wID: number) {
    //room.broadcast(MessageType.WHITEBOARD_SAVE, wID, {except: client});
    //nothing?
}

function onPath(room: Room<State>, client: Client, message: number[]) {           //message: [wID, color, x, y]
    var wID: number = message.shift();
    var color: number = message.shift(); //colors: 0=black, 1=white
    if (color === 1) {
        var colorStr: string = 'white';
    } else {
        var colorStr: string = 'black';
    }
    var size: number = message.shift();
    if (room.state.whiteboard.at(wID).color.length === 0) {
        room.state.whiteboard.at(wID).color.push(colorStr);
        room.state.whiteboard.at(wID).size.push(size);
    }
    if (message[0] < 0) {
        //(new) code where multiple players should be able to draw at once
        //!!!!!!!!!!Fehlermeldung: Property 'color' does not exist on type 'WhiteboardPlayerState'.!!!!!!!!!!!!!!!!!
        /*let length = room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.length;
        if (room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.at(length-2) > -1) { //only push -1 if last element is not already -1
            room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.push(-1); //-1 means end of line/beginning of new line
            if (color === 0 && message[0] === -1) {
                room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].color.push('black');
            } else if (color === 1 && message[0] === -1) {
                room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].color.push('white');
            }
        }
    } else {
        room.state.whiteboard.at(wID).whiteboardPlayer[client.sessionId].paths.push(...message);
    }*/

        //"same" (old) code where only one player can draw at a time
        let length = room.state.whiteboard.at(wID).paths.length;
        if (room.state.whiteboard.at(wID).paths.at(length-2) > -1) { //only push -1 if last element is not already -1
            room.state.whiteboard.at(wID).paths.push(-1); //-1 means end of line/beginning of new line
            if (message[0] === -1) {
            //if (color === 0 && message[0] === -1) {
                room.state.whiteboard.at(wID).color.push(colorStr);
                room.state.whiteboard.at(wID).size.push(size);
            /*} else if (color === 1 && message[0] === -1) {
                room.state.whiteboard.at(wID).color.push('white');
                room.state.whiteboard.at(wID).size.push(size);*/
            }
        }
    } else {
        room.state.whiteboard.at(wID).paths.push(...message);
    }
    room.broadcast(MessageType.WHITEBOARD_REDRAW, client, {except: client});
}

function onDraw(room: Room<State>, client: Client, wID: number) {
    //nothing?
}

function onErase(room: Room<State>, client: Client, wID: number) {
    //nothing?
}
