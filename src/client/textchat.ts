import { MessageType } from "../common/util";
import { checkInputMode, setShowPlayersRoomTab } from "./main";
import {
    textchatAddUsers,
    textchatArea,
    textchatBar,
    textchatButton,
    textchatChatsButton,
    textchatContainer,
    textchatDropdownChats,
    textchatDropdownUsers,
    textchatNewChat,
    textchatSendButton,
    textchatUsersButton,
} from "./static";
import { getOurPlayer, getPlayersByUserId, getRoom, sendNotification } from "./util";
import { Chat, ChatDTO, ChatMessage } from "../common/handler/chat-handler";
import { PlayerState } from "../common/states/player-state";
import { getUser, setShowParticipantsTab } from "./conference/conference";
import { Player } from "./player";
import { getRoleColor } from "../common";
import { Autolinker } from "autolinker";

const patternUrl: RegExp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

//tracks if button/shortcut have been pressed
let _showTextchat = false;

//tracks if client is using text area, for changing of inputmode
var _inFocus = false;

const chats: Chat[] = [];

var unread: boolean = false;

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
    if (getShowTextchatBar()) {
        setShowTextchatBar(false);
    } else {
        setShowTextchatBar(true);
    }
    checkInputMode();
    setShowParticipantsTab(false);
    setShowPlayersRoomTab(false);
}

//getter of _showTextchat
function getShowTextchatBar(): boolean {
    return _showTextchat;
}

