import { Interactive } from "./interactive";
import {
    createCloseInteractionButton,
    getCollisionInfo,
    getCorrectedPlayerCoordinates,
    getNewCorrectedPlayerCoordinate,
    getNewPlayerFacingCoordinates,
    getOurPlayer,
    getPlayers,
    getRoom,
    InputMode,
    PlayerRecord,
    removeCloseInteractionButton,
    sendNotification,
} from "../util";
import { Chunk, MapInfo, solidInfo, TileSet } from "../map";
import { Room } from "colyseus.js";
import { Direction, MessageType, State } from "../../common";
import { doors, interactiveCanvas } from "../static";
import { Player } from "../player";
import { checkInputMode, START_POSITION_X, START_POSITION_Y } from "../main";
import { setInputMode } from "../input";
import { Animation, doorAnimation, drawMap, GroundType, MapData } from "../newMap";
import { Space } from "../util/space";

export enum DoorDirection {
    UNKNOWN,
    NORTH,
    EAST,
    SOUTH,
    WEST,
    ALWAYS_OPEN,
}

let lastKnocked: number = Date.now();

export class Door extends Interactive {
    isClosed: boolean;
    direction: DoorDirection;
    playerId: string;
    posX: number;
    posY: number;
    map: MapInfo;
    texture: HTMLImageElement;
    private room: Room<State>;
    static doors: Door[] = [];
    chunk: Chunk;
    inOpenAnimation: boolean;
    inCloseAnimation: boolean
    path: string;
    animation: doorAnimation;
    newMap: MapData;
    id: string;

    constructor(direction: DoorDirection, posX: number, posY: number, path: string, animation: doorAnimation) {
        super("Door", true, 1);
        this.isClosed = false;
        this.direction = direction;
        this.posX = posX;
        this.posY = posY;
        this.path = path;
        this.room = getRoom();
        this.id = posX + "." + posY;
        this.room.send(MessageType.DOOR_NEW, this.id);
        Door.doors.push(this);
        this.inOpenAnimation = false;
        this.inCloseAnimation = false;
        this.animation = animation;
    }

    onInteraction(): void {
        let player = getOurPlayer();
        //let [x, y] = getCorrectedPlayerCoordinates(player);
        let [x, y] = getNewCorrectedPlayerCoordinate(player);
        this.startInteraction(x, y, player.roomId);
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
            let message = [this.id, this.playerId];
            this.room.send(MessageType.DOOR_LOCK, message);

            const oldDoorPos = Space.NEW_MAP.toOldMapSolidInfo(this.posX, this.posY);
            Door.doors
                .filter(oldDoor => oldDoor.posX === oldDoorPos.x && oldDoor.posY === oldDoorPos.y)
                .forEach(oldDoor => {
                    this.room.send(MessageType.DOOR_LOCK, [oldDoor.id, this.playerId]);
                    oldDoor.isClosed = true;
                });
            this.inCloseAnimation = true;
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
        this.room.send(MessageType.DOOR_UNLOCK, this.id);
        this.inOpenAnimation = true;
        for (const door of Door.doors) {
            let x = door.posX -72 + (8 - this.posX);
            let y = door.posY - 79 + (-17 - this.posY);
            if (x == this.posX && y == this.posY) {
                this.room.send(MessageType.DOOR_UNLOCK, door.id);
                door.isClosed = false;
            }
        }
    }

    //id describes who knocks
    knockDoor(id: string): void  {
        const temp = Date.now()
        if (temp - lastKnocked > 2000) {
            const roomId: string = this.getRoomId().toString();
            const callPlayers: string[] = [];
            const players: PlayerRecord = getPlayers();
            for (const player of Object.values(players)) {
                //if player is in the room and the player isn't us
                if (this.checkRoom(player, roomId) && player.roomId !== id) {
                    callPlayers.push(player.roomId);
                }
            }
            //console.log(callPlayers);
            this.room.send(MessageType.DOOR_KNOCK, callPlayers);
            lastKnocked = temp;
            console.log("Knocked (Local)");
        }
        else {
            //console.warn("Faggot dont spam");
        }
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
        var posX: number;
        var posY: number;
        for (const door of Door.doors) {
            let x = door.posX - 72 + (8 - this.posX);
            let y = door.posY - 79 + (-17 - this.posY);
            if (this.direction == DoorDirection.NORTH) {
                y += 2;
            }
            if (x == this.posX && y == this.posY) {
                posX = door.posX;
                posY = door.posY;
                if (this.direction == DoorDirection.NORTH) {
                    posY += 2;
                }
            }
        }
        switch (this.direction) {
            case DoorDirection.NORTH: {
                roomX = posX;
                roomY = posY + 2;
                break;
            }
            case DoorDirection.SOUTH: {
                roomX = posX;
                roomY = posY - 1;
                break;
            }
            case DoorDirection.WEST: {
                roomX = posX + 2;
                roomY = posY;
                break;
            }
            case DoorDirection.EAST: {
                roomX = posX - 1;
                roomY = posY;
                break;
            }
        }

        return collisionInfo[roomX][roomY].roomId;
    }

