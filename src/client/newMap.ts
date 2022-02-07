import { Room } from "colyseus.js";
import { loadImage } from "./util";
import {Interactive} from "./interactive/interactive"
import { helpExitButton } from "./static";
import { lowestX, lowestY } from "./main";
import { classicNameResolver } from "typescript";
import { Door, DoorDirection } from "./interactive/door";
import { PingPongTable } from "./interactive/pingpongtable";
import { Whiteboard } from "./interactive/whiteboard";
import { Todo } from "./interactive/todo";
import { CoffeeMachine } from "./interactive/machines/coffeeMachine";
import { Donuts } from "./interactive/donuts";
import { VendingMachine } from "./interactive/machines/vendingMachine";
import { State } from "../common";
import { Cat } from "./interactive/cat";
import { ChessBoard } from "./interactive/chessboard";
import { Computer } from "./interactive/computer";
import { WaterCooler } from "./interactive/machines/waterCooler";
import { Notes } from "./interactive/notes";
import { MapInfo } from "./map";
export class Chunk {

    private readonly _posX: number;
    private readonly _posY: number;
    private readonly _data: dataFromPos[][];

    public get posX(): number { return this._posX; };
    public get posY(): number { return this._posY; };
    public get data(): dataFromPos[][] { return this._data; };

    constructor(posX: number, posY: number, layerSize: number) {
        this._posX = posX;
        this._posY = posY;
        this._data = [];
        for (let i = 0; i < 16; i++) {
            this._data[i] = [];
        }
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                this._data[x][y] = new dataFromPos(layerSize);
            }
        }
    }
}

export class Animation {

    private _path: string; //Path from the animation
    private _animationState: number; //The current state of the snimation
    private _width: number; //Width of the animation
    private _height: number; //Height of the animation
    private _posx: number //xpos
    private _posy: number //ypos
    private _groundType: GroundType //The time it will be drawn
    private _counter: number;
    private _image: HTMLImageElement;
    private _speed: number;

    public get animationState() { return this._animationState; };
    public get path() { return this._path; };
    public get posx() { return this._posx; };
    public get posy() { return this._posy; };
    public get groundType() { return this._groundType; };
    public get width() { return this._width; };
    public get height() { return this._height; };

    constructor(path:string, width: number, height: number, posx: number, posy: number, groundType: GroundType, speed: number) {

        this._path = path;
        this._width = width;
        this._height = height;
        this._posx = posx;
        this._posy = posy;
        this._groundType = groundType;
        this._animationState = 0;
        this._counter = 0;
        this._speed = speed;
    }

    private async getImage(path: string) {
        if (this._image == undefined) {
            this._image = await loadImage(path);
        }
        return this._image;
    }

    public async setState(texturePaths: TexturePaths) {
        let width = (await this.getImage(texturePaths.getPath(this._path))).naturalWidth / 48 / this._width;
        this._counter++;
        this._counter = this._counter % (this._speed * width);
        this._animationState = Math.floor(this._counter / this._speed);
    }

    public async drawAnimation(ctx: CanvasRenderingContext2D, dx: number, dy: number, posx: number, posy: number) {
        
        ctx.drawImage(this._image, posx * 48 + this._animationState * this._width * 48 , posy * 48, 48, 48, dx, dy, 48, 48);
    }



}

export enum GroundType {
    BackGround,
    BackGround1,
    BackGround2,
    BackGround3,
    BackGround4,
    BackGround5,
    BackGround6,
    BackGround7,
    ForeGround,
    AnimationElement
}

//Will be crated from the server and send to the clients. The clients will then load the rigth textures with the given information
export class TileSet {

    private _path: string; //Path from the png file
    private _value: number; //Contains informaton about the x an y coordinate on the png file

    constructor(path: string, value: number) {

        // Vorher schon das Bild geladen
        this._path = path;
        this._value = value;
    }

    get value() {return this._value}
    get path() {return this._path}
}

export class usedPngFile {

    private _path: string;
    private _firstGridId: number;
    private _pngWidth: number; //Must be set from the client

    constructor(firstId: number, source: string, paths: TexturePaths) {
        this._firstGridId = firstId;
        this._path = paths.getPath(source);
    }