//setter of _showTextchat
export function setShowTextchatBar(set: boolean) {
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
        textchatChatsButton.classList.remove("unread");
        removeUnreadFromChatButton();
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
        sendMessage(textchatArea.value, textchatChatsButton.getAttribute("data-id"));
        //console.log(textchatSelect.selectedOptions[0].innerText)
        textchatArea.value = "";
    });

    updateUserList();

    textchatChatsButton.addEventListener("click", () => {
        textchatChatsButton.classList.remove("unread");
        removeUnreadFromChatButton();
    });

    textchatAddUsers.addEventListener("click", () => {
        const ids: string[] = [];
        for (let i = 0; i < textchatDropdownUsers.children.length; i++) {
            // @ts-ignore
            if (textchatDropdownUsers.children[i].children[0].children[0].checked) {
                ids.push(textchatDropdownUsers.children[i].id);
            }
        }
        modifyChat(ids, textchatChatsButton.getAttribute("data-id"));
        unCheck();
    });

    textchatNewChat.addEventListener("click", () => {
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
    getRoom().onMessage(MessageType.CHAT_SEND, (message: ChatMessage) => {
        onMessage(message);
        sendChatNotification(message);
    });
}

//function to be executed onPlayerChange
export function textchatPlayerOnChange(playerState: PlayerState) {
    if (playerState) {
        let uid: string = "";
        playerState.onChange = (changes => {
            changes.forEach(change => {
                if (change.field === "displayName") {
                    getRoom()?.state.players.forEach((p, key) => {
                        if (p === playerState && chats[0]) {
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

//updates the chats object of client
function onChatUpdate(chatDTOs: ChatDTO[]): void {
    //console.debug(chatDTOs);

    let ids: string[] = [];
    chatDTOs.forEach(chat => {
        updateChat(chat);
        ids.push(chat.id);
    });
    for (let i = 0; i < chats.length; i++) {
        if (!ids.includes(chats[i].id)) {
            chats.splice(i, 1);
        }
    }

    updateChatList();
}

//update/refill all messages in chat object and update displayed messages
function onMessageLogs(chatMessages: ChatMessage[]): void {
    //console.debug("onmessagelogs call");
    let chatIds: string[] = [];
    chatMessages.forEach(message => {
        if (!chatIds.includes(message.chatId)) {
            chatIds.push(message.chatId);
        }
    });
    chats.forEach(chat => {
        if (chatIds.includes(chat.id)) {
            chat.messages.forEach(() => chat.messages.pop());
            if (textchatChatsButton.getAttribute("data-id") === chat.id) {
                clearTextchatBar();
            }
        }

    });
    chatMessages.forEach(message => {
        onMessage(message);
    });
}

//write message into chat object, update messagebar if it is selected
function onMessage(chatMessage: ChatMessage) {
    //console.log(`New message: `, chatMessage)
    const chat: Chat = getChatById(chatMessage.chatId);
    chat.messages.push(chatMessage);
    if (textchatChatsButton.getAttribute("data-id") === chatMessage.chatId) {
        addMessageToBar(chatMessage);
    }
}

//sends text message to server (if its not empty)
function sendMessage(message: string, chatId: string) {
    chatId = JSON.stringify([chatId]);
    if (textchatChatsButton.getAttribute("data-id") === chats[1].id) {
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

const autolinker: Autolinker = new Autolinker({
    newWindow: true,
    sanitizeHtml: true,
    stripPrefix: { www: true, scheme: false },
});

const autolinkerSanitizeOnly: Autolinker = new Autolinker({
    sanitizeHtml: true,
    urls: false,
    email: false,
    phone: false,
});

//add message as "p" into textchatbar
function addMessageToBar(chatMessage: ChatMessage) {
    const messageDiv = document.createElement("div");
    const messageLine = document.createElement("p");
    const messageTime = document.createElement("p");
    const players: Player[] = getPlayersByUserId(chatMessage.userId);
    const color: string = getRoleColor(players?.[0]?.userRole).nameColorChat;
    messageTime.id = "message-time";
    messageLine.id = "message-line";
    messageLine.innerHTML = `<span style="color: ${color}; -webkit-text-fill-color: ${color};">${autolinkerSanitizeOnly.link(chatMessage.name)}</span>: ${autolinker.link(chatMessage.message)}`;
    messageDiv.append(messageTime);
    messageDiv.append(messageLine);
    if (checkIfOwnMessage(chatMessage)) {
        messageDiv.classList.add("sent-message");
    } else {
        messageDiv.classList.add("received-message");
    }
    textchatBar.prepend(messageDiv);
}

function checkIfOwnMessage(message: ChatMessage) {
    if (message.userId === getOurPlayer().roomId || message.userId === getOurPlayer().userId) {
        return true;
    } else {
        return false;
    }
}

//for sending the adding/removing command to server
function modifyChat(whoToAdd: string[], chatId: string = "new") {
    //if chat is selected, add to it (even if global, garbage sorting on handler side)
    const message: string = whoToAdd.toString();
    getRoom().send(MessageType.CHAT_ADD, { message, chatId });
}

function leaveChat(chatId: string) {
    getRoom().send(MessageType.CHAT_LEAVE, { message: "", chatId });
}

//update listed chats
function updateChatList() {
    if (!textchatChatsButton.getAttribute("data-id")) {
        updateChatListButton(chats[0].id);
    }

    //all chats ids that are displayed
    const chatList: string[] = [];

    for (let i = 0; i < textchatDropdownChats.children.length; i++) {
        chatList.push(textchatDropdownChats.children[i].id);
    }
    //console.log(chatList);
    //all chatids that should be displayed
    const chatIds: string[] = [];

    //add any chats
    chats.forEach(chat => {
        chatIds.push(chat.id);
        if (!chatList.includes(chat.id)) {
            addChatListOption(chat);
        }
        let a: number = chatIds.indexOf(chat.id);
        // @ts-ignore
        textchatDropdownChats.children[a].children[0].children[0].innerText = chat.name;
        if (chat.id === textchatChatsButton.getAttribute("data-id")) {
            updateChatListButton(chat.id);
        }
    });

    //remove chats that shouldn't be there
    for (let i = 0; i < textchatDropdownChats.children.length; i++) {
        if (!chatIds.includes(textchatDropdownChats.children[i].id)) {
            textchatDropdownChats.children[i].remove();
            i--;
        }
    }
}

//update displayed users
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
        }
    }
}

//add proper html elements for chat item
function addChatListOption(chat: Chat) {
    const a = document.createElement("a");
    //a.innerText = chat.name;
    a.classList.add("dropdown-item");

    const i = document.createElement("a");
    i.innerText = chat.name;
    a.appendChild(i);
    let chatId = chat.id;
    if (chats[0].id !== chat.id && chats[1].id !== chat.id) {
        const bin = document.createElement("i");
        bin.classList.add("fas");
        bin.classList.add("fa-trash");
        //bin.setAttribute()
        bin.addEventListener("click", (event) => {
            event.stopPropagation();
            leaveChat(chatId);
            updateChatListButton(chats[0].id);
            clearTextchatBar();
            getChatById(chats[0].id).messages.forEach(addMessageToBar);
            textchatChatsButton.click();
        });
        a.appendChild(bin);
    }

    const li = document.createElement("li");
    li.append(a);
    li.id = chat.id;
    //change displayed chats to selected one
    li.addEventListener("click", () => {
        if (textchatChatsButton.getAttribute("data-id") === chat.id) {
            //console.log("Chat already selected");
            return;
        }
        li.classList.remove("unread");
        removeUnreadFromChatButton();
        updateChatListButton(chat.id);

        clearTextchatBar();

        getChatById(chat.id).messages.forEach(addMessageToBar);
    });
    textchatDropdownChats.append(li);
}

//add html li element for user
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

//display new chat in chat-list-button
function updateChatListButton(id: string) {
    let a = "";
    chats.forEach(chat => {
        if (chat.id === id) {
            a = chat.name;
        }
    });
    textchatChatsButton.innerText = a;
    textchatChatsButton.setAttribute("data-id", id);
    textchatChatsButton.classList.remove("unread");
    removeUnreadFromChatButton();

}

function clearTextchatBar() {
    //console.log("clearing bar");
    while (textchatBar.firstChild) {
        textchatBar.firstChild.remove();
    }
}


//uncheck checkboxes
function unCheck() {
    textchatUsersButton.click();
    $(":checkbox").prop("checked", false);
}

function updatePlayerName(userId: string) {
    //console.log("Updating player: ", userId);
    const chatList: Chat[] = chats.filter(chat => chat.users.includes(userId));
    chatList.forEach(chat => updateChatName(chat));
}

function updateChatName(chat: Chat) {
    chat.name = "";
    chat.users.forEach((user) => {
        if (user.length !== 9) {
            getRoom().state.players.forEach((p, k) => {
                if (p.userId && p.userId === user) {
                    user = k;
                }
            });
        }
        if (user === getOurPlayer().roomId) {
            return;
        }
        if (chat.name === "") {
            chat.name = getRoom().state.players.get(user).displayName;
        } else {
            chat.name += ", " + getRoom().state.players.get(user).displayName;
            //console.log("Add name: ", getRoom().state.players.get(user).displayName);
        }
    });
    if (chat.name === "") {
        chat.name = "Empty chat";
    }
}

function sendChatNotification(message: ChatMessage) {
    if (checkIfOwnMessage(message)) {
        return;
    }
    if (!unread && !_showTextchat) {
        sendNotification(`Recieved new messages.`);
    }
    if (!unread) {
        textchatButton.classList.add("unread");
        unread = true;
    }
    for (let i = 0; textchatDropdownChats.children.length > i; i++) {
        if (textchatChatsButton.getAttribute("data-id") === message.chatId) {
            textchatChatsButton.classList.add("unread");
        } else if (textchatDropdownChats.children[i].id === message.chatId) {

            textchatDropdownChats.children[i].classList.add("unread");
        }
    }
}

function removeUnreadFromChatButton() {
    if ($(".unread").length === 1) {
        textchatButton.classList.remove("unread");
        unread = false;
    }
}
