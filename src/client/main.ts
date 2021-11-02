import {Client} from "colyseus.js";
import {TILE_SIZE} from "./player";
import {
    createPlayerAvatar,
    getCharacter,
    getCurrentVersion,
    getUsername,
    InitState,
    InputMode,
    joinAndSync,
    loadCharacter,
    PlayerRecord,
    removeChildren,
    setCharacter,
    setCollisionInfo,
    setCurrentVersion,
    setMapInfo,
    setOurPlayer,
    setPlayers,
    setRoom,
    setUsername
} from "./util";
import {convertMapData, drawMap, fillSolidInfos, MapInfo, solidInfo} from "./map";
import {
    applyConferenceSettings,
    initConference,
    loadConferenceSettings,
    nearbyPlayerCheck,
    toggleMuteByType,
    toggleSharing,
    toggleShowParticipantsTab,
    updateButtons,
    updateChat,
    updateUsers
} from "./conference/conference";
import {playerLoop} from "./movement";
import {
    checkInteraction,
    checkInteractionNearby,
    currentInteraction,
    getInputMode,
    loadInputFunctions,
    setInputMode
} from "./input";
import {drawPlayers} from "./draw-player"
import {
    background,
    camButton,
    canvas,
    characterPreview,
    characterSelect,
    doors,
    interactiveCanvas,
    muteButton,
    settingsApplyButton,
    settingsButton,
    settingsModal,
    settingsOkButton,
    shareButton,
    usernameInput,
    usernameInputWelcome,
    usersButton,
    version,
    welcomeModal,
    welcomeOkButton
} from "./static";
import {updateDoors} from "./interactive/door";
import {initLoadingScreenLoading, setShowLoadingscreen} from "./loadingscreen";
import AnimatedSpriteSheet from "./graphic/animated-sprite-sheet";

export const characters: { [key: string]: AnimatedSpriteSheet } = {}
export const START_POSITION_X = 5;
export const START_POSITION_Y = -10;
const MS_PER_UPDATE = 10;
const MS_PER_UPDATE2 = 15;

export var lowestX;
export var lowestY;

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

settingsButton.addEventListener("click", () => onSettingsOpen());
usersButton.addEventListener("click", () => toggleShowParticipantsTab());

settingsOkButton.addEventListener("click", () => applySettings());
settingsApplyButton.addEventListener("click", () => applySettings());

welcomeOkButton.addEventListener("click", () => applySettingsWelcome());


const observer = new MutationObserver(mutations => mutations.forEach(checkInputMode));
observer.observe(settingsModal, {attributes: true, attributeFilter: ['style']});

//observer.observe(pongModal, {attributes: true, attributeFilter: ['style']});

export function checkInputMode() {
    if (settingsModal.style.display && !settingsModal.style.display.match(/none/)) {
        setInputMode(InputMode.IGNORE);
    } else if (welcomeModal.style.display && !welcomeModal.style.display.match(/none/)) {
        setInputMode(InputMode.IGNORE);
    } else if (!interactiveCanvas.style.visibility.match(/hidden/)) {
        setInputMode(InputMode.INTERACTION);
    } else {
        setInputMode(InputMode.NORMAL);
    }
    //console.log(getInputMode());
}

function checkValidSettings() {
    let valid = checkValidUsernameInput();
    if (!checkValidCharacterSelect()) {
        valid = false;
    }
    settingsOkButton.disabled = !valid;
    settingsApplyButton.disabled = !valid;
}

function checkValidUsernameInput(): boolean {
    const username = usernameInput.value;
    const valid = !!username.match(/^.{0,20}$/);
    usernameInput.style.color = valid ? null : "red";
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

characterSelect.addEventListener("change", () => checkValidSettings());

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
        removeChildren(characterSelect);
        const current = getCharacterIntern?.();
        let selectedIndex = -1;
        let counter = 0;
        for (const key of Object.keys(characters)) {
            if (current && key === current) {
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
    if(currentInteraction === null){interactiveCanvas.style.visibility = "hidden";}
    currentInteraction?.hide();
    loadSettings();
    setInputMode(InputMode.IGNORE);
}

function loadSettings() {
    loadUsernameSettings();
    loadCharacterSettings();
    loadConferenceSettings().catch(console.error);
    checkValidSettings();
}

function applySettings() {
    if (usernameInput.value) {
        setUsername(usernameInput.value);
    }
    if (characterSelect.value) {
        setCharacter(characterSelect.value);
    }
    applyConferenceSettings();
}

function applySettingsWelcome() {
    if (usernameInputWelcome.value) {
        setUsername(usernameInputWelcome.value);
    }
    setInputMode(InputMode.NORMAL);
}

function showWelcomeScreen() {
    // @ts-ignore
    $("#welcome-modal").modal();
}

function checkWelcomeScreen() {
    const currentVersion = getCurrentVersion();
    if (!currentVersion || version > currentVersion) {
        showWelcomeScreen();
    }
    setCurrentVersion(version);
}

// async is necessary here, because we use 'await' to resolve the promises
async function main() {
    initLoadingScreenLoading();
    /*
     * We communicate to our server via WebSockets (ws-protocol instead of http)
     */
    let host = window.document.location.host.replace(/:.*/, '');
    let protocol = location.protocol.replace("http", "ws") + "//";
    let portSuffix = (location.port ? ':' + location.port : '');
    let client = new Client(protocol + host + portSuffix);

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

    checkWelcomeScreen();

    getUsernameIntern = () => ourPlayer.name;
    getCharacterIntern = () => ourPlayer.character;

    //loads all the character information
    await loadCharacter();
    checkInputMode();

    /*
     * Then, we wait for our map to load
     */

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");

    //load map from server
    const mapJson = await fetch("/map/Map.json").then((response) => response.json());
    const map: MapInfo = await convertMapData(mapJson, room, background);
    setMapInfo(map);

    let currentMap = new MapInfo(map.layers, map.tileSets, map.canvas, map.resolution, map.textures, map.lowestX, map.lowestY, map.highestY, map.highestX);

    drawMap(currentMap);

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
        playerLoop(ourPlayer, players, room, now, canvas, ctx, collisionInfo);

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
            nearbyPlayerCheck();
        } else if (playerNearbyTimer % 20 === 10) {
            updateUsers();
            updateChat();
        }

        //check if interaction is nearby
        checkInteractionNearby();

        ctx.drawImage(background, posX - Math.floor(width / 2), posY - Math.floor(height / 2), width, height, 0, 0, width, height);
        ctx.drawImage(doors, posX - Math.floor(width / 2), posY - Math.floor(height / 2), width, height, 0, 0, width, height);

        //check if a doorState changed
        updateDoors();

        ctx.save();

        // Draw each player
        drawPlayers(ourPlayer, players, characters, ctx, width, height);

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
    checkInputMode();
        // Start game loop
    requestAnimationFrame(loop);
}

main();