    get pngWidth() {return this._pngWidth}
    get firstGridId() {return this._firstGridId}
    get path() {return this._path}

    set pngWidth(width: number) {this._pngWidth = width}
    set firstGridId(id: number) {this._firstGridId = id}
    set path(path: string) {this._path = path}
}

//maybe 2 arrays? easier
export class Tuple {

    _number: number;
    _string: string;

    constructor(n: number, s: string) {
        this._number = n;
        this._string = s;
    }
    get number() {return this._number}
    get string() {return this._string}
}

//Contains all paths from the png files
export class TexturePaths {

    private _paths: string[];

    constructor(paths: string[]) {
        this._paths = paths;
    }

    public getPath(source: string) {
        source = source.replace(".tsx", ".png");
        source = source.replace("Map/", "");
        for (const path of this._paths) {
            if (path.includes(source)) {
                return path;
            }
        }
    }    
}

//Contains information about all used textures. Also includes all paths from the png files
export class TileList {

    private _list: TileSet[];

    constructor() {
        this._list = [];
    }

    public addTile(path: string, value): number {
        for (let i = 0; i < this._list.length; i++) {
            if (this._list[i].value === value && this._list[i].path.includes(path)) {
                return i;
            }
        }
        this._list.push(new TileSet(path, value));
        return this._list.length - 1; //Returns the index of the new added TileSet
    }

    public getTile(id: number) {
        return this._list[id];
    }

    get list() {return this._list}
}

class dataFromPos {

    public _textureIdF: number[]; // For Foregound
    public _textureIdB: number[]; // For Background
    public _solidInfo: boolean[][];
    public _interactive: Interactive;
    public _isConferencRoom: boolean;
    public _roomId: number;

    constructor(layerSize: number) {

        this._textureIdB = [];
        for (let i = 0; i < layerSize; i++) {
            this._textureIdB[i] = -1;
        }
        this._interactive = null;
        this._isConferencRoom = false;
        this._roomId = 0;

        this._solidInfo = [];
        this._solidInfo[0] = [];
        this._solidInfo[1] = [];
        this._solidInfo[0][0] = false;
        this._solidInfo[0][1] = false;
        this._solidInfo[1][0] = false;
        this._solidInfo[1][1] = false;
    }

    /* TODO einheitliches Koordinaten-System
    nur isSolid wird im datapackage gespeichert, Rest in dataFromPos
    Koordiante wird auf und abgerundet um alle betroffenen Felder von einem Spieler zu erkennen.
    Pfade der sheets für Animationen werden auf dem jeweiligen Feld gespeichert. 
    DONE    Vordergrund und Hintergund in einem Chunk speichern.
    */

}
class dataPackage {

    _isSolid: boolean;

    constructor() {
        this._isSolid = false
    }

    get isSolid() {return this._isSolid}

    set isSolid(isSolid: boolean) {this._isSolid = isSolid}
}

export class MapData {

    private _map: Map<string, Chunk>;
    public _tileList: TileList;
    public _animationList: Array<Animation>;
    public _texturePaths: TexturePaths;
    public _lowestPosx: number;
    public _lowestPosy: number;
    public _highestPosx: number;
    public _highestPosy: number;
    public _layerList: string[];

    constructor(paths: TexturePaths) {
        this._map = new Map<string, Chunk>();
        this._tileList = new TileList();
        this._animationList = [];
        this._texturePaths = paths;
        this._layerList = [];
    }

    public setBoundaries(lowestX: number, lowestY: number, highestX: number, highestY: number) {
        this._lowestPosx = lowestX;
        this._lowestPosy = lowestY;
        this._highestPosx = highestX;
        this._highestPosy = highestY;
    }

