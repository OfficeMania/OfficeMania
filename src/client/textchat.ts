import { checkInputMode } from "./main";
import { textchatBar, textchatContainer } from "./static";


let showTextchat = false;
export var inFocus = false; 
export function toggleTextchatBar() {
    //console.log("hi")
    if(getShowTextchatBar()) setShowTextchatBar(false);
    else setShowTextchatBar(true);
    let a = document.createElement('p');
    a.innerText = "Hallo";
    textchatBar.prepend(a);
    checkInputMode();
}

export function getShowTextchatBar(): boolean{
    return showTextchat;
}

function setShowTextchatBar(set: boolean) {
    if(set) {
        textchatContainer.classList.add("hover");
    }
    else {
        textchatContainer.classList.remove("hover");
    }
    showTextchat = set;
}
export function setInFocus(set){
    inFocus = set;
    checkInputMode();
} 
export function getInFocus() {
    return inFocus;
}