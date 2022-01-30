import { MessageType } from "../common/util";
import { checkInputMode } from "./main";
import {
    textchatArea,
    textchatBar,
    textchatButton,
    textchatContainer,
    textchatDropdownAddUsers,
    textchatDropdownChats,
    textchatDropdownChatsButton,
    textchatDropdownNewChat,
    textchatDropdownUsers,
    textchatDropdownUsersButton,
    textchatSendButton,
} from "./static";
import { getOurPlayer, getRoom } from "./util";
import { Chat, ChatDTO, ChatMessage } from "../common/handler/chatHandler";
import { PlayerData } from "../common/rooms/schema/state";
import { getUser } from "./conference/conference";

//tracks if button/shortcut have been pressed
let _showTextchat = false;

//tracks if client is using text area, for changing of inputmode
var _inFocus = false;

const chats: Chat[] = [];

function getChatById(chatId: string): Chat {
    const chat = chats.find(chat => chat.id === chatId);
    if (!chat) {
        //console.warn("chat not existing");
    }
    return chat;
}

function updateChat(chatDTO: ChatDTO): void {
    var chat: Chat = getChatById(chatDTO.id);
    if (!chat) {
        chat = new Chat(chatDTO.name, chatDTO.id);
        chats.push(chat);
    }
    if (chat.id !== chats[0].id && chat.id !== chats[1].id) {
        while (chat.users.length > 0) {
            chat.users.pop();
        }
        chatDTO.users.forEach(user => chat.users.push(user));
        updateChatName(chat);
    }
}

function setInFocus(set) {
    _inFocus = set;
    checkInputMode();
}

//getter for _inFocus
export function getInFocus() {
    return _inFocus;
}

//toggles chat visibility
function toggleTextchatBar() {
    if (getShowTextchatBar()) setShowTextchatBar(false);
    else setShowTextchatBar(true);
    checkInputMode();
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

//initializes all needed functions for the chat
export function initChatListener() {
    textchatButton.addEventListener("click", () => toggleTextchatBar());


    //changing of inputmode if text area is in use or not
    textchatArea.onfocus = function() {
        setInFocus(true);
    };
    textchatArea.onblur = function() {
        setInFocus(false);
    };

    textchatArea.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            textchatSendButton.click();
        }
    });

    textchatSendButton.addEventListener("click", () => {
        sendMessage(textchatArea.value, textchatDropdownChatsButton.getAttribute("data-id"));
        //console.log(textchatSelect.selectedOptions[0].innerText)
        textchatArea.value = "";
    });

    updateUserList();

    textchatDropdownAddUsers.addEventListener("click", () => {
        console.log("add");
        const ids: string[] = [];
        for (let i = 0; i < textchatDropdownUsers.children.length; i++) {
            // @ts-ignore
            if (textchatDropdownUsers.children[i].children[0].children[0].checked) {
                ids.push(textchatDropdownUsers.children[i].id);
            }
        }
        console.log(ids);
        modifyChat(ids, textchatDropdownChatsButton.getAttribute("data-id"));
        unCheck();
    });

    textchatDropdownNewChat.addEventListener("click", () => {
        console.log("new");
        const ids: string[] = [];
        for (let i = 0; i < textchatDropdownUsers.children.length; i++) {
            // @ts-ignore
            if (textchatDropdownUsers.children[i].children[0].children[0].checked) {
                ids.push(textchatDropdownUsers.children[i].id);
            }
        }
        modifyChat(ids);
        unCheck();
    });
    getRoom().onMessage(MessageType.CHAT_UPDATE, (message: string) => onChatUpdate(JSON.parse(message)));
    getRoom().onMessage(MessageType.CHAT_LOG, (message: string) => onMessageLogs(JSON.parse(message)));
    getRoom().send(MessageType.CHAT_UPDATE);
    getRoom().send(MessageType.CHAT_LOG);
    getRoom().onMessage(MessageType.CHAT_SEND, (message: ChatMessage) => onMessage(message));
}

export function textchatPlayerOnChange(player: PlayerData) {
    if (player) {
        let uid: string = "";

        player.onChange = (changes => {
            changes.forEach(change => {
                if (change.field === "displayName") {
                    getRoom()?.state.players.forEach((p, key) => {
                        if (p === player && chats[0]) {
                            uid = key;
                        }
                    });
                    if (uid !== "") {
                        updateUserList();
                        updatePlayerName(uid);
                        updateChatList();
                    }
                }
            });
        });
    }
}