    startInteraction(playerX: number, playerY: number, playerId: string) {
        if (this.animation === null) {
            return;
        }
        let correctionX = 0;
        let correctionY = 0;
        if (this.direction == DoorDirection.WEST) {
            correctionX++;
        }
        if (this.direction == DoorDirection.SOUTH) {
            correctionY += 2;
        }
        const isVertical: boolean = this.direction === DoorDirection.NORTH || this.direction === DoorDirection.SOUTH;
        const isBigger: boolean = this.direction === DoorDirection.EAST || this.direction === DoorDirection.SOUTH;
        const player = isVertical ? playerY + correctionY: playerX - correctionX;
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
        const doorState = this.room.state.doorStates[this.id];
        this.playerId = doorState?.playerId;
    }

    update(spriteSheet: HTMLCanvasElement, background: HTMLCanvasElement, map: MapData, tileSize: number) {
        const doorState = this.room.state.doorStates[this.id];
        if (this.isClosed != doorState?.isClosed && !this.inCloseAnimation && !this.inOpenAnimation) {
            if (doorState?.isClosed) {
                this.animation._animationState = 0;
            } else {
                this.animation._animationState = this.animation._animationSteps - 1;
            }
            this.draw(spriteSheet, background, map, tileSize);
        }
        this.isClosed = doorState?.isClosed;
        for (const door of Door.doors) {
            let x = door.posX -72 + (8 - this.posX);
            let y = door.posY - 79 + (-17 - this.posY);
            if (this.direction == DoorDirection.NORTH) {
                y += 2;
            }
            if (x == this.posX && y == this.posY) {
                door.isClosed = doorState?.isClosed;
            }
        }
    }

    draw(spriteSheet: HTMLCanvasElement, background: HTMLCanvasElement, map: MapData, tileSize: number) {
        let ctx = background.getContext("2d");
        ctx.clearRect(
            (this.animation.posx + Math.abs(map._lowestPosx)) * tileSize,
            (this.animation.posy + Math.abs(map._lowestPosy)) * tileSize,
            this.animation.width * tileSize, this.animation.height * tileSize);

        for (let i = 0; i < map._layerList.length; i++) {
            drawMap(
                map,
                spriteSheet,
                background,
                this.animation.posx,
                this.animation.posy,
                this.animation.posx + this.animation.width - 1,
                this.animation.posy + this.animation.height - 1,
                i);
        }
        for (let y = this.animation.posy; y < this.animation.posy + this.animation.height; y++) {
            for (let x = this.animation.posx; x < this.animation.posx + this.animation.width; x++) {

                const dx = (x + Math.abs(map._lowestPosx)) * 48;
                const dy = (y + Math.abs(map._lowestPosy)) * 48;

                this.animation.drawAnimation(ctx, dx, dy, x - this.animation.posx, y - this.animation.posy);
            }
        }
    }

    drawNewDoor(spriteSheet: HTMLCanvasElement, background: HTMLCanvasElement, map: MapData, tileSize: number) {
        if(this.inCloseAnimation || this.inOpenAnimation) {

            this.draw(spriteSheet, background, map, tileSize);
            if (this.inCloseAnimation) {
                this.animation.setStateClosing(map._texturePaths);
                if (this.animation._inCloseAnimation == false) {
                    this.inCloseAnimation = false;

                }
            } else if (this.inOpenAnimation) {
                this.animation.setStateOpen(map._texturePaths);
                if (this.animation._inOpenAnimation == false) {
                    this.inOpenAnimation = false;
                }
            }
        }
    }
}

export function updateDoors(spriteSheet: HTMLCanvasElement, background: HTMLCanvasElement, map: MapData, tileSize: number) {
    Door.doors.forEach(value => {
        if (value.posX <= map._highestPosx && value.posY <= map._highestPosy) {
            value.sync();
            value.update(spriteSheet, background, map, tileSize);
            value.drawNewDoor(spriteSheet, background, map, tileSize);
        }
    });
}

export function setDoorTextures(map: MapData) {
    Door.doors.forEach(value => {
        if (value.posX <= map._highestPosx && value.posY <= map._highestPosy) {
            value.animation.getImage(map._texturePaths.getPath(value.path));
        }
    });
}
export function initDoorState(map: MapData, ctx: CanvasRenderingContext2D) {
    Door.doors.forEach(value => {
        if (value.posX <= map._highestPosx && value.posY <= map._highestPosy) {
            value.animation.initCounter();
            value.animation.drawDoorsFirstTime(map, ctx);
        }
    });
    getRoom().state.doorStates.forEach((door, key) => {
        door.onChange = (changes) => {
            changes.forEach(change => {
                if (change.field === "isClosed") {
                    for (const door of Door.doors) {
                        if (key === door.id) {
                            if (getRoom().state.doorStates.get(key).isClosed) {
                                door.inCloseAnimation = true;
                            } else {
                                door.inOpenAnimation = true;
                            }
                        }
                    }
                }
            })
        }
    })
}
