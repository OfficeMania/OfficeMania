import { Client, Room } from "colyseus.js";
import { Player, PLAYER_COLORS, TILE_SIZE, updatePosition, updateOwnPosition, syncOwnPosition } from "./player";
import { InitState, joinAndSync, loadImage, PlayerRecord } from "./util";
import { convertMapData, drawMapWithChunks, mapInfo, drawMap } from "./map";
import { choosePlayerSprites } from "./player_sprite";
import {toggleMuteByType, switchVideo} from "./conference";
import { getCookieName, setCookieName} from "./cookie"


export var characters: {[key: string]: HTMLImageElement} = {}
var START_POSITION_X = -13;
var START_POSITION_Y = -8;
const MS_PER_UPDATE = 10;

// A simple helper function
function $<T extends HTMLElement>(a: string) { return <T>document.getElementById(a); }

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

    let cookieName = getCookieName();
    if(cookieName === ""){
        ourPlayer.name = window.prompt("Gib dir einen Namen", "Jimmy");
        setCookieName(ourPlayer.name, 100);
    } else {
        ourPlayer.name = cookieName;
    }
    room.send("name", ourPlayer.name);
    
    /*
     * Then, we wait for our map to load
     */
    let canvas = $<HTMLCanvasElement>("canvas");
    let background = $<HTMLCanvasElement>("background");

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    let width = canvas.width;
    let height = canvas. height;
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
    for (let path of room.state.playerSpritePaths){
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
    function keyPressed(e: KeyboardEvent){
        if(e.key === "s" && !ourPlayer.prioDirection.includes("moveDown")){
            ourPlayer.prioDirection.unshift("moveDown");
        }
        if(e.key === "w" && !ourPlayer.prioDirection.includes("moveUp")){            
            ourPlayer.prioDirection.unshift("moveUp");
        }
        if(e.key === "a" && !ourPlayer.prioDirection.includes("moveLeft")){            
            ourPlayer.prioDirection.unshift("moveLeft");
        }
        if(e.key === "d" && !ourPlayer.prioDirection.includes("moveRight")){            
            ourPlayer.prioDirection.unshift("moveRight");
        }
        //iterate through characters
        if(e.key === "c"){
            let filenames = Object.keys(characters);
            let nextIndex = filenames.indexOf(ourPlayer.character) + 1;
            if (filenames.length <= nextIndex){
                nextIndex = 0;
            }
            ourPlayer.character = filenames[nextIndex]
            room.send("character", filenames[nextIndex]);
        }
        if(e.key === " "){
            //player interacts with object in front of him
            //(ttriggert with space)
        }
    }

    function keyUp(e: KeyboardEvent){
        if(e.key === "s"){
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveDown"), 1);
        }
        if(e.key === "w"){
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveUp"), 1);
        }
        if(e.key === "a"){
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveLeft"), 1);
        }
        if(e.key === "d"){
            ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveRight"), 1);
        }
    }
    
    //gets called when window is out auf focus
    function onBlur(){
        //stops player
        ourPlayer.prioDirection = [];
    }


    //mute button logic
    document.addEventListener("keydown", keyPressed);
    document.addEventListener("keyup", keyUp);
    window.addEventListener("blur", onBlur);

    const muteButton = $<HTMLButtonElement>("mute_button");
    const camButton = $<HTMLButtonElement>("cam_button");
    const switchButton = $<HTMLButtonElement>("switch_button");

    muteButton.addEventListener("click", () => toggleMute("audio"));
    camButton.addEventListener("click", () => toggleMute("video"));
    switchButton.addEventListener("click", () => toggleMute("desktop"));

    function setAudioButtonMute(muted: boolean) {
        muteButton.innerHTML = muted ? "<em class = \"fa fa-microphone-slash\"></em>" : "<em class = \"fa fa-microphone\"></em>";
    }

    function setVideoButtonMute(muted: boolean) {
        camButton.innerHTML = muted ? "<em class = \"fa fa-video-slash\"></em>" : "<em class = \"fa fa-video\"></em>";
    }

    function setSwitchToDesktop(muted: boolean){
        switchButton.innerHTML = muted ? "<em class = \"fa fa-camera\"></em>" : "<em class = \"fa fa-video\"></em>";
        }

    //toggle mute of tracks by type
    function toggleMute(type: string) {
        if (type === "desktop"){
            switchVideo();
        }
        else {
            const muted = toggleMuteByType(type);
            if (type === "audio") {
                setAudioButtonMute(muted);
            } else if (type === "video") {
                setVideoButtonMute(muted);
            }
        }
        
    }



    /* (from movement)
     * Create a gameLoop-like function for drawing a simple animation
     *
     * See: https://gameprogrammingpatterns.com/game-loop.html
     */

    //const MS_PER_UPDATE = 10;

    
    
    //let j = 0;


    let previous = performance.now();
    let lastSecond = performance.now();
    let lag = 0;
    let playerNearbyTimer = 0;

    function loop(now: number) {

        lag += now - previous;
        previous = now;

        ctx.clearRect(0, 0, width, height);
        
        //update width and height
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        width = canvas.width;
        height = canvas.height;

        
        while (lag >= MS_PER_UPDATE) {
            //Update each player's data
            Object.values(players).forEach((player: Player) => {
                if(player !== ourPlayer){
                    updatePosition(player, room, client, now - previous);
                    player.character = room.state.players[player.id].character;
                    player.name = room.state.players[player.id].name;
                } 
            });
            //Update own player
            updateOwnPosition(ourPlayer, room, currentMap);

            lag -= MS_PER_UPDATE;
        }

        if(!lastSecond || now - lastSecond >= 100) {
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

            //array with nearby players. use this vor videochat.
            let playersNearby = [];

            for (const [key, value] of Object.entries(players)) {
                if (value.id === ourPlayer.id) {
                    continue;
                }
                //console.log(Math.pow(value.positionX - ourPlayer.positionX, 2) + Math.pow(value.positionY - ourPlayer.positionY, 2));

                if (Math.pow(value.positionX - ourPlayer.positionX, 2) + Math.pow(value.positionY - ourPlayer.positionY, 2) < 5000) {
                    //console.log("Player nearby: " + value.name);
                    playersNearby.push(value);
                }
            }
            if (playersNearby.length === 0) {
                document.getElementById("playerNearbyIndicator").innerHTML = "you are lonely :(";
            } else {
                document.getElementById("playerNearbyIndicator").innerHTML = "player nearby";
            }
        }

        //DESIGN TODO: when something on the map changes: drawMap

        //TODO: draw background on canvas - need to make movestuff here
        ctx.drawImage(background, posX - Math.floor(width / 2), posY - Math.floor(height / 2), width, height, 0, 0, width, height);

        
        // Draw each player
        ctx.save();
        Object.values(players).forEach((player: Player, i: number) => {
            //choose the correct sprite
            if (ourPlayer.id !== player.id){
                choosePlayerSprites(room, player, playerWidth, playerHeight, false);
                //draw everyone else on theire position relatively to you
                ctx.drawImage(characters[player.character], player.spriteX, player.spriteY , playerWidth, playerHeight, Math.round((width / 2) + player.positionX - ourPlayer.positionX), Math.round((height / 2) + player.positionY - ourPlayer.positionY), playerWidth, playerHeight);

                //draw name
                ctx.font = '18px Hevitica';
                ctx.textAlign = "center";

                var text = ctx.measureText(player.name);
                ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
                ctx.fillRect(Math.round((width / 2) + player.positionX - ourPlayer.positionX) - text.width/2 + 20, Math.round((height / 2) + player.positionY - ourPlayer.positionY) - 4, text.width + 8, 24);

                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.fillText(player.name, Math.round((width / 2) + player.positionX - ourPlayer.positionX) + 24, Math.round((height / 2) + player.positionY - ourPlayer.positionY) + 12)
            } else {
                choosePlayerSprites(room, player, playerWidth, playerHeight, true);
                //draw yourself always at the same position
                ctx.drawImage(characters[player.character], player.spriteX, player.spriteY , playerWidth, playerHeight, Math.round(width / 2), Math.round(height / 2), playerWidth, playerHeight);

                //draw name
                ctx.font = '18px Hevitica';
                ctx.textAlign = "center";

                var text = ctx.measureText(player.name);
                ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
                ctx.fillRect(Math.round(width / 2) - text.width/2 + 20, Math.round(height / 2) - 4, text.width + 8, 24);

                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.fillText(player.name,Math.round(width / 2) + 24, Math.round(height / 2) + 12)
                
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