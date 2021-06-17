import {Client} from "colyseus.js";
import {Player, syncOwnPosition, TILE_SIZE, updateOwnPosition, updatePosition} from "./player";
import {InitState, joinAndSync, loadImage, PlayerRecord, setRoom} from "./util";
import {convertMapData, drawMap, mapInfo} from "./map";
import {choosePlayerSprites} from "./player_sprite";
import {initConference, nearbyPlayerCheck, toggleMuteByType, toggleSharing} from "./conference/conference";


export var characters: { [key: string]: HTMLImageElement } = {}
var START_POSITION_X = -13;
var START_POSITION_Y = -8;
const MS_PER_UPDATE = 10;
const MS_PER_UPDATE2 = 15;

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
     * room and ourPlayer are currently unused, but are probably of use for later
     */
    const [room, ourPlayer]: InitState = await joinAndSync(client, players);
    setRoom(room);

    function setUsername(value: string) {
        ourPlayer.name = value;
        localStorage.setItem("username", value);
        room.send("name", value);
    }

    function setCharacter(value: string) {
        const filenames = Object.keys(characters);
        if (filenames.indexOf(value) === -1) {
            value = filenames[0];
        }
        ourPlayer.character = value;
        localStorage.setItem("character", value);
        room.send("character", value);
    }

    //load or ask for name
    const username = localStorage.getItem("username");
    if (username && username !== "") {
        setUsername(username);
    } else {
        setUsername(window.prompt("Gib dir einen Namen (max. 20 Chars)", "Jimmy")?.slice(0, 20) || "Jimmy");
    }

    //load character
    const character = localStorage.getItem("character");
    if (character && character !== "") {
        setCharacter(character);
    }

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

    let currentMap = new mapInfo((await map).layers, (await map).tilesets, (await map).canvas, (await map).resolution, (await map).textures);

    //start position
    let posX: number = (START_POSITION_X + Math.floor(currentMap.widthOfMap / 2)) * currentMap.resolution;
    let posY: number = (START_POSITION_Y + Math.floor(currentMap.heightOfMap / 2)) * currentMap.resolution;

    drawMap(currentMap);

    //loads character sprite paths from the server (from movement)
    for (let path of room.state.playerSpritePaths) {
        characters[path] = await loadImage("/img/characters/" + path);
    }

    //sprite dimensions (from movement)
    let playerWidth: number = 48;
    let playerHeight: number = 96;

    /* (from movement)
     * movement inputs
     *
     * ourPlayer is the currentPlayer
     *
     * prioDirection is used, so that you can press another direction without
     * needing to let go of the first button pressed
     */
    function keyPressed(e: KeyboardEvent) {
        if (e.key.toLowerCase() === "s" && !ourPlayer.prioDirection.includes("moveDown")) {
            ourPlayer.prioDirection.unshift("moveDown");
        }
        if (e.key.toLowerCase() === "w" && !ourPlayer.prioDirection.includes("moveUp")) {
            ourPlayer.prioDirection.unshift("moveUp");
        }
        if (e.key.toLowerCase() === "a" && !ourPlayer.prioDirection.includes("moveLeft")) {
            ourPlayer.prioDirection.unshift("moveLeft");
        }
        if (e.key.toLowerCase() === "d" && !ourPlayer.prioDirection.includes("moveRight")) {
            ourPlayer.prioDirection.unshift("moveRight");
        }
        //iterate through characters
        if (e.key.toLowerCase() === "c") {
            let filenames = Object.keys(characters);
            let nextIndex = filenames.indexOf(ourPlayer.character) + 1;
            if (filenames.length <= nextIndex) {
                nextIndex = 0;
            }
            setCharacter(filenames[nextIndex]);
        }
        //rename players name
        if (e.key.toLowerCase() === "r") {
            setUsername(window.prompt("Gib dir einen Namen (max. 20 Chars)", "Jimmy")?.slice(0, 20) || "Jimmy");
        }
        if (e.key.toLowerCase() === " ") {
            //player interacts with object in front of him
            //(ttriggert with space)
        }
    }

    function keyUp(e: KeyboardEvent) {
        if (e.key.toLowerCase() === "s") {
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveDown"), 1);
        }
        if (e.key.toLowerCase() === "w") {
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveUp"), 1);
        }
        if (e.key.toLowerCase() === "a") {
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveLeft"), 1);
        }
        if (e.key.toLowerCase() === "d") {
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveRight"), 1);
        }
    }

    //gets called when window is out auf focus
    function onBlur() {
        //stops player
        ourPlayer.prioDirection = [];
    }


    document.addEventListener("keydown", keyPressed);
    document.addEventListener("keyup", keyUp);
    window.addEventListener("blur", onBlur);


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

    //const MS_PER_UPDATE = 10;


    //let j = 0;


    let previous = performance.now();
    let lag = 0;
    let lag2 = 0;
    let lastSecond = performance.now();
    let playerNearbyTimer = 0;

    function loop(now: number) {
        lag += now - previous;
        lag2 += now - previous;
        previous = now;

        ctx.clearRect(0, 0, width, height);

        //update width and height
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        width = canvas.width;
        height = canvas.height;

        //calculates players movement
        while (lag >= MS_PER_UPDATE) {
            //Update each player's data
            Object.values(players).forEach((player: Player) => {
                if (player !== ourPlayer) {
                    updatePosition(player, room);
                    player.character = room.state.players[player.id].character;
                    player.name = room.state.players[player.id].name;
                    player.participantId = room.state.players[player.id].participantId;
                }
            });
            //Update own player
            updateOwnPosition(ourPlayer, room, currentMap);

            lag -= MS_PER_UPDATE;
        }

        //animates/chooses character sprite
        while (lag2 >= MS_PER_UPDATE2) {
            Object.values(players).forEach((player: Player) => {
                choosePlayerSprites(room, player, playerWidth, playerHeight, ourPlayer);
            });
            lag2 -= MS_PER_UPDATE2;
        }

        //synchronize own position with the server
        if (!lastSecond || now - lastSecond >= 100) {
            lastSecond = now;
            syncOwnPosition(ourPlayer, room);
        }


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

            nearbyPlayerCheck(players, ourPlayer);
        }

        //DESIGN TODO: when something on the map changes: drawMap

        //TODO: draw background on canvas - need to make movestuff here
        ctx.drawImage(background, posX - Math.floor(width / 2), posY - Math.floor(height / 2), width, height, 0, 0, width, height);


        // Draw each player
        ctx.save();
        Object.values(players).forEach((player: Player, i: number) => {
            //choose the correct sprite
            if (ourPlayer.id !== player.id) {
                //draw everyone else on theire position relatively to you
                ctx.drawImage(characters[player.character], player.spriteX, player.spriteY, playerWidth, playerHeight, Math.round((width / 2) + player.positionX - ourPlayer.positionX), Math.round((height / 2) + player.positionY - ourPlayer.positionY), playerWidth, playerHeight);

                //draw name
                ctx.font = '18px Hevitica';
                ctx.textAlign = "center";

                var text = ctx.measureText(player.name);
                ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
                ctx.fillRect(Math.round((width / 2) + player.positionX - ourPlayer.positionX) - text.width / 2 + 20, Math.round((height / 2) + player.positionY - ourPlayer.positionY) - 4, text.width + 8, 24);

                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.fillText(player.name, Math.round((width / 2) + player.positionX - ourPlayer.positionX) + 24, Math.round((height / 2) + player.positionY - ourPlayer.positionY) + 12)
            } else {
                //draw yourself always at the same position
                ctx.drawImage(characters[player.character], player.spriteX, player.spriteY, playerWidth, playerHeight, Math.round(width / 2), Math.round(height / 2), playerWidth, playerHeight);

                //draw name
                ctx.font = '18px Hevitica';
                ctx.textAlign = "center";

                var text = ctx.measureText(player.name);
                ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
                ctx.fillRect(Math.round(width / 2) - text.width / 2 + 20, Math.round(height / 2) - 4, text.width + 8, 24);

                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.fillText(player.name, Math.round(width / 2) + 24, Math.round(height / 2) + 12)

            }
            //draw each character
            //ctx.drawImage(characters[player.character], player.spriteX, player.spriteY , playerWidth, playerHeight, Math.round(player.positionX), Math.round(player.positionY), playerWidth, playerHeight);

        });
        ctx.restore();

        // Repeat game loop
        requestAnimationFrame(loop);
    }

    // Start game loop
    requestAnimationFrame(loop);
}

main();
