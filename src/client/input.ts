import {
    appendFAIcon,
    consumeInteractionClosed,
    createInteractionButton,
    getCollisionInfo,
    getCorrectedPlayerFacingCoordinates,
    getNewPlayerFacingCoordinates,
    getOurPlayer,
    InputMode,
    payRespect,
    setCharacter,
} from "./util";
import { toggleShowParticipantsTab } from "./conference/conference";
import { Direction } from "../common/util";
import { solidInfo } from "./map";
import { characters } from "./main";
import { Interactive } from "./interactive/interactive";
import {
    camButton,
    helpButton,
    helpExitButton,
    helpFooter,
    muteButton,
    settingsButton,
    settingsCancelButton,
    shareButton,
} from "./static";
import { Chunk, MapData } from "./newMap";
import { Door } from "./interactive/door";

let inputMode: InputMode = InputMode.IGNORE;

export const interactionIgnore: string[] = ["sticky notes", "notes"];

export let currentInteraction: Interactive = null;

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
    let input: Direction[] = null;
    switch (inputMode) {
        case InputMode.NORMAL:
            input = getOurPlayer().priorDirections;
            break;
        case InputMode.INTERACTION:
            const solidInfo: solidInfo = checkInteraction();
            if (!solidInfo?.content) {
                break;
            }
            input = solidInfo.content.input;
            break;
    }
    if (!input) {
        return;
    }
    if (!input.includes(direction)) {
        input.unshift(direction);
    }
}

function onDirectionKeyUp(event: KeyboardEvent, key: string, direction: Direction) {
    if (/*!isPureKey(event) || */ event.key.toLowerCase() !== key.toLowerCase()) {
        return;
    }
    let input: Direction[] = null;
    switch (inputMode) {
        case InputMode.NORMAL:
            input = getOurPlayer().priorDirections;
            break;
        case InputMode.INTERACTION:
            const solidInfo: solidInfo = checkInteraction();
            if (!solidInfo?.content) {
                break;
            }
            input = solidInfo.content.input;
            break;
    }
    if (!input) {
        return;
    }
    const index = input.indexOf(direction);
    if (index > -1) {
        input.splice(index, 1);
    }
}

