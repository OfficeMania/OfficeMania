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

    unlockDoor() {
        this.isClosed = false;
        this.room.send(MessageType.OPEN_DOOR, this.posX + "" + this.posY);
    }

    knockDoor(id: string) {
        //TODO Klopfton im Raum abspielen (also bei Spielern, die sich aktuell in der RaumID des Raumes befinden)
        console.log("Klopf, klopf from:", id);
    }

    startInteraction(playerX: number, playerY: number, playerId: string) {
        switch (this.direction) {
            case DoorDirection.NORTH: {
                if (playerY < this.posY) {
                    this.knockDoor(playerId);
                } else {
                    if (this.isClosed) {
                        this.unlockDoor();
                    } else {
                        this.lockDoor(playerId);
                    }
                }
                break;
            }
            case DoorDirection.EAST: {
                if (playerX > this.posX) {
                    this.knockDoor(playerId);
                } else {
                    if (this.isClosed) {
                        this.unlockDoor();
                    } else {
                        this.lockDoor(playerId);
                    }
                }
                break;
            }
            case DoorDirection.SOUTH: {
                if (playerY > this.posY) {
                    this.knockDoor(playerId);
                } else {
                    if (this.isClosed) {
                        this.unlockDoor();
                    } else {
                        this.lockDoor(playerId);
                    }
                }
                break;
            }
            case DoorDirection.WEST: {
                if (playerX < this.posX) {
                    this.knockDoor(playerId);
                } else {
                    if (this.isClosed) {
                        this.unlockDoor();
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
        //
        const tx = this.chunk.tileSetX[this.chunkX][this.chunkY];
        const ty = this.chunk.tileSetY[this.chunkX][this.chunkY];
        //
        const bx = this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2);
        const by = this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2);
        //
        const bxTimes = bx * resolution;
        const bxMinusTimes = (bx - 1) * resolution;
        const bxPlusTimes = (bx + 1) * resolution;
        //
        const bottomDeep = new DoorPart(ty + resolution, (by + 1) * resolution);
        const bottom = new DoorPart(ty, by * resolution);
        const middle = new DoorPart(ty - resolution, (by - 1) * resolution);
        const top = new DoorPart(ty - resolution * 2, (by - 2) * resolution);
        if (this.inAnimation && this.syncIndex && this.delay === 5) { //TODO Do not sync door animation with server? Just animate it on message/event...
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
                const sxOpenVertical = tx + this.animationCounter * resolution;
                const sxOpenHorizontalLeft = tx + (this.animationCounter * 2 - 1) * resolution;
                const sxOpenHorizontalRight = tx + (this.animationCounter * 2) * resolution;
                switch (this.direction) {
                    case DoorDirection.NORTH: {
                        this.ctx.clearRect(bxTimes, top.dy, resolution, resolution * 3);
                        break;
                    }
                    case DoorDirection.EAST: {
                        // this.ctx.clearRect(bxTimes, top.dy, resolution * 2, resolution * 3);
                        this.ctx.clearRect(bxMinusTimes, top.dy, resolution * 2, resolution * 3);
                        break;
                    }
                    case DoorDirection.SOUTH: {
                        this.ctx.clearRect(bxTimes, middle.dy, resolution, resolution * 3);
                        break;
                    }
                    case DoorDirection.WEST: {
                        this.ctx.clearRect(bxMinusTimes, top.dy, resolution * 2, resolution * 3);
                        break;
                    }
                }
                this.drawDoorIntern(resolution, sxOpenVertical, sxOpenHorizontalLeft, sxOpenHorizontalRight, bxTimes, bxMinusTimes, bxPlusTimes, bottomDeep, bottom, middle, top);
            }
        }
        if (!this.firstTimeDrawn) {
            const sxOpenVertical = tx + 4 * resolution;
            const sxOpenHorizontalLeft = tx + 7 * resolution;
            const sxOpenHorizontalRight = tx + 8 * resolution;
            this.drawDoorIntern(resolution, sxOpenVertical, sxOpenHorizontalLeft, sxOpenHorizontalRight, bxTimes, bxMinusTimes, bxPlusTimes, bottomDeep, bottom, middle, top);
            this.firstTimeDrawn = true;
        }
        if (this.delay === 5) {
            this.delay = 0;
        }
        this.delay++;
    }

    private drawDoorIntern(resolution: number, sxVertical: number, sxHorizontalLeft: number, sxHorizontalRight: number, dxMiddle: number, dxLeft: number, dxRight: number, bottomDeep: DoorPart, bottom: DoorPart, middle: DoorPart, top: DoorPart) {
        switch (this.direction) {
            case DoorDirection.NORTH: {
                this.drawVertical(resolution, sxVertical, dxMiddle, bottom, middle, top);
                break;
            }
            case DoorDirection.EAST: {
                // this.drawHorizontal(resolution, sxHorizontalLeft, sxHorizontalRight, dxMiddle, dxRight, bottom, middle, top);
                this.drawHorizontal(resolution, sxHorizontalLeft, sxHorizontalRight, dxLeft, dxMiddle, bottom, middle, top);
                break;
            }
            case DoorDirection.SOUTH: {
                this.drawVertical(resolution, sxVertical, dxMiddle, bottomDeep, bottom, middle);
                break;
            }
            case DoorDirection.WEST: {
                this.drawHorizontal(resolution, sxHorizontalLeft, sxHorizontalRight, dxLeft, dxMiddle, bottom, middle, top);
                break;
            }
        }
    }

    private drawHorizontal(resolution: number, sxLeft: number, sxRight: number, dxLeft: number, dxRight: number, bottom: DoorPart, middle: DoorPart, top: DoorPart) {
        this.drawVertical(resolution, sxLeft, dxLeft, bottom, middle, top); // Draw left Part of the Door
        this.drawVertical(resolution, sxRight, dxRight, bottom, middle, top); // Draw right Part of the Door
    }

    private drawVertical(length: number, sx: number, dx: number, bottom: DoorPart, middle: DoorPart, top: DoorPart) {
        this.ctx.drawImage(this.texture, sx, bottom.sy, length, length, dx, bottom.dy, length, length); // Draw bottom Part of the Door
        this.ctx.drawImage(this.texture, sx, middle.sy, length, length, dx, middle.dy, length, length); // Draw middle Part of the Door
        this.ctx.drawImage(this.texture, sx, top.sy, length, length, dx, top.dy, length, length); // Draw top Part of the Door
    }

}

export function updateDoors() {
    Door.doors.forEach((value) => {
        value.sync();
        value.update();
        value.drawDoor();
    });
}

class DoorPart {

    private _sy: number;
    private _dy: number;

    constructor(sx: number, dy: number) {
        this._sy = sx;
        this._dy = dy;
    }

    get sy(): number {
        return this._sy;
    }

    set sy(value: number) {
        this._sy = value;
    }

    get dy(): number {
        return this._dy;
    }

    set dy(value: number) {
        this._dy = value;
    }

}
