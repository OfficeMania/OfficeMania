import { Client, Room } from "colyseus.js";
import { Player, PLAYER_COLORS, TILE_SIZE, updatePosition, updateOwnPosition } from "./player";
import { InitState, joinAndSync, loadImage, PlayerRecord } from "./util";
import { convertMapData, drawMapWithChunks, mapInfo, drawMap } from "./map";
import { choosePlayerSprites } from "./player_sprite";

export var characters: {[key: string]: HTMLImageElement} = {}
var START_POSITION_X = -13;
var START_POSITION_Y = -8;
const MS_PER_UPDATE = 20;

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
            let names = Object.keys(characters);
            let nextIndex = names.indexOf(ourPlayer.character) + 1;
            if (names.length <= nextIndex){
                nextIndex = 0;
            }
            ourPlayer.character = names[nextIndex]
            room.send("character", names[nextIndex]);
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
    
    document.addEventListener("keydown", keyPressed);
    document.addEventListener("keyup", keyUp);

    /* (from movement)
     * Create a gameLoop-like function for drawing a simple animation
     *
     * See: https://gameprogrammingpatterns.com/game-loop.html
     */

    //const MS_PER_UPDATE = 10;

    
    
    //let j = 0;


    let previous = performance.now();
    let lag = 0;

    function loop(now: number) {

        lag += now - previous;
        previous = now;
        
        

        ctx.clearRect(0, 0, width, height);

        

        //update width and height
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        width = canvas.width;
        height = canvas.height;

        /*
         * Update each player's data
         */
        while (lag >= MS_PER_UPDATE) {
            Object.values(players).forEach((player: Player) => {
                if(player !== ourPlayer){
                    updatePosition(player, room, client, now - previous);
                    player.character = room.state.players[player.name].character
                    //console.log(player.character)
                } 
            });

            updateOwnPosition(ourPlayer, room, currentMap);

            lag -= MS_PER_UPDATE;
        }

        

         /*
        code from beginning
        
        

        while (lag >= MS_PER_UPDATE) {
            Object.values(players).forEach((player: Player) => {
                return updatePosition(player, MS_PER_UPDATE, room, client, MS_PER_UPDATE);
            });

            lag -= MS_PER_UPDATE;
        }/*
        

        /*
         * Repaint the scene
         */

        //the new Position from yourself
        posX = ((ourPlayer.positionX / TILE_SIZE) + START_POSITION_X + Math.floor(currentMap.widthOfMap / 2)) * TILE_SIZE;
        posY = ((ourPlayer.positionY / TILE_SIZE) + START_POSITION_Y + Math.floor(currentMap.heightOfMap / 2)) * TILE_SIZE;

        //when somethin on the map changes: drawMap

        //draw background on canvas - need to make movestuff here
        ctx.drawImage(background, posX - Math.floor(width / 2), posY - Math.floor(height / 2), width, height, 0, 0, width, height);

        
        // Draw each player
        ctx.save();
        Object.values(players).forEach((player: Player, i: number) => {
            //choose the correct sprite
            if (ourPlayer.name !== player.name){
                choosePlayerSprites(room, player, playerWidth, playerHeight, false);
                //draw everyone else on theire position relatiely to you
                ctx.drawImage(characters[player.character], player.spriteX, player.spriteY , playerWidth, playerHeight, Math.round((width / 2) + player.positionX - ourPlayer.positionX), Math.round((height / 2) + player.positionY - ourPlayer.positionY), playerWidth, playerHeight);
            } else {
                choosePlayerSprites(room, player, playerWidth, playerHeight, true);
                //draw yourself always at the same position
                ctx.drawImage(characters[player.character], player.spriteX, player.spriteY , playerWidth, playerHeight, Math.round(width / 2), Math.round(height / 2), playerWidth, playerHeight);
                
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