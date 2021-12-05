import { MessageType } from "../common/util";
import { checkInputMode } from "./main";
import {
    textchatArea,
    textchatBar,
    textchatButton,
    textchatContainer,
    textchatCreateButton,
    textchatSelect,
    textchatSendButton,
} from "./static";
import { getOurPlayer, getRoom } from "./util";
import { Chat, ChatDTO, ChatMessage } from "../common/handler/chatHandler";

//tracks if button/shortcut have been pressed
let _showTextchat = false;

//tracks if client is using text area, for changing of inputmode
var _inFocus = false;

var _menuOpen = false;

var _clientLogs = new Map();

const chats: Chat[] = [];

function getChatById(chatId: string): Chat {
    return chats.find(chat => chat.id === chatId);
}

function getOrCreateChatById(chatId: string): Chat {
    let chat: Chat = getChatById(chatId);
    if (!chat) {
        chat = new Chat(undefined, chatId);
        chats.push(chat);
    }
    return chat;
}

function updateChat(chatDTO: ChatDTO): void {
    const chat: Chat = getChatById(chatDTO.id);
    if (!chat) {
        chats.push(new Chat(chat.name, chat.id));
        return;
    }
    chat.name = chatDTO.name;
}

//initializes all needed functions for the chat
export function initChatListener() {
    textchatButton.addEventListener("click", () => toggleTextchatBar());
    
    console.log("hello");
    
    updateChatUsers();
    //update textchatSelect on click
    textchatSelect.addEventListener("click", () => updateChatUsers());
    //changing of inputmode if text area is in use or not
    textchatArea.onfocus = function () {
        setInFocus(true);
    };
    textchatArea.onblur = function () {
        setInFocus(false);
    };

    textchatSendButton.addEventListener("click", () => {
        sendMessage(textchatArea.value, "global");
        textchatArea.value = "";
    });

    getRoom().onMessage(MessageType.CHAT_UPDATE, (message: string) => onChatUpdate(JSON.parse(message)));
    getRoom().onMessage(MessageType.CHAT_LOG, (message: string) => onMessageLogs(JSON.parse(message)));
    getRoom().send(MessageType.CHAT_UPDATE);
    getRoom().send(MessageType.CHAT_LOG);
    textchatCreateButton.addEventListener("click", () => {});

    /*//write chatlog in client
    let counter = 0;
    getRoom().state.chatState.contents.forEach((e) => {
        console.log("gogo " + counter)
        writeMessage(counter);
        counter++;
    });*/

    //primitive updating of the chat
    getRoom().onMessage(MessageType.CHAT_SEND, (message: ChatMessage) => {
        onMessage(message);

        //FOR LATER USE, WITH MULTIPLE GROUPS
        /**
         room.state.chatState.participants.forEach(participant => {
           if (participant === getOurPlayer().id) {
                let a = document.createElement("p");
                a.innerText = con.at(con.length-1);
                textchatBar.prepend(a);
            }
        });
         */
    });
}

function onChatUpdate(chatDTOs: ChatDTO[]): void {
    console.debug("chatDTOs:", chatDTOs);
    chatDTOs.forEach(updateChat);
}

function onMessageLogs(chatMessages: ChatMessage[]): void {
    console.debug("chatMessages:", chatMessages);
    chatMessages.forEach(onMessage);
}

//getter for _inFocus
export function getInFocus() {
    return _inFocus;
}

//write message from contents at position x, if not specified, last will be written
//will need to accept key/position of chatgroupstate
function onMessage(chatMessage: ChatMessage) {
    const chatId: string = chatMessage.chatId;
    const chat: Chat = getOrCreateChatById(chatId);
    chat.messages.push(chatMessage);
    //TODO Only add it if the Chat is selected?
    const messageLine = document.createElement("p");
    messageLine.innerText = `[${chatMessage.timestamp}] ${chatMessage.name}: ${chatMessage.message}`;
    textchatBar.prepend(messageLine);
}

function setInFocus(set) {
    _inFocus = set;
    checkInputMode();
}

//toggles chat visibility
function toggleTextchatBar() {
    if (getShowTextchatBar()) setShowTextchatBar(false);
    else setShowTextchatBar(true);
    checkInputMode();
}

//sends text message to server (if its not empty)
function sendMessage(message: string, chatId: string) {
    //console.log(message);
    if (message && message !== "") {
        getRoom().send(MessageType.CHAT_SEND, { message, chatId });
    }
}

//getter of _showTextchat
function getShowTextchatBar(): boolean {
    return _showTextchat;
}

//setter of _showTextchat
function setShowTextchatBar(set: boolean) {
    if (set) {
        textchatContainer.classList.add("hover");
    } else {
        textchatContainer.classList.remove("hover");
    }
    _showTextchat = set;
}

//update user list in select
function updateChatUsers() {
    while (textchatSelect.firstChild) {
        textchatSelect.firstChild.remove();
    }
    const option = document.createElement("option");
    option.innerText = "globul";
    option.value = "ungabunga";
    textchatSelect.append(option);
    getRoom().state.players.forEach((value, key) => {
        if (key === getOurPlayer().id) {
            return;
        }
        const option = document.createElement("option");
        option.innerText = getRoom().state.players[key].name;
        option.value = key;
        textchatSelect.append(option);
    });
}

function onStateChange() {}
