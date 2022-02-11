import { Room } from "colyseus.js";
import { solidInfo } from "./map";
import { Direction, MessageType } from "../common/util";
import { getCorrectedPlayerCoordinates, getNewCorrectedPlayerCoordinate } from "./util";
import { Backpack } from "./backpack";
import { Chunk, MapData } from "./newMap";
import { Door } from "./interactive/door";
import { State } from "../common";
import { isGetAccessor } from "typescript";
//import { lowestX, lowestY } from "./main"

//all variables needed to adjust movement speed and length.
export var MOVEMENT_SPEED = 10;
export var TILE_SIZE = 48;
export var STEP_SIZE = TILE_SIZE / 2;
export var FRAMES_PER_MOVE = Math.round(100 / MOVEMENT_SPEED);
export var PLAYER_MOVEMENT_PER_TICK = STEP_SIZE * (1 / FRAMES_PER_MOVE);

export var PLAYER_COLORS = ["red", "blue", "green", "yellow", "black"];

/*
 * This is a client-side Player-class. This means that the name and position
 * attributes are not synced with the server, but need to be updated when
 * a change from the server is reported (in the onAdd, onRemove, onChange methods).
 */
export interface Player {
    loggedIn: boolean; // is user logged in?
    userId: string; // user id logged in with
    userRole?: number; // user role logged in with
    roomId: string; //players id in the room
    username: string; //players username
    displayName: string; //players display name
    participantId: string; //id of the jitsi participant
    character: string; //the name of the character sprite
    positionX: number; //posX on the Map
    positionY: number; //posY on the Map
    scaledX: number; //one step changes this by 1
    scaledY: number; //one step changes this by 1
    lastScaledX: number[]; //last 5 postion from scaledX
    lastScaledY: number[]; //last 5 postion from scaledY
    moveDirection: Direction; //currently moving in this or none direction
    moveTime: number; //time moving in current move
    priorDirections: Direction[]; //current and last direction button pressed
    facing: Direction; //direction facing to calculate sprite while standing still
    standing: number; //time standing still
    moving: number; //time moving to calculate sprite
    animationName: string; // current animation
    animationStep: number; // current animation step
    whiteboard: number;
    previousDirection: Direction; // direction (previously) facing
    changeDirection: boolean; // true, if last facing direction was different to current facing direction
    waitBeforeMoving: number; // time that it takes to turn before moving
    backpack: Backpack;
}

/*
 * Syncing data from server and using it
 */
export function updatePosition(player: Player, room: Room) {
    //if server and client data differ to much tp player to server postion.
    if (
        Math.abs(player.positionX - room.state.players[player.roomId].x * STEP_SIZE) >= 100 ||
        Math.abs(player.positionY - room.state.players[player.roomId].y * STEP_SIZE) >= 100
    ) {
        player.positionX = room.state.players[player.roomId].x * STEP_SIZE;
        player.positionY = room.state.players[player.roomId].y * STEP_SIZE;
    }

    //if close enough just set client pos = server pos
    if (Math.abs(player.positionX - room.state.players[player.roomId].x * STEP_SIZE) <= PLAYER_MOVEMENT_PER_TICK) {
        player.positionX = room.state.players[player.roomId].x * STEP_SIZE;
    } else {
        //smooth animation to new x coord
        if (player.positionX < room.state.players[player.roomId].x * STEP_SIZE) {
            player.positionX += PLAYER_MOVEMENT_PER_TICK;
        } else if (player.positionX > room.state.players[player.roomId].x * STEP_SIZE) {
            player.positionX -= PLAYER_MOVEMENT_PER_TICK;
        }
    }
    //if close enough just set client pos = server pos
    if (Math.abs(player.positionY - room.state.players[player.roomId].y * STEP_SIZE) <= PLAYER_MOVEMENT_PER_TICK) {
        player.positionY = room.state.players[player.roomId].y * STEP_SIZE;
    } else {
        //smooth animation to new y coord
        if (player.positionY < room.state.players[player.roomId].y * STEP_SIZE) {
            player.positionY += PLAYER_MOVEMENT_PER_TICK;
        } else if (player.positionY > room.state.players[player.roomId].y * STEP_SIZE) {
            player.positionY -= PLAYER_MOVEMENT_PER_TICK;
        }
    }
}

