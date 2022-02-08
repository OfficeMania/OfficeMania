import { Client, Room } from "colyseus.js";
import { TILE_SIZE } from "./player";
import {
    areWeAdmin,
    areWeLoggedIn,
    createPlayerAvatar,
    getCharacter,
    getCurrentVersion,
    getDisplayName,
    getOurPlayer,
    getUsername,
    InitState,
    InputMode,
    joinAndSync,
    loadCharacter,
    loadImage,
    loadUser,
    PlayerRecord,
    removeChildren,
    sendNotification,
    setCharacter,
    setClient,
    setCollisionInfo,
    setCurrentVersion,
    setDisplayName,
    setLocalCharacter,
    setLocalDisplayName,
    setMapInfo,
    setOurPlayer,
    setPlayers,
    setRoom,
    setUsername,
    updateCharacter,
    updateDisplayName,
    updateUsername,
} from "./util";
import { convertMapData, fillSolidInfos, MapInfo, solidInfo } from "./map";
import {
    applyConferenceSettings,
    initConference,
    loadConferenceSettings,
    nearbyPlayerCheck,
    toggleMuteByType,
    toggleSharing,
    toggleShowParticipantsTab,
    updateButtons,
    updateUsers,
} from "./conference/conference";
import { playerLoop } from "./movement";
import {
    checkInteraction,
    checkInteractionNearby,
    currentInteraction,
    getInputMode,
    loadInputFunctions,
    setInputMode,
} from "./input";
import { drawPlayers } from "./draw-player";
import {
    adminConfigButton,
    background,
    backpackCanvas,
    bsWelcomeModal,
    camButton,
    canvas,
    characterPreview,
    characterSelect,
    displayNameInput,
    doors,
    foreground,
    interactiveCanvas,
    interactiveChessCanvas,
    interactivePongCanvas,
    interactiveWhiteboardCanvas,
    loadingScreen,
    loginButton,
    logoutButton,
    muteButton,
    settingsApplyButton,
    settingsButton,
    settingsModal,
    settingsOkButton,
    shareButton,
    spriteSheet,
    usernameInput,
    usernameInputWelcome,
    usersButton,
    version,
    welcomeModal,
    welcomeOkButton,
} from "./static";
import { updateDoors } from "./interactive/door";
import { initLoadingScreenLoading, setShowLoadingscreen } from "./loadingscreen";
import AnimatedSpriteSheet from "./graphic/animated-sprite-sheet";
import { getInFocus, initChatListener } from "./textchat";
import { Backpack } from "./backpack";
import { MessageType } from "../common/util";
import { State } from "../common";
import {createMapJson, drawMap, GroundType, TileList} from "./newMap";

export const characters: { [key: string]: AnimatedSpriteSheet } = {};
export const START_POSITION_X = 5;
export const START_POSITION_Y = -10;
const MS_PER_UPDATE = 10;
const MS_PER_UPDATE2 = 15;

export var lowestX;
export var lowestY;


if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) {
    if (!window.location.search) {
        window.location.href = "/mobile.html";
    }
}

// Mute Buttons
muteButton.addEventListener("click", () => toggleMute("audio"));
camButton.addEventListener("click", () => toggleMute("video"));
shareButton.addEventListener("click", () => toggleMute("desktop")); //TODO Maybe make a confirmation dialog to confirm the stopping of a screenshare?

//toggle mute of tracks by type
function toggleMute(type: string) {
    if (type === "desktop") {
        toggleSharing();
    } else {
        toggleMuteByType(type);
    }
    updateButtons();
}

// Settings

adminConfigButton.addEventListener("click", () => adminConfig());
loginButton.addEventListener("click", () => login());
logoutButton.addEventListener("click", () => logout());

settingsButton.addEventListener("click", () => onSettingsOpen());
usersButton.addEventListener("click", () => toggleShowParticipantsTab());

