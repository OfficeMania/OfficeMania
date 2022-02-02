import { Interactive } from "./interactive";
import {
    createCloseInteractionButton,
    getCollisionInfo,
    getCorrectedPlayerCoordinates,
    getOurPlayer,
    getPlayers,
    getRoom,
    InputMode,
    PlayerRecord,
    removeCloseInteractionButton,
} from "../util";
import { Chunk, MapInfo, solidInfo, TileSet } from "../map";
import { Room } from "colyseus.js";
import { MessageType, State } from "../../common";
import { doors, interactiveCanvas } from "../static";
import { Player } from "../player";
import { checkInputMode } from "../main";
import { setInputMode } from "../input";

export enum DoorDirection {
    UNKNOWN,
    NORTH,
    EAST,
    SOUTH,
    WEST,
    ALWAYS_OPEN,
}

export function sendNotification(message: string) {
    //TODO make Notification beautiful
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
    }else if (window.Notification.permission === "granted") {
        new window.Notification(message);
    } else if (window.Notification.permission !== "denied") {
        //we send even though the person doesnt wqant to get notifications
        window.Notification.requestPermission(function (permission) {
            if (permission === "granted") {
              new window.Notification(message);
            }
          });
    }
}

export class Door extends Interactive {
    isClosed: boolean;
    direction: DoorDirection;
    playerId: string;
    posX: number;
    posY: number;
    map: MapInfo;
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
        this.room.send(MessageType.DOOR_NEW, id);
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
        this.startInteraction(x, y, player.roomId);
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
                        if (!chunk.tileSetForElement[this.chunkX][this.chunkY]) {
                            //why are there two doors with this?
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
                        if (!groundChunk.tileSetForElement[this.chunkX][this.chunkY]) {
                            //why are there two doors with this?
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
            //TODO
            this.printWarning();
            console.warn("Tried to close an always open door");
        } else {
            this.playerId = id;
            this.isClosed = true;
            let message = [this.posX + "" + this.posY, this.playerId];
            this.room.send(MessageType.DOOR_LOCK, message);
        }
    }

    printMessage(iCtx: CanvasRenderingContext2D) {
        iCtx.textAlign = "left";
        iCtx.fillStyle = "black";
        iCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        iCtx.fillStyle = "white";
        iCtx.fillRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);

