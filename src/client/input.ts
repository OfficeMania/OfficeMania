import {
    appendFAIcon,
    consumeInteractionClosed,
    createInteractionButton,
    getCollisionInfo,
    getCorrectedPlayerFacingCoordinates,
    getOurPlayer,
    InputMode,
    payRespect,
    setCharacter,
    setUsername
} from "./util";
import {toggleShowParticipantsTab} from "./conference/conference";
import {Direction} from "../common/util";
import {solidInfo} from "./map";
import {characters} from "./main";
import {Interactive} from "./interactive/interactive";
import {camButton, helpButton, helpFooter, muteButton, settingsButton, shareButton} from "./static";

let inputMode: InputMode = InputMode.NORMAL;

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
    if (/*!isPureKey(event) || */event.key.toLowerCase() !== key.toLowerCase()) {
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

export function loadInputFunctions() {
    function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape" && inputMode !== InputMode.NORMAL) {
            checkInteraction().content.leave();
            return;
        }
        if (inputMode === InputMode.WRITETODO) {
            return;
        }
        if (inputMode === InputMode.SETTINGS) {
            return;
        }
        const ourPlayer = getOurPlayer();
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
        onPureKey(e, "f", () => payRespect());
        onPureKey(e, "n", () => muteButton.click());
        onPureKey(e, "m", () => camButton.click());
        onPureKey(e, ",", () => shareButton.click());
        onPureKey(e, "q", () => settingsButton.click());
        onPureKey(e, "h", () => helpButton.click());
    }

    function onKeyUp(e: KeyboardEvent) {
        if (inputMode === InputMode.SETTINGS) {
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
    const ourPlayer = getOurPlayer();
    const [facingX, facingY] = getCorrectedPlayerFacingCoordinates(ourPlayer);
    const solidInfo: solidInfo = getCollisionInfo()?.[facingX]?.[facingY];
    if (!solidInfo) {
        console.error(`no solidInfo for ${facingX}:${facingY}`);
        return null;
    }
    solidInfo.content && executeInteraction && solidInfo.content.onInteraction();
    currentInteraction = solidInfo.content
    return solidInfo;
}

const ID_BUTTON_INTERACT = "button-interact";
const ID_HELP_INTERACTION = "help-interaction";
const ID_HELP_INTERACTION_ITEM = "help-interaction-item";

const interactionNearbyButton: HTMLButtonElement = createInteractionButton(() => checkInteraction(true), ID_BUTTON_INTERACT, (button) => {
    button.style.opacity = "0";
    button.style.display = "none";
});
appendFAIcon(interactionNearbyButton, "fa-sign-in-alt");
const [interactionHelp, interactionHelpItem]: [HTMLDivElement, HTMLSpanElement] = createInteractionHelp();
interactionHelp.style.opacity = "0";
interactionHelp.style.display = "none";
helpFooter.append(interactionHelp);

let interactionInfoShown = false;

export function checkInteractionNearby() {
    const solidInfo: solidInfo = checkInteraction();
    const fade: boolean = inputMode === InputMode.NORMAL;
    if (solidInfo?.content && inputMode !== InputMode.INTERACTION && inputMode !== InputMode.WRITETODO) {
        if (!interactionInfoShown) {
            interactionInfoShown = true;
            interactionHelpItem.innerText = solidInfo.content.name;
            interactionNearbyButton.disabled = false;
            showElement(interactionHelp, fade && !consumeInteractionClosed());
            showElement(interactionNearbyButton, fade && !consumeInteractionClosed());
        }
    } else if (interactionInfoShown) {
        interactionInfoShown = false;
        interactionNearbyButton.disabled = true;
        hideElement(interactionNearbyButton, fade);
        hideElement(interactionHelp, fade);
    }
}

function createInteractionHelp(): [HTMLDivElement, HTMLSpanElement] {
    const divElement: HTMLDivElement = document.createElement("div");
    divElement.id = ID_HELP_INTERACTION;
    const interactionHelpTextPrefix = document.createElement("span");
    interactionHelpTextPrefix.innerText = "Press ";
    divElement.append(interactionHelpTextPrefix);
    const interactionHelpKey: HTMLImageElement = document.createElement("img");
    interactionHelpKey.src = "../assets/img/transparent_32x32.png";
    interactionHelpKey.classList.add("key", "key-small");
    interactionHelpKey.style.backgroundPosition = "calc(6 * -32px) calc(-32px)";
    divElement.append(interactionHelpKey);
    const interactionHelpText = document.createElement("span");
    interactionHelpText.innerText = "to interact with ";
    divElement.append(interactionHelpText);
    const spanElement = document.createElement("span");
    spanElement.id = ID_HELP_INTERACTION_ITEM;
    divElement.append(spanElement);
    return [divElement, spanElement];
}

function showElement(element: HTMLElement, fade: boolean = true) {
    element.style.display = null;
    if (fade) {
        setTimeout(() => element.style.opacity = "1", 10);
    } else {
        element.style.opacity = "1";
    }
}

function hideElement(element: HTMLElement, fade: boolean = true) {
    element.style.opacity = "0";
    if (fade) {
        setTimeout(() => element.style.display = "none", 510);
    } else {
        element.style.display = "none";
    }
}
