import {Room} from "colyseus.js";
import {mapInfo} from "./map";

//all variables needed to adjust movement speed and length.
export var MOVEMENT_SPEED = 10;
export var TILE_SIZE = 48;
export var STEP_SIZE = TILE_SIZE/2
export var FRAMES_PER_MOVE = Math.round(100 / MOVEMENT_SPEED)
export var PLAYER_MOVEMENT_PER_TICK = STEP_SIZE * (1 / FRAMES_PER_MOVE);

export var PLAYER_COLORS = ["red", "blue", "green", "yellow", "black"];

/*
 * This is a client-side Player-class. This means that the name and position
 * attributes are not synced with the server, but need to be updated when
 * a change from the server is reported (in the onAdd, onRemove, onChange methods).
 */
export interface Player {
    id: string;                 //players id in the room
    name: string;               //players name
    participantId: string;      //id of the jitsi participant
    character: string;          //the name of the character sprite
    positionX: number;          //posX on the Map
    positionY: number;          //posY on the Map
    scaledX: number;            //one step changes this by 1
    scaledY: number;            //one step changes this by 1
    lastScaledX: number[];      //last 5 postion from scaledX
    lastScaledY: number[];      //last 5 postion from scaledY
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
export function updatePosition(player: Player, room: Room) {

    //if server and client data differ to much tp player to server postion.
    if(Math.abs(player.positionX - room.state.players[player.id].x * STEP_SIZE)>=100 || Math.abs(player.positionY - room.state.players[player.id].y * STEP_SIZE)>=100){
        player.positionX = room.state.players[player.id].x * STEP_SIZE;
        player.positionY = room.state.players[player.id].y * STEP_SIZE;
    }

    //if close enough just set client pos = server pos
    if(Math.abs(player.positionX - room.state.players[player.id].x * STEP_SIZE) <= PLAYER_MOVEMENT_PER_TICK){
        player.positionX = room.state.players[player.id].x * STEP_SIZE;
    } else {
        //smooth animation to new x coord
        if(player.positionX < room.state.players[player.id].x * STEP_SIZE){
            player.positionX += PLAYER_MOVEMENT_PER_TICK;
        }else if(player.positionX > room.state.players[player.id].x * STEP_SIZE){
            player.positionX -= PLAYER_MOVEMENT_PER_TICK;
        }
    }
    //if close enough just set client pos = server pos
    if(Math.abs(player.positionY - room.state.players[player.id].y * STEP_SIZE) <= PLAYER_MOVEMENT_PER_TICK){
        player.positionY = room.state.players[player.id].y * STEP_SIZE
    } else {
        //smooth animation to new y coord
        if(player.positionY < room.state.players[player.id].y * STEP_SIZE){
            player.positionY += PLAYER_MOVEMENT_PER_TICK;
        }else if(player.positionY > room.state.players[player.id].y * STEP_SIZE){
            player.positionY -= PLAYER_MOVEMENT_PER_TICK;
        }
    }

}

export function updateOwnPosition(player: Player, room: Room, currentMap: mapInfo) {

    //initiates movement in one direction and blocks the other directions till the next tile
    if(player.prioDirection.length > 0){
        if(player.prioDirection[0] === "moveDown" && player.moveDirection === null){
            player.moveDirection = "down"
            player.facing = "down"
            player.lastScaledY.pop()
            player.lastScaledY.unshift(player.scaledY) //stores the previous position
            player.scaledY++;
            room.send("move", "moveDown");
        }
        if(player.prioDirection[0] === "moveUp" && player.moveDirection === null){
            player.moveDirection = "up"
            player.facing = "up"
            player.lastScaledY.pop()
            player.lastScaledY.unshift(player.scaledY) //stores the previous position
            player.scaledY--;
            room.send("move", "moveUp");
        }
        if(player.prioDirection[0] === "moveLeft" && player.moveDirection === null){
            player.moveDirection = "left"
            player.facing = "left"
            player.lastScaledX.pop()
            player.lastScaledX.unshift(player.scaledX) //stores the previous position
            player.scaledX--;
            room.send("move", "moveLeft");
        }
        if(player.prioDirection[0] === "moveRight" && player.moveDirection === null){
            player.moveDirection = "right"
            player.facing = "right"
            player.lastScaledX.pop()
            player.lastScaledX.unshift(player.scaledX) //stores the previous position
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
            //centers the player every whole step
            player.positionX = player.scaledX * STEP_SIZE
            player.positionY = player.scaledY * STEP_SIZE

            //resets movement counter and blocker
            player.moveTime = 0;
            player.moveDirection = null;
        }
    }
}

//syncs the own position from the server
let posDiffers = 0;
export function syncOwnPosition(player: Player, room: Room){

    //checks if current position differs from servers data
    if ((player.scaledY !== room.state.players[player.id].y && !player.lastScaledY.includes(room.state.players[player.id].y)) ||
        (!player.lastScaledX.includes(room.state.players[player.id].x) && player.scaledX !== room.state.players[player.id].x)){

        //if it differs for to long the positions get synced
        if (posDiffers < 10){
            posDiffers++;
        } else {
            player.scaledX = room.state.players[player.id].x;
            player.scaledY = room.state.players[player.id].y;
            player.positionX = player.scaledX * STEP_SIZE
            player.positionY = player.scaledY * STEP_SIZE
        }
    } else {
        posDiffers = 0;
    }

}

/*
 * If you run npm test, you will find that no test covers this function.
 */
export function untestedFunction(a: number, b: number) {
    return a + b;
}