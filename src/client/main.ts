import {Client} from "colyseus.js";
import {TILE_SIZE} from "./player";
import {
    getCharacter,
    getUsername,
    InitState,
    joinAndSync,
    PlayerRecord,
    setCharacter,
    setRoom,
    setUsername,
    loadCharacter
} from "./util";
import {convertMapData, drawMap, fillSolidInfos, mapInfo, solidInfo} from "./map";
import {
    applyConferenceSettings,
    initConference,
    loadConferenceSettings,
    nearbyPlayerCheck,
    toggleMuteByType,
    toggleSharing,
    updateUsers
} from "./conference/conference";
import {playerLoop} from "./movement";
import {loadInputFunctions, setKeysDisabled} from "./input";
import {drawPlayer} from "./drawplayer"



export var characters: { [key: string]: HTMLImageElement } = {}
const START_POSITION_X = -13;
const START_POSITION_Y = -8;
const MS_PER_UPDATE = 10;
const MS_PER_UPDATE2 = 15;

export var lowestX;
export var lowestY;

function $<T extends HTMLElement>(a: string) {
    return <T>document.getElementById(a);
}

// Mute Buttons

const muteButton = $<HTMLButtonElement>("button-mute-audio");
const camButton = $<HTMLButtonElement>("button-mute-video");
const shareButton = $<HTMLButtonElement>("button-share-video");

muteButton.addEventListener("click", () => toggleMute("audio"));
camButton.addEventListener("click", () => toggleMute("video"));
shareButton.addEventListener("click", () => toggleMute("desktop")); //TODO Maybe make a confirmation dialog to confirm the stopping of a screenshare?

export function setAudioButtonMute(muted: boolean, sharing: boolean = false) {
    //muteButton.toggleAttribute("disabled", sharing);
    muteButton.toggleAttribute("disabled", false);
    muteButton.innerHTML = muted ? "<em class = \"fa fa-microphone-slash\"></em><span></span>" : "<em class = \"fa fa-microphone\"></em><span></span>";
}

export function setVideoButtonMute(muted: boolean, sharing: boolean = false) {
    camButton.toggleAttribute("disabled", false);
    const camNormal = "<em class = \"fa fa-video\"></em><span></span>";
    const camMuted = "<em class = \"fa fa-video-slash\"></em><span></span>";
    const sharingNormal = "<em class = \"fa fa-pause\"></em><span></span>";
    const sharingMuted = "<em class = \"fa fa-play\"></em><span></span>";
    const textNormal = sharing ? sharingNormal : camNormal;
    const textMuted = sharing ? sharingMuted : camMuted;
    camButton.innerHTML = muted ? textMuted : textNormal;
}

export function setSwitchToDesktop(enabled: boolean, supported: boolean = false) {
    shareButton.toggleAttribute("disabled", !supported);
    shareButton.innerHTML = enabled ? "<em class = \"fa fa-user\"></em><span></span>" : "<em class = \"fa fa-desktop\"></em><span></span>";
}

//toggle mute of tracks by type
function toggleMute(type: string) {
    if (type === "desktop") {
        toggleSharing(setSwitchToDesktop);
    } else {
        toggleMuteByType(type);
    }
}

// Settings

const settingsModal = $<HTMLDivElement>("settings-modal");

const settingsButton = $<HTMLButtonElement>("button-settings");
const settingsOkButton = $<HTMLButtonElement>("button-settings-ok");
//const settingsCancelButton = $<HTMLButtonElement>("button-settings-cancel");
const settingsApplyButton = $<HTMLButtonElement>("button-settings-apply");

settingsButton.addEventListener("click", () => onSettingsOpen());
settingsOkButton.addEventListener("click", () => applySettings());
settingsApplyButton.addEventListener("click", () => applySettings());

const usernameInput = $<HTMLInputElement>("input-settings-username");
const characterSelect = $<HTMLSelectElement>("character-select");

const observer = new MutationObserver(mutations => mutations.forEach(() => setKeysDisabled(!settingsModal.style.display.match(/none/))));
observer.observe(settingsModal, {attributes: true, attributeFilter: ['style']});

function checkValidSettings() {
    const valid = checkValidUsernameInput();
    settingsOkButton.disabled = !valid;
    settingsApplyButton.disabled = !valid;
}

function checkValidUsernameInput(): boolean {
    const username = usernameInput.value;
    const valid = !!username.match(/^\w{0,20}$/);
    usernameInput.style.color = valid ? null : "red";
    return valid;
}

usernameInput.addEventListener("change", () => checkValidSettings());
usernameInput.addEventListener("keydown", () => checkValidSettings());
usernameInput.addEventListener("paste", () => checkValidSettings());
usernameInput.addEventListener("input", () => checkValidSettings());

let getUsernameIntern: () => string = () => getUsername();
let getCharacterIntern: () => string = () => getCharacter();

function loadUsernameSettings() {
    if (getUsernameIntern) {
        usernameInput.value = getUsernameIntern();
        usernameInput.disabled = false;
    } else {
        usernameInput.value = "";
        usernameInput.disabled = true;
    }
}

function convertCharacterName(key: string) {
    return key.replace(/_/gi, " ").replace(/\d\dx\d\d\.png/gi, "");
}

