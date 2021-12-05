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

export interface ChatDTO {
    id: string;
    name: string;
}

export class Chat {
    private readonly _id: string;
    private readonly _users: string[] = [];
    private readonly _messages: ChatMessage[] = [];
    private _name: string;

    constructor(name: string, id: string = generateUUIDv4()) {
        this._id = id;
        this._name = name;
    }

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get users(): string[] {
        return this._users;
    }

    get messages(): ChatMessage[] {
        return this._messages;
    }
}

export class ChatHandler implements Handler {
    room: Room<State>;
    readonly chats: Chat[] = [];

    globalChat: Chat;

    byChatId(chatId: string): Chat {
        return this.chats.find(chat => chat.id === chatId);
    }

    byUserId(userId: string): Chat[] {
        return this.chats.filter(chat => chat.users.includes(userId));
    }

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options?: any) {
        this.globalChat = new Chat("Global");
        this.chats.push(this.globalChat);
        this.room.onMessage(MessageType.CHAT_SEND, (client, message: ChatMessage) => this.onSend(client, message));
        this.room.onMessage(MessageType.CHAT_UPDATE, client => this.onChatUpdate(client));
        this.room.onMessage(MessageType.CHAT_LOG, (client, message: string) => this.onLog(client, message));
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
        const chatId: string = chatMessage.chatId || this.globalChat.id;
        console.log("chatId:", chatId);
        const chat: Chat = this.byChatId(chatId);
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
        chat.messages.forEach(chatMessage => console.log("chatMessage:", JSON.stringify(chatMessage)));
        if (chatId === this.globalChat.id) {
            this.room.clients.forEach(client => client.send(MessageType.CHAT_SEND, serverMessage));
        }
    }

    onLog(client: Client, chatId?: string) {
        if (chatId) {
            console.log("Request log for Chat:", chatId);
            const chat: Chat = this.byChatId(chatId);
            client.send(MessageType.CHAT_LOG, JSON.stringify(chat.messages));
        } else {
            const userId: string = this.room.state.players[client.sessionId].name;
            console.log("Request log for User:", userId);
            const chats: Chat[] = this.byUserId(userId);
            if (!chats.includes(this.globalChat)) {
                chats.push(this.globalChat);
            }
            client.send(MessageType.CHAT_LOG, JSON.stringify(chats.flatMap(chat => chat.messages)));
        }
    }

    onChatUpdate(client: Client) {
        const userId: string = this.room.state.players[client.sessionId].name;
        console.log("Request chat update for User:", userId);
        const chats: Chat[] = this.byUserId(userId);
        if (!chats.includes(this.globalChat)) {
            chats.push(this.globalChat);
        }
        const chatDTOs: ChatDTO[] = chats.map(chat => ({
            id: chat.id,
            name: chat.name,
        }));
        client.send(MessageType.CHAT_UPDATE, JSON.stringify(chatDTOs));
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
