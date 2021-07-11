import {Player} from "./player";
import {Room} from "colyseus.js";
import {
    getCollisionInfo,
    getCorrectedPlayerFacingCoordinates,
    getOurPlayer,
    InputMode,
    setCharacter,
    setUsername
} from "./util";
import {setShowParticipantsTab} from "./conference/conference";
import {Whiteboard} from "./whiteboard";
import {Direction} from "../common/util";
import {solidInfo} from "./map";

let yPressed: boolean = false;
let inputMode: InputMode = InputMode.NORMAL;

function resetPlayerDirections() {
    getOurPlayer().priorDirections.length = 0;
}

export function setInputMode(input: InputMode) {
    inputMode = input;
    if (inputMode !== InputMode.NORMAL) {
        resetPlayerDirections();
    }
}

export function getInputMode(): InputMode {
    return inputMode;
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

function onDirectionKeyDown(event: KeyboardEvent, key: string, ourPlayer: Player = undefined, direction: Direction = undefined) {
    if (!isPureKey(event)) {
        return;
    }
    if (inputMode === InputMode.NORMAL) {
        if (event.key.toLowerCase() === key.toLowerCase() && !ourPlayer.priorDirections.includes(direction)) {
            ourPlayer.priorDirections.unshift(direction);
        }
    } else if (inputMode === InputMode.INTERACTION) {
        //TODO
    }
}

function onDirectionKeyUp(event: KeyboardEvent, key: string, ourPlayer: Player = undefined, direction: Direction = undefined) {
    if (!isPureKey(event)) {
        return;
    }
    if (inputMode === InputMode.NORMAL) {
        ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(direction), 1);
    } else if (inputMode === InputMode.INTERACTION) {
        //TODO
    }
}

export function loadInputFunctions(ourPlayer: Player, room: Room, characters: { [key: string]: HTMLImageElement }, whiteboard: Whiteboard) {
    function onKeyDown(e: KeyboardEvent) {
        if (inputMode === InputMode.SETTINGS) {
            return;
        }
        onDirectionKeyDown(e, "s", ourPlayer, Direction.DOWN);
        onDirectionKeyDown(e, "w", ourPlayer, Direction.UP);
        onDirectionKeyDown(e, "a", ourPlayer, Direction.LEFT);
        onDirectionKeyDown(e, "d", ourPlayer, Direction.RIGHT);
        //player interacts with object in front of him
        onPureKey(e, " ", () => {
            const [facingX, facingY] = getCorrectedPlayerFacingCoordinates(ourPlayer);
            const solidInfo: solidInfo = getCollisionInfo()?.[facingX]?.[facingY];
            if (!solidInfo) {
                console.error(`no solidInfo for ${facingX}:${facingY}`);
                return
            }
            solidInfo.content && solidInfo.content.onInteraction();
        });
        if (inputMode === InputMode.INTERACTION) {
            return;
        }
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
        onPureKey(e, "y", () => {
            if (!yPressed) {
                console.log("Y has been pressed"); //DEBUG
                yPressed = true;
                setShowParticipantsTab(true);
            }
        });
    }

    function onKeyUp(e: KeyboardEvent) {
        if (inputMode === InputMode.SETTINGS) {
            return;
        }
        onDirectionKeyUp(e, "s", ourPlayer, Direction.DOWN);
        onDirectionKeyUp(e, "w", ourPlayer, Direction.UP);
        onDirectionKeyUp(e, "a", ourPlayer, Direction.LEFT);
        onDirectionKeyUp(e, "d", ourPlayer, Direction.RIGHT);
        if (inputMode === InputMode.INTERACTION) {
            return;
        }
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