    private mergeChunks(chunk: Chunk, layerId: number) {

        let mergedChunk = <Chunk> this.getChunk(chunk.posX + "." + chunk.posY);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {

                if (mergedChunk.data[x][y]._textureIdB[layerId] == -1) {
                    mergedChunk.data[x][y]._textureIdB[layerId] = chunk.data[x][y]._textureIdB[layerId];
                }
            }
        }
        this._map.set(chunk.posX + "." + chunk.posY, mergedChunk);
    }

    public getChunk(id: string = "-1") { 
        if (id == "-1") {
            return this._map
        } else {
            return this._map.get(id);
        }
    }

    public addChunk(chunk: Chunk, layerIndex: number) {
        let groundChunk = this._map.get(chunk.posX + "." + chunk.posY);
        if (groundChunk == null) {
            this._map.set(chunk.posX + "." + chunk.posY, chunk);
        } else {
            this.mergeChunks(chunk, layerIndex);
        }
    }

    public async updateAnimationCounter() {
        for (const Animation of this._animationList) {
            await Animation.setState(this._texturePaths);
        }
    }

    public addLayer(name: string) {
        for (const LAYER of this._layerList) {
            if (name == LAYER) {
                break;
            }
        }
        this._layerList.push(name);
        return this._layerList.length - 1;
    }

    public getIndex(name: string) {
        for (let i = 0; i < this._layerList.length; i++) {
            if (name == this._layerList[i]) {
                return i;
            }
        }
    }

    public mergeAnimation() {
        let animationList = this._animationList;
        let mergedList: Array<Animation>;
        let animationMap = new Map<String, Animation>();
        let compareAnimation: Animation;

        mergedList = [];

        for (const ANIMATION of animationList) {
            if (!animationMap.get(ANIMATION.path)) {
                animationMap.set(ANIMATION.path, ANIMATION);
            } else {
                compareAnimation = animationMap.get(ANIMATION.path);
                if (ANIMATION.posx <= compareAnimation.posx && ANIMATION.posy <= compareAnimation.posy) {
                    animationMap.set(ANIMATION.path, ANIMATION);
                }
            }
        }
        for (const ANIMATION of animationMap.values()) {
            mergedList.push(ANIMATION);
        }
    
        this._animationList = mergedList;
    }
}

export function createTexturePaths(room: Room) {

    let paths: string[] = [];
    room.state.templatePaths.forEach((path) => paths.push(path));
    return new TexturePaths(paths);
}


export async function createMapJson(room: Room, canvas: HTMLCanvasElement) {

    let map = createMapFromJson(await fetch("/map/Map.json").then((response) => response.json()), room);
    await createSpriteSheet(map, canvas);
    return map;
}

async function createSpriteSheet(map: MapData, canvas: HTMLCanvasElement) {

    let list = map._tileList.list;
    canvas.width = Math.ceil(Math.sqrt(list.length)) * 48;
    canvas.height = canvas.width;
    let ctx = canvas.getContext("2d");
    let path = "";
    let image: HTMLImageElement;
    let width = 0;
    for (let i = 0; i < list.length; i++) {

        if (!(path == map._texturePaths.getPath(list[i].path))) {
            path = map._texturePaths.getPath(list[i].path);
            image = await loadImage(path);
            width = image.naturalWidth / 48;
        }
        let sourceX = (list[i].value % width) * 48;
        let sourceY = Math.floor(list[i].value / width) * 48;
        let dx = (i % (canvas.width / 48)) * 48;
        let dy = Math.floor(i / (canvas.width / 48)) * 48;
        ctx.drawImage(image, sourceX, sourceY, 48, 48, dx, dy, 48, 48);
    }
    return canvas;
}

