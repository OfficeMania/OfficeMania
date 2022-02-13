import { Client, Room } from "colyseus";
import { Chat, ChatDTO, ChatMessage, MessageType, PlayerState, State } from "../../common";
import { Handler } from "./handler";

export class ChatHandler implements Handler {
    room: Room<State>;
    readonly chats: Chat[] = [];

    globalChat: Chat;

    nearbyChat: Chat;

    byChatId(chatId: string): Chat {
        return this.chats.find(chat => chat.id === chatId);
    }

    byUserId(userId: string): Chat[] {
        return this.chats.filter(chat => chat.users.includes(userId));
    }

    init(room: Room<State>) {
        this.room = room;
        this.globalChat = new Chat("Global");
        this.nearbyChat = new Chat("Nearby");
    }

    onCreate(options?: any) {
        this.chats.push(this.globalChat);
        this.chats.push(this.nearbyChat);
        this.room.onMessage(MessageType.CHAT_SEND, (client, message: ChatMessage) => this.onSend(client, message));
        this.room.onMessage(MessageType.CHAT_UPDATE, client => this.onChatUpdate(client));
        this.room.onMessage(MessageType.CHAT_LOG, (client, message: string) => this.onLog(client, message));
        this.room.onMessage(MessageType.CHAT_ADD, (client, message) => this.onChatAdd(client, message));
        this.room.onMessage(MessageType.CHAT_LEAVE, (client, message) => this.onChatLeave(client, message));
        this.room.onMessage(MessageType.CHAT_UPDATE_DISPLAY_NAME, (client: Client, message: string) =>
            this.onUpdateUsername(client, message),
        );
    }

    onJoin() {
    }

    onLeave(client: Client, consented: boolean) {
        const id: string = client.id;
        const formattedTime: string = getFormattedTime();
        this.chats.forEach(chat => {
            if (chat.id === this.globalChat.id || chat.id === this.nearbyChat.id) {
                return;
            }
            //this will not remove logged in people, as their colyseus id will not in in the users array
            this.onChatLeave(client, { message: "remove", chatId: chat.id });
        });
    }

    onDispose() {
    }

    onSend(client: Client, chatMessage: ChatMessage) {
        const message: string = chatMessage.message;
        if (message.length > 1000) {
            //TODO
            return;
        }
        
        if (message === "chats") {
            this.chats.forEach(chat => console.log(chat.id, chat.name, chat.users))
        }
        console.debug("Message received:", message);
        const messageIdArray: string[] = JSON.parse(chatMessage.chatId);
        console.debug("chatId:", messageIdArray);
        const chatIds: string[] = this.chats.map(chat => chat.id);
        if (chatIds.includes(messageIdArray[0])) {
            const chatId = messageIdArray[0];
            const userId: string = getUserId(client, this.room);
            const serverMessage: ChatMessage = makeMessage(this.room, client, { chatId: chatId, message: chatMessage.message, userId });

            const chat: Chat = this.byChatId(chatId);
            chat.messages.push(serverMessage);
            if (chatId === this.globalChat.id) {
                this.room.clients.forEach(client => client.send(MessageType.CHAT_SEND, serverMessage));
            } else {
                this.room.clients
                    .filter(client => chat.users.includes(getUserId(client, this.room)))
                    .forEach(client => client.send(MessageType.CHAT_SEND, serverMessage));
            }
        } else {
            const serverMessage: ChatMessage = makeMessage(this.room, client, {
                message: chatMessage.message,
                chatId: this.chats[1].id,
                userId: client.sessionId,
            });
            let users: string[] = messageIdArray;
            this.room.clients
                .filter(client => users.includes(getUserId(client, this.room)))
                .forEach(client => client.send(MessageType.CHAT_SEND, serverMessage));
        }
    }

    onLog(client: Client, chatId?: string) {
        //console.log("chatlog call ", client.id)
        if (chatId) {
            console.log("Request log for Chat:", chatId);
            const chat: Chat = this.byChatId(chatId);
            client.send(MessageType.CHAT_LOG, JSON.stringify(chat.messages));
        } else {
            const userId: string = getUserId(client, this.room);
            console.log("Request log for User:", userId);
            const chats: Chat[] = this.byUserId(userId);
            if (!chats.includes(this.globalChat)) {
                chats.unshift(this.nearbyChat);
                chats.unshift(this.globalChat);
            }
            client.send(MessageType.CHAT_LOG, JSON.stringify(chats.flatMap(chat => chat.messages)));
        }
    }

