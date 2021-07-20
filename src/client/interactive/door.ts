import {Interactive} from "./interactive"
import {getOurPlayer, getRoom} from "./../util"
import {MapInfo, solidInfo, TileSet} from "./../map"
import { Player } from "../player";
import {Room} from "colyseus.js";
import {State} from "../../common";
import {MessageType} from "../../common/util";
import { DoorState } from "../../common/rooms/schema/state";

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
    tileSet: TileSet;
    private room: Room<State>;
    //TODO no hardcoding
    xCorrection: number = -38;
    yCorrection: number = -83;
    static doors: Door[] = [];


    constructor(direction: DoorDirection, posX: number, posY: number, map: MapInfo) {

        super("Door", true, 1);
        this.isClosed = false;
        this.direction = direction;
        this.posX = posX;
        this.posY = posY;
        this.map = map;
        this.room = getRoom();
        let id = posX + "" + posY;
        this.room.send(MessageType.NEW_DOOR, id);
        this.setTexture();
        Door.doors.push(this);
    }


    onInteraction(): void {
        let player = getOurPlayer();
        this.update();
        this.startInteraction(player.scaledX - this.xCorrection, player.scaledY - this.yCorrection, player.id);
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

        for (const layer of this.map.layers) {
            if (layer.name === "Doors") {

                for (const chunk of layer.chunks) {

                    if (Math.floor(x / 16) * 16 === chunk.posX && Math.floor(y / 16) * 16 === chunk.posY) {

                        if(!chunk.tileSetForElement[chunkPosX][chunkPosY]){ //why are there two doors with this?
                            // console.log("ehhhh");
                            return;
                        } else{
                            this.tileSet = chunk.tileSetForElement[chunkPosX][chunkPosY];
                            this.texture = this.map.textures.get(this.tileSet.path);
                        }
                    }
                }
            }
        }
    }

    proofIfClosed() {

        this.update();
        if (this.isClosed) {
            return true;
        } else {
            return false;
        }
    }

    lockDoor(id: string) {
        //if you are not allowed to close this door
        if (this.direction === DoorDirection.ALWAYS_OPEN) {
            console.warn("Tried to close an always open door");
        } else {
            this.playerId = id;
            this.isClosed = true;
            let message = [this.posX + "" + this.posY, this.playerId]
            this.room.send(MessageType.CLOSE_DOOR, message);
        }
    }

    openDoor(id: string) {
        if (id === this.playerId) {
            this.isClosed = false;
            this.room.send(MessageType.OPEN_DOOR, this.posX + "" + this.posY);
        } else {
           //TODO Klopfton im Raum abspielen (also bei Spielern, die sich aktuell in der RaumID des Raumes befinden)
           console.log("Klopf, klopf");
        }
    }

    startInteraction(playerX: number, playerY: number, playerId: string) {

        switch (this.direction) {

            case DoorDirection.NORTH: {

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
            case DoorDirection.EAST: {

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
            case DoorDirection.SOUTH: {

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
            case DoorDirection.WEST: {

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
        }
    }

    update() {
        if(this.room.state.doorStates[this.posX + "" + this.posY].isClosed !== this.isClosed || this.room.state.doorStates[this.posX + "" + this.posY].playerId != this.playerId){
            if(this.room.state.doorStates[this.posX + "" + this.posY].isClosed !== this.isClosed){
                //TODO start animation
            }
            this.isClosed = this.room.state.doorStates[this.posX + "" + this.posY].isClosed;
            this.playerId = this.room.state.doorStates[this.posX + "" + this.posY].playerId;
        }
    }

}

export function updateDoors(collisionInfo: solidInfo[][]) {
    Door.doors.forEach((value, index, array) => {
        value.update;
    });
}