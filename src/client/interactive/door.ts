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
        //
        const tx = this.chunk.tileSetX[this.chunkX][this.chunkY];
        const ty = this.chunk.tileSetY[this.chunkX][this.chunkY];
        //
        const tyMinus = ty - resolution;
        const tyMinus2 = ty - resolution * 2;
        const tyPlus = ty + resolution;
        //
        const bx = this.chunkStartX + this.chunkX + Math.floor(this.map.widthOfMap / 2);
        const by = this.chunkStartY + this.chunkY + Math.floor(this.map.heightOfMap / 2);
        //
        const bxTimes = bx * resolution;
        const bxMinusTimes = (bx - 1) * resolution;
        //
        const byTimes = by * resolution;
        const byMinusTimes = (by - 1) * resolution;
        const byMinus2Times = (by - 2) * resolution;
        const byPlusTimes = (by + 1) * resolution;
        //
        const byTimesMinus = byTimes - resolution;
        const byTimesMinus2 = byTimes - resolution * 2;
        const byTimesPlus = byTimes + resolution;
        //
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
                const txPlusACTimes = tx + this.animationCounter * resolution;
                const txPlusAC2Times = tx + (this.animationCounter * 2) * resolution;
                const txPlusAC2MinusTimes = tx + (this.animationCounter * 2 - 1) * resolution;
                switch (this.direction) {
                    case DoorDirection.NORTH: {
                        this.ctx.clearRect(bxTimes, byTimesMinus2, resolution, resolution * 3);
                        // this.drawVerticalBase(bxTimes, byTimes - doubleMapResolution, byTimes, resolution, txPlusACTimes, ty, tsy1Minus);
                        this.ctx.drawImage(this.texture, txPlusACTimes, ty, resolution, resolution, bxTimes, byTimes, resolution, resolution);
                        this.ctx.drawImage(this.texture, txPlusACTimes, tyMinus, resolution, resolution, bxTimes, byTimesMinus, resolution, resolution);
                        this.ctx.drawImage(this.texture, txPlusACTimes, tyMinus2, resolution, resolution, bxTimes, byTimesMinus2, resolution, resolution);
                        break;
                    }
                    case DoorDirection.EAST:
                    case DoorDirection.WEST: {
                        this.ctx.clearRect(bxMinusTimes, byMinus2Times, resolution * 2, resolution * 3);
                        this.drawHorizontal(resolution, txPlusAC2Times, txPlusAC2MinusTimes, bxTimes, bxMinusTimes, ty, byTimes, tyMinus, byMinusTimes, tyMinus2, byMinus2Times);
                        break;
                    }
                    case DoorDirection.SOUTH: {
                        this.ctx.clearRect(bxTimes, byTimesMinus, resolution, resolution * 3);
                        // this.drawVerticalBase(bxTimes, byTimes - resolution, byTimes, resolution, txPlusACTimes, ty, tsy1Minus);
                        this.ctx.drawImage(this.texture, txPlusACTimes, ty, resolution, resolution, bxTimes, byTimes, resolution, resolution);
                        this.ctx.drawImage(this.texture, txPlusACTimes, tyMinus, resolution, resolution, bxTimes, byTimesMinus, resolution, resolution);
                        this.ctx.drawImage(this.texture, txPlusACTimes, tyPlus, resolution, resolution, bxTimes, byTimesPlus, resolution, resolution);
                        break;
                    }
                }
            }
        }
        if (!this.firstTimeDrawn) {
            const txPlus4 = tx + 4 * resolution;
            const txPlus7 = tx + 7 * resolution;
            const txPlus8 = tx + 8 * resolution;
            switch (this.direction) {
                case DoorDirection.NORTH: {
                    this.drawThree(resolution, txPlus4, bxTimes, ty, byTimes, tyMinus, byMinusTimes, tyMinus2, byMinus2Times);
                    break;
                }
                case DoorDirection.EAST:
                case DoorDirection.WEST: {
                    this.drawHorizontal(resolution, txPlus8, txPlus7, bxTimes, bxMinusTimes, ty, byTimes, tyMinus, byMinusTimes, tyMinus2, byMinus2Times);
                    break;
                }
                case DoorDirection.SOUTH: {
                    this.ctx.drawImage(this.texture, txPlus4, ty, resolution, resolution, bxTimes, byTimes, resolution, resolution);
                    this.ctx.drawImage(this.texture, txPlus4, tyMinus, resolution, resolution, bxTimes, byMinusTimes, resolution, resolution);
                    this.ctx.drawImage(this.texture, txPlus4, tyPlus, resolution, resolution, bxTimes, byPlusTimes, resolution, resolution);
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
