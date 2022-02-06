import { Room } from "colyseus.js";
import { loadImage } from "./util";
import {Interactive} from "./interactive/interactive"
import { helpExitButton } from "./static";
import { lowestX, lowestY } from "./main";
import { classicNameResolver } from "typescript";
export class Chunk {

    private readonly _posX: number;
    private readonly _posY: number;
    private readonly _data: dataFromPos[][];

    public get posX(): number { return this._posX; };
    public get posY(): number { return this._posY; };
    public get data(): dataFromPos[][] { return this._data; };

    constructor(posX: number, posY: number) {
        this._posX = posX;
        this._posY = posY;
        this._data = [];
        for (let i = 0; i < 16; i++) {
            this._data[i] = [];
        }
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                this._data[x][y] = new dataFromPos();
            }
        }
    }

    public setTileNumber(posX: number, posY: number, tileNumb:number, groundType: GroundType) {

        switch (groundType) {
            case GroundType.BackGround:
                this._data[posX][posY]._textureIdB = tileNumb;
                break;

            case GroundType.BackGround1:
                this._data[posX][posY]._textureIdB1 = tileNumb;
                break;

            case GroundType.BackGround2:
                this._data[posX][posY]._textureIdB2 = tileNumb;
                break;
            
            case GroundType.BackGround3:
                this._data[posX][posY]._textureIdB3 = tileNumb;
                break;

            case GroundType.BackGround4:
                this._data[posX][posY]._textureIdB4 = tileNumb;
                break;
    
            case GroundType.BackGround5:
                this._data[posX][posY]._textureIdB5 = tileNumb;
                break;
             
            case GroundType.BackGround6:
                this._data[posX][posY]._textureIdB6 = tileNumb;
                break;
    
            case GroundType.BackGround7:
                this._data[posX][posY]._textureIdB7 = tileNumb;
                break;

            case GroundType.ForeGround:
                this._data[posX][posY]._textureIdF = tileNumb;
                break;
        }
    };
}

class Animation {

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

    _textureIdB: number; //For Background
    _textureIdB1: number; //For Backgound1
    _textureIdB2: number; //For Background2
    _textureIdB3: number; //For Background3
    _textureIdB4: number; //For Background4
    _textureIdB5: number; //For Background5
    _textureIdB6: number; //For Background6
    _textureIdB7: number; //For Background7
    _textureIdF: number; // For Foregound
    _dataPackage: dataPackage[][];

