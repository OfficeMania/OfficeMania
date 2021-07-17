import {
    appendFAIcon,
    consumeInteractionClosed,
    createInteractionButton,
    getCollisionInfo,
    getCorrectedPlayerFacingCoordinates,
    getOurPlayer,
    InputMode,
    payRespect,
    removeChildren,
    setCharacter,
    setUsername
} from "./util";
import {toggleMuteByType, toggleShowParticipantsTab} from "./conference/conference";
import {Direction} from "../common/util";
import {solidInfo} from "./map";
import {characters} from "./main";
import {Interactive} from "./interactive/interactive";
import {helpFooter} from "./static";

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
    const ourPlayer = getOurPlayer();
    switch (inputMode) {
        case InputMode.NORMAL:
            if (!ourPlayer.priorDirections.includes(direction)) {
                ourPlayer.priorDirections.unshift(direction);
            }
            break;
        case InputMode.INTERACTION:
            const solidInfo = checkInteraction();
            if (!solidInfo) {
                break;
            }
            const content = solidInfo.content;
            if (!content.input.includes(direction)) {
                content.input.unshift(direction);
            }
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
            const solidInfo = checkInteraction();
            if (!solidInfo) {
                break;
            }
            const content = solidInfo.content;
            let index = -1;
            index = content.input.indexOf(direction);
            if (index > -1) content.input.splice(index, 1);
            break;

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
        onPureKey(e, "m", () => toggleMuteByType("audio"));
        onPureKey(e, "n", () => toggleMuteByType("video"));
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

const interactionNearbyButton: HTMLButtonElement = createInteractionButton(() => checkInteraction(true), ID_BUTTON_INTERACT, (button) => {
    button.style.opacity = "0";
    button.style.display = "none";
});
appendFAIcon(interactionNearbyButton, "fa-sign-in-alt");

let interactionInfoShown = false;

export function checkInteractionNearby() {
    const solidInfo: solidInfo = checkInteraction();
    const fade: boolean = inputMode === InputMode.NORMAL;
    if (solidInfo?.content && inputMode !== InputMode.INTERACTION && inputMode !== InputMode.WRITETODO) {
        if (!interactionInfoShown) {
            interactionInfoShown = true;
            const interactionHelp: HTMLDivElement = createInteractionHelp(solidInfo.content.name);
            helpFooter.append(interactionHelp);
            showButton(interactionNearbyButton, fade && !consumeInteractionClosed());
        }
    } else if (interactionInfoShown) {
        interactionInfoShown = false;
        hideButton(interactionNearbyButton, fade);
        removeChildren(helpFooter);
    }
}

function createInteractionHelp(interactiveName: string) {
    const interactionHelp: HTMLDivElement = document.createElement("div");
    interactionHelp.id = ID_HELP_INTERACTION;
    const interactionHelpTextPrefix = document.createElement("span");
    interactionHelpTextPrefix.innerText = "Press ";
    interactionHelp.append(interactionHelpTextPrefix);
    const interactionHelpKey: HTMLImageElement = document.createElement("img");
    interactionHelpKey.src = "../assets/img/transparent_32x32.png";
    interactionHelpKey.classList.add("key", "key-small");
    interactionHelpKey.style.backgroundPosition = "calc(6 * -32px) calc(-32px)";
    interactionHelp.append(interactionHelpKey);
    const interactionHelpText = document.createElement("span");
    interactionHelpText.innerText = "to interact with " + interactiveName;
    interactionHelp.append(interactionHelpText);
    return interactionHelp;
}

function showButton(button: HTMLButtonElement, fade: boolean = true) {
    button.style.display = null;
    button.disabled = false;
    if (fade) {
        setTimeout(() => button.style.opacity = "1", 10);
    } else {
        button.style.opacity = "1";
    }
}

function hideButton(button: HTMLButtonElement, fade: boolean = true) {
    interactionNearbyButton.disabled = true;
    interactionNearbyButton.style.opacity = "0";
    if (fade) {
        setTimeout(() => interactionNearbyButton.style.display = "none", 510);
    } else {
        interactionNearbyButton.style.display = "none";
    }
}