settingsOkButton.addEventListener("click", () => applySettings());
settingsApplyButton.addEventListener("click", () => applySettings());

welcomeOkButton.addEventListener("click", () => applySettingsWelcome());

const observer = new MutationObserver(mutations => mutations.forEach(checkInputMode));
observer.observe(settingsModal, { attributes: true, attributeFilter: ["style"] });

//observer.observe(pongModal, {attributes: true, attributeFilter: ['style']});

export function checkInputMode() {
    if (settingsModal.style.display && !settingsModal.style.display.match(/none/)) {
        setInputMode(InputMode.IGNORE);
    } else if (welcomeModal.style.display && !welcomeModal.style.display.match(/none/)) {
        setInputMode(InputMode.IGNORE);
    } else if (!interactiveCanvas.style.visibility.match(/hidden/)) {
        setInputMode(InputMode.INTERACTION);
    } else if (!interactiveChessCanvas.style.visibility.match(/hidden/)) {
        setInputMode(InputMode.INTERACTION);
    } else if (!interactivePongCanvas.style.visibility.match(/hidden/)) {
        setInputMode(InputMode.INTERACTION);
    } else if (!interactiveWhiteboardCanvas.style.visibility.match(/hidden/)) {
        setInputMode(InputMode.INTERACTION);
    } else if (!backpackCanvas.style.visibility.match(/hidden/)) {
        setInputMode(InputMode.BACKPACK);
    } else if (getInFocus()) {
        setInputMode(InputMode.IGNORE);
    } else {
        setInputMode(InputMode.NORMAL);
    }
    //console.log(getInputMode());
}

function adminConfig() {
    window.location.href = "/admin/config";
}

function login() {
    window.location.href = "/auth/login";
}

function logout() {
    window.location.href = "/auth/logout";
}

function checkValidSettings() {
    let valid = checkValidUsernameInput();
    if (!checkValidDisplayNameInput()) {
        valid = false;
    }
    if (!checkValidCharacterSelect()) {
        valid = false;
    }
    settingsOkButton.disabled = !valid;
    settingsApplyButton.disabled = !valid;
}

function checkValidUsernameInput(): boolean {
    const value: string = usernameInput.value;
    const disabled: boolean = usernameInput.disabled;
    if (disabled || !value || value === "") {
        displayNameInput.style.color = "red";
        return disabled;
    }
    const valid = !!value.match(/^.{0,20}$/);
    usernameInput.style.color = valid ? null : "red";
    return valid;
}

function checkValidDisplayNameInput(): boolean {
    const value: string = displayNameInput.value;
    if (!value || value === "") {
        displayNameInput.style.color = null;
        return true;
    }
    const valid = !!value.match(/^.{0,20}$/);
    displayNameInput.style.color = valid ? null : "red";
    return valid;
}

function checkValidCharacterSelect(): boolean {
    removeChildren(characterPreview);
    characterPreview.append(createPlayerAvatar(characterSelect.value));
    return true;
}

usernameInput.addEventListener("change", () => checkValidSettings());
usernameInput.addEventListener("keydown", () => checkValidSettings());
usernameInput.addEventListener("paste", () => checkValidSettings());
usernameInput.addEventListener("input", () => checkValidSettings());

displayNameInput.addEventListener("change", () => checkValidSettings());
displayNameInput.addEventListener("keydown", () => checkValidSettings());
displayNameInput.addEventListener("paste", () => checkValidSettings());
displayNameInput.addEventListener("input", () => checkValidSettings());

characterSelect.addEventListener("change", () => checkValidSettings());

function loadUsernameSettings() {
    if (areWeLoggedIn()) {
        usernameInput.value = getUsername();
        usernameInput.style.color = null;
        usernameInput.disabled = false;
    } else {
        usernameInput.value = "Not Logged In";
        usernameInput.style.color = "red";
        usernameInput.disabled = true;
    }
}

function loadDisplayNameSettings() {
    displayNameInput.value = getDisplayName();
}

