import {Interactive} from "./interactive"
import {Player} from "./../player"
import {getOurPlayer} from "./../util"

export enum DoorDirection {
    UNKNOWN,
    NORTH,
    EAST,
    SOUTH,
    WEST,
    ALWAYS_OPEN
}

export class Door extends Interactive {

    isClosed: boolean;
    direction: DoorDirection;
    playerId: string;
    posX: number;
    posY: number;


    constructor(direction: DoorDirection, posX: number, posY: number) {

        super("door", true, 1);
        this.isClosed = false;
        this.direction = direction;
        this.posX = posX;
        this.posY = posY;
    }

    onInteraction(): void {
        
        let player = getOurPlayer();
        this.startInteraction(player.positionX, player.positionY, player.id);
    }

    proofIfClosed(playerDirection: number) {

        //TODO
        //update Door from server before
        //Open door if Player who looked is in the room and wants to leave
        if (this.isClosed) {
            //if direction is inside the room then return false
            return true;
        } else {
            return false;
        }
    }

    lockDoor(id: string) {
        if (this.isClosed) {
            //error
        } else {
            //if you are not allowed to close this door
            if (this.direction === DoorDirection.ALWAYS_OPEN) {
                //error
            } else {
                this.playerId = id;
                this.isClosed = true;
            }
        }
        //TODO
    }

    openDoor(id: string) {

        //TODO
        if (!this.isClosed) {
            //error
        } else {
            if (id === this.playerId) {
                this.isClosed = false;
            } else {
                //error
            }
        }
    }

    startInteraction(playerX: number, playerY: number, playerId: string) {

        //update Door before
        switch (this.direction) {

            case DoorDirection.NORTH: {

                if (playerY > this.posY) {

                    this.openDoor(playerId);
                } else {

                    if (this.isClosed) {

                        this.openDoor(playerId);
                    } else {

                        this.lockDoor(playerId);
                    }
                }
                break;
            }
            case DoorDirection.EAST: {

                if (playerX < this.posX) {

                    this.openDoor(playerId);
                } else {

                    if (this.isClosed) {

                        this.openDoor(playerId);
                    } else {

                        this.lockDoor(playerId);
                    }
                }
                break;
            }
            case DoorDirection.SOUTH: {

                if (playerY < this.posY) {

                    this.openDoor(playerId);
                } else {

                    if (this.isClosed) {

                        this.openDoor(playerId);
                    } else {

                        this.lockDoor(playerId);
                    }
                }
                break;
            }
            case DoorDirection.WEST: {

                if (playerX > this.posX) {

                    this.openDoor(playerId);
                } else {

                    if (this.isClosed) {

                        this.openDoor(playerId);
                    } else {

                        this.lockDoor(playerId);
                    }
                }
                break;
            }
        }
    }
}
