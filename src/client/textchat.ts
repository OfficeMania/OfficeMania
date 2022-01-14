import { MessageType } from "../common/util";
import { checkInputMode } from "./main";
import {
    textchatArea,
    textchatBar,
    textchatButton,
    textchatContainer,
    textchatUsers,
    textchatSelect,
    textchatSendButton,
} from "./static";
import { getOurPlayer, getRoom } from "./util";
import { Chat, ChatDTO, ChatMessage } from "../common/handler/chatHandler";
import { PlayerData } from "../common/rooms/schema/state";

//tracks if button/shortcut have been pressed
let _showTextchat = false;

//tracks if client is using text area, for changing of inputmode
var _inFocus = false;

var _addToChat = false;

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
        chats.push(new Chat(chatDTO.name, chatDTO.id));
        return;
    }
    if (chat.name !== chatDTO.name) {
        chat.name = chatDTO.name;
    }
    else {
        console.log("Name was equal");
    }
}

//initializes all needed functions for the chat
export function initChatListener() {
    textchatButton.addEventListener("click", () => toggleTextchatBar());

    console.log("hello");

    updateParticipatingChats();
    openChatUsers();
    //update textchatSelect on click, but not selected element??
    textchatSelect.addEventListener("click", () => {
    });
    //changing of inputmode if text area is in use or not
    textchatArea.onfocus = function () {
        setInFocus(true);
    };
    textchatArea.onblur = function () {
        setInFocus(false);
    };
    textchatArea.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            textchatSendButton.click();
        }
    });

    textchatSendButton.addEventListener("click", () => {
        sendMessage(textchatArea.value, textchatSelect.selectedOptions[0].value);
        console.log(textchatSelect.selectedOptions[0].innerText)
        textchatArea.value = "";
    });


    getRoom().onMessage(MessageType.CHAT_UPDATE, (message: string) => onChatUpdate(JSON.parse(message)));
    getRoom().onMessage(MessageType.CHAT_LOG, (message: string) => onMessageLogs(JSON.parse(message)));
    getRoom().send(MessageType.CHAT_UPDATE);
    getRoom().send(MessageType.CHAT_LOG);

    textchatUsers.addEventListener("click", () => openChatUsers());



    //primitive updating of the chat
    getRoom().onMessage(MessageType.CHAT_SEND, (message: ChatMessage) => {
        onMessage(message);
    });
}

function onChatUpdate(chatDTOs: ChatDTO[]): void {    
    console.debug("chatDTOs:", chatDTOs);
    chatDTOs.forEach(updateChat);
}

function onMessageLogs(chatMessages: ChatMessage[]): void {
    if (!_addToChat) {
        updateParticipatingChats();
    }
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
    if (textchatSelect.selectedOptions[0].value === chatMessage.chatId) {
        addMessageToBar(chatMessage);
    }

}

function addMessageToBar(chatMessage: ChatMessage){
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
export function sendMessage(message: string, chatId: string) {
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
function openChatUsers() {
    while (textchatUsers.firstChild) {
        textchatUsers.firstChild.remove();
    }
    var opt = document.createElement("option");
    opt.innerText = "New Chat With";
    opt.value = "default";
    textchatUsers.append(opt);

    //add any players online except for player
    getRoom().state.players.forEach((value, key) => {
        //return is it is the player himself??
        if (value.userId === getOurPlayer().userId) {
            return;
        }
        const option = document.createElement("option");
        option.innerText = value.name;
        option.value = key;
        option.addEventListener("click", (e) => {
            addNewChat(value);
            console.log(value.name);

        });
        textchatUsers.append(option);
    });
}
//refresh chat list in select
function updateParticipatingChats(hard?: boolean) {
    //console.log("chats:", chats);
    if (hard) {
        clearTextchatSelect();
    }

    const childrenItems: HTMLOptionsCollection = textchatSelect.options;
    const children: HTMLOptionElement[] = Array.from(childrenItems);
    var wasFound: boolean = false;
    
    chats.forEach(chat => {
        wasFound = false;

        children.forEach(child => {
            if (child.value === chat.id) {
                wasFound = true;
            }
        });
        if (wasFound) {
            console.log("was found, exiting");
            return;
        }
        else {
            const option: HTMLOptionElement = document.createElement("option");
            option.innerText = chat.name;
            option.value = chat.id;
    
            option.onclick = function () {
                while(textchatBar.firstChild){
                    textchatBar.firstChild.remove();
                }
                onMessageLogs(chat.messages);
            }
            textchatSelect.append(option);
        }
    });
}
function clearTextchatSelect() {
    while (textchatSelect.firstChild) {
        textchatSelect.firstChild.remove();
    }
}

function addTestOption(name: string) {
    const option = document.createElement("option");
        option.innerText = name;
        option.value = name + name;
        textchatSelect.append(option);
        option.onclick = function () {
            while(textchatBar.firstChild){
                textchatBar.firstChild.remove();
            }
        }
}

function addNewChat(player: PlayerData) {
    //if chat is selected, add to it (even if global, garbage sorting on handler side)
    var chatId: string = "new";
    var playerId: string = player.userId;
    getRoom().send(MessageType.CHAT_ADD, {playerId, chatId});
}