function convertCharacterName(key: string) {
    return key.replace(/_/gi, " ").replace(/\d\dx\d\d\.png/gi, "");
}

function loadCharacterSettings() {
    if (characters) {
        removeChildren(characterSelect);
        const character: string = getCharacter();
        let selectedIndex = -1;
        let counter = 0;
        for (const key of Object.keys(characters)) {
            if (character && key === character) {
                selectedIndex = counter;
            }
            counter++;
            const option = document.createElement("option");
            option.value = key;
            option.innerText = convertCharacterName(key);
            characterSelect.append(option);
        }
        characterSelect.selectedIndex = selectedIndex;
        characterSelect.disabled = false;
    } else {
        characterSelect.disabled = true;
    }
}

function onSettingsOpen() {
    if (currentInteraction === null) {
        interactiveCanvas.style.visibility = "hidden";
        backpackCanvas.style.visibility = "hidden";
        interactiveChessCanvas.style.visibility = "hidden";
        interactivePongCanvas.style.visibility = "hidden";
        interactiveWhiteboardCanvas.style.visibility = "hidden";
    }
    currentInteraction?.hide();
    loadSettings();
    setInputMode(InputMode.IGNORE);
}

function loadSettings() {
    loadUsernameSettings();
    loadDisplayNameSettings();
    loadCharacterSettings();
    loadConferenceSettings().catch(console.error);
    checkValidSettings();
}

function saveUsernameSettings() {
    if (!usernameInput.disabled && usernameInput.value) {
        updateUsername(usernameInput.value);
    }
}

function saveDisplayNameSettings() {
    if (!displayNameInput.value && !areWeLoggedIn()) {
        displayNameInput.value = getOurPlayer().displayName;
        return;
    }
    updateDisplayName(getOurPlayer().displayName, displayNameInput.value);
}

function saveCharacterSettings() {
    if (characterSelect.value) {
        updateCharacter(characterSelect.value);
    }
}

function applySettings() {
    saveUsernameSettings();
    saveDisplayNameSettings();
    saveCharacterSettings();
    applyConferenceSettings();
}

function applySettingsWelcome() {
    if (usernameInputWelcome.value) {
        updateDisplayName(getOurPlayer().displayName, usernameInputWelcome.value);
    }
    setInputMode(InputMode.NORMAL);
}

function showWelcomeScreen() {
    bsWelcomeModal.show();
}

function checkWelcomeScreen() {
    const currentVersion = getCurrentVersion();
    if (!currentVersion || version > currentVersion) {
        showWelcomeScreen();
    }
    setCurrentVersion(version);
}

function onUsernameUpdate(username: string): void {
    setUsername(username);
    usernameInput.value = username;
}

function onDisplayNameUpdate(displayName: string): void {
    setDisplayName(displayName);
    if (!areWeLoggedIn()) {
        setLocalDisplayName(displayName);
    }
    displayNameInput.value = displayName;
}

function onCharacterUpdate(character: string): void {
    setCharacter(character);
    if (!areWeLoggedIn()) {
        setLocalCharacter(character);
    }
}

function setupRoomListener(room: Room<State>) {
    room.onMessage(MessageType.UPDATE_USERNAME, onUsernameUpdate);
    room.onMessage(MessageType.UPDATE_DISPLAY_NAME, onDisplayNameUpdate);
    room.onMessage(MessageType.UPDATE_CHARACTER, onCharacterUpdate);
    //if someone knocks on a door
    room.onMessage(MessageType.DOOR_NOTIFICATION, (message: string) => sendNotification(message));
    room.onMessage(MessageType.DOOR_KNOCK_SUCCESS, (message: string) => sendNotification(message));
}

