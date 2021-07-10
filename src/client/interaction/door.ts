import {Interactive} from "./interactive"

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
    //1: S-->N, 2: W-->E, 3: N-->S, 4: E-->W, 5: Always open.
    direction: DoorDirection;
    playerId: string;
    posX: number;
    posY: number;

    constructor(direction: DoorDirection) {
        super("door");
        this.direction = direction;
    }

    proofIfClosed(playerDirection: number) {

        //TODO
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

        switch (this.direction) {

            case 1: {

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
            case 2: {

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
            case 3: {

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
            case 4: {

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