export function updateOwnPosition(player: Player, room: Room<State>, collisionInfo: solidInfo[][]) {
    let [x, y] = getCorrectedPlayerCoordinates(player);
    let [newX, newY] = getNewCorrectedPlayerCoordinate(player);

    //initiates movement in one direction and blocks the other directions till the next tile
    if (player.priorDirections.length > 0) {
        if (player.priorDirections[0] === Direction.DOWN && player.moveDirection === null) {
            if (
                (collisionInfo[x][y + 1] === undefined || !collisionInfo[x][y + 1].isSolid) && //dont go in direction if there are objects
                (collisionInfo[x + 1][y + 1] === undefined || !collisionInfo[x + 1][y + 1].isSolid) ||
                (room.state.players.get(player.roomId).isSitting && player.facing === Direction.DOWN)
            ) {
                let content = collisionInfo[x][y + 1].content;
                let content2 = collisionInfo[x + 1][y + 1].content;

                if (
                    (content && content.name === "Door" && !content.proofIfClosed()) ||
                    !content ||
                    content.name !== "Door" ||
                    (content2 && content2.name === "Door" && !content2.proofIfClosed()) ||
                    !content2 ||
                    content2.name !== "Door"
                ) {
                    player.moveDirection = Direction.DOWN;
                    player.facing = Direction.DOWN;

                    player.lastScaledY.pop();
                    player.lastScaledY.unshift(player.scaledY); //stores the previous position

                    // turn without moving when not facing down
                    if (player.previousDirection === player.facing) {
                        player.scaledY++;
                        room.send(MessageType.MOVE, Direction.DOWN);
                        player.changeDirection = false;
                    } else {
                        player.previousDirection = Direction.DOWN;
                        player.changeDirection = true;
                        player.waitBeforeMoving = 2 * Math.floor(PLAYER_MOVEMENT_PER_TICK);
                    }
                } else {
                    player.facing = Direction.DOWN;
                }
            } else {
                player.facing = Direction.DOWN;
            }
        }
        if (player.priorDirections[0] === Direction.UP && player.moveDirection === null) {
            if (
                y > 0 &&
                (collisionInfo[x][y - 1] === undefined || !collisionInfo[x][y - 1].isSolid) && //dont go in direction if there are objects
                (collisionInfo[x + 1][y - 1] === undefined || !collisionInfo[x + 1][y - 1].isSolid) ||
                (room.state.players.get(player.roomId).isSitting && player.facing === Direction.UP)
            ) {
                //dont go in direction if there are objects
                //if there is a door
                let content = collisionInfo[x][y - 1].content;
                let content2 = collisionInfo[x + 1][y - 1].content;
                if (
                    (content && content.name === "Door" && !content.proofIfClosed()) ||
                    !content ||
                    content.name !== "Door" ||
                    (content2 && content2.name === "Door" && !content2.proofIfClosed()) ||
                    !content2 ||
                    content2.name !== "Door"
                ) {
                    player.moveDirection = Direction.UP;
                    player.facing = Direction.UP;

                    player.lastScaledY.pop();
                    player.lastScaledY.unshift(player.scaledY); //stores the previous position

                    // turn without moving when not facing up
                    if (player.previousDirection === player.facing) {
                        player.scaledY--;
                        room.send(MessageType.MOVE, Direction.UP);
                        player.changeDirection = false;
                    } else {
                        player.previousDirection = Direction.UP;
                        player.changeDirection = true;
                        player.waitBeforeMoving = 2 * Math.floor(PLAYER_MOVEMENT_PER_TICK);
                    }
                } else {
                    player.facing = Direction.UP;
                }
            } else {
                player.facing = Direction.UP;
            }
        }
        if (player.priorDirections[0] === Direction.LEFT && player.moveDirection === null) {
            if (x > 0 && (collisionInfo[x - 1][y] === undefined || !collisionInfo[x - 1][y].isSolid) ||
            (room.state.players.get(player.roomId).isSitting && player.facing === Direction.LEFT)) {
                //dont go in direction if there are objects
                //if there is a door
                let content = collisionInfo[x - 1][y].content;
                if (
                    (content && content.name === "Door" && !content.proofIfClosed()) ||
                    !content ||
                    content.name !== "Door"
                ) {
                    player.moveDirection = Direction.LEFT;
                    player.facing = Direction.LEFT;

                    player.lastScaledX.pop();
                    player.lastScaledX.unshift(player.scaledX); //stores the previous position

                    // turn without moving when not facing left
                    if (player.previousDirection === player.facing) {
                        player.scaledX--;
                        room.send(MessageType.MOVE, Direction.LEFT);
                        player.changeDirection = false;
                    } else {
                        player.previousDirection = Direction.LEFT;
                        player.changeDirection = true;
                        player.waitBeforeMoving = 2 * Math.floor(PLAYER_MOVEMENT_PER_TICK);
                    }
                } else {
                    player.facing = Direction.LEFT;
                }
            } else {
                player.facing = Direction.LEFT;
            }
        }
        if (player.priorDirections[0] === Direction.RIGHT && player.moveDirection === null) {
            if (collisionInfo[x + 2][y] === undefined || !collisionInfo[x + 2][y].isSolid ||
                (room.state.players.get(player.roomId).isSitting && player.facing === Direction.RIGHT)) {
                //dont go in direction if there are objects
                //if there is a door
                let content = collisionInfo[x + 2][y].content;
                if (
                    (content && content.name === "Door" && !content.proofIfClosed()) ||
                    !content ||
                    content.name !== "Door"
                ) {
                    player.moveDirection = Direction.RIGHT;
                    player.facing = Direction.RIGHT;

                    player.lastScaledX.pop();
                    player.lastScaledX.unshift(player.scaledX); //stores the previous position

                    // turn without moving when not facing right
                    if (player.previousDirection === player.facing) {
                        player.scaledX++;
                        room.send(MessageType.MOVE, Direction.RIGHT);
                        player.changeDirection = false;
                    } else {
                        player.previousDirection = Direction.RIGHT;
                        player.changeDirection = true;
                        player.waitBeforeMoving = 2 * Math.floor(PLAYER_MOVEMENT_PER_TICK);
                    }
                } else {
                    player.facing = Direction.RIGHT;
                }
            } else {
                player.facing = Direction.RIGHT;
            }
        }
    }
    //moves to the next tile
    if (player.moveDirection) {
        player.moveTime++;
        if (player.moveDirection === Direction.DOWN && !player.changeDirection) {
            player.positionY += PLAYER_MOVEMENT_PER_TICK;
        } else if (player.moveDirection === Direction.UP && !player.changeDirection) {
            player.positionY -= PLAYER_MOVEMENT_PER_TICK;
        } else if (player.moveDirection === Direction.LEFT && !player.changeDirection) {
            player.positionX -= PLAYER_MOVEMENT_PER_TICK;
        } else if (player.moveDirection === Direction.RIGHT && !player.changeDirection) {
            player.positionX += PLAYER_MOVEMENT_PER_TICK;
        }
        if (player.moveTime === FRAMES_PER_MOVE && !player.changeDirection) {
            //centers the player every whole step
            player.positionX = player.scaledX * STEP_SIZE;
            player.positionY = player.scaledY * STEP_SIZE;

            //resets movement counter and blocker
            player.moveTime = 0;
            player.moveDirection = null;
        }
    }

    /*
     * standing is calculated in player_sprite -> choosePlayerSprite.
     * syncs the position with the server about every second.
     */
    if (player.standing > 0 && player.standing % 50 === 0) {
        if (
            !(
                player.scaledX === room.state.players[player.roomId].x &&
                player.scaledY === room.state.players[player.roomId].y
            )
        ) {
            room.send(MessageType.SYNC, [player.scaledX, player.scaledY]);
        }
    }
}

//syncs the own position from the server
let posDiffers = 0;

export function syncOwnPosition(player: Player, room: Room) {
    //checks if current position differs from servers data
    if (
        (player.scaledY !== room.state.players[player.roomId].y &&
            !player.lastScaledY.includes(room.state.players[player.roomId].y)) ||
        (!player.lastScaledX.includes(room.state.players[player.roomId].x) &&
            player.scaledX !== room.state.players[player.roomId].x)
    ) {
        //if it differs for to long the positions get synced
        if (posDiffers < 10) {
            posDiffers++;
        } else {
            room.send(MessageType.SYNC, [player.scaledX, player.scaledY]);
        }
    } else {
        posDiffers = 0;
    }
}