    onChatUpdate(client: Client) {
        const userId: string = getUserId(client, this.room);
        console.log("Request chat update for User:", userId);
        const userChats: Chat[] = this.byUserId(userId);
        //userChats.forEach(chat => console.log("chat: ", chat.id));
        const chatDTOs: ChatDTO[] = userChats.map(chat => ({
            id: chat.id,
            name: chat.name,
            users: chat.users.map(userId => getColyseusId(userId, this.room)),
        }));
        chatDTOs.unshift({ id: this.nearbyChat.id, name: this.nearbyChat.name });
        chatDTOs.unshift({ id: this.globalChat.id, name: this.globalChat.name });
        console.log("ChatDTOs: ", chatDTOs);
        client.send(MessageType.CHAT_UPDATE, JSON.stringify(chatDTOs));
    }

    sendChatMessage(chat: Chat, chatMessage: ChatMessage): void {
        chat.messages.push(chatMessage);
        this.room.clients
            .filter(client => chat.users.includes(getUserId(client, this.room)))
            .forEach(client => client.send(MessageType.CHAT_SEND, chatMessage));
    }

    triggerChatUpdate(chat: Chat): void {
        this.room.clients
            .filter(client => chat.users.includes(getUserId(client, this.room)))
            .forEach(client => this.onChatUpdate(client));
    }

    onChatLeave(client: Client, chatMessage: ChatMessage) {
        //console.log(`client ${client.id} leavin chat ${chatMessage.chatId}`);
        const chatId: string = chatMessage.chatId;
        const userId: string = getUserId(client, this.room);
        const chat: Chat = this.byChatId(chatId);
        if (!chat) {
            // Chat no longer exists
            return;
        }
        console.debug(`User ${userId} left Chat ${chatId}.`);
        const userIndex: number = chat.users.indexOf(userId);
        if (userIndex < 0) {
            // Client is not part of Chat
            console.debug(`User ${userId} already left Chat ${chatId}.`);
            return;
        }
        chat.users.splice(userIndex, 1);
        updateChatName(chat, this.room);
        const name: string = this.room.state.players[client.sessionId]?.displayName || client.sessionId;
        const leaveMessage: ChatMessage = {
            timestamp: getFormattedTime(),
            chatId,
            message: `User "${name}" left the Chat.`,
            name: "Server",
        }
        if (!this.room.state.players.has(client.sessionId)) {
            leaveMessage.message = `User "${name}" was removed from the Chat.`
        }
        
        this.sendChatMessage(chat, leaveMessage);

        this.triggerChatUpdate(chat);

        this.onChatUpdate(client);
        // Check if chat has any participants left
        if (chat.users.length === 0) {
            const chatIndex: number = this.chats.indexOf(chat);
            if (chatIndex < 0) {
                // Chat no longer exists
                return;
            }
            this.chats.splice(chatIndex, 1);
            console.debug(`Removed empty chat ${chatId}`);
        }
    }

