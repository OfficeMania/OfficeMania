import { MessageType } from "../common/util";
import { checkInputMode } from "./main";
import { textchatArea, textchatBar, textchatButton, textchatContainer, textchatDropdownBar, textchatMenuButton, textchatSendButton } from "./static";
import { getRoom } from "./util";

//tracks if button/shortcut have been pressed
let _showTextchat = false;

//tracks if client is using text area, for changing of inputmode
var _inFocus = false; 

var _menuOpen = false;

//initializes all needed functions for the chat
export function initChatListener() {

    textchatButton.addEventListener("click", () => toggleTextchatBar());

    //changing of inputmode if text area is in use or not
    textchatArea.onfocus = function(){setInFocus(true)};
    textchatArea.onblur = function() {setInFocus(false)};
    
    textchatSendButton.addEventListener("click", () => {
        sendMessage(textchatArea.value);
        textchatArea.value = "";
    });
    textchatMenuButton.addEventListener("click", () => toggleChatMenu());
    textchatDropdownBar
    getRoom().onMessage(MessageType.CHAT_LOG, (message) => {
        console.log(message);
    })
    
    //write chatlog in client 
    let counter = 0;
    getRoom().state.chatState.contents.forEach((e) => {
        console.log("gogo " + counter)
        writeMessage(counter);
        counter++;
    });

    //primitive updating of the chat
    getRoom().state.chatState.onChange = () => {

        writeMessage();

        //FOR LATER USE, WITH MULTIPLE GROUPS
        /**
        room.state.chatState.participants.forEach(participant => {
           if (participant === getOurPlayer().id) {
                let a = document.createElement('p');
                a.innerText = con.at(con.length-1);
                textchatBar.prepend(a);
            }
        });
        */
    };
}

//getter for _inFocus
export function getInFocus() {
    return _inFocus;
}

//write message from contents at position x, if not specified, last will be written
//will need to accept key/position of chatgroupstate
function writeMessage(pos: number = -1) {
    let room = getRoom();
    let con = room.state.chatState.contents;
    if (pos === -1) {
        pos = con.length - 1;
    }
    let messageLine = document.createElement('p');
    let messageString = con.at(pos);
    let formattedMessage = "(" + messageString.substring(0,5) + ") " + messageString.substring(6)
    messageLine.innerText = formattedMessage;
    textchatBar.prepend(messageLine);
    console.log("writing message" + pos);
}

function setInFocus(set){
    _inFocus = set;
    checkInputMode();
}  

//toggles chat visibility
function toggleTextchatBar() {
    if(getShowTextchatBar()) setShowTextchatBar(false);
    else setShowTextchatBar(true);
    checkInputMode();
}

//sends text message to server (if its not empty)
function sendMessage(message: string) {
    //console.log(message);
    if (message && message !== "") {
        getRoom().send(MessageType.CHAT_SEND, message);
    }
}

//getter of _showTextchat
function getShowTextchatBar(): boolean{
    return _showTextchat;
}

//setter of _showTextchat
function setShowTextchatBar(set: boolean) {
    if(set) {
        textchatContainer.classList.add("hover");
    }
    else {
        textchatContainer.classList.remove("hover");
    }
    _showTextchat = set;
}

function toggleChatMenu(){
    if(_menuOpen) {
        textchatDropdownBar.style.visibility = "hidden";
    }
    else {
        textchatDropdownBar.style.visibility = "";
    }
    _menuOpen = !_menuOpen;
}

function onStateChange(){

}