//rewrites all the of the clients chats from scratch
function onChatUpdate(chatDTOs: ChatDTO[]): void {
    //console.debug("chatDTOs:", chatDTOs);
    //chats.forEach(() => {chats.pop()});
    //console.log(chats, "chats:");
    let ids: string[] = [];
    chatDTOs.forEach(chat => {
        updateChat(chat);
        ids.push(chat.id);
    });
    chats.forEach(chat => {
        if (!ids.includes(chat.id)) {
            chats.splice(ids.indexOf(chat.id));
        }
    });

    //updateParticipatingChats();
    updateChatList();
}

//
function onMessageLogs(chatMessages: ChatMessage[]): void {
    //console.debug("chatMessages:", chatMessages);
    chatMessages.forEach(onMessage);
}

//write message into chat object, update messagebar if it is selected
function onMessage(chatMessage: ChatMessage) {
    const chatId: string = chatMessage.chatId;
    const chat: Chat = getChatById(chatMessage.chatId);
    chat.messages.push(chatMessage);
    if (textchatDropdownChatsButton.getAttribute("data-id") === chatMessage.chatId) {
        addMessageToBar(chatMessage);
    }

}

//sends text message to server (if its not empty)
function sendMessage(message: string, chatId: string) {
    //console.log(message);
    chatId = JSON.stringify(["chat", chatId]);
    if (textchatDropdownChatsButton.getAttribute("data-id") === chats[1].id) {
        const ids: string[] = [];
        chatId = "";
        getRoom().state.players.forEach((p, k) => {
            if (!getUser(p.participantId).getDisabled()) {
                ids.push(k);
            }
        });
        chatId = JSON.stringify(ids);
    }
    if (message && message !== "") {
        getRoom().send(MessageType.CHAT_SEND, { message, chatId });
    }

}


//add message as "p" into textchatbar
function addMessageToBar(chatMessage: ChatMessage) {
    const messageLine = document.createElement("p");
    messageLine.innerText = `[${chatMessage.timestamp}] ${chatMessage.name}: ${chatMessage.message}`;
    textchatBar.prepend(messageLine);
}


//for sending the adding/removing command to server
function modifyChat(whoToAdd: string[], chatId: string = "new") {
    //if chat is selected, add to it (even if global, garbage sorting on handler side)
    console.log("not yet implemented");
    const message: string = whoToAdd.toString();
    console.log(message);
    getRoom().send(MessageType.CHAT_ADD, { message, chatId });
}

function leaveChat(chatId: string) {
    getRoom().send(MessageType.CHAT_LEAVE, { message: "", chatId });
}

function updateChatList() {
    if (!textchatDropdownChatsButton.getAttribute("data-id")) {
        updateChatListButton(chats[0].id);
    }
    //add any chats

    //all chats ids that are displayed
    const chatList: string[] = [];

    for (let i = 0; i < textchatDropdownChats.children.length; i++) {
        chatList.push(textchatDropdownChats.children[i].id);
    }
    //console.log(chatList);
    //all chatids that should be displayed
    const chatIds: string[] = [];

    chats.forEach(chat => {
        chatIds.push(chat.id);
        if (!chatList.includes(chat.id)) {
            addChatListOption(chat);
        }
        let a: number = chatIds.indexOf(chat.id);
        console.log(chat.name);
        // @ts-ignore
        textchatDropdownChats.children[a].children[0].children[0].innerText = chat.name;
        if (chat.id === textchatDropdownChatsButton.getAttribute("data-id")) {
            updateChatListButton(chat.id);
        }
    });

    //remove any chats
    for (let i = 0; i < textchatDropdownChats.children.length; i++) {
        if (!chatIds.includes(textchatDropdownChats.children[i].id)) {
            textchatDropdownChats.children[i].remove();
            console.log("remove");
            i--;
        }
    }
}

