import {Interactive} from "./interactive"
import {getOurPlayer, getRoom} from "./../util"
import {MapInfo, solidInfo, TileSet, Chunk} from "./../map"
import { Player } from "../player";
import {Room} from "colyseus.js";
import {State} from "../../common";
import {MessageType} from "../../common/util";
import { DoorState } from "../../common/rooms/schema/state";
import { doors } from "../../client/static";

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
    chunkStartX: number;
    chunkStartY: number;
    chunkX: number;
    chunkY: number;
    ctx: CanvasRenderingContext2D;
    chunk: Chunk;
    animationCounter: number;
    inAnimation: boolean;
    firstTimeDrawn: boolean;
    syncIndex: boolean;
    asyncIsClosed: boolean;
    delay: number;
    groundTileset: TileSet;
    groundTexture: HTMLImageElement;
    groundChunk: Chunk;

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
        this.ctx = doors.getContext("2d");
        this.animationCounter = 0;
        this.inAnimation = false;
        this.firstTimeDrawn = false;
        this.syncIndex = false;
        this.asyncIsClosed = false;
        this.delay = 4;
    }


    onInteraction(): void {
        let player = getOurPlayer();
        this.update();
        this.startInteraction(player.scaledX - this.xCorrection, player.scaledY - this.yCorrection, player.id);
    }

    calculateX (correction: number) {

        return (this.posX + correction) / 2 + this.map.lowestX;
    }
    calculateY (correction: number) {

        return (this.posY + correction) / 2 + this.map.lowestY;
    }

    chunkCorrection(i: number) {

        if (i < 0) {
            return 16 - Math.abs(i);
        } else {
            return i;
        }
    }

    setTexture() {

        let x = this.calculateX(0);
        let y = this.calculateY(0);

        this.chunkX = x % 16;
        this.chunkY = y % 16;

        this.chunkX = this.chunkCorrection(this.chunkX);
        this.chunkY = this.chunkCorrection(this.chunkY);
    
        this.chunkStartX = Math.floor(x / 16) * 16;
        this.chunkStartY = Math.floor(y / 16) * 16;

        for (const layer of this.map.layers) {
            if (layer.name === "Doors") {

                for (const chunk of layer.chunks) {

                    if (this.chunkStartX === chunk.posX && this.chunkStartY === chunk.posY) {

                        if(!chunk.tileSetForElement[this.chunkX][this.chunkY]){ //why are there two doors with this?
                            // console.log("ehhhh");
                            return;
                        } else {
                            this.tileSet = chunk.tileSetForElement[this.chunkX][this.chunkY];
                            this.texture = this.map.textures.get(this.tileSet.path);
                            this.chunk = chunk;
                        }
                    }
                }
            } else if (layer.name !== "Doors") {

                for (const groundChunk of layer.chunks) {

                    if (this.chunkStartX === groundChunk.posX && this.chunkStartY === groundChunk.posY) {

                        if(!groundChunk.tileSetForElement[this.chunkX][this.chunkY]){ //why are there two doors with this?
                            // console.log("ehhhh");
                        } else {
                            this.groundTileset = groundChunk.tileSetForElement[this.chunkX][this.chunkY];
                            this.groundTexture = this.map.textures.get(this.groundTileset.path);
                            this.groundChunk = groundChunk;
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
        if(this.room.state.doorStates[this.posX + "" + this.posY].isClosed !== this.isClosed || this.room.state.doorStates[this.posX + "" + this.posY].playerId !== this.playerId) {
            if(this.room.state.doorStates[this.posX + "" + this.posY].isClosed !== this.isClosed) {
                if(this.room.state.doorStates[this.posX + "" + this.posY].isClosed === true && this.inAnimation === false) {
                    this.animationCounter = 0;
                    this.inAnimation = true;
                    this.asyncIsClosed = false;
                    this.syncIndex = false;
                } else if (this.room.state.doorStates[this.posX + "" + this.posY].isClosed === false && this.inAnimation === false) {
                    this.animationCounter = 4;
                    this.inAnimation = true;
                    this.asyncIsClosed = true;
                    this.syncIndex = false;
                }
            }
            this.isClosed = this.room.state.doorStates[this.posX + "" + this.posY].isClosed;
            this.playerId = this.room.state.doorStates[this.posX + "" + this.posY].playerId;
            if (this.isClosed === this.asyncIsClosed) {
                this.syncIndex = true;
            }
        }
    }

    drawDoor() {
        if (this.inAnimation === true && this.syncIndex === true && this.delay === 5) {
            if (this.isClosed === true) {
                this.animationCounter--;
                if (this.animationCounter === 0) {
                    this.inAnimation = false;
                }
            } else {
                this.animationCounter++;
                if (this.animationCounter === 4) {
                    this.inAnimation = false;
                }
            }
        
            switch (this.direction) {

                case DoorDirection.SOUTH: {

                    this.ctx.clearRect((this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution - this.map.resolution, this.map.resolution, this.map.resolution * 3);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] -this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution - this.map.resolution, this.map.resolution, this.map.resolution);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] + this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution + this.map.resolution, this.map.resolution, this.map.resolution);
                    break;
                }
                case DoorDirection.EAST: {

                    this.ctx.clearRect((this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution * 2, this.map.resolution * 3);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * 2 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);
                    
                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * 2 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution, this.map.resolution);
                    
                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + (this.animationCounter * 2 - 1) * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
                        
                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + (this.animationCounter * 2 - 1) * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + (this.animationCounter * 2 - 1) * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution, this.map.resolution);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 2 * this.animationCounter * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
                    break;
                }
                case DoorDirection.NORTH: {

                    this.ctx.clearRect((this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution - 2 * this.map.resolution, this.map.resolution, this.map.resolution * 3);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution - this.map.resolution, this.map.resolution, this.map.resolution);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution - 2 * this.map.resolution, this.map.resolution, this.map.resolution);
                    break;
                }
                case DoorDirection.WEST: {

                    this.ctx.clearRect((this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution * 2, this.map.resolution * 3);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * 2 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);
                    
                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + this.animationCounter * 2 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution, this.map.resolution);
                    
                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + (this.animationCounter * 2 - 1) * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
                        
                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + (this.animationCounter * 2 - 1) * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + (this.animationCounter * 2 - 1) * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution, this.map.resolution);

                    this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 2 * this.animationCounter * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                        this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                        (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
                    break;
                }
            }
        }
        if (this.firstTimeDrawn === false) {

                switch (this.direction) {

                    case DoorDirection.NORTH: {

                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 4 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
    
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 4 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);
                        
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 4 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution, this.map.resolution);
                        break;
                    }
                    case DoorDirection.EAST: {
                        
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 8 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);
                        
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 8 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution, this.map.resolution);
                        
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 7 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
                            
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 7 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);

                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 7 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution, this.map.resolution);

                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 8 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
                        break;
                    }
                    case DoorDirection.SOUTH: {

                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 4 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
                        
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 4 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] -this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);
                        
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 4 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] +this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) + 1) * this.map.resolution, this.map.resolution, this.map.resolution);
                        break;
                    }
                    case DoorDirection.WEST: {

                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 8 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);
                        
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 8 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution, this.map.resolution);
                        
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 7 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
                            
                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 7 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 1) * this.map.resolution, this.map.resolution, this.map.resolution);

                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 7 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY] - 2 * this.map.resolution,
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2) - 1) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2) - 2) * this.map.resolution, this.map.resolution, this.map.resolution);

                        this.ctx.drawImage(this.texture, this.chunk.tileSetX[this.chunkX][this.chunkY] + 8 * this.map.resolution, this.chunk.tileSetY[this.chunkX][this.chunkY],
                            this.map.resolution, this.map.resolution, (this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2)) * this.map.resolution, 
                            (this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2)) * this.map.resolution, this.map.resolution, this.map.resolution);
                        break;
                    }
                }
            this.firstTimeDrawn = true;
        }
        if (this.delay === 5) {
            this.delay = 0;
        }
        this.delay++;
    }
}

export function updateDoors(collisionInfo: solidInfo[][]) {
    Door.doors.forEach((value, index, array) => {
        value.update();
        value.drawDoor();
    });
}