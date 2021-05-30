import { Client, Room } from "colyseus.js";
import { State } from "../common";
import { convertMapData, drawMapWithChunks, mapInfo } from "./map";

//all variables needed to adjust movement speed and length.
export var MOVEMENT_SPEED = 64;
export var TILE_SIZE = 48;
export var FRAMES_PER_MOVE = Math.round(100 / MOVEMENT_SPEED)
export var PLAYER_MOVEMENT_PER_TICK = TILE_SIZE * (1 / FRAMES_PER_MOVE);

export var PLAYER_COLORS = ["red", "blue", "green", "yellow", "black"];


/*
 * This is a client-side Player-class. This means that the name and position
 * attributes are not synced with the server, but need to be updated when
 * a change from the server is reported (in the onAdd, onRemove, onChange methods).
 */
export interface Player {
    name: string;
    character: string;          //the name of the character sprite               
    positionX: number;          //posX on the Map
    positionY: number;          //posY on the Map
    scaledX: number;            //one tilestep changes this by 1
    scaledY: number;            //one tilestep changes this by 1
    moveDirection: string;      //currently moving in this or none direction
    moveTime: number;           //time moving in current move
    prioDirection: string[];    //current and last direction button pressed
    facing: string;             //direction facing to calculate sprite while standing still
    standing: number;           //time standing still
    moving: number;             //time moving to calculate sprite
    spriteX: number;            //posX to locate sprite
    spriteY: number;            //posY to locate sprite
}

/*
 * Syncing data from server and using it
 */
export function updatePosition(player: Player, room: Room, client: Client) {
    
    //if server and client data differ to much tp player to server postion.
    if(Math.abs(player.positionX - room.state.players[player.name].x * TILE_SIZE)>=100 || Math.abs(player.positionY - room.state.players[player.name].y * TILE_SIZE)>=100){
        player.positionX = room.state.players[player.name].x * TILE_SIZE;
        player.positionY = room.state.players[player.name].y * TILE_SIZE;
    }

    //if close enough just set client pos = server pos
    if(Math.abs(player.positionX - room.state.players[player.name].x * TILE_SIZE) <= PLAYER_MOVEMENT_PER_TICK){
        player.positionX = room.state.players[player.name].x * TILE_SIZE;
    } else {
        //smooth animation to new x coord
        if(player.positionX < room.state.players[player.name].x * TILE_SIZE){
            player.positionX += PLAYER_MOVEMENT_PER_TICK;
        }else if(player.positionX > room.state.players[player.name].x * TILE_SIZE){
            player.positionX -= PLAYER_MOVEMENT_PER_TICK;
        }
    }
    //if close enough just set client pos = server pos
    if(Math.abs(player.positionY - room.state.players[player.name].y * TILE_SIZE) <= PLAYER_MOVEMENT_PER_TICK){
        player.positionY = room.state.players[player.name].y * TILE_SIZE
    } else {
        //smooth animation to new y coord
        if(player.positionY < room.state.players[player.name].y * TILE_SIZE){
            player.positionY += PLAYER_MOVEMENT_PER_TICK;
        }else if(player.positionY > room.state.players[player.name].y * TILE_SIZE){
            player.positionY -= PLAYER_MOVEMENT_PER_TICK;
        }
    }
    
}

export function updateOwnPosition(player: Player, room: Room, currentMap: mapInfo) {

    //if server and client data differ to much tp player to server postion.
    if(Math.abs(player.positionX - room.state.players[player.name].x  * TILE_SIZE)>=72 || Math.abs(player.positionY-room.state.players[player.name].y  * TILE_SIZE)>=72){
        player.positionX = room.state.players[player.name].x * TILE_SIZE;
        player.positionY = room.state.players[player.name].y * TILE_SIZE;
    }
    
    //initiates movement in one direction and blocks the other directions till the next tile
    if(player.prioDirection.length > 0){
        if(player.prioDirection[0] === "moveDown" && player.moveDirection === null){
            player.moveDirection = "down"
            player.facing = "down"
            player.scaledY++;
            room.send("move", "moveDown");
        }
        if(player.prioDirection[0] === "moveUp" && player.moveDirection === null){
            player.moveDirection = "up"
            player.facing = "up"
            player.scaledY--;
            room.send("move", "moveUp");
        }
        if(player.prioDirection[0] === "moveLeft" && player.moveDirection === null){
            player.moveDirection = "left"
            player.facing = "left"
            player.scaledX--;
            room.send("move", "moveLeft");
        }
        if(player.prioDirection[0] === "moveRight" && player.moveDirection === null){
            player.moveDirection = "right"
            player.facing = "right"
            player.scaledX++;
            room.send("move", "moveRight");
        }
    }
    //moves to the next tile
    if(player.moveDirection !== null){
        player.moveTime++;
        if(player.moveDirection === "down"){
            player.positionY += PLAYER_MOVEMENT_PER_TICK;
        }else if(player.moveDirection === "up"){
            player.positionY -= PLAYER_MOVEMENT_PER_TICK;
        }else if(player.moveDirection === "left"){
            player.positionX -= PLAYER_MOVEMENT_PER_TICK;
        }else if(player.moveDirection === "right"){
            player.positionX += PLAYER_MOVEMENT_PER_TICK;
        }
        if(player.moveTime === FRAMES_PER_MOVE){
            player.scaledX = room.state.players[player.name].x
            player.scaledY = room.state.players[player.name].y
            player.moveTime = 0;
            player.moveDirection = null;
            //corrects centers the player every whole step
            if(player.positionX % TILE_SIZE != 0 || player.positionY % TILE_SIZE != 0){
                player.positionX = player.scaledX * TILE_SIZE
                player.positionY = player.scaledY * TILE_SIZE
            }
        }
    }
}

/*
 * If you run npm test, you will find that no test covers this function.
 */
export function untestedFunction(a: number, b: number) {
    return a + b;
}