export function drawMap(map: MapData, spriteSheet: HTMLCanvasElement, canvas: HTMLCanvasElement, startx: number, starty: number, endx:number, endy: number, layerIndex: number) {

    let ctx = canvas.getContext("2d");
    let mapChunks: Map<string, Chunk>;
    let size = Math.ceil(Math.sqrt(map._tileList.list.length))
    let willAnimate: boolean;
    let animationToDraw: Animation;
    let animationX: number;
    let animationY: number;
    
    mapChunks = <Map<string, Chunk>> map.getChunk();

    for (let y = starty; y <= endy; y++) {
        for (let x = startx; x <= endx; x++) {

            willAnimate = false;

            let correctX = x % 16;
            let correctY = y % 16;
            let copyX = correctX;
            let copyY = correctY;

            if (copyX < 0) {
                correctX = 16 - Math.abs(correctX);
            }
            else if (copyX == -16 % 16) {
                correctX = 0;
            }
            if (copyY < 0) {
                correctY = 16 - Math.abs(correctY);
            }
            else if (copyY == -16 % 16) {
                correctY = 0;
            }

            const ChunkX = x - correctX;
            const ChunkY = y - correctY;

            const chunk = mapChunks.get(ChunkX + "." + ChunkY);

            const dx = (x + Math.abs(map._lowestPosx)) * 48;
            const dy = (y + Math.abs(map._lowestPosy)) * 48;

            for (const ANIMATION of map._animationList) {
                if ((ChunkX + correctX - ANIMATION.posx) < ANIMATION.width && (ChunkX + correctX - ANIMATION.posx) >= 0 && (ChunkY + correctY - ANIMATION.posy) < ANIMATION.height && (ChunkY + correctY - ANIMATION.posy) >= 0 && ANIMATION.groundType == layerIndex) {
                    willAnimate = true;
                    animationToDraw = ANIMATION;
                    animationX = ChunkX + correctX - ANIMATION.posx;
                    animationY = ChunkY + correctY - ANIMATION.posy;
                }
            }

            if (chunk == null) {
                continue;
            }

            if (willAnimate == true) {
                animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                continue;
            }
            if (chunk.data[correctX][correctY]._textureIdB[layerIndex] == -1) {
                continue;
            }
            ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdB[layerIndex] % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdB[layerIndex] / size) * 48, 48, 48, dx, dy, 48, 48);
        }
    }
}

function getInteractive(value: number, basePosX: number, basePosY: number, path: string) {
    switch (value) {
        //doors
        case 1: {
            return new Door(DoorDirection.NORTH, basePosX, basePosY, path, new Animation(path, 1, 2, basePosX, basePosY, GroundType.BackGround7, 20));
        }
        case 2: {
            return new Door(DoorDirection.EAST, basePosX, basePosY, path, new Animation(path, 1, 2, basePosX, basePosY, GroundType.BackGround7, 20));
        }
        case 3: {
            return new Door(DoorDirection.SOUTH, basePosX, basePosY, path, new Animation(path, 1, 2, basePosX, basePosY, GroundType.BackGround7, 20));
        }
        case 4: {
            return new Door(DoorDirection.WEST, basePosX, basePosY, path, new Animation(path, 1, 2, basePosX, basePosY, GroundType.BackGround7, 20));
        }
        case 5: {
            return new Door(DoorDirection.ALWAYS_OPEN, basePosX, basePosY, path, new Animation(path, 1, 2, basePosX, basePosY, GroundType.BackGround7, 20));
        }
        //pongtable
        case 6: {
            return new PingPongTable();
        }
        //whiteboard
        case 7: {
            return new Whiteboard();
        }
        //Post-its
        case 8: {
            return new Todo();
        }
        //coffee machine
        case 9: {
            return new CoffeeMachine();
        }
        //Donuts
        case 10: {
            return new Donuts();
        }
        //vending machine
        case 11: {
            return new VendingMachine();
        }
        //computer
        case 12: {
            return new Computer();
        }
        //chess table
        case 15: {
            return new ChessBoard();
        }
        case 16: {
            return new WaterCooler();
        }
        case 17: {
            return new Notes();
        }
        case 18: {
            return new Cat();
        }
    }
    return null;
}

