import { Client, Room } from "colyseus";
import { generateUUIDv4, MessageType } from "../util";
import { Handler } from "./handler";
import { PlayerData, State } from "../rooms/schema/state";

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
        this.globalChat = new Chat("Global");
    }

    onCreate(options?: any) {
        this.chats.push(this.globalChat);
        this.room.onMessage(MessageType.CHAT_SEND, (client, message: ChatMessage) => this.onSend(client, message));
        this.room.onMessage(MessageType.CHAT_UPDATE, client => this.onChatUpdate(client));
        this.room.onMessage(MessageType.CHAT_LOG, (client, message: string) => this.onLog(client, message));
        this.room.onMessage(MessageType.CHAT_ADD, (client, message) => this.onAdd(client, message));
        this.room.onMessage(MessageType.CHAT_UPD_DISPLAYNAME, (client: Client, message: string) => this.onUpdateUsername(client, message))
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
        console.debug("Message received:", message);
        const chatId: string = chatMessage.chatId || this.globalChat.id;
        console.debug("chatId:", chatId);
        const chat: Chat = this.byChatId(chatId);

        const userId: string = getUserId(client);
        if (!chat.users.includes(userId)) {
            chat.users.push(userId);
        }
        const serverMessage: ChatMessage = makeMessage(this.room, client, chatMessage);
        chat.messages.push(serverMessage);
        //chat.messages.forEach(chatMessage => console.log("chatMessage:", JSON.stringify(chatMessage)));
        if (chatId === this.globalChat.id) {
            this.room.clients.forEach(client => client.send(MessageType.CHAT_SEND, serverMessage));
        } else {
            this.room.clients
                .filter(client => chat.users.includes(getUserId(client)))
                .forEach(client => client.send(MessageType.CHAT_SEND, serverMessage));
        }
    }

    onLog(client: Client, chatId?: string) {
        if (chatId) {
            console.log("Request log for Chat:", chatId);
            const chat: Chat = this.byChatId(chatId);
            client.send(MessageType.CHAT_LOG, JSON.stringify(chat.messages));
        } else {
            const userId: string = getUserId(client);
            console.log("Request log for User:", userId);
            const chats: Chat[] = this.byUserId(userId);
            if (!chats.includes(this.globalChat)) {
                chats.unshift(this.globalChat);
            }
            client.send(MessageType.CHAT_LOG, JSON.stringify(chats.flatMap(chat => chat.messages)));
        }
    }

    onChatUpdate(client: Client) {
        const userId: string = getUserId(client);
        console.log("Request chat update for User:", userId);
        const chats: Chat[] = this.byUserId(userId);
        chats.unshift(this.globalChat);
        const chatDTOs: ChatDTO[] = chats.map(chat => ({
            id: chat.id,
            name: chat.name,
        }));
        client.send(MessageType.CHAT_UPDATE, JSON.stringify(chatDTOs));
    }

    onAdd(client: Client, chatMessage: ChatMessage) {
        console.log(chatMessage, client.id);
        if (!chatMessage.message ||chatMessage.message ==="") {
            return;
        }
        let ids: string[] = chatMessage.message.split(",");
        console.log(ids);

        let ourPlayer: { data: PlayerData, id: string }; 
        let otherPlayers: { data: PlayerData, id: string }[] = [];

        //fill our and other players with valid data
        this.room.state.players.forEach((player, key) => {
            if (key === getUserId(client)) {
                ourPlayer = { data: player, id: key };
            }
            else if (ids.includes(key)) {
                otherPlayers.push({ data: player, id: key })
            }
        });
        console.log(otherPlayers, ourPlayer)

        if (chatMessage.chatId === "new") {
            //add new chat
            console.log("Create new chat:", ourPlayer.id);
            otherPlayers.forEach(p => {console.log(p.id)})
            
            // create new chat between client and playerid
            let newChat: Chat = new Chat("");

            newChat.users.push(ourPlayer.id);
            otherPlayers.forEach(p => newChat.users.push(p.id));
            updateChatName(newChat, this.room);
            this.chats.push(newChat);

            getClientsByUserId(ourPlayer.id, this.room).forEach((client) => {
                this.onChatUpdate(client);
            });
            //this.onChatUpdate();
            otherPlayers.forEach(p => {
                getClientsByUserId(p.id, this.room).forEach((client) => {
                    this.onChatUpdate(client);
                });
            })
            
        }
        else if (chatMessage.message === "remove") {
            //remove client from chat
        }
        else {
            //add to existing
            if (chatMessage.chatId === this.globalChat.id) {
                console.log("is globul")
                return;
            }
            else {
                let chat = this.byChatId(chatMessage.chatId);
                otherPlayers.forEach(otherPlayer => {
                    if (!chat.users.includes(otherPlayer.id)) {

                        chat.users.push(otherPlayer.id);

                        //make a message
                        const message = "Add new User to this Chat: " + otherPlayer.data.displayName;
                        const chatId = chatMessage.chatId;
                        chat.messages.push(makeMessage(this.room, client, { message, chatId }));

                        //change the name of the chat
                        updateChatName(chat, this.room);

                        //update all clients
                        this.room.clients
                            .filter(client => chat.users.includes(getUserId(client)))
                            .forEach(client => {
                                this.onChatUpdate(client);
                                client.send(MessageType.CHAT_SEND,{ message, chatId });
                            });
                    }
                    else {
                        console.log("user " + otherPlayer.id + " already in chat " + chat.id);
                    }
                });
            }
        }

        
        /*
        let ourPlayerKey: string = getUserId(client);
        let ourPlayer: PlayerData;
        let otherPlayerKey: string = chatMessage.message;
        let otherPlayer: PlayerData;
        this.room.state.players.forEach((value, key) => {
            if (key === ourPlayerKey) {
                ourPlayer = value;
            }
            else if(key === otherPlayerKey) {
                otherPlayer = value;
            }
        });
        //impossible action filtering
        if (chatMessage.message === "remove"  && (chatMessage.chatId === this.globalChat.id || chatMessage.chatId === "new")){
            //console.log("nah bruv");
            return;
        }

        //removal of user from a chat
        else if(chatMessage.message === "remove") {
            //console.log("removing");
            let chat: Chat = this.byChatId(chatMessage.chatId);
            chat.users.splice(chat.users.indexOf(ourPlayerKey), 1);
            chat.name = "";
            chat.users.forEach((user) => {
                chat.name += this.room.state.players.get(user).displayName;
            });
            const message = "User left the Chat: " + ourPlayer.displayName;
            const chatId = chatMessage.chatId;
            chat.messages.push(makeMessage(this.room, client, { message, chatId }));
            //check if chat has any participants left
            if(chat.users.length === 0) {
                this.chats.splice(this.chats.indexOf(chat), 1);
                //console.log(this.chats);
            }
            this.room.clients
            .filter(client => chat.users.includes(getUserId(client)))
            .forEach(client => {
                client.send(MessageType.CHAT_SEND,{ message, chatId });
            });
            this.onChatUpdate(client);

        }

        //create a new chat
        else if (chatMessage.chatId === "new") {
            console.log("Create new chat:", ourPlayerKey, otherPlayerKey);
            // create new chat between client and playerid
            let newChat: Chat = new Chat("");

            newChat.users.push(ourPlayerKey, otherPlayerKey);
            newChat.users.forEach((user) => {
                newChat.name += this.room.state.players.get(user).displayName;
            });
            this.chats.push(newChat);

            getClientsByUserId(ourPlayerKey, this.room).forEach((client) => {
                this.onChatUpdate(client);
            });
            //this.onChatUpdate();
            getClientsByUserId(otherPlayerKey, this.room).forEach((client) => {
                this.onChatUpdate(client);
            });
        }

        //add user to chat
        else {
            //check if other user is not in chat already
            if (chatMessage.chatId != this.globalChat.id && !this.byUserId(otherPlayerKey).includes(this.byChatId(chatMessage.chatId)) ) {

                let chat = this.byChatId(chatMessage.chatId)
                chat.users.push(otherPlayerKey);
                chat.name = chat.name + otherPlayer.displayName;
                const message = "Add new User to this Chat: " + otherPlayer.displayName;
                const chatId = chatMessage.chatId;
                chat.messages.push(makeMessage(this.room, client, { message, chatId }));
                this.room.clients
                .filter(client => chat.users.includes(getUserId(client)))
                .forEach(client => {
                    this.onChatUpdate(client);
                    client.send(MessageType.CHAT_SEND,{ message, chatId });
                });
            }
        }
        */
    }
    onUpdateUsername(client: Client, name: string) {
        console.log("hello there name has changed", client.sessionId, name);
        this.chats.forEach(chat => {
            if (chat.users.includes(getUserId(client))) {
                updateChatName(chat, this.room);
                this.room.clients.filter(client => chat.users.includes(getUserId(client))).forEach(client => {
                    this.onChatUpdate(client);
                })
            }
        });
    }
}

function getUserId(client: Client): string {
    return client.sessionId;
}

//message assembly for storage
function makeMessage(room: Room, client: Client, chatMessage: ChatMessage): ChatMessage {
    return {
        timestamp: getFormattedTime(),
        name: room.state.players[client.sessionId].displayName,
        chatId: chatMessage.chatId,
        message: chatMessage.message,
    };
}

//format current Time, prone to change
function getFormattedTime() {
    const date = new Date();
    const temp = addZero(date.getHours()) + ":" + addZero(date.getMinutes()) + ":" + addZero(date.getSeconds());
    return temp;
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

//get all the clients (different pcs f.e.) that are connected to userId
function getClientsByUserId(userId: string, room: Room): Client[] {
    let clients: Client[] = [];
    room.clients.forEach((client) => {
        if (client.sessionId === userId) {
            clients.push(client);
        }
    });
    return clients;
}
function updateChatName(chat: Chat, room: Room) {
    chat.name = "";
    chat.users.forEach((user) => {
        if ( chat.name === "") {
            chat.name = room.state.players.get(user).displayName;
        }
        else {
            chat.name += ", " + room.state.players.get(user).displayName;
        }
    });
}
