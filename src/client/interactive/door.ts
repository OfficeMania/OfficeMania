import {Interactive} from "./interactive"
import {getCorrectedPlayerCoordinates, getOurPlayer, getRoom} from "../util"
import {Chunk, MapInfo, solidInfo, TileSet} from "../map"
import {Room} from "colyseus.js";
import {State} from "../../common";
import {MessageType} from "../../common/util";
import {doors} from "../static";

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
    lastIsClosed: boolean;
    syncDelay: number;

    constructor(direction: DoorDirection, posX: number, posY: number, map: MapInfo) {

        super("Door", true, 1);
        this.isClosed = false;
        this.lastIsClosed = false;
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
        this.syncDelay = 0;
    }


    onInteraction(): void {
        let player = getOurPlayer();
        let [x, y] = getCorrectedPlayerCoordinates(player);
        this.startInteraction(x, y, player.id);
    }

    calculateX(correction: number) {

        return (this.posX + correction) / 2 + this.map.lowestX;
    }

    calculateY(correction: number) {

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

                        if (!chunk.tileSetForElement[this.chunkX][this.chunkY]) { //why are there two doors with this?
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

                        if (!groundChunk.tileSetForElement[this.chunkX][this.chunkY]) { //why are there two doors with this?
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

        this.sync;
        return this.isClosed;
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

    sync() {
        const doorState = this.room.state.doorStates[this.posX + "" + this.posY];
        this.lastIsClosed = doorState?.isClosed;
        this.playerId = doorState?.playerId;
    }

    update() {
        if (this.syncDelay > 0) {
            this.syncDelay++;
        }
        const doorState = this.room.state.doorStates[this.posX + "" + this.posY];
        if (this.lastIsClosed !== this.isClosed) {
            if (doorState?.isClosed && !this.inAnimation) {
                this.animationCounter = 4;
                this.inAnimation = true;
                this.syncDelay = 1;
                this.syncIndex = false;
            } else if (!doorState?.isClosed && !this.inAnimation) {
                this.animationCounter = 0;
                this.inAnimation = true;
                this.syncDelay = 1;
                this.syncIndex = false;
            }
        }
        this.isClosed = doorState?.isClosed;
        if (this.syncDelay === 20) {
            this.syncIndex = true;
            this.syncDelay = 0;
        }
    }

    drawDoor() {
        let lastCounter = this.animationCounter;
        const resolution = this.map.resolution;
        const baseX = this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2);
        const baseY = this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2);
        const dx = baseX * resolution;
        const dy = baseY * resolution;
        const tileSetYElement = this.chunk.tileSetY[this.chunkX][this.chunkY];
        const sy = tileSetYElement - resolution;
        const x = (baseX - 1) * resolution;
        const y = (baseY - 2) * resolution;
        const dyEast = (baseY - 1) * resolution;
        const doubleMapResolution = resolution * 2;
        const syEast = tileSetYElement - doubleMapResolution;
        const tileSetXElement = this.chunk.tileSetX[this.chunkX][this.chunkY];
        if (this.inAnimation && this.syncIndex && this.delay === 5) {
            this.syncDelay = 0;
            if (this.isClosed) {
                this.animationCounter--;
                if (this.animationCounter < 1) {
                    this.inAnimation = false;
                    this.syncIndex = false;
                }
            } else {
                this.animationCounter++;
                if (this.animationCounter > 3) {
                    this.inAnimation = false;
                    this.syncIndex = false;
                }
            }

            if (lastCounter !== this.animationCounter) {

                const sxVertical = tileSetXElement + this.animationCounter * resolution;
                const sxHorizontal = tileSetXElement + this.animationCounter * doubleMapResolution;
                const sxHorizontal2 = tileSetXElement + (this.animationCounter * 2 - 1) * resolution;
                const tripleMapResolution = resolution * 3;
                switch (this.direction) {

                    case DoorDirection.SOUTH: {

                        this.ctx.clearRect(dx, dy - resolution, resolution, tripleMapResolution);

                        this.ctx.drawImage(this.texture, sxVertical, tileSetYElement, resolution, resolution, dx, dy, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxVertical, sy, resolution, resolution, dx, dy - resolution, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxVertical, tileSetYElement + resolution, resolution, resolution, dx, dy + resolution, resolution, resolution);
                        break;
                    }
                    case DoorDirection.EAST: {

                        this.ctx.clearRect(x, y, doubleMapResolution, tripleMapResolution);

                        this.ctx.drawImage(this.texture, sxHorizontal, sy, resolution, resolution, dx, dyEast, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal, syEast, resolution, resolution, dx, y, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal2, tileSetYElement, resolution, resolution, x, dy, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal2, sy, resolution, resolution, x, dyEast, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal2, syEast, resolution, resolution, x, y, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal, tileSetYElement, resolution, resolution, dx, dy, resolution, resolution);
                        break;
                    }
                    case DoorDirection.NORTH: {

                        this.ctx.clearRect(dx, dy - doubleMapResolution, resolution, tripleMapResolution);

                        this.ctx.drawImage(this.texture, sxVertical, tileSetYElement, resolution, resolution, dx, dy, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxVertical, sy, resolution, resolution, dx, dy - resolution, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxVertical, syEast, resolution, resolution, dx, dy - doubleMapResolution, resolution, resolution);
                        break;
                    }
                    case DoorDirection.WEST: {

                        this.ctx.clearRect(x, y, doubleMapResolution, tripleMapResolution);

                        this.ctx.drawImage(this.texture, sxHorizontal, sy, resolution, resolution, dx, dyEast, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal, syEast, resolution, resolution, dx, y, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal2, tileSetYElement, resolution, resolution, x, dy, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal2, sy, resolution, resolution, x, dyEast, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal2, syEast, resolution, resolution, x, y, resolution, resolution);

                        this.ctx.drawImage(this.texture, sxHorizontal, tileSetYElement, resolution, resolution, dx, dy, resolution, resolution);
                        break;
                    }
                }
            }
        }
        if (!this.firstTimeDrawn) {

            const sxVertical = tileSetXElement + 2 * doubleMapResolution;
            const sxHorizontal = tileSetXElement + 4 * doubleMapResolution;
            const sxHorizontal2 = tileSetXElement + 7 * resolution;
            switch (this.direction) {

                case DoorDirection.NORTH: {

                    this.ctx.drawImage(this.texture, sxVertical, tileSetYElement, resolution, resolution, dx, dy, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxVertical, sy, resolution, resolution, dx, dyEast, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxVertical, syEast, resolution, resolution, dx, y, resolution, resolution);
                    break;
                }
                case DoorDirection.EAST: {

                    this.ctx.drawImage(this.texture, sxHorizontal, sy, resolution, resolution, dx, dyEast, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal, syEast, resolution, resolution, dx, y, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal2, tileSetYElement, resolution, resolution, x, dy, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal2, sy, resolution, resolution, x, dyEast, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal2, syEast, resolution, resolution, x, y, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal, tileSetYElement, resolution, resolution, dx, dy, resolution, resolution);
                    break;
                }
                case DoorDirection.SOUTH: {

                    this.ctx.drawImage(this.texture, sxVertical, tileSetYElement, resolution, resolution, dx, dy, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxVertical, sy, resolution, resolution, dx, dyEast, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxVertical, tileSetYElement + resolution, resolution, resolution, dx, (baseY + 1) * resolution, resolution, resolution);
                    break;
                }
                case DoorDirection.WEST: {

                    this.ctx.drawImage(this.texture, sxHorizontal, sy, resolution, resolution, dx, dyEast, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal, syEast, resolution, resolution, dx, y, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal2, tileSetYElement, resolution, resolution, x, dy, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal2, sy, resolution, resolution, x, dyEast, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal2, syEast, resolution, resolution, x, y, resolution, resolution);

                    this.ctx.drawImage(this.texture, sxHorizontal, tileSetYElement, resolution, resolution, dx, dy, resolution, resolution);
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
        value.sync();
        value.update();
        value.drawDoor();
    });
}