// async is necessary here, because we use 'await' to resolve the promises
async function main() {
    initLoadingScreenLoading();
    /*
     * We communicate to our server via WebSockets (ws-protocol instead of http)
     */
    let host = window.document.location.host.replace(/:.*/, "");
    let protocol = location.protocol.replace("http", "ws") + "//";
    let portSuffix = location.port ? ":" + location.port : "";
    const client: Client = new Client(protocol + host + portSuffix);
    setClient(client);

    // Keep track of all (active) players (from movement)
    const players: PlayerRecord = {};
    setPlayers(players);

    /*
     * Before we can launch our main functionality, we need to join a room and
     * wait for our player to be available to the server.
     *
     * room and ourPlayer are currently unused, but are probably of use  later
     */
    const [room, ourPlayer]: InitState = await joinAndSync(client, players);
    setRoom(room);
    setOurPlayer(ourPlayer);
    setupRoomListener(room);
    const loggedIn: boolean = areWeLoggedIn();
    loginButton.hidden = loggedIn;
    logoutButton.hidden = !loggedIn;
    const admin: boolean = areWeAdmin();
    adminConfigButton.hidden = !admin;

    /*
     * Then, we wait for our map to load
     */



    let newMap = await createMapJson(room, spriteSheet);
    newMap.mergeAnimation();
    background.width = Math.abs(newMap._highestPosx + 1 - newMap._lowestPosx) * 48;
    background.height = Math.abs(newMap._highestPosy + 1 - newMap._lowestPosy) * 48;
    foreground.width = background.width;
    foreground.height = background.height;
    let ctxB = background.getContext("2d");
    let ctxF = foreground.getContext("2d");

    await newMap.updateAnimationCounter();

    for (let i = 0; i < newMap._layerList.length; i++) {
        drawMap(newMap, spriteSheet, background, newMap._lowestPosx, newMap._lowestPosy, newMap._highestPosx, newMap._highestPosy, i);
    }

    //For getting the SpriteSheet as png
    //let img = background.toDataURL("image/png");
    //document.write('<img src="' + img + '"/>');

    /*
     * Then, we wait for our map to load
     */

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");

    //load map from server
    const mapJson = await fetch("/map/Map.json").then(response => response.json());
    const map: MapInfo = await convertMapData(mapJson, room, foreground); // foreground is for testing;
    setMapInfo(map);

    let currentMap = new MapInfo(
        map.layers,
        map.tileSets,
        map.canvas,
        map.resolution,
        map.textures,
        map.lowestX,
        map.lowestY,
        map.highestY,
        map.highestX
    );

    //i guess it should not be here but i don't know where it should be
    ourPlayer.backpack = new Backpack();

    //ask for permission to send notifications
    if("Notification" in window) {
        window.Notification.requestPermission();
    }

    checkWelcomeScreen();

    //INITIATE CHAT

    initChatListener();

    //loads all the character information
    loadUser();
    document.getElementById("name-form").addEventListener(
        "submit",
        function (e) {
            e.preventDefault();
        },
        false
    );
    await loadCharacter();
    checkInputMode();

    let collisionInfo: solidInfo[][] = fillSolidInfos(currentMap);
    setCollisionInfo(collisionInfo);
    // console.log(collisionInfo);

    doors.height = currentMap.canvas.height;
    doors.width = currentMap.canvas.width;

    //retrieve lowest coords
    lowestX = currentMap.lowestX;
    lowestY = currentMap.lowestY;
    //console.log(lowestX, lowestY)

    //start position
    let posX: number = (START_POSITION_X + Math.floor(currentMap.widthOfMap / 2)) * currentMap.resolution;
    let posY: number = (START_POSITION_Y + Math.floor(currentMap.heightOfMap / 2)) * currentMap.resolution;
    let coordinateX: number;
    let coordinateY: number;

    /* (from movement)
     * movement inputs
     *
     * ourPlayer is the currentPlayer
     *
     * prioDirection is used, so that you can press another direction without
     * needing to let go of the first button pressed
     */

    //loads all the input functions
    loadInputFunctions();

    // message recieve test

    room.onMessage("skill", message => {
        console.log("lol");
    });

    initConference(room);

    /* (from movement)
     * Create a gameLoop-like function for drawing a simple animation
     *
     * See: https://gameprogrammingpatterns.com/game-loop.html
     */

    let playerNearbyTimer = 0;

    //load image for help message
    const pressEImage: HTMLImageElement = await loadImage( "../assets/keys/KeysExtended.png");

    async function loop(now: number) {

        //update the animationloop
        await newMap.updateAnimationCounter();

        //clear the canvas
        ctx.clearRect(0, 0, width, height);

        //update width and height
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        width = canvas.width;
        height = canvas.height;

        //calculate everything regarding the player
        playerLoop(ourPlayer, players, room, now, canvas, ctx, collisionInfo);

        /*
         * Repaint the scene
         */

        //the new Position of yourself in relation to the map
        coordinateX = (ourPlayer.positionX / TILE_SIZE) + START_POSITION_X;
        posX = Math.abs(coordinateX - newMap._lowestPosx) * TILE_SIZE;
        coordinateY = (ourPlayer.positionY / TILE_SIZE) + START_POSITION_Y;
        posY = Math.abs(coordinateY- newMap._lowestPosy) * TILE_SIZE;

        //detection if someone is nearby, executed only every 20th time
        playerNearbyTimer++;
        if (playerNearbyTimer % 20 === 0) {
            playerNearbyTimer = 0;
            nearbyPlayerCheck();
        } else if (playerNearbyTimer % 20 === 10) {
            updateUsers();
            //updateChat();
        }

        //check if interaction is nearby
        checkInteractionNearby();

        for (const ANIMATION of newMap._animationList) {
            if (Math.abs(coordinateX - ANIMATION.posx) <= Math.floor(width / 2 / TILE_SIZE) && Math.abs(coordinateY - ANIMATION.posy) <= Math.floor(height / 2 / TILE_SIZE)) {
                let startx = ANIMATION.posx;
                let starty = ANIMATION.posy;
                ctxB.clearRect(
                    (startx + Math.abs(newMap._lowestPosx)) * TILE_SIZE,
                    (starty + Math.abs(newMap._lowestPosy)) * TILE_SIZE,
                    ANIMATION.width * TILE_SIZE, ANIMATION.height * TILE_SIZE);

                for (let i = 0; i < newMap._layerList.length; i++) {
                    drawMap(
                        newMap,
                        spriteSheet,
                        background,
                        startx,
                        starty,
                        startx + ANIMATION.width - 1,
                        starty + ANIMATION.height - 1,
                        i);
                }
            }
        }

        ctx.drawImage(
            background,
            posX - Math.floor(width / 2),
            posY - Math.floor(height / 2),
            width,
            height,
            0,
            0,
            width,
            height);

        //check if a doorState changed
        updateDoors(spriteSheet, background, newMap, 48);

        ctx.save();

        // Draw each player
        drawPlayers(ourPlayer, players, characters, ctx, width, height);

        //draw press e thing
        if (checkInteraction()?.content) {
            ctx.globalAlpha = 0.75;
            ctx.drawImage(pressEImage, 192, 33, 32, 32, Math.floor(width / 2) + 50, Math.floor(height / 2) + 80, 32, 32);
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        //drawWhiteboard(canvas, whiteboard.getCanvas())
        if (getInputMode() === InputMode.INTERACTION) {
            checkInteraction()?.content?.loop();
        }

        // Repeat game loop
        requestAnimationFrame(loop);
    }

    //loadingScreen.style.display = "none";
    setShowLoadingscreen(false);
    interactiveCanvas.style.visibility = "hidden";
    interactiveWhiteboardCanvas.style.visibility = "hidden";
    interactiveChessCanvas.style.visibility = "hidden";
    interactivePongCanvas.style.visibility = "hidden";
    backpackCanvas.style.visibility = "hidden";
    checkInputMode();
    // Start game loop
    requestAnimationFrame(loop);
}

main();
