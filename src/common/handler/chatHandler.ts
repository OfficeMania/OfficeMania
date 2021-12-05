import { Client, Room } from "colyseus";
import { generateUUIDv4, MessageType } from "../util";
import { Handler } from "./handler";
import { State } from "../rooms/schema/state";

export interface ChatMessage {
    timestamp?: string;
    name?: string;
    chatId: string;
    message: string;
}

export class Chat {
    private readonly _id: string;
    private _users: string[];
    private readonly _messages: ChatMessage[] = [];

    constructor(id: string = generateUUIDv4()) {
        this._id = id;
    }

    get id(): string {
        return this._id;
    }

    get users(): string[] {
        return this._users;
    }

    set users(value: string[]) {
        this._users = value;
    }

    get messages(): ChatMessage[] {
        return this._messages;
    }
}

export class ChatHandler implements Handler {
    room: Room<State>;
    readonly chats: Chat[] = [];

    globalChat: Chat;

    byId(chatId: string): Chat {
        return this.chats.find(chat => chat.id === chatId);
    }

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options?: any) {
        this.globalChat = new Chat("");
        this.chats.push(this.globalChat);
        this.room.onMessage(MessageType.CHAT_SEND, (client, message) => this.onSend(client, message));
        this.room.onMessage(MessageType.CHAT_LOG, (client, message) => this.onLog(client, message));
    }

    onJoin() {}

    onLeave() {}

    onDispose() {}

    onSend(client: Client, chatMessage: ChatMessage) {
        const message: string = chatMessage.message;
        if (message.length > 1000) {
            //TODO
            return;
        }
        console.log("Message received:", message);
        const chatId: string = chatMessage.chatId;
        console.log("chatId:", chatId);
        const chat: Chat = this.byId(chatId);
        if (!chat) {
            //TODO
            return;
        }
        /*
        if (message === "gimmelog") {
            //client.send(MessageType.CHAT_LOG, this.room.state.chatStates);
            client.send(MessageType.CHAT_LOG, chat);
        }
        */
        const serverMessage: ChatMessage = makeMessage(this.room, client, chatMessage);
        chat.messages.push(serverMessage);
        chat.messages.forEach(e => console.log("content: " + e));
        if (chatId === "") {
            this.room.clients.forEach(client => client.send(MessageType.CHAT_NEW, serverMessage));
        }
    }

    onLog(client: Client, chatId?: string) {
        if (chatId) {
            client.send(JSON.stringify(this.byId(chatId))); //TODO Check this
        } else {
            //Send all chats as arrayschema
        }
    }
}

//message assembly for storage
function makeMessage(room: Room, client: Client, chatMessage: ChatMessage): ChatMessage {
    return {
        timestamp: new Date().toISOString(),
        name: room.state.players[client.sessionId].name,
        chatId: chatMessage.chatId,
        message: chatMessage.message,
    };
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