function loadCharacterSettings() {
    if (characters) {
        while (characterSelect.firstChild) {
            characterSelect.firstChild.remove();
        }
        const current = getCharacterIntern?.();
        let selectedIndex = -1;
        let counter = 0;
        for (const [key, image] of Object.entries(characters)) {
            if (current && key === current) {
                selectedIndex = counter;
            }
            counter++;
            const option = document.createElement("option");
            option.value = key;
            option.innerText = convertCharacterName(key);
            option.style.background = `url(${image.src}) no-repeat`; //FIXME Doesn't work, also the file contains multiple views of the character
            characterSelect.append(option);
        }
        characterSelect.selectedIndex = selectedIndex;
        characterSelect.disabled = false;
    } else {
        characterSelect.disabled = true;
    }
}

function onSettingsOpen() {
    loadSettings();
    setKeysDisabled(true);
}

function loadSettings() {
    loadUsernameSettings();
    loadCharacterSettings();
    loadConferenceSettings().catch(console.error);
    checkValidSettings();
}

let setUsernameIntern: (username: string) => void = undefined;
let setCharacterIntern: (character: string) => void = undefined;

function applySettings() {
    if (setUsernameIntern && usernameInput.value) {
        setUsernameIntern(usernameInput.value);
    }
    if (setCharacterIntern && characterSelect.value) {
        setCharacterIntern(characterSelect.value);
    }
    applyConferenceSettings();
}

// async is necessary here, because we use 'await' to resolve the promises
async function main() {
    /*
     * We communicate to our server via WebSockets (ws-protocol instead of http)
     */
    let host = window.document.location.host.replace(/:.*/, '');
    let protocol = location.protocol.replace("http", "ws") + "//";
    let portSuffix = (location.port ? ':' + location.port : '');
    let client = new Client(protocol + host + portSuffix);

    // Keep track of all (active) players (from movement)
    let players: PlayerRecord = {};

    /*
     * Before we can launch our main functionality, we need to join a room and
     * wait for our player to be available to the server.
     *
     * room and ourPlayer are currently unused, but are probably of use  later
     */
    const [room, ourPlayer]: InitState = await joinAndSync(client, players);
    setRoom(room);

    getUsernameIntern = () => ourPlayer.name;
    getCharacterIntern = () => ourPlayer.character;
    setUsernameIntern = (username) => setUsername(username, ourPlayer, room);
    setCharacterIntern = (character) => setCharacter(character, ourPlayer, room, characters);

    //loads all the character information
    loadCharacter(ourPlayer, room, characters);

    /*
     * Then, we wait for our map to load
     */
    let canvas = $<HTMLCanvasElement>("canvas");
    let background = $<HTMLCanvasElement>("background");

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");

    //load map from server
    let xml = new XMLHttpRequest();
    xml.open("GET", "/map/Map.json", false);
    xml.send(null);

    let map: Promise<mapInfo> = convertMapData(xml.responseText, room, background);

    let currentMap = new mapInfo((await map).layers, (await map).tilesets, (await map).canvas, (await map).resolution, (await map).textures, (await map).lowestX, (await map).lowestY, (await map).highestY, (await map).highestX);
    let collisionInfo: solidInfo[][] = fillSolidInfos(currentMap);
    console.log(collisionInfo)

    //retrieve lowest coords
    lowestX = currentMap.lowestX;
    lowestY = currentMap.lowestY;
    console.log(lowestX, lowestY)

    //start position
    let posX: number = (START_POSITION_X + Math.floor(currentMap.widthOfMap / 2)) * currentMap.resolution;
    let posY: number = (START_POSITION_Y + Math.floor(currentMap.heightOfMap / 2)) * currentMap.resolution;

    drawMap(currentMap);

    /* (from movement)
     * movement inputs
     *
     * ourPlayer is the currentPlayer
     *
     * prioDirection is used, so that you can press another direction without
     * needing to let go of the first button pressed
     */

    //loads all the input functions
    loadInputFunctions(ourPlayer, room, characters);

    // message recieve test

    room.onMessage("skill", (message) => {
        console.log("lol")
    });

    initConference(room);


    /* (from movement)
     * Create a gameLoop-like function for drawing a simple animation
     *
     * See: https://gameprogrammingpatterns.com/game-loop.html
     */

    let playerNearbyTimer = 0;

    function loop(now: number) {

        ctx.clearRect(0, 0, width, height);

        //update width and height
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        width = canvas.width;
        height = canvas.height;

        //calculate everything regarding the player
        playerLoop(ourPlayer, players, room, now, canvas, ctx, collisionInfo)


        /*
         * Repaint the scene
         */

        //the new Position of yourself in relation to the map
        posX = ((ourPlayer.positionX / TILE_SIZE) + START_POSITION_X + Math.floor(currentMap.widthOfMap / 2)) * TILE_SIZE;
        posY = ((ourPlayer.positionY / TILE_SIZE) + START_POSITION_Y + Math.floor(currentMap.heightOfMap / 2)) * TILE_SIZE;

        //detection if someone is nearby, executed only every 20th time
        playerNearbyTimer++;
        if (playerNearbyTimer % 20 === 0) {
            playerNearbyTimer = 0;
            nearbyPlayerCheck(players, ourPlayer, collisionInfo);
        } else if (playerNearbyTimer % 20 === 10) {
            updateUsers(players);
        }

        //DESIGN TODO: when something on the map changes: drawMap

        //TODO: draw background on canvas - need to make movestuff here
        ctx.drawImage(background, posX - Math.floor(width / 2), posY - Math.floor(height / 2), width, height, 0, 0, width, height);

        ctx.save();

        // Draw each player
        drawPlayer(ourPlayer, players, characters, ctx, width, height);

        ctx.restore();

        // Repeat game loop
        requestAnimationFrame(loop);
    }

    // Start game loop
    requestAnimationFrame(loop);
}

main();
