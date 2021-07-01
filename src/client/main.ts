import {Client} from "colyseus.js";
import {TILE_SIZE} from "./player";
import {InitState, joinAndSync, PlayerRecord, setRoom} from "./util";
import {convertMapData, drawMap, fillSolidInfos, mapInfo, solidInfo} from "./map";
import {initConference, nearbyPlayerCheck, toggleMuteByType, toggleSharing, updateUsers} from "./conference/conference";
import {drawPlayer, loadCharacter, loadInputFuctions, playerLoop} from "./movement";


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
    muteButton.innerHTML = muted ? "<em class = \"fa fa-microphone-slash\"></em>" : "<em class = \"fa fa-microphone\"></em>";
}

export function setVideoButtonMute(muted: boolean, sharing: boolean = false) {
    camButton.toggleAttribute("disabled", false);
    const camNormal = "<em class = \"fa fa-video\"></em>";
    const camMuted = "<em class = \"fa fa-video-slash\"></em>";
    const sharingNormal = "<em class = \"fa fa-pause\"></em>";
    const sharingMuted = "<em class = \"fa fa-play\"></em>";
    const textNormal = sharing ? sharingNormal : camNormal;
    const textMuted = sharing ? sharingMuted : camMuted;
    camButton.innerHTML = muted ? textMuted : textNormal;
}

export function setSwitchToDesktop(enabled: boolean, supported: boolean = false) {
    shareButton.toggleAttribute("disabled", !supported);
    shareButton.innerHTML = enabled ? "<em class = \"fa fa-user\"></em>" : "<em class = \"fa fa-desktop\"></em>";
}

//toggle mute of tracks by type
function toggleMute(type: string) {
    if (type === "desktop") {
        toggleSharing(setSwitchToDesktop);
    } else {
        const muted = toggleMuteByType(type);
        if (type === "audio") {
            //setAudioButtonMute(muted);
        } else if (type === "video") {
            //setVideoButtonMute(muted);
        }
    }
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
    loadInputFuctions(ourPlayer, room, characters);

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
