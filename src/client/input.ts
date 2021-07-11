import {
    getCollisionInfo,
    getCorrectedPlayerFacingCoordinates,
    getOurPlayer,
    InputMode,
    setCharacter,
    setUsername
} from "./util";
import {toggleShowParticipantsTab} from "./conference/conference";
import {Direction} from "../common/util";
import {solidInfo} from "./map";
import {characters} from "./main";

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
    if (!isPureKey(event) || event.key.toLowerCase() !== key.toLowerCase()) {
        return;
    }
    runnable();
}

function onDirectionKeyDown(event: KeyboardEvent, key: string, direction: Direction) {
    if (!isPureKey(event) || event.key.toLowerCase() !== key.toLowerCase()) {
        return;
    }
    const ourPlayer = getOurPlayer();
    switch (inputMode) {
        case InputMode.NORMAL:
            ourPlayer.priorDirections.unshift(direction);
            break;
        case InputMode.INTERACTION:
            //TODO
            break;

    }
}

function onDirectionKeyUp(event: KeyboardEvent, key: string, direction: Direction) {
    if (!isPureKey(event) || event.key.toLowerCase() !== key.toLowerCase()) {
        return;
    }
    const ourPlayer = getOurPlayer();
    switch (inputMode) {
        case InputMode.NORMAL:
            ourPlayer.priorDirections.splice(ourPlayer.priorDirections.indexOf(direction), 1);
            break;
        case InputMode.INTERACTION:
            //TODO
            break;

    }
}

export function loadInputFunctions() {
    function onKeyDown(e: KeyboardEvent) {
        if (inputMode === InputMode.SETTINGS) {
            return;
        }
        const ourPlayer = getOurPlayer();
        onDirectionKeyDown(e, "s", Direction.DOWN);
        onDirectionKeyDown(e, "w", Direction.UP);
        onDirectionKeyDown(e, "a", Direction.LEFT);
        onDirectionKeyDown(e, "d", Direction.RIGHT);
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
            setCharacter(filenames[nextIndex]);
        });
        //rename players name
        onPureKey(e, "r", () => setUsername(window.prompt("Gib dir einen Namen (max. 20 Chars)", "Jimmy")));
        onPureKey(e, "u", () => toggleShowParticipantsTab());
    }

    function onKeyUp(e: KeyboardEvent) {
        if (inputMode === InputMode.SETTINGS) {
            return;
        }
        onDirectionKeyUp(e, "s", Direction.DOWN);
        onDirectionKeyUp(e, "w", Direction.UP);
        onDirectionKeyUp(e, "a", Direction.LEFT);
        onDirectionKeyUp(e, "d", Direction.RIGHT);
        if (inputMode === InputMode.INTERACTION) {
            return;
        }
    }

    //gets called when window is out auf focus
    function onBlur() {
        resetPlayerDirections();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
}
