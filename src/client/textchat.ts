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

    textchatCreateButton.addEventListener("click", () => {
        if (!_addToChat) {
            updateParticipatingChats();
            updateChatUsers();
            _addToChat = true;
        }
        else {
            //TODO
            updateParticipatingChats();
            _addToChat = false;
        }

    });



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
    updateParticipatingChats();
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
    getRoom().state.players.forEach((value, key) => {
        /*if (key === getOurPlayer().roomId) {
            return;
        }*/
        const option = document.createElement("option");
        option.innerText = getRoom().state.players[key].name;
        option.value = key;
        textchatSelect.append(option);
    });
}
//refresh chat list in select
function updateParticipatingChats() {
    //console.log("chats:", chats);
    while (textchatSelect.firstChild) {
        textchatSelect.firstChild.remove();
    }
    chats.forEach(e => {
        const option = document.createElement("option");
        option.innerText = e.name;
        option.value = e.id;

        option.onclick = function () {
            while(textchatBar.firstChild){
                textchatBar.firstChild.remove();
            }
            onMessageLogs(e.messages);
        }
        textchatSelect.append(option);
    });
    addTestOption("abc");
    addTestOption("lorem ipsum");

    //TODO dont reset pointer?? hulp
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

function addCurrentToChat(chatId) {
    const a = textchatSelect.selectedOptions[0].value;
    getRoom().send(MessageType.CHAT_ADD_USER, {a, chatId});
}
