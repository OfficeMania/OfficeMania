import { checkInputMode } from "./main";
import { textchatBar } from "./static";


let showTextchat = false;
export var inFocus = false; 
export function toggleTextchatBar() {
    //console.log("hi")
    if(getShowTextchatBar()) setShowTextchatBar(false);
    else setShowTextchatBar(true);
    checkInputMode();
}

export function getShowTextchatBar(): boolean{
    return showTextchat;
}

function setShowTextchatBar(set: boolean) {
    if(set) {
        textchatBar.classList.add("hover");
    }
    else {
        textchatBar.classList.remove("hover");
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