function createMapFromJson(mapJson: {[key: string]: any}, room: Room) {

    let paths = createTexturePaths(room);
    let map = new MapData(paths);
    let usedPngFiles: usedPngFile[] = [];
    let lowestX: number;
    let lowestY: number;
    let highestY: number;
    let highestX: number;

    for (const tileSet of mapJson.tilesets) {

        let newPngFile = new usedPngFile(parseInt(tileSet.firstgid), tileSet.source, paths)
        usedPngFiles.push(newPngFile);
    }

    for (const mapJsonLayer of mapJson.layers) {
        map.addLayer(mapJsonLayer.name);
    }

    for (const mapJsonLayer of mapJson.layers) {

        const LAYER_INDEX = map.getIndex(mapJsonLayer.name);

        if (mapJsonLayer.chunks == undefined) {
            continue;
        }

        for (const mapJsonChunk of mapJsonLayer.chunks) {
            const chunk: Chunk = new Chunk(mapJsonChunk.x, mapJsonChunk.y, map._layerList.length);

            if (lowestX == undefined || mapJsonChunk.x < lowestX) {
                lowestX = mapJsonChunk.x;
            }
            if (lowestY == undefined || mapJsonChunk.y < lowestY) {
                lowestY = mapJsonChunk.y;
            }
            if (highestX == undefined || mapJsonChunk.x + 15 > highestX) {
                highestX = mapJsonChunk.x + 15;
            }
            if (highestY == undefined || mapJsonChunk.y + 15 > highestY) {
                highestY = mapJsonChunk.y + 15;
            }

            //Finds the correct png file for every data-entry
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const data = mapJsonChunk.data[x + 16*y];
                    if (data == 0) {
                        continue;
                    }
                    let newFirstGridId: number;
                    let path: string;
                    let id: number;
                    const lastTileSet: usedPngFile = usedPngFiles[usedPngFiles.length - 1];
                    for (const tileSet of mapJson.tilesets) {
                        if (data >= tileSet.firstgid) {
                            newFirstGridId = tileSet.firstgid;
                            id = newFirstGridId;
                            path = tileSet.source;
                        }
                        //if this is true we found the right png with help of the firstGridId
                        if (!(newFirstGridId < tileSet.firstgid || tileSet === lastTileSet)) {
                            continue;
                        }

                        path = path.replace(".tsx", ".png");
                        path = path.replace("Map/", "")

                        if (mapJsonLayer.name == "Content" || mapJsonLayer.name == "Solid" || mapJsonLayer.name == "Rooms" || mapJsonLayer.name == "Conference rooms") {
            
                            const value: number = data - id + 1;
                            if (mapJsonLayer.name == "Solid" && value !== 0 && value < 16) {
                                let numbBin: string = value.toString(2);
                                let fillerString: string = "";
                                const length = numbBin.length;
                                if (length < 4) {
                                    for (let j = 0; j < 4 - length; j++) {
                                        fillerString += "0";
                                    }
                                    numbBin = fillerString + numbBin;
                                }
                                //makes different quarters of a block solid
                                if (numbBin.charAt(0) === "1") {
                                    chunk.data[x][y]._solidInfo[0][0] = true;
                                }
                                if (numbBin.charAt(1) === "1") {
                                    chunk.data[x][y]._solidInfo[0][1]= true;
                                }
                                if (numbBin.charAt(2) === "1") {
                                    chunk.data[x][y]._solidInfo[1][0] = true;
                                }
                                if (numbBin.charAt(3) === "1") {
                                    chunk.data[x][y]._solidInfo[1][1] = true;
                                }
                            } else if (mapJsonLayer.name == "Content" && value !== 0) {
                                const interactive: Interactive = getInteractive(value, chunk.posX + x, chunk.posY + y, path);
                                chunk.data[x][y]._interactive = interactive;
                            } else if (mapJsonLayer.name == "Conference rooms" && value === 1) {
                                chunk.data[x][y]._isConferencRoom = true;
                            } else if (mapJsonLayer.name == "Rooms") {
                                chunk.data[x][y]._roomId = value;
                            }
                            break;
                        }

                        if (String(mapJsonLayer.name).includes("animated")) {
                            let width = Number(String(mapJsonLayer.name).replace("<animated", "")[0]);
                            let height = Number(String(mapJsonLayer.name).replace("<animated", "")[2]);

                            map._animationList.push(new Animation(path, width, height, x + chunk.posX, y + chunk.posY, LAYER_INDEX, 25));
                        }

                        let index = map._tileList.addTile(path, data - id);
                        chunk.data[x][y]._textureIdB[LAYER_INDEX] = index; //Adds the index of the texture in the TileList. New textures will be saved first in the list
                        map.addChunk(chunk, LAYER_INDEX);
                        break;
                    }
                }
            }
        }
    }
    map.setBoundaries(lowestX, lowestY, highestX, highestY);
    console.log(map);
    return map;
}