function updateUserList() {
    const uIdList: string[] = [];

    for (let i = 0; i < textchatDropdownUsers.children.length; i++) {
        uIdList.push(textchatDropdownUsers.children[i].id);
    }

    const userIds: string[] = [];

    //early in loading cycle, getroom and the state are not yet fetched, so this need to run conditionally
    getRoom()?.state.players.forEach((value, key) => {
        userIds.push(key);

        if (!uIdList.includes(key) && key != getOurPlayer().roomId) {
            console.log("inserting");
            addUserListOption(value.displayName, key);
        } else if (uIdList.includes(key)) {
            //renaming logic
            textchatDropdownUsers.children[uIdList.indexOf(key)].children[0].children[1].remove();

            let div = document.createElement("div");
            div.innerText = value.displayName;
            textchatDropdownUsers.children[uIdList.indexOf(key)].children[0].append(div);
        }
    });

    for (let i = 0; i < textchatDropdownUsers.children.length; i++) {
        if (!userIds.includes(textchatDropdownUsers.children[i].id)) {
            textchatDropdownUsers.children[i].remove();
            i--;
            console.log("removing");
        }
    }
}

function addChatListOption(chat: Chat) {
    const a = document.createElement("a");
    //a.innerText = chat.name;
    a.classList.add("dropdown-item");

    const i = document.createElement("a");
    i.innerText = chat.name;
    a.appendChild(i);

    if (chats[0].id !== chat.id && chats[1].id !== chat.id) {
        const bin = document.createElement("i");
        bin.classList.add("fas");
        bin.classList.add("fa-trash");
        //bin.setAttribute()
        bin.addEventListener("click", (event) => {
            event.stopPropagation();
            leaveChat(chat.id);
            updateChatListButton(chats[0].id);
            clearTextchatBar();
            getChatById(chats[0].id).messages.forEach(addMessageToBar);
            textchatDropdownChatsButton.click();
        });
        a.appendChild(bin);
    }

    const li = document.createElement("li");
    li.append(a);
    li.id = chat.id;
    li.addEventListener("click", () => {
        if (textchatDropdownChatsButton.getAttribute("data-id") === chat.id) {
            console.log("already there");
            return;
        }

        updateChatListButton(chat.id);

        clearTextchatBar();

        getChatById(chat.id).messages.forEach(addMessageToBar);

        console.log(getChatById(chat.id));


    });
    textchatDropdownChats.append(li);
}

function addUserListOption(name: string, key: string) {
    const input = document.createElement("input");
    input.classList.add("form-check-input");
    input.type = "checkbox";
    input.id = "input-" + key;

    let div = document.createElement("div");
    div.innerText = name;

    const label = document.createElement("label");
    label.append(input);
    label.classList.add("form-check-label");
    label.classList.add("dropdown-item");
    label.style.alignContent = "inline";
    label.append(div);

    const li = document.createElement("li");
    li.id = key;
    li.append(label);
    textchatDropdownUsers.append(li);
}

function updateChatListButton(id: string) {
    let a = "";
    chats.forEach(chat => {
        if (chat.id === id) {
            a = chat.name;
        }
    });
    textchatDropdownChatsButton.innerText = a;
    textchatDropdownChatsButton.setAttribute("data-id", id);

}

function clearTextchatBar() {
    while (textchatBar.firstChild) {
        textchatBar.firstChild.remove();
    }
}

function unCheck() {
    textchatDropdownUsersButton.click();
    $(":checkbox").prop("checked", false);
}

function updatePlayerName(userId: string) {
    console.log("updating plaer: ", userId);
    const chatList: Chat[] = chats.filter(chat => chat.users.includes(userId));
    console.log(chatList);
    chatList.forEach(chat => updateChatName(chat));
}

function updateChatName(chat: Chat) {
    chat.name = "";
    console.log(chat);
    chat.users.forEach((user) => {
        if (user === getOurPlayer().roomId) {
            return;
        }
        if (chat.name === "") {
            chat.name = getRoom().state.players.get(user).displayName;
        } else {
            chat.name += ", " + getRoom().state.players.get(user).displayName;
            console.log("add name: ", getRoom().state.players.get(user).displayName);
        }
    });
    if (chat.name === "") {
        chat.name = "Empty chat";
    }
}


/**
 * Old Textchat logic
 */


/*
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
        if (!chatIds.includes(selectOptions[i].value)) {
            //console.log("chat not part of list: removing " + selectOptions[i].innerText);
            textchatSelect.removeChild(selectOptions[i]);
            i--;
        }
        else {
            //console.log("chats include: " + selectOptions[i].innerText);
        }
    }
    addEmptyOption("New: ", "new");
}

//adds a nonfuncional option to textchatselect
function addEmptyOption(name: string, id: string) {
    const option = document.createElement("option");
        option.innerText = name;
        option.value = id;
        textchatSelect.append(option);
}

*/


