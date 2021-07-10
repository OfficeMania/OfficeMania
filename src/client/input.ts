import {Player} from "./player";
import {Room} from "colyseus.js";
import {setCharacter, setUsername} from "./util";
import {setShowParticipantsTab} from "./conference/conference";
import {Whiteboard} from "./whiteboard";
import {Direction} from "../common/util";

let yPressed: boolean = false;
let keysDisabled: boolean = false;
let interactionOpen: boolean = false;

export function setKeysDisabled(disabledSettings: boolean, disabledInteraction: boolean) {
    keysDisabled = disabledSettings || disabledInteraction;
    interactionOpen = disabledInteraction;
}

function isPureKey(event: KeyboardEvent): boolean {
    return event && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey;
}

function onPureKey(event: KeyboardEvent, key: string, runnable: () => void) {
    if (!isPureKey(event)) {
        return;
    }
    if (event.key.toLowerCase() === key.toLowerCase()) {
        runnable();
    }
}

function onPureKeyDirection(event: KeyboardEvent, key: string, ourPlayer: Player = undefined, direction: Direction = undefined) {
    if (!isPureKey(event)) {
        return;
    }
    if (event.key.toLowerCase() === key.toLowerCase() && !ourPlayer.priorDirections.includes(direction)) {
        ourPlayer.priorDirections.unshift(direction);
    }
}

export function loadInputFunctions(ourPlayer: Player, room: Room, characters: { [key: string]: HTMLImageElement }, whiteboard: Whiteboard) {
    function onKeyDown(e: KeyboardEvent) {
        if (keysDisabled) {
            return;
        }
        onPureKeyDirection(e, "s", ourPlayer, Direction.DOWN);
        onPureKeyDirection(e, "w", ourPlayer, Direction.UP);
        onPureKeyDirection(e, "a", ourPlayer, Direction.LEFT);
        onPureKeyDirection(e, "d", ourPlayer, Direction.RIGHT);
        //iterate through characters
        onPureKey(e, "c", () => {
            const filenames = Object.keys(characters);
            let nextIndex = filenames.indexOf(ourPlayer.character) + 1;
            if (filenames.length <= nextIndex) {
                nextIndex = 0;
            }
            setCharacter(filenames[nextIndex], ourPlayer, room, characters);
        });
        //rename players name
        onPureKey(e, "r", () => setUsername(window.prompt("Gib dir einen Namen (max. 20 Chars)", "Jimmy"), ourPlayer, room));
        //player interacts with object in front of him
        onPureKey(e, " ", () => {
            whiteboard.toggelIsVisible();
        });
        onPureKey(e, "y", () => {
            if (!yPressed) {
                console.log("Y has been pressed"); //DEBUG
                yPressed = true;
                setShowParticipantsTab(true);
            }
        });
    }

    function onKeyUp(e: KeyboardEvent) {
        if (keysDisabled) {
            return;
        }
        onPureKey(e, "s", () => ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(Direction.DOWN), 1));
        onPureKey(e, "w", () => ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(Direction.UP), 1));
        onPureKey(e, "a", () => ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(Direction.LEFT), 1));
        onPureKey(e, "d", () => ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(Direction.RIGHT), 1));
        onPureKey(e, "y", () => {
            yPressed = false;
            setShowParticipantsTab(false);
        });
    }

    //gets called when window is out auf focus
    function onBlur() {
        //stops player
        ourPlayer.priorDirections = [];
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
}
