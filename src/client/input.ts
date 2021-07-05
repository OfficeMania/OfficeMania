import {Player} from "./player";
import {Room} from "colyseus.js";
import {setCharacter, setUsername} from "./util";
import {setShowParticipantsTab} from "./conference/conference";

let yPressed: boolean = false;
let keysDisabled: boolean = false;

export function setKeysDisabled(disabled: boolean) {
    keysDisabled = disabled;
}

export function loadInputFunctions(ourPlayer: Player, room: Room, characters: { [key: string]: HTMLImageElement }) {
    function keyPressed(e: KeyboardEvent) {
        if (keysDisabled) {
            return;
        }
        if (e.key.toLowerCase() === "s" && !ourPlayer.prioDirection.includes("moveDown")) {
            ourPlayer.prioDirection.unshift("moveDown");
        }
        if (e.key.toLowerCase() === "w" && !ourPlayer.prioDirection.includes("moveUp")) {
            ourPlayer.prioDirection.unshift("moveUp");
        }
        if (e.key.toLowerCase() === "a" && !ourPlayer.prioDirection.includes("moveLeft")) {
            ourPlayer.prioDirection.unshift("moveLeft");
        }
        if (e.key.toLowerCase() === "d" && !ourPlayer.prioDirection.includes("moveRight")) {
            ourPlayer.prioDirection.unshift("moveRight");
        }
        //iterate through characters
        if (e.key.toLowerCase() === "c") {
            let filenames = Object.keys(characters);
            let nextIndex = filenames.indexOf(ourPlayer.character) + 1;
            if (filenames.length <= nextIndex) {
                nextIndex = 0;
            }
            setCharacter(filenames[nextIndex], ourPlayer, room, characters);
        }
        //rename players name
        if (e.key.toLowerCase() === "r") {
            setUsername(window.prompt("Gib dir einen Namen (max. 20 Chars)", "Jimmy"), ourPlayer, room);
        }
        if (e.key.toLowerCase() === " ") {
            //player interacts with object in front of him
            //(ttriggert with space)
        }
        if (e.key.toLowerCase() === "y" && !yPressed) {
            console.log("Y has been pressed"); //DEBUG
            yPressed = true;
            setShowParticipantsTab(true);
        }
    }

    function keyUp(e: KeyboardEvent) {
        if (keysDisabled) {
            return;
        }
        if (e.key.toLowerCase() === "s") {
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveDown"), 1);
        }
        if (e.key.toLowerCase() === "w") {
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveUp"), 1);
        }
        if (e.key.toLowerCase() === "a") {
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveLeft"), 1);
        }
        if (e.key.toLowerCase() === "d") {
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveRight"), 1);
        }
        if (e.key.toLowerCase() === "y") {
            yPressed = false;
            setShowParticipantsTab(false);
        }
    }

    //gets called when window is out auf focus
    function onBlur() {
        //stops player
        ourPlayer.prioDirection = [];
    }

    document.addEventListener("keydown", keyPressed);
    document.addEventListener("keyup", keyUp);
    window.addEventListener("blur", onBlur);

}
