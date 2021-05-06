import { Client, Room } from "colyseus.js";
import { State } from "../common";

export var PLAYER_MOVEMENT_PER_SECOND = 10;
export var PLAYER_COLORS = ["red", "blue", "green", "yellow", "black"];

/*
 * This is a client-side Player-class. This means that the name and position
 * attributes are not synced with the server, but need to be updated when
 * a change from the server is reported (in the onAdd, onRemove, onChange methods).
 */
export interface Player {
    name: string;
    positionX: number;
    positionY: number;
    moveDown: boolean;
    moveUp: boolean;
    moveLeft: boolean;
    moveRight: boolean;
}

/*
 * Sending the movement to the Server
 */
export function updatePosition(player: Player, delta: number, room: Room, client: Client) {
    
    if(player.moveDown === true){
        room.send("move", "moveDown");
    }
    if(player.moveUp === true){
        room.send("move", "moveUp");
    }
    if(player.moveLeft === true){
        room.send("move", "moveLeft");
    }
    if(player.moveRight === true){
        room.send("move", "moveRight");
    }
    
    //sync down cords
    player.positionX = room.state.players[player.name].x
    player.positionY = room.state.players[player.name].y
}

/*
 * If you run npm test, you will find that no test covers this function.
 */
export function untestedFunction(a: number, b: number) {
    return a + b;
}