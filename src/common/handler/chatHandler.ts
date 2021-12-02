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
    m = room.state.players[client.sessionId].name;
    const date = new Date();

    m += ":" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "-";
    m += message;
    //console.log(m);
    return m;
}