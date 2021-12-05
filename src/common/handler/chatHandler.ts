import { Client, Room } from "colyseus";
import { ArraySchema, Schema, type } from "@colyseus/schema";
import { MessageType } from "../util";
import { Handler } from "./handler";
import { State } from "../rooms/schema/state";

export interface ChatMessage {
    pos: number;
    message: string;
}

//Schema for sending to client
export class ChatState extends Schema {
    //for later modularity
    @type({ array: "string" })
    participants: ArraySchema<string> = new ArraySchema<string>();

    @type({ array: "string" })
    contents: ArraySchema<string> = new ArraySchema<string>();

    //position in array (reference for client)
    @type("number")
    pos: number;
}

export class ChatHandler implements Handler {
    room: Room<State>;
    globalChat: ChatState;

    private chats(): ArraySchema<ChatState> {
        return this.room.state.chatStates;
    }

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options?: any) {
        this.globalChat = new ChatState();
        this.chats().push(this.globalChat);
        this.room.onMessage(MessageType.CHAT_SEND, (client, message) => this.onSend(client, message));
        this.room.onMessage(MessageType.CHAT_LOG, (client, message) => this.onLog(client, message));
    }

    onJoin() {}

    onLeave() {}

    onDispose() {}

    onSend(client: Client, chatMessage: ChatMessage) {
        const message: string = chatMessage.message;
        console.log("Message recieved: " + message);
        if (message === "gimmelog") {
            //client.send(MessageType.CHAT_LOG, this.room.state.chatStates);
        }
        const pos: number = chatMessage.pos;
        console.log(pos);
        if (!this.chats().at(pos)) {
            //TODO
            return;
        }
        let newMessage = makeMessage(this.room, client, message.substr(1));
        this.chats().at(pos).contents.push(newMessage);

        this.chats()
            .at(pos)
            .contents.forEach(e => {
                console.log("content: " + e);
            });
        if (pos === 0) {
            this.room.clients.forEach(client => {
                client.send(MessageType.CHAT_NEW, pos + newMessage);
            });
        }
    }

    onLog(client: Client, position?: number) {
        if (position) {
            client.send(this.chats()[position]);
        } else {
            //Send all chats as arrayschema
        }
    }
}

//message assembly for storage
function makeMessage(room: Room, client: Client, message: string): string {
    let m: string = "";
    const date = new Date();
    m +=
        addZero(date.getHours()) +
        ":" +
        addZero(date.getMinutes()) +
        ":" +
        room.state.players[client.sessionId].name +
        ": ";
    m += message;
    //console.log(m);
    return m;
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
