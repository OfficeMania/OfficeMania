import { Client, Room } from "colyseus";
import { ChatState } from "../rooms/schema/state";
import { MessageType } from "../util";
import { Handler } from "./handler";

export class ChatHandler implements Handler {
    room: Room;
    init (room: Room) {
        this.room = room;
    }

    onCreate(options?: any) {
        this.room.state.chatState = new ChatState();        
        this.room.onMessage(MessageType.CHAT_SEND, (client: Client, message: string) => {onSend(this.room, client, message)});
    }

    onJoin() {

    }

    onLeave() {

    }

    onDispose() {

    }
}
function onSend(room: Room, client: Client, message: string) {
    console.log("Message recieved: " + message);
    if(message === "gimmelog") {
        client.send(MessageType.CHAT_LOG, room.state.chatState);
    }
    room.state.chatState.contents.push(makeMessage(room, client, message));

    /*room.state.chatState.contents.forEach(e => {
        console.log("content: "+e);
    });*/
    
    //VERY IMPORTANT
    room.state.chatState.change = !room.state.chatState.change;
    
}

//message assembly for storage
function makeMessage(room: Room, client: Client, message: string): string{
    let m: string = "";
    const date = new Date();
    m += addZero(date.getHours()) + ":" + addZero(date.getMinutes()) + ":" + room.state.players[client.sessionId].name + ": ";
    m += message;
    //console.log(m);
    return m;
}


function addZero(i) {
    if (i < 10) {i = "0" + i}
    return i;
}
  