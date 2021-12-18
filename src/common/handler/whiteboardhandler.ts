import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {State, WhiteboardState} from "../rooms/schema/state";
import {MessageType} from "../util";
import {ArraySchema} from "@colyseus/schema";

let whiteboardCount = 300
let clientIDs = new Map<string, number>(); //ids of clients as 0,1,2,3,4,5,6,7,8,...
let freeIDs: number[] = [0];
let highestID: number = 0;

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
        //=============================new Code=================================
        let id = 0;
        if (freeIDs.length === 0) {
            highestID++;
            id = highestID;
        } else {
            id = freeIDs.pop();
        }
        clientIDs.set(client.sessionId, id);
        for (var wID=0; wID < this.room.state.whiteboard.length; wID++) { //save in state.ts
            //this.room.state.whiteboard.at(wID).clientIDs.set(client.sessionId, id);
            this.room.state.whiteboard.at(wID).numberOfClients = highestID+1;
        }
        //destroys everything...! :(
        /*if (id === this.room.state.whiteboard.at(wID).playerColors.length) { //no color array for this player exists yet
            let newStringArray = new ArraySchema<string>();
            let newNumberArray = new ArraySchema<number>();
            this.room.state.whiteboard.at(wID).playerColors.push(newStringArray);
            this.room.state.whiteboard.at(wID).playerSizes.push(newNumberArray);
            this.room.state.whiteboard.at(wID).playerPaths.push(newNumberArray);
        }*/
    }

    onLeave(client: Client, consented: boolean) {
        //===========================new Code===========================================
        let id = clientIDs.get(client.sessionId)
        for (var wID=0; wID < this.room.state.whiteboard.length; wID++) {
            this.room.state.whiteboard.at(wID).playerColors[id] = new ArraySchema<string>();
            this.room.state.whiteboard.at(wID).playerPaths[id] = new ArraySchema<number>();
            this.room.state.whiteboard.at(wID).playerSizes[id] = new ArraySchema<number>();
            //this.room.state.whiteboard.at(wID).clientIDs.delete(client.sessionId);
        }
        clientIDs.delete(client.sessionId);
        freeIDs.push(id);
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

    //=======================================old=====================================================
    //"same" (old) code where only one player can draw at a time
    room.state.whiteboard.at(wID).color = new ArraySchema<string>();
    room.state.whiteboard.at(wID).size = new ArraySchema<number>();
    room.state.whiteboard.at(wID).paths = new ArraySchema<number>();

    //======================================new Code=================================================
    //var clientID = clientIDs.get(client.sessionId);
    //room.state.whiteboard.at(wID).playerColors[clientID] = new ArraySchema<string>();
    //room.state.whiteboard.at(wID).playerPaths[clientID] = new ArraySchema<number>();
    //room.state.whiteboard.at(wID).playerSizes[clientID] = new ArraySchema<number>();
}

function onClear(room: Room<State>, client: Client, wID: number) {
    //(new) code where multiple players should be able to draw at once (no error here)
    /*for (const [, player] of room.state.whiteboard.at(wID).whiteboardPlayer) {
        player.color = new ArraySchema<string>();
        player.color.push('black'); //first line is black
        player.paths = new ArraySchema<number>();
    }*/
    room.broadcast(MessageType.WHITEBOARD_CLEAR, wID, {except: client});

    //=========================================old===================================================
    //"same" (old) code where only one player can draw at a time
    room.state.whiteboard.at(wID).color = new ArraySchema<string>();
    room.state.whiteboard.at(wID).paths = new ArraySchema<number>();
    room.state.whiteboard.at(wID).size = new ArraySchema<number>();

    //======================================new Code=================================================
    //var clientID = clientIDs.get(client.sessionId);
    //room.state.whiteboard.at(wID).playerColors[clientID] = new ArraySchema<string>();
    //room.state.whiteboard.at(wID).playerPaths[clientID] = new ArraySchema<number>();
    //room.state.whiteboard.at(wID).playerSizes[clientID] = new ArraySchema<number>();
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
    } else { //if color === 0
        var colorStr: string = 'black';
    }
    var size: number = message.shift();
    //==============================================old=====================================
    if (room.state.whiteboard.at(wID).color.length === 0) { //add setting of first stroke to color and size variable
        room.state.whiteboard.at(wID).color.push(colorStr);
        room.state.whiteboard.at(wID).size.push(size);
    }
    //==================================new Code===========================================
    //var clientID = clientIDs.get(client.sessionId);
    //if (room.state.whiteboard.at(wID).playerColors[clientID].length === 0) {
    //    room.state.whiteboard.at(wID).playerColors[clientID].push(colorStr);
    //    room.state.whiteboard.at(wID).playerSizes[clientID].push(size);
    //}
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
        //===========================================old===========================================
        let length = room.state.whiteboard.at(wID).paths.length;
        if (room.state.whiteboard.at(wID).paths.at(length-2) > -1) { //only push -1 if last element is not already -1
            room.state.whiteboard.at(wID).paths.push(-1); //-1 means end of line/beginning of new line
            if (message[0] === -1) {
                room.state.whiteboard.at(wID).color.push(colorStr);
                room.state.whiteboard.at(wID).size.push(size);
            }
        }
        //==============================new Code============================================
        //let length = room.state.whiteboard.at(wID).playerPaths[clientID].length;
        //if (room.state.whiteboard.at(wID).playerPaths[clientID].at(length-2) > -1) { //only push -1 if last element is not already -1
        //    room.state.whiteboard.at(wID).playerPaths[clientID].push(-1); //-1 means end of line/beginning of new line
        //    if (message[0] === -1) {
        //        room.state.whiteboard.at(wID).playerColors[clientID].push(colorStr);
        //        room.state.whiteboard.at(wID).playerSizes[clientID].push(size);
        //    }
        //}
    } else {
        //====================================old============================
        room.state.whiteboard.at(wID).paths.push(...message);
        //==========================================new Code==========================
        //room.state.whiteboard.at(wID).playerPaths[clientID].push(...message);
    }
    room.broadcast(MessageType.WHITEBOARD_REDRAW, client, {except: client});
}

function onDraw(room: Room<State>, client: Client, wID: number) {
    //nothing?
}

function onErase(room: Room<State>, client: Client, wID: number) {
    //nothing?
}
