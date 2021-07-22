import {Interactive} from "./interactive"
import {getCorrectedPlayerCoordinates, getOurPlayer, getRoom} from "../util"
import {Chunk, MapInfo, TileSet} from "../map"
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
        this.sync();
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
        const tsy1 = this.chunk.tileSetY[this.chunkX][this.chunkY];
        const tsx1 = this.chunk.tileSetX[this.chunkX][this.chunkY];
        const tsy1Minus = tsy1 - resolution;
        const tsy1Minus2 = tsy1 - resolution * 2;
        const tsy1Plus = tsy1 + resolution;
        const dx1 = baseX * resolution;
        const dx2 = (baseX - 1) * resolution;
        const dy1 = baseY * resolution;
        const dy1Minus = dy1 - resolution;
        const dy1Minus2 = dy1 - resolution * 2;
        const dy2 = (baseY - 1) * resolution;
        const dy3Minus = (baseY - 2) * resolution;
        const dy3Plus = (baseY + 1) * resolution;
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
                const tsx1PlusAC1 = tsx1 + this.animationCounter * resolution;
                const tsx1PlusAC2 = tsx1 + (this.animationCounter * 2) * resolution;
                const tsx1PlusAc2Minus = tsx1 + (this.animationCounter * 2 - 1) * resolution;
                switch (this.direction) {
                    case DoorDirection.NORTH: {
                        this.ctx.clearRect(dx1, dy1Minus2, resolution, resolution * 3);
                        // this.drawVerticalBase(dx1, dy1 - doubleMapResolution, dy1, resolution, tsx1PlusAC1, tsy1, tsy1Minus);
                        this.ctx.drawImage(this.texture, tsx1PlusAC1, tsy1, resolution, resolution, dx1, dy1, resolution, resolution);
                        this.ctx.drawImage(this.texture, tsx1PlusAC1, tsy1Minus, resolution, resolution, dx1, dy1Minus, resolution, resolution);
                        this.ctx.drawImage(this.texture, tsx1PlusAC1, tsy1Minus2, resolution, resolution, dx1, dy1Minus2, resolution, resolution);
                        break;
                    }
                    case DoorDirection.EAST:
                    case DoorDirection.WEST: {
                        this.ctx.clearRect(dx2, dy3Minus, resolution * 2, resolution * 3);
                        this.drawHorizontal(resolution, tsx1PlusAC2, tsx1PlusAc2Minus, dx1, dx2, tsy1, dy1, tsy1Minus, dy2, tsy1Minus2, dy3Minus);
                        break;
                    }
                    case DoorDirection.SOUTH: {
                        this.ctx.clearRect(dx1, dy1Minus, resolution, resolution * 3);
                        // this.drawVerticalBase(dx1, dy1 - resolution, dy1, resolution, tsx1PlusAC1, tsy1, tsy1Minus);
                        this.ctx.drawImage(this.texture, tsx1PlusAC1, tsy1, resolution, resolution, dx1, dy1, resolution, resolution);
                        this.ctx.drawImage(this.texture, tsx1PlusAC1, tsy1Minus, resolution, resolution, dx1, dy1Minus, resolution, resolution);
                        this.ctx.drawImage(this.texture, tsx1PlusAC1, tsy1Plus, resolution, resolution, dx1, dy1 + resolution, resolution, resolution);
                        break;
                    }
                }
            }
        }
        if (!this.firstTimeDrawn) {
            const tsx1Plus4 = tsx1 + 4 * resolution;
            const tsx1Plus7 = tsx1 + 7 * resolution;
            const tsx1Plus8 = tsx1 + 8 * resolution;
            switch (this.direction) {
                case DoorDirection.NORTH: {
                    this.drawThree(resolution, tsx1Plus4, dx1, tsy1, dy1, tsy1Minus, dy2, tsy1Minus2, dy3Minus);
                    break;
                }
                case DoorDirection.EAST:
                case DoorDirection.WEST: {
                    this.drawHorizontal(resolution, tsx1Plus8, tsx1Plus7, dx1, dx2, tsy1, dy1, tsy1Minus, dy2, tsy1Minus2, dy3Minus);
                    break;
                }
                case DoorDirection.SOUTH: {
                    this.ctx.drawImage(this.texture, tsx1Plus4, tsy1, resolution, resolution, dx1, dy1, resolution, resolution);
                    this.ctx.drawImage(this.texture, tsx1Plus4, tsy1Minus, resolution, resolution, dx1, dy2, resolution, resolution);
                    this.ctx.drawImage(this.texture, tsx1Plus4, tsy1Plus, resolution, resolution, dx1, dy3Plus, resolution, resolution);
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

    private drawVerticalBase(dx: number, clearY: number, dy: number, resolution: number, sxVertical: number, tileSetYElement: number, sy: number) {
        this.ctx.clearRect(dx, clearY, resolution, resolution * 3);
        this.ctx.drawImage(this.texture, sxVertical, tileSetYElement, resolution, resolution, dx, dy, resolution, resolution);
        this.ctx.drawImage(this.texture, sxVertical, sy, resolution, resolution, dx, dy - resolution, resolution, resolution);
    }

    private drawHorizontal(resolution: number, sx11: number, sx12: number, dx1: number, dx2: number, sy1: number, dy1: number, sy2: number, dy2: number, sy3: number, dy3: number) {
        this.drawThree(resolution, sx11, dx1, sy1, dy1, sy2, dy2, sy3, dy3);
        this.drawThree(resolution, sx12, dx2, sy1, dy1, sy2, dy2, sy3, dy3);
    }

    private drawThree(resolution: number, sx1: number, dx1: number, sy1: number, dy1: number, sy2: number, dy2: number, sy3: number, dy3: number) {
        this.ctx.drawImage(this.texture, sx1, sy1, resolution, resolution, dx1, dy1, resolution, resolution);
        this.ctx.drawImage(this.texture, sx1, sy2, resolution, resolution, dx1, dy2, resolution, resolution);
        this.ctx.drawImage(this.texture, sx1, sy3, resolution, resolution, dx1, dy3, resolution, resolution);
    }

}

export function updateDoors() {
    Door.doors.forEach((value) => {
        value.sync();
        value.update();
        value.drawDoor();
    });
}
