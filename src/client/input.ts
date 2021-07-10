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

function onKey(event: KeyboardEvent, key: string, runnable: () => void) {
    if (event.key.toLowerCase() === key.toLowerCase()) {
        runnable();
    }
}

function onKeyDirection(event: KeyboardEvent, key: string, ourPlayer: Player = undefined, direction: Direction = undefined) {
    if (event.key.toLowerCase() === key.toLowerCase() && !ourPlayer.priorDirections.includes(direction)) {
        ourPlayer.priorDirections.unshift(direction);
    }
}

export function loadInputFunctions(ourPlayer: Player, room: Room, characters: { [key: string]: HTMLImageElement }, whiteboard: Whiteboard) {
    function onKeyDown(e: KeyboardEvent) {
        if (keysDisabled) {
            return;
        }
        onKeyDirection(e, "s", ourPlayer, Direction.DOWN);
        onKeyDirection(e, "w", ourPlayer, Direction.UP);
        onKeyDirection(e, "a", ourPlayer, Direction.LEFT);
        onKeyDirection(e, "d", ourPlayer, Direction.RIGHT);
        //iterate through characters
        onKey(e, "c", () => {
            const filenames = Object.keys(characters);
            let nextIndex = filenames.indexOf(ourPlayer.character) + 1;
            if (filenames.length <= nextIndex) {
                nextIndex = 0;
            }
            setCharacter(filenames[nextIndex], ourPlayer, room, characters);
        });
        //rename players name
        onKey(e, "r", () => setUsername(window.prompt("Gib dir einen Namen (max. 20 Chars)", "Jimmy"), ourPlayer, room));
        //player interacts with object in front of him
        onKey(e, " ", () => {
            whiteboard.toggelIsVisible();
        });
        onKey(e, "y", () => {
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
        onKey(e, "s", () => ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(Direction.DOWN), 1));
        onKey(e, "w", () => ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(Direction.UP), 1));
        onKey(e, "a", () => ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(Direction.LEFT), 1));
        onKey(e, "d", () => ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(Direction.RIGHT), 1));
        onKey(e, "y", () => {
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