    onChatAdd(client: Client, chatMessage: ChatMessage) {
        if (!chatMessage.message || chatMessage.message === "") {
            return;
        }
        const ids: string[] = chatMessage.message.split(",");

        let ourPlayer: { data: PlayerState; id: string };
        const otherPlayers: { data: PlayerState; id: string }[] = [];

        //fill our and other players with valid data
        this.room.state.players.forEach((player, key) => {
            if (key === getColyseusId(getUserId(client, this.room), this.room)) {
                ourPlayer = { data: player, id: key };
            } else if (ids.includes(key)) {
                otherPlayers.push({ data: player, id: key });
            }
        });
        //console.log(otherPlayers, ourPlayer);

        if (chatMessage.chatId === "new") {
            //add new chat
            console.log("Create new chat:", ourPlayer.id);

            // create new chat between client and playerid
            const newChat: Chat = new Chat("");
            if (ourPlayer.data.userId && ourPlayer.data.userId !== "undefined") {
                newChat.users.push(ourPlayer.data.userId);
            }
            else {
                newChat.users.push(ourPlayer.id);
            }
            otherPlayers.forEach(p => {
                if (p.data.userId && p.data.userId !== "undefined") {
                    newChat.users.push(p.data.userId);
                }
                else {
                    newChat.users.push(p.id);
                }
            });
            updateChatName(newChat, this.room);
            this.chats.push(newChat);


            getClientsByUserId(ourPlayer.id, this.room).forEach(client => {
                this.onChatUpdate(client);
            });

            otherPlayers.forEach(p => {
                if (p.data.userId && p.data.userId !== "undefined") {
                    getClientsByUserId(p.data.userId, this.room).forEach(client => {
                        this.onChatUpdate(client);
                    });
                }
                else {
                    getClientsByUserId(p.id, this.room).forEach(client => {
                        this.onChatUpdate(client);
                    })
                }
            });
            
            const message = "Created chat";
            const serverMessage: ChatMessage = {
                timestamp: getFormattedTime(),
                name: "Server",
                chatId: newChat.id,
                message: `User "${ourPlayer.data.displayName}" created a new Chat.`,
                userId: "",
            };
            newChat.messages.push(serverMessage);
            
            this.room.clients
                    .filter(client => newChat.users.includes(getUserId(client, this.room)))
                    .forEach(client => client.send(MessageType.CHAT_SEND, serverMessage));
            
        } else {
            //add to existing
            if (chatMessage.chatId === this.globalChat.id || chatMessage.chatId === this.nearbyChat.id) {
                console.log("Trying to add a player to Global or Nearby Chat.");
                return;
            } else {
                const chat: Chat = this.byChatId(chatMessage.chatId);
                otherPlayers.forEach(otherPlayer => {
                    if (!(chat.users.includes(otherPlayer.id) || chat.users.includes(otherPlayer.data.userId))) {
                        if (otherPlayer.data.userId && otherPlayer.data.userId !== "undefined") {
                            chat.users.push(otherPlayer.data.userId);
                            console.log(`Adding userid "${otherPlayer.data.userId}" to chat ${chat.id}.`)
                        }
                        else {
                            chat.users.push(otherPlayer.id);
                            console.log(`Adding sessionid "${otherPlayer.id}" to chat ${chat.id}.`)
                        }


                        //change the name of the chat
                        updateChatName(chat, this.room);

                        //update all clients
                        this.room.clients
                            .filter(client => chat.users.includes(getUserId(client, this.room)))
                            .forEach(client => {
                                this.onChatUpdate(client);
                                this.onLog(client, chat.id);
                            });
                        
                        
                    } else {
                        console.log(`User ${otherPlayer.id} already in chat ${chat.id}`);
                    }
                });
                //make a message
                let message = `User "${ourPlayer.data.displayName}" added `;
                for (let i = 0; i < otherPlayers.length; i++) {
                    message += `"${otherPlayers[i].data.displayName}"`;
                    if (i === otherPlayers.length - 2) {
                        message += ` and `;
                    } else if (i === otherPlayers.length - 1) {} 
                    else {
                        message += `, `
                    }
                }
                message += ` to Chat.`;
                
                const serverMessage: ChatMessage = {
                    timestamp: getFormattedTime(),
                    name: "Server",
                    chatId: chat.id,
                    message,
                    userId: "",
                };
                chat.messages.push(serverMessage);
                this.room.clients
                    .filter(client => chat.users.includes(getUserId(client, this.room)))
                    .forEach(client => client.send(MessageType.CHAT_SEND, serverMessage));
            }
        }
    }

    onUpdateUsername(client: Client, name: string) {
        //console.log("updatreusernamecall", client.sessionId, name);
        this.chats.forEach(chat => {
            if (chat.users.includes(getUserId(client, this.room)) && chat.id !== this.globalChat.id && chat.id !== this.nearbyChat.id) {
                updateChatName(chat, this.room);
                let displayName: string;
                this.room.state.players.forEach((p, k) => {if(k === client.sessionId) {displayName = p.displayName;}});
                const serverMessage: ChatMessage =  {
                    timestamp: getFormattedTime(),
                    name,
                    chatId: chat.id,
                    message: `User "${name}" changed names to "${displayName}"`,
                }
                chat.messages.push(serverMessage);
                this.room.clients
                    .filter(client => chat.users.includes(getUserId(client, this.room)))
                    .forEach(client => {
                        client.send(MessageType.CHAT_SEND, serverMessage);
                    });
            }
        });
    }
}

function getUserId(client: Client, room: Room<State>): string {
    let id: string = client.sessionId; 
    room.state.players.forEach((p,k) => {
        if (k === client.sessionId) {
            if (p.userId !== "undefined") {
                id = p.userId;
            }
        }
    });
    return id;
}

function getColyseusId(id: string, room: Room<State>) {
    let temp: string = id;
    room.state.players.forEach((p,k) => {
        if (p.userId === id) {
            temp = k;
        }
    });
    return temp;
}

//message assembly for storage
function makeMessage(room: Room, client: Client, chatMessage: ChatMessage): ChatMessage {
    return {
        timestamp: getFormattedTime(),
        name: room.state.players[client.sessionId].displayName,
        chatId: chatMessage.chatId,
        message: chatMessage.message,
        userId: chatMessage.userId,
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
function getClientsByUserId(userId: string, room: Room<State>): Client[] {
    const cl: Client[] = [];
    room.clients.forEach((client: Client) => {
        room.state.players.forEach((p,playerKey) => {
            if (playerKey === client.sessionId && (p.userId === userId || playerKey === userId)) {
                cl.push(client);
            }
        })
    })
    return cl;
}

function updateChatName(chat: Chat, room: Room) {
    chat.name = chat.users.filter(user => !!room.state.players.get(getColyseusId(user, room))).map(user => room.state.players.get(getColyseusId(user, room)).displayName).join(", ");
}