    constructor() {

        this._textureIdB = -1;
        this._textureIdB1 = -1;
        this._textureIdB2 = -1;
        this._textureIdB3 = -1;
        this._textureIdB4 = -1;
        this._textureIdB5 = -1;
        this._textureIdB6 = -1;
        this._textureIdB7 = -1;
        this._textureIdF = -1;

        this._dataPackage = [];
        this._dataPackage[0] = [];
        this._dataPackage[1] = [];
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
    _interactive: Interactive;
    _roomId: number;
    _isConferenceRoom: boolean;

    constructor() {
        this._isSolid = false
        this._interactive = null;
        this._roomId = 0;
        this._isConferenceRoom = false;
    }

    get isSolid() {return this._isSolid}
    get interactive() {return this._interactive}
    get roomId() {return this._roomId}
    get isConferenceRoom() {return this._isConferenceRoom}

    set isSolid(isSolid: boolean) {this._isSolid = isSolid}
    set interactive(interactive: Interactive) {this._interactive = interactive}
    set roomId(roomId: number) {this._roomId = roomId}
    set isConferenceRoom(isConferenceRoom: boolean) {this._isConferenceRoom = isConferenceRoom}
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

    constructor(paths: TexturePaths) {
        this._map = new Map<string, Chunk>();
        this._tileList = new TileList();
        this._animationList = [];
        this._texturePaths = paths;
    }

    public setBoundaries(lowestX: number, lowestY: number, highestX: number, highestY: number) {
        this._lowestPosx = lowestX;
        this._lowestPosy = lowestY;
        this._highestPosx = highestX;
        this._highestPosy = highestY;
    }

    private mergeChunks(chunk: Chunk, groundType: GroundType) {

        let mergedChunk = <Chunk> this.getChunk(chunk.posX + "." + chunk.posY);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {

                switch (groundType) {

                    case GroundType.BackGround:
                        if (mergedChunk.data[x][y]._textureIdB == -1) {
                            mergedChunk.data[x][y]._textureIdB = chunk.data[x][y]._textureIdB;
                        }
                        break;

                    case GroundType.BackGround1:
                        if (mergedChunk.data[x][y]._textureIdB1 == -1) {
                            mergedChunk.data[x][y]._textureIdB1 = chunk.data[x][y]._textureIdB1;
                        }
                        break;

                    case GroundType.BackGround2:
                        if (mergedChunk.data[x][y]._textureIdB2 == -1) {
                            mergedChunk.data[x][y]._textureIdB2 = chunk.data[x][y]._textureIdB2;
                        }
                        break;

                    case GroundType.BackGround3:
                        if (mergedChunk.data[x][y]._textureIdB3 == -1) {
                            mergedChunk.data[x][y]._textureIdB3 = chunk.data[x][y]._textureIdB3;
                        }
                        break;
                    
                    case GroundType.BackGround4:
                        if (mergedChunk.data[x][y]._textureIdB4 == -1) {
                            mergedChunk.data[x][y]._textureIdB4 = chunk.data[x][y]._textureIdB4;
                        }
                        break;    

                    case GroundType.BackGround5:
                        if (mergedChunk.data[x][y]._textureIdB5 == -1) {
                            mergedChunk.data[x][y]._textureIdB5 = chunk.data[x][y]._textureIdB5;
                        }
                        break;
    
                    case GroundType.BackGround6:
                        if (mergedChunk.data[x][y]._textureIdB6 == -1) {
                            mergedChunk.data[x][y]._textureIdB6 = chunk.data[x][y]._textureIdB6;
                        }
                        break;
                        
                    case GroundType.BackGround7:
                        if (mergedChunk.data[x][y]._textureIdB7 == -1) {
                            mergedChunk.data[x][y]._textureIdB7 = chunk.data[x][y]._textureIdB7;
                        }
                        break;  

                    case GroundType.ForeGround:
                        if (mergedChunk.data[x][y]._textureIdF == -1) {
                            mergedChunk.data[x][y]._textureIdF = chunk.data[x][y]._textureIdF;
                        }
                        break;
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

    public addChunk(chunk: Chunk, groundType: GroundType) {
        let groundChunk = this._map.get(chunk.posX + "." + chunk.posY);
        if (groundChunk == null) {
            this._map.set(chunk.posX + "." + chunk.posY, chunk);
        } else {
            this.mergeChunks(chunk, groundType);
        }
    }

    public async updateAnimationCounter() {
        for (const Animation of this._animationList) {
            await Animation.setState(this._texturePaths);
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

export function drawMap(map: MapData, spriteSheet: HTMLCanvasElement, canvas: HTMLCanvasElement, startx: number, starty: number, endx:number, endy: number, groundType: GroundType) {

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
                if ((ChunkX + correctX - ANIMATION.posx) < ANIMATION.width && (ChunkX + correctX - ANIMATION.posx) >= 0 && (ChunkY + correctY - ANIMATION.posy) < ANIMATION.height && (ChunkY + correctY - ANIMATION.posy) >= 0) {
                    willAnimate = true;
                    animationToDraw = ANIMATION;
                    animationX = ChunkX + correctX - ANIMATION.posx;
                    animationY = ChunkY + correctY - ANIMATION.posy;
                }
            }

            if (chunk == null) {
                continue;
            }

            switch (groundType) {

                case GroundType.BackGround:
                    if (willAnimate == true) {
                        animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                    }
                    if (chunk.data[correctX][correctY]._textureIdB == -1) {
                        continue;
                    }
                    ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdB % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdB / size) * 48, 48, 48, dx, dy, 48, 48);
                    break;

                case GroundType.BackGround1:
                    if (willAnimate == true) {
                        animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                    }
                    if (chunk.data[correctX][correctY]._textureIdB1 == -1) {
                        continue;
                    }
                    ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdB1 % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdB1 / size) * 48, 48, 48, dx, dy, 48, 48);
                    break;

                case GroundType.BackGround2:
                    if (willAnimate == true) {
                        animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                    }
                    if (chunk.data[correctX][correctY]._textureIdB2 == -1) {
                        continue;
                    }
                    ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdB2 % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdB2 / size) * 48, 48, 48, dx, dy, 48, 48);
                    break;

                case GroundType.BackGround3:
                    if (willAnimate == true) {
                        animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                    }
                    if (chunk.data[correctX][correctY]._textureIdB3 == -1) {
                        continue;
                    }
                    ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdB3 % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdB3 / size) * 48, 48, 48, dx, dy, 48, 48);                        
                    break;

                case GroundType.BackGround4:
                    if (willAnimate == true) {
                        animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                    }
                    if (chunk.data[correctX][correctY]._textureIdB4 == -1) {
                        continue;
                    }
                    ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdB4 % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdB4 / size) * 48, 48, 48, dx, dy, 48, 48);                        
                    break;

                case GroundType.BackGround5:
                    if (willAnimate == true) {
                        animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                    }
                    if (chunk.data[correctX][correctY]._textureIdB5 == -1) {
                        continue;
                    }
                    ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdB5 % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdB5 / size) * 48, 48, 48, dx, dy, 48, 48);
                    break;
    
                case GroundType.BackGround6:
                    if (willAnimate == true) {
                        animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                    }
                    if (chunk.data[correctX][correctY]._textureIdB6 == -1) {
                        continue;
                    }
                    ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdB6 % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdB6 / size) * 48, 48, 48, dx, dy, 48, 48);                        
                    break;
    
                case GroundType.BackGround7:
                    if (willAnimate == true) {
                        animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                    }
                    if (chunk.data[correctX][correctY]._textureIdB4 == -1) {
                        continue;
                    }
                    ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdB7 % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdB7 / size) * 48, 48, 48, dx, dy, 48, 48);                        
                    break;
                
                case GroundType.ForeGround:
                    if (willAnimate == true) {
                        animationToDraw.drawAnimation(ctx, dx, dy, animationX, animationY);
                    }
                    if (chunk.data[correctX][correctY]._textureIdF == -1) {
                        continue;
                    }
                    ctx.drawImage(spriteSheet, (chunk.data[correctX][correctY]._textureIdF % size) * 48 , Math.floor(chunk.data[correctX][correctY]._textureIdF / size) * 48, 48, 48, dx, dy, 48, 48);
                    break;
            }
        }
    }
}

