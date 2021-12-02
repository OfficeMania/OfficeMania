import { MessageType } from "../common/util";
import { checkInputMode } from "./main";
import { textchatArea, textchatBar, textchatButton, textchatContainer, textchatSendButton } from "./static";
import { getRoom } from "./util";

//tracks if button/shortcut have been pressed
let _showTextchat = false;

//tracks if client is using text area, for changing of inputmode
var _inFocus = false; 

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

    //TODO::: GET CHAT FROM STATE WHEN LOADING IN FOR THE FIRST TIME


    //primitive updating of the chat
    getRoom().state.chatState.onChange = () => {
        let room = getRoom();
        let con = room.state.chatState.contents;
        let a = document.createElement('p');
        a.innerText = con.at(con.length - 1);
        textchatBar.prepend(a);

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

function onStateChange(){

}