export function loadInputFunctions(map: MapData) {
    function onKeyDown(e: KeyboardEvent) {
        const ourPlayer = getOurPlayer();
        if (e.key === "Escape") {
            if (inputMode === InputMode.INTERACTION) {
                checkInteraction().content.leave();
                return;
            }
            if (inputMode === InputMode.BACKPACK) {
                ourPlayer.backpack.leave();
                return;
            }
            if (inputMode === InputMode.IGNORE) {
                helpExitButton.click();
                settingsCancelButton.click();
                return;
            }
        }
        if (
            inputMode === InputMode.IGNORE ||
            (inputMode === InputMode.INTERACTION && interactionIgnore.includes(checkInteraction()?.content?.name)) ||
            inputMode === InputMode.BACKPACK
        ) {
            //console.log("exiting");
            return;
        }
        onDirectionKeyDown(e, "s", Direction.DOWN);
        onDirectionKeyDown(e, "w", Direction.UP);
        onDirectionKeyDown(e, "a", Direction.LEFT);
        onDirectionKeyDown(e, "d", Direction.RIGHT);
        onDirectionKeyDown(e, "ArrowDown", Direction.DOWN);
        onDirectionKeyDown(e, "ArrowUp", Direction.UP);
        onDirectionKeyDown(e, "ArrowLeft", Direction.LEFT);
        onDirectionKeyDown(e, "ArrowRight", Direction.RIGHT);
        //player interacts with object in front of him
        onPureKey(e, "e", () => checkInteraction(true));
        onPureKey(e, "e", () => checkNewInteraction(map, true));
        onPureKey(e, "i", () => ourPlayer.backpack.draw());
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
        onPureKey(e, "u", () => toggleShowParticipantsTab());
        onPureKey(e, "f", () => payRespect());
        onPureKey(e, "n", () => muteButton.click());
        onPureKey(e, "m", () => camButton.click());
        onPureKey(e, ",", () => shareButton.click());
        onPureKey(e, "q", () => settingsButton.click());
        onPureKey(e, "h", () => helpButton.click());
    }

    function onKeyUp(e: KeyboardEvent) {
        if (inputMode === InputMode.IGNORE) {
            return;
        }
        onDirectionKeyUp(e, "s", Direction.DOWN);
        onDirectionKeyUp(e, "w", Direction.UP);
        onDirectionKeyUp(e, "a", Direction.LEFT);
        onDirectionKeyUp(e, "d", Direction.RIGHT);
        onDirectionKeyUp(e, "ArrowDown", Direction.DOWN);
        onDirectionKeyUp(e, "ArrowUp", Direction.UP);
        onDirectionKeyUp(e, "ArrowLeft", Direction.LEFT);
        onDirectionKeyUp(e, "ArrowRight", Direction.RIGHT);
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

export function checkInteraction(executeInteraction: boolean = false): solidInfo {
    if (executeInteraction) {
        console.log("Interaction called.");
    }
    const ourPlayer = getOurPlayer();
    const [facingX, facingY] = getCorrectedPlayerFacingCoordinates(ourPlayer);
    const solidInfo: solidInfo = getCollisionInfo()?.[facingX]?.[facingY];

    if (!solidInfo) {
        console.error(`no solidInfo for ${facingX}:${facingY}`);
        return null;
    }
    solidInfo.content && executeInteraction && solidInfo.content.onInteraction();
    currentInteraction = solidInfo.content;
    return solidInfo;
}

export function checkNewInteraction(map: MapData, executeInteraction: boolean = false): Interactive {
    if (executeInteraction) {
        console.log("Interaction called.");
    }
    const ourPlayer = getOurPlayer();
    const [newFacingX, newFacingY] = getNewPlayerFacingCoordinates(ourPlayer);
    let correctX = newFacingX % 16;
    let correctY = (newFacingY + 1) % 16;
    let copyX = correctX;
    let copyY = correctY;

    if (copyX < 0) {
        correctX = 16 - Math.abs(correctX);
    }
    else if (copyX == -16 % 16) {
        correctX = 0;
    }
    if (copyY < 0) {
        correctY = 16 - Math.abs(correctY);
    }
    else if (copyY == -16 % 16) {
        correctY = 0;
    }

    const ChunkX = newFacingX - correctX;
    const ChunkY = (newFacingY + 1) - correctY;

    const chunk = <Chunk> map.getChunk(ChunkX + "." + ChunkY);

    const content = chunk.data[correctX][correctY]._interactive;
    if (!content) {
        console.error(`no interactive for ${newFacingX}:${newFacingY}`);
        return null;
    }
    if (!(content instanceof Door)) {
        return null;
    }

    content && executeInteraction && content.onInteraction();
    currentInteraction = content;
    return currentInteraction;
}

const ID_BUTTON_INTERACT = "button-interact";
const ID_HELP_INTERACTION = "help-interaction";
const ID_HELP_INTERACTION_ITEM = "help-interaction-item";

const interactionNearbyButton: HTMLButtonElement = createInteractionButton(
    () => checkInteraction(true),
    ID_BUTTON_INTERACT,
    button => {
        button.style.opacity = "0";
        button.style.display = "none";
    }
);
appendFAIcon(interactionNearbyButton, "sign-in-alt");
//const [interactionHelp, interactionHelpItem]: [HTMLDivElement, HTMLSpanElement] = createInteractionHelp();
//interactionHelp.style.opacity = "0";
//interactionHelp.style.display = "none";
//helpFooter.append(interactionHelp);

let interactionInfoShown = false;

export function checkInteractionNearby() {
    const solidInfo: solidInfo = checkInteraction();
    const fade: boolean = inputMode === InputMode.NORMAL;
    if (solidInfo?.content && inputMode !== InputMode.INTERACTION) {
        if (!interactionInfoShown) {
            interactionInfoShown = true;
            interactionNearbyButton.disabled = false;
            //showElement(interactionHelp, fade && !consumeInteractionClosed());
            showElement(interactionNearbyButton, fade && !consumeInteractionClosed());
        }
        //interactionHelpItem.innerText = solidInfo.content.name;
    } else if (interactionInfoShown) {
        interactionInfoShown = false;
        interactionNearbyButton.disabled = true;
        hideElement(interactionNearbyButton, fade);
        //hideElement(interactionHelp, fade);
    }
}

/*function createInteractionHelp(): [HTMLDivElement, HTMLSpanElement] {
    const divElement: HTMLDivElement = document.createElement("div");
    divElement.id = ID_HELP_INTERACTION;
    const interactionHelpTextPrefix = document.createElement("span");
    interactionHelpTextPrefix.innerText = "Press ";
    divElement.append(interactionHelpTextPrefix);
    const interactionHelpKey: HTMLImageElement = document.createElement("img");
    interactionHelpKey.src = "../assets/img/transparent_32x32.png";
    interactionHelpKey.classList.add("key", "key-small");
    interactionHelpKey.style.backgroundPosition = "calc(6 * -32px) calc(-33px)";
    divElement.append(interactionHelpKey);
    const interactionHelpText = document.createElement("span");
    interactionHelpText.innerText = "to interact with ";
    divElement.append(interactionHelpText);
    const spanElement = document.createElement("span");
    spanElement.id = ID_HELP_INTERACTION_ITEM;
    divElement.append(spanElement);
    return [divElement, spanElement];
}*/

function showElement(element: HTMLElement, fade: boolean = true) {
    element.style.display = null;
    if (fade) {
        setTimeout(() => (element.style.opacity = "1"), 10);
    } else {
        element.style.opacity = "1";
    }
}

function hideElement(element: HTMLElement, fade: boolean = true) {
    element.style.opacity = "0";
    if (fade) {
        setTimeout(() => (element.style.display = interactionInfoShown ? null : "none"), 510);
    } else {
        element.style.display = "none";
    }
}
