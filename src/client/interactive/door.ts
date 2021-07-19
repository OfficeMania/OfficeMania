import {Interactive} from "./interactive"
import {getOurPlayer} from "./../util"
import {MapInfo, TileSet} from "./../map"

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
    map: MapInfo
    texture: HTMLImageElement;


    constructor(direction: DoorDirection, posX: number, posY: number, map: MapInfo) {

        super("Door", true, 1);
        this.isClosed = false;
        this.direction = direction;
        this.posX = posX;
        this.posY = posY;
        this.map = map;
        //this.setTexture();
    }

    onInteraction(): void {
        let player = getOurPlayer();
        this.startInteraction(player.positionX, player.positionY, player.id);
    }

    setTexture() {

        let x = this.posX / 2 + this.map.lowestX;
        let y = this.posY / 2 + this.map.lowestY;

        let chunkPosX = x % 16;
        let chunkPosY = y % 16;

        if (chunkPosX < 0) {
            chunkPosX = 16 - Math.abs(chunkPosX);
        }
        if (chunkPosY < 0) {
            chunkPosY = 16 - Math.abs(chunkPosY);
        }

        let tileset: TileSet;

        console.log(this.posX + "." + this.posY + "   " + x + "." + y + "     " + Math.floor(x / 16) * 16 + "." + Math.floor(y / 16) * 16 + "   " + chunkPosX + "." + chunkPosY);

        for (const layer of this.map.layers) {
            if (layer.name !== "Content" && layer.name !== "Rooms" && layer.name !== "Conference rooms" && layer.name !== "Solid") {

                for (const chunk of layer.chunks) {

                    if (Math.floor(x / 16) * 16 === chunk.posX && Math.floor(y / 16) * 16 === chunk.posY) {

                        console.log(chunk);
                        console.log(layer);
                        tileset = chunk.tileSetForElement[chunkPosX][chunkPosY];
                        this.texture = this.map.textures.get(tileset.path);
                    }
                }
            }
        }
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