function createInfoMap(mapJson: {[key: string]: any}, room: Room) {
    // fillSolidInfoMap and add animations to the animation layer of the map




}

function createMapFromJson(mapJson: {[key: string]: any}, room: Room) {

    let paths = createTexturePaths(room);
    let map = new MapData(paths);
    let usedPngFiles: usedPngFile[] = [];
    let groundType: GroundType;
    let lowestX: number;
    let lowestY: number;
    let highestY: number;
    let highestX: number;

    for (const tileSet of mapJson.tilesets) {

        let newPngFile = new usedPngFile(parseInt(tileSet.firstgid), tileSet.source, paths)
        usedPngFiles.push(newPngFile);
    }

    for (const mapJsonLayer of mapJson.layers) {

        if (mapJsonLayer.name === "Interactives" || mapJsonLayer.name == "Content" || mapJsonLayer.name == "Solid" || mapJsonLayer.name == "Rooms" || mapJsonLayer.name == "Conference rooms") {
            
            //TODO Infos in eine Info Datei speichern, siehe SolidInfoMap
            continue;
        }

        for (const mapJsonChunk of mapJsonLayer.chunks) {
            const chunk: Chunk = new Chunk(mapJsonChunk.x, mapJsonChunk.y)

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
                for ( let x = 0; x < 16; x++) {
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

                        if (String(mapJsonLayer.name).includes("animated")) {
                            let width = Number(String(mapJsonLayer.name).replace("<animated", "")[0]);
                            let height = Number(String(mapJsonLayer.name).replace("<animated", "")[2]);

                            switch (mapJsonLayer.name) {

                                case("<animated1x2>Plant"):
                                    map._animationList.push(new Animation(path, width, height, x + chunk.posX, y + chunk.posY, GroundType.BackGround7, 30));
                                    break;

                                case("<animated2x2>Fishtank"):
                                    map._animationList.push(new Animation(path, width, height, x + chunk.posX, y + chunk.posY, GroundType.BackGround7, 10));
                                    break;

                                case("<animated3x2>Cat"):
                                    map._animationList.push(new Animation(path, width, height, x + chunk.posX, y + chunk.posY, GroundType.BackGround5, 15));
                                    break;
                                
                            }
                            break;
                        }

                        let index = map._tileList.addTile(path, data - id);

                        switch(mapJsonLayer.name) {

                            case("Floor"):
                                groundType = GroundType.BackGround;
                                break;
                
                            case("Floor kitchen"):
                                groundType = GroundType.BackGround;
                                break;
                
                            case("Floor bathroom"):
                                groundType = GroundType.BackGround;
                                break;
                
                            case("Walls"):
                                groundType = GroundType.BackGround1;
                                break;

                            case("Post its"):
                                groundType = GroundType.BackGround7;
                                break;

                            case("Whiteboards"):
                                groundType = GroundType.BackGround7;
                                break;

                            case("Deko above Deko"):
                                groundType = GroundType.BackGround7;
                                break;

                            case("Automat"):
                                groundType = GroundType.BackGround2;
                                break;

                            case("Deko"):
                                groundType = GroundType.BackGround6;
                                break;

                            case("Toilette"):
                                groundType = GroundType.BackGround2;
                                break;

                            case("Coffee machine"):
                                groundType = GroundType.BackGround5;
                                break;

                            case("Donuts"):
                                groundType = GroundType.BackGround4;
                                break;

                            case("kitchen utensils"):
                                groundType = GroundType.BackGround3;
                                break;

                            case("kitchen"):
                                groundType = GroundType.BackGround2;
                                break;

                            case("chairs above tables"):
                                groundType = GroundType.BackGround6;
                                break;

                            case("Computer front"):
                                groundType = GroundType.BackGround5;
                                break;

                            case("Computer back"):
                                groundType = GroundType.BackGround4;
                                break;

                            case("Tables"):
                                groundType = GroundType.BackGround3;
                                break;

                            case("chairs behind tables"):
                                groundType = GroundType.BackGround2;
                                break;

                            case("Deko under deko"):
                                groundType = GroundType.BackGround1;
                                break;

                            case("Stairs"):
                                groundType = GroundType.BackGround2;
                                break;

                            case("Windows"):
                                groundType = GroundType.BackGround1;
                                break;
                        }

                        chunk.setTileNumber(x, y, index, groundType); //Adds the index of the texture in the TileList. New textures will be saved first in the list
                        map.addChunk(chunk, groundType)
                        break;
                    }
                }
            }
        }
    }
    map.setBoundaries(lowestX, lowestY, highestX, highestY);
    return map;
}