        iCtx.fillStyle = "black";
        iCtx.font = "50px Comic Sans";
        iCtx.lineWidth = 3;
        iCtx.fillText("You cannot close a door", 100, 100);
        iCtx.fillText("that is supossed to be open all the time", 100, 150);
    }

    loop() {}

    printWarning() {
        interactiveCanvas.style.visibility = "visible";
        const interactiveCtx = interactiveCanvas.getContext("2d");
        interactiveCtx.textAlign = "center";
        createCloseInteractionButton(() => this.leave());
        checkInputMode();
        this.printMessage(interactiveCtx);
    }

    leave() {
        removeCloseInteractionButton();
        interactiveCanvas.style.visibility = "hidden";
        setInputMode(InputMode.NORMAL);
    }

    unlockDoor() {
        this.isClosed = false;
        this.room.send(MessageType.DOOR_UNLOCK, this.posX + "" + this.posY);
    }

    //id descripes who knocks
    knockDoor(id: string): void  {
        const roomId = "" + this.getRoomId();

        const callPlayers: string[] = [];
        const players: PlayerRecord = getPlayers();
        for (const player of Object.values(players)) {
            //if player is in the room and the player isn't us
            if (this.checkRoom(player, roomId) && player.roomId !== id) {
                callPlayers.push(player.roomId);
            }
        }

        this.room.send(MessageType.DOOR_KNOCK, callPlayers);
    }

    checkRoom(player: Player, roomId: String): boolean {
        const collisionInfo: solidInfo[][] = getCollisionInfo();
        const [posX, posY] = getCorrectedPlayerCoordinates(player);
        if(collisionInfo[posX][posY]?.roomId + "" === roomId) {
            return true;
        }
        return false;
    }

    getRoomId() {
        const collisionInfo: solidInfo[][] = getCollisionInfo();
        var roomX: number;
        var roomY: number;
        switch (this.direction) {
            case DoorDirection.NORTH: {
                roomX = this.posX;
                roomY = this.posY + 2;
                break;
            }
            case DoorDirection.SOUTH: {
                roomX = this.posX;
                roomY = this.posY - 1;
                break;
            }
            case DoorDirection.WEST: {
                roomX = this.posX + 2;
                roomY = this.posY;
                break;
            }
            case DoorDirection.EAST: {
                roomX = this.posX - 1;
                roomY = this.posY;
                break;
            }
        }

        return collisionInfo[roomX][roomY].roomId;
    }

    startInteraction(playerX: number, playerY: number, playerId: string) {
        const isVertical: boolean = this.direction === DoorDirection.NORTH || this.direction === DoorDirection.SOUTH;
        const isBigger: boolean = this.direction === DoorDirection.EAST || this.direction === DoorDirection.SOUTH;
        const player = isVertical ? playerY : playerX;
        const pos = isVertical ? this.posY : this.posX;
        if (isBigger ? player > pos : player < pos) {
            //you knock on door every time you are outside of the room
            this.knockDoor(playerId);
        } else {
            if (this.isClosed) {
                this.unlockDoor();
            } else {
                this.lockDoor(playerId);
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
        if (this.inAnimation && this.syncIndex && this.delay === 5) {
            //TODO Do not sync door animation with server? Just animate it on message/event...
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
                const sxOpenHorizontalRight = tx + this.animationCounter * 2 * resolution;
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
                this.drawDoorIntern(
                    resolution,
                    sxOpenVertical,
                    sxOpenHorizontalLeft,
                    sxOpenHorizontalRight,
                    bxTimes,
                    bxMinusTimes,
                    bxPlusTimes,
                    bottomDeep,
                    bottom,
                    middle,
                    top
                );
            }
        }
        if (!this.firstTimeDrawn) {
            const sxOpenVertical = tx + 4 * resolution;
            const sxOpenHorizontalLeft = tx + 7 * resolution;
            const sxOpenHorizontalRight = tx + 8 * resolution;
            this.drawDoorIntern(
                resolution,
                sxOpenVertical,
                sxOpenHorizontalLeft,
                sxOpenHorizontalRight,
                bxTimes,
                bxMinusTimes,
                bxPlusTimes,
                bottomDeep,
                bottom,
                middle,
                top
            );
            this.firstTimeDrawn = true;
        }
        if (this.delay === 5) {
            this.delay = 0;
        }
        this.delay++;
    }

    private drawDoorIntern(
        resolution: number,
        sxVertical: number,
        sxHorizontalLeft: number,
        sxHorizontalRight: number,
        dxMiddle: number,
        dxLeft: number,
        dxRight: number,
        bottomDeep: DoorPart,
        bottom: DoorPart,
        middle: DoorPart,
        top: DoorPart
    ) {
        switch (this.direction) {
            case DoorDirection.NORTH: {
                this.drawVertical(resolution, sxVertical, dxMiddle, bottom, middle, top);
                break;
            }
            case DoorDirection.EAST: {
                // this.drawHorizontal(resolution, sxHorizontalLeft, sxHorizontalRight, dxMiddle, dxRight, bottom, middle, top);
                this.drawHorizontal(
                    resolution,
                    sxHorizontalLeft,
                    sxHorizontalRight,
                    dxLeft,
                    dxMiddle,
                    bottom,
                    middle,
                    top
                );
                break;
            }
            case DoorDirection.SOUTH: {
                this.drawVertical(resolution, sxVertical, dxMiddle, bottomDeep, bottom, middle);
                break;
            }
            case DoorDirection.WEST: {
                this.drawHorizontal(
                    resolution,
                    sxHorizontalLeft,
                    sxHorizontalRight,
                    dxLeft,
                    dxMiddle,
                    bottom,
                    middle,
                    top
                );
                break;
            }
        }
    }

    private drawHorizontal(
        resolution: number,
        sxLeft: number,
        sxRight: number,
        dxLeft: number,
        dxRight: number,
        bottom: DoorPart,
        middle: DoorPart,
        top: DoorPart
    ) {
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
    Door.doors.forEach(value => {
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
