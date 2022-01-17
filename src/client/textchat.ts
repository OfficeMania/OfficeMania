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
    const chat = chats.find(chat => chat.id === chatId);
    if (!chat){
        //console.warn("chat not existing");
    }
    return chat;
}

function updateChat(chatDTO: ChatDTO): void {
    var chat: Chat = getChatById(chatDTO.id);
    if (!chat) {
        chat = new Chat(chatDTO.name, chatDTO.id)
        chats.push(chat);
        return;
    }
    if (chat.name !== chatDTO.name) {
        chat.name = chatDTO.name;
    }
    else {
        //console.log("Name was equal");
    }
}

//initializes all needed functions for the chat
export function initChatListener() {
    textchatButton.addEventListener("click", () => toggleTextchatBar());

    //updateParticipatingChats();
    openChatUsers();
    /**update textchatSelect on click, but not selected element??
    textchatSelect.addEventListener("click", () => {
    });*/

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
        //console.log(textchatSelect.selectedOptions[0].innerText)
        textchatArea.value = "";
    });

    textchatUsers.addEventListener("click", () => openChatUsers());

    getRoom().onMessage(MessageType.CHAT_UPDATE, (message: string) => onChatUpdate(JSON.parse(message)));
    getRoom().onMessage(MessageType.CHAT_LOG, (message: string) => onMessageLogs(JSON.parse(message)));
    getRoom().send(MessageType.CHAT_UPDATE);
    getRoom().send(MessageType.CHAT_LOG);
    getRoom().onMessage(MessageType.CHAT_SEND, (message: ChatMessage) => onMessage(message));
}

//rewrites all the of the clients chats from scratch
function onChatUpdate(chatDTOs: ChatDTO[]): void {
    //console.debug("chatDTOs:", chatDTOs);
    chats.forEach(() => {chats.pop()});
    //console.log(chats, "chats:");
    chatDTOs.forEach(updateChat);
    updateParticipatingChats();
}

//
function onMessageLogs(chatMessages: ChatMessage[]): void {
    //console.debug("chatMessages:", chatMessages);
    chatMessages.forEach(onMessage);
}

//getter for _inFocus
export function getInFocus() {
    return _inFocus;
}

//write message into chat object, update messagebar if it is selected
function onMessage(chatMessage: ChatMessage) {
    const chatId: string = chatMessage.chatId;
    const chat: Chat = getChatById(chatId);
    chat.messages.push(chatMessage);

    if (textchatSelect.selectedOptions[0].value === chatMessage.chatId) {
        addMessageToBar(chatMessage);
    }

}

//add message as "p" into textchatbar
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
    //default option, only display no finctionality
    var opt = document.createElement("option");
    opt.innerText = "New Chat With";
    opt.value = "default";
    textchatUsers.append(opt);

    //add any players online except for player
    getRoom().state.players.forEach((value, key) => {
        if (key === getOurPlayer().roomId) {
            return;
        }
        const option = document.createElement("option");
        option.innerText = value.displayName;
        option.value = key;
        option.addEventListener("click", () => {
            modifyChat(key);
            //console.log(value.name);
        });
        textchatUsers.append(option);
    });

    //leave button
    var opt = document.createElement("option");
    opt.innerText = "Leave Selected";
    opt.value = "remove";
    opt.addEventListener("click", () => {
        modifyChat("remove");
    });
    textchatUsers.append(opt);
}

//refresh chat list in select without changing the order/ the selected item
function updateParticipatingChats() {
    //console.log("chats:", chats);

    var childrenItems: HTMLOptionsCollection = textchatSelect.options;
    var children: HTMLOptionElement[] = Array.from(childrenItems);
    var wasFound: boolean = false;

    //keeps log of all the chatids
    var chatIds: string[] = [];
    chats.forEach(chat => {
        chatIds.push(chat.id);

        wasFound = false;

        children.forEach(child => {
            if (child.value === chat.id) {
                child.innerText = chat.name;
                wasFound = true;
            }
        });
        if (wasFound) {
            //console.log("was found, renaming, exiting");
            return;
        }
        else {
            const option: HTMLOptionElement = document.createElement("option");
            //console.log(chat.id, chat.name);
            option.innerText = chat.name;
            option.value = chat.id;

            option.onclick = function () {
                while(textchatBar.firstChild){
                    textchatBar.firstChild.remove();
                }
                chat.messages.forEach(addMessageToBar);
            }
            textchatSelect.append(option);
        }
    });

    //removes any chats user is not in
    var selectOptions: HTMLOptionsCollection = textchatSelect.options;

    for ( var i = 0; i < selectOptions.length; i++) {
        console.log("comparison:", chatIds, selectOptions[i].value)
        if (!chatIds.includes(selectOptions[i].value)) {
            console.log("chat not part of list: removing " + selectOptions[i].innerText)
            textchatSelect.removeChild(selectOptions[i]);
            i--;
        }
        else {
            console.log("chats include: " + selectOptions[i].innerText)
        }
    }
    addEmptyOption("New: ", "new");
}

function clearTextchatSelect() {
    while (textchatSelect.firstChild) {
        textchatSelect.firstChild.remove();
    }
}

//adds a nonfuncional option to textchatselect
function addEmptyOption(name: string, id: string) {
    const option = document.createElement("option");
        option.innerText = name;
        option.value = id;
        textchatSelect.append(option);
}

//for sending the adding/removing command to server
function modifyChat(whoToAdd: string) {
    //if chat is selected, add to it (even if global, garbage sorting on handler side)
    console.log(whoToAdd);
    var chatId: string = textchatSelect.selectedOptions[0].value;
    var message: string = whoToAdd;
    getRoom().send(MessageType.CHAT_ADD,{ message, chatId });
}



