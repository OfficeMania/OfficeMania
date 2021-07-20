import {getRoom, loadImage} from "./util";
import {Room} from "colyseus.js";
import {Interactive} from "./interactive/interactive"
import {Door, DoorDirection} from "./interactive/door";
import {PingPongTable} from "./interactive/pingpongtable";
import {State} from "../common";
import {MessageType} from "../common/util";
import {Whiteboard} from "./interactive/whiteboard";
import {Todo} from "./interactive/todo";
import {CoffeeMachine} from "./interactive/coffeeMachine";
import {VendingMachine} from "./interactive/vendingMachine";
import {ChessBoard} from "./interactive/chessboard";
import { WaterCooler } from "./interactive/waterCooler";

export {convertMapData, MapInfo, drawMap, fillSolidInfos, solidInfo}

//map which contains infos if something is solid

class solidInfo {

    isSolid: boolean;
    content: Interactive;
    roomId: number;
    isConferenceRoom: boolean;

    constructor() {
        this.isSolid = false
        this.content = null;
        this.roomId = 0;
        this.isConferenceRoom = false;
    }

    setIsSolid() {
        this.isSolid = true;
    }

    setContent(content: Interactive) {
        this.content = content;
    }

    setRoomId(id: number) {
        this.roomId = id;
    }

    getRoomId() {
        return this.roomId;
    }

    setIsConferenceRoom(isConferenceRoom: boolean) {
        this.isConferenceRoom = isConferenceRoom;
    }

    getIsConferenceRoom(): boolean {
        return this.isConferenceRoom;
    }

}

class MapInfo {

    lowestX: number;
    lowestY: number;
    highestY: number;
    highestX: number;
    layers: Layer[];
    tileSets: TileSet[];
    heightOfMap: number;
    widthOfMap: number;
    ctx: CanvasRenderingContext2D;
    textures: Map<string, HTMLImageElement>;
    resolution: number;
    canvas: HTMLCanvasElement;

    constructor(layers: Layer[], tileSets: TileSet[], canvas: HTMLCanvasElement, resolution: number, textures: Map<string, HTMLImageElement>, lowestX: number, lowestY: number, highestY: number, highestX: number) {
        this.lowestX = lowestX;
        this.lowestY = lowestY;
        this.highestY = highestY;
        this.highestX = highestX;
        this.layers = layers;
        this.tileSets = tileSets;
        this.heightOfMap = canvas.height / (resolution);
        this.widthOfMap = canvas.width / (resolution);
        this.ctx = canvas.getContext("2d");
        this.textures = textures;
        this.resolution = resolution;
        this.canvas = canvas;
    }

}

class Layer {

    private readonly _name: string;
    private readonly _chunks: Chunk[] = [];


    constructor(name: string, chunks: Chunk[]) {
        this._name = name;
        this._chunks = chunks;
    }

    get name(): string {
        return this._name;
    }

    get chunks(): Chunk[] {
        return this._chunks;
    }

}

//only important for infinite maps
class Chunk {

    private readonly _posX: number;
    private readonly _posY: number;
    private readonly _data: number[][] = [];
    private readonly _tileSetForElement: TileSet[][] = [];
    private readonly _tileSetX: number[][] = [];
    private readonly _tileSetY: number[][] = [];

    constructor(posX: number, posY: number, data: number[]) {
        this._posX = posX;
        this._posY = posY;
        this.data.fill([]);
        this.tileSetForElement.fill([]);
        this.tileSetX.fill([]);
        this.tileSetY.fill([]);
        for (let i = 0; i < 16; i++) {
            this.tileSetForElement[i] = [];
            this.tileSetX[i] = [];
            this.tileSetY[i] = [];
        }
        for (let i = 0; i < data.length; i++) {
            const x = i % 16;
            if (!this.data[x]) {
                this.data[x] = [];
            }
            this.data[x][Math.floor(i / 16)] = data[i];
        }
    }

    get posX(): number {
        return this._posX;
    }

    get posY(): number {
        return this._posY;
    }

    get data(): number[][] {
        return this._data;
    }

    get tileSetForElement(): TileSet[][] {
        return this._tileSetForElement;
    }

    get tileSetX(): number[][] {
        return this._tileSetX;
    }

    get tileSetY(): number[][] {
        return this._tileSetY;
    }

}

export class TileSet {

    firstGridId: number;
    path: string;
    tileWidth: number;

    constructor(firstId: number, source: string) {
        this.firstGridId = firstId;
        source = source.replace(".tsx", ".png");
        source = source.replace("Map/", "");
        this.path = this.getPath(source);
        this.tileWidth = 0;
    }

    getPath(source: string) {
        for (const path of paths) {
            if (path.includes(source)) {
                return path;
            }
        }
    }

}

const LAYER_NAME_SOLID: string = "Solid";
const LAYER_NAME_CONTENT: string = "Content";
const LAYER_NAME_ROOMS: string = "Rooms";
const LAYER_NAME_CONFERENCE_ROOMS: string = "Conference rooms";
const LAYER_NAME_ANIMATED: string = "animated";
const LAYER_NAME_DOORS: string = "Doors";

function fillSolidInfos(map: MapInfo) {

    let solidInfoMap: solidInfo[][];
    const height = Math.abs(map.lowestY - map.highestY) + 32; //TODO why 32? Is this the same for every map
    const width = Math.abs(map.lowestX - map.highestX) + 32;
    const mapStartX = map.lowestX;
    const mapStartY = map.lowestY;
    const room = getRoom();

    solidInfoMap = [];
    for (let i = 0; i < height * 2; i++) {
        solidInfoMap[i] = [];
        for (let j = 0; j < width * 2; j++) {
            solidInfoMap[i][j] = new solidInfo();
        }
    }

    const lastTileSet = map.tileSets[map.tileSets.length - 1];
    for (const layer of map.layers) {
        const isSolidLayer = layer.name === LAYER_NAME_SOLID;
        const isContentLayer = layer.name === LAYER_NAME_CONTENT;
        const isRoomsLayer = layer.name === LAYER_NAME_ROOMS;
        const isConferenceRoomsLayer = layer.name === LAYER_NAME_CONFERENCE_ROOMS;
        if (!(isSolidLayer || isContentLayer || isRoomsLayer || isConferenceRoomsLayer)) {
            continue;
        }
        for (const chunk of layer.chunks) {
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const chunkElement = chunk.data[x][y];
                    const basePosX = (x + chunk.posX - mapStartX) * 2;
                    const basePosY = (y + chunk.posY - mapStartY) * 2;
                    if (chunkElement === 0) {
                        if (isRoomsLayer) {
                            setSolidInfoMap(solidInfoMap, basePosX, basePosY, (solidInfo) => solidInfo.setRoomId(0));
                        }
                        continue;
                    }
                    let newFirstGridId: number;
                    let newTileSet: TileSet;
                    for (const tileSet of map.tileSets) {
                        if (chunkElement >= tileSet.firstGridId || map.tileSets.length === 1) {
                            newFirstGridId = tileSet.firstGridId;
                            newTileSet = tileSet;
                        }
                        if (!(newFirstGridId < tileSet.firstGridId || tileSet === lastTileSet)) {
                            continue;
                        }
                        //if this is true we found the right tileSet with help of the firstGridId
                        const value: number = chunkElement - newTileSet.firstGridId + 1;
                        if (isSolidLayer && value !== 0 && value < 16) {
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
                                solidInfoMap[basePosX][basePosY].setIsSolid();
                            }
                            if (numbBin.charAt(1) === "1") {
                                solidInfoMap[basePosX + 1][basePosY].setIsSolid();
                            }
                            if (numbBin.charAt(2) === "1") {
                                solidInfoMap[basePosX][basePosY + 1].setIsSolid();
                            }
                            if (numbBin.charAt(3) === "1") {
                                solidInfoMap[basePosX + 1][basePosY + 1].setIsSolid();
                            }
                        } else if (isContentLayer && value !== 0) {
                            const interactive: Interactive = getInteractive(value, basePosX, basePosY, room, map);
                            setSolidInfoMap(solidInfoMap, basePosX, basePosY, (solidInfo) => solidInfo.setContent(interactive));
                        } else if (isConferenceRoomsLayer && value === 1) {
                            setSolidInfoMap(solidInfoMap, basePosX, basePosY, (solidInfo) => solidInfo.setIsConferenceRoom(true));
                        } else if (isRoomsLayer) {
                            setSolidInfoMap(solidInfoMap, basePosX, basePosY, (solidInfo) => solidInfo.setRoomId(value));
                        }
                    }
                }
            }
        }
    }
    return solidInfoMap;
}

function setSolidInfoMap(solidInfoMap: solidInfo[][], basePosX: number, basePosY: number, callback: (solidInfo: solidInfo) => void) {
    callback(solidInfoMap[basePosX][basePosY]);
    callback(solidInfoMap[basePosX + 1][basePosY]);
    callback(solidInfoMap[basePosX][basePosY + 1]);
    callback(solidInfoMap[basePosX + 1][basePosY + 1]);
}

function getInteractive(value: number, basePosX: number, basePosY: number, room: Room<State>, map: MapInfo) {
    switch (value) {
        //doors
        case 1: {
            return createDoor(DoorDirection.NORTH, basePosX, basePosY, room, map);
        }
        case 2: {
            return createDoor(DoorDirection.EAST, basePosX, basePosY, room, map);
        }
        case 3: {
            return createDoor(DoorDirection.SOUTH, basePosX, basePosY, room, map);
        }
        case 4: {
            return createDoor(DoorDirection.WEST, basePosX, basePosY, room, map);
        }
        case 5: {
            return createDoor(DoorDirection.ALWAYS_OPEN, basePosX, basePosY, room, map);
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
        //vending machine
        case 11: {
            return new VendingMachine();
        }
        //chess table
        case 15: {
            return new ChessBoard();
        }
        case 16: {
            return new WaterCooler();
        }
    }
    return null;
}

function createDoor(direction: DoorDirection, basePosX: number, basePosY: number, room: Room<State>, map: MapInfo): Door {
    room.send(MessageType.NEW_DOOR, basePosX + "." + basePosY);
    return new Door(direction, basePosX, basePosY, map);
}

//saves the paths from the templates
let paths: string[];

async function convertMapData(mapJson: {[key: string]: any}, room: Room, canvas: HTMLCanvasElement) {

    //saves the layers from the map
    const layers: Layer[] = [];

    //the resolution is 48 and shouldn't be changed, would be too complicated to get the right resolution
    let resolution: number;

    //important for drawing, infinite maps work only with chunks
    let isInfinite: boolean;

    //the height and width of the map on screen. Let Height and Width be odd, so player is displayed in middle of the screen
    let mapHeight: number;
    let mapWidth: number;

    //maps a HTMLImageElement with the name of the sourcefile
    let textures: Map<string, HTMLImageElement>;

    //zoom in and out on the map, 1 is the standard
    let scaling: number;

    //saves the tileSets from the map
    const tileSets: TileSet[] = [];

    paths = [];

    room.state.templatePaths.forEach((path) => paths.push(path));

    textures = new Map<string, HTMLImageElement>();
    let image: HTMLImageElement;

    // if (map.infinite === "true") {
    //     isInfinite = true;
    // } else {
    //     isInfinite = false;
    // }

    resolution = parseInt(mapJson.tileheight);

    canvas.height = mapJson.height * resolution;
    canvas.width = mapJson.width * resolution;

    let lowestX: number;
    let lowestY: number;
    let highestY: number;
    let highestX: number;
    let isSet: boolean = false;

    for (const mapJsonLayer of mapJson.layers) {
        const chunks: Chunk[] = [];
        for (const mapJsonChunk of mapJsonLayer.chunks) {
            chunks.push(new Chunk(mapJsonChunk.x, mapJsonChunk.y, mapJsonChunk.data));
            if (!isSet) {
                lowestX = mapJsonChunk.x;
                lowestY = mapJsonChunk.y;
                highestY = mapJsonChunk.y + 15;
                highestX = mapJsonChunk.x + 15;
                isSet = true;
            }
            if (mapJsonChunk.x < lowestX) {
                lowestX = mapJsonChunk.x;
            }
            if (mapJsonChunk.y < lowestY) {
                lowestY = mapJsonChunk.y;
            }
            if (mapJsonChunk.y + 15 > highestY) {
                highestY = mapJsonChunk.y + 15;
            }
            if (mapJsonChunk.x + 15 > highestX) {
                highestY = mapJsonChunk.x + 15;
            }
        }
        layers.push(new Layer(mapJsonLayer.name, chunks));
    }
    for (let t = 0; t < mapJson.tilesets.length; t++) {
        tileSets.push(new TileSet(parseInt(mapJson.tilesets[t].firstgid), mapJson.tilesets[t].source));
        image = await loadImage(tileSets[t].path);
        tileSets[t].tileWidth = image.naturalWidth;
        textures.set(tileSets[t].path, image);
    }
    return new MapInfo(layers, tileSets, canvas, resolution, textures, lowestX, lowestY, highestY, highestX);
}

/*
function convertXCoordinate(x: number, c:chunk, currentX: number, mapWidth: number): number {

    return (x + c.posX - (currentX - Math.floor(mapWidth/2)))
}

function convertYCoordinate(y: number, c:chunk, currentY: number, mapHeight: number): number {

    return (y + c.posY - (currentY - Math.floor(mapHeight/2)))
}


//code for infinite maps
//we have to do it all again because performance sucks
function drawMapWithChunks (mapData: mapInfo) {

    mapData.layers.forEach(function(l: layer) {

        l.chunks.forEach(function(c: chunk) {

            let convertedY: number = convertYCoordinate(0, c, mapData.currentX, mapData.widthOfMap);
            let convertedX: number = convertXCoordinate(0, c, mapData.currentY, mapData.heightOfMap);

            //checks if the full chunk is not on the map on the screen
            //if(!(convertedX + 16 < 0 || convertedY + 16 < 0 || convertedX > mapData.widthOfMap || convertedY > mapData.heightOfMap)) {

                for (let y = 0; y < 16; y++) {

                    //checks if the y coordinate would be seen on the screen, only works with an odd mapHeight
                    convertedY = convertYCoordinate(y, c, mapData.currentY, mapData.heightOfMap);
                    //if (!(convertedY < 0 || convertedY > mapData.heightOfMap)) {

                        for (let x = 0; x < 16; x++) {

                            //if the value is 0 we do not need to draw
                            if (c.element[x][y] !== 0) {

                                //checks if the x coordinate would be seen on the screen, only works with an odd mapWidth
                                convertedX = convertXCoordinate(x, c, mapData.currentX, mapData.widthOfMap);
                                //if (!(convertedX < 0 || convertedX > mapData.widthOfMap)) {

                                    if(c.tilesetForElement[x][y] === null){
                                        //saves a tileset, we need this to find the right one
                                        let newFirstGridId: number;
                                        let newTileset: tileset;
                                        let entry = c.element[x][y];

                                        for (let i = 0; i < mapData.tilesets.length; i++) {

                                            if (entry >= mapData.tilesets[i].firstGridId || mapData.tilesets.length === 1) {

                                                newFirstGridId = mapData.tilesets[i].firstGridId;
                                                newTileset = mapData.tilesets[i];
                                            }

                                            let value: number;
                                            let sourceX: number;
                                            let sourceY: number;
                                            //if this is true we found the right tileset with help of the firstGridId
                                            if (newFirstGridId < mapData.tilesets[i].firstGridId || i === (mapData.tilesets.length - 1)) {

                                                c.tilesetForElement[x][y] = newTileset;
                                                value = c.element[x][y] - newTileset.firstGridId;

                                                //calculates the right position from the required texture
                                                sourceX = (value % (newTileset.tileWidth / mapData.resolution)) * mapData.resolution
                                                c.tilesetX[x][y] = sourceX;
                                                sourceY = Math.floor(value / (newTileset.tileWidth / mapData.resolution)) * mapData.resolution;
                                                c.tilesetY[x][y] = sourceY;

                                                //Create an array with used templates to boost performance
                                                mapData.ctx.drawImage(mapData.textures.get(newTileset.path), sourceX, sourceY, mapData.resolution, mapData.resolution, convertedX * mapData.resolution, convertedY * mapData.resolution, mapData.resolution, mapData.resolution);
                                                i = mapData.tilesets.length;
                                            }
                                        }

                                    } else{
                                        //draw the image without searching
                                        mapData.ctx.drawImage(mapData.textures.get(c.tilesetForElement[x][y].path), c.tilesetX[x][y], c.tilesetY[x][y], mapData.resolution, mapData.resolution, convertedX * mapData.resolution, convertedY * mapData.resolution, mapData.resolution, mapData.resolution);
                                    }

                                //}
                            }
                        }
                    //}
                }
            //}
        })
    })
}
*/

function drawMap(mapData: MapInfo) {
    for (const layer of mapData.layers) {
        if (layer.name === LAYER_NAME_SOLID || layer.name === LAYER_NAME_CONTENT || layer.name === LAYER_NAME_ROOMS || layer.name === LAYER_NAME_CONFERENCE_ROOMS) {
            continue;
        }
        for (const chunk of layer.chunks) {
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    const chunkElement = chunk.data[x][y];
                    if (chunkElement === 0) {
                        //dont paint if there is nothing
                        continue;
                    }
                    const positionX: number = x + chunk.posX + Math.floor(mapData.widthOfMap / 2);
                    const positionY: number = y + chunk.posY + Math.floor(mapData.heightOfMap / 2);
                    const tileSetElement = chunk.tileSetForElement[x][y];
                    const dx = positionX * mapData.resolution;
                    const dy = positionY * mapData.resolution;
                    if (tileSetElement) {
                        //draw the image without searching
                        mapData.ctx.drawImage(mapData.textures.get(tileSetElement.path), chunk.tileSetX[x][y], chunk.tileSetY[x][y], mapData.resolution, mapData.resolution, dx, dy, mapData.resolution, mapData.resolution);
                        continue;
                    }
                    //saves a tileSet, we need this to find the right one
                    let newFirstGridId: number;
                    let newTileSet: TileSet;
                    const lastTileSet: TileSet = mapData.tileSets[mapData.tileSets.length - 1];
                    for (const tileSet of mapData.tileSets) {
                        if (chunkElement >= tileSet.firstGridId || mapData.tileSets.length === 1) {
                            newFirstGridId = tileSet.firstGridId;
                            newTileSet = tileSet;
                        }
                        //if this is true we found the right tileset with help of the firstGridId
                        if (!(newFirstGridId < tileSet.firstGridId || tileSet === lastTileSet)) {
                            continue;
                        }
                        chunk.tileSetForElement[x][y] = newTileSet;
                        const value: number = chunkElement - newTileSet.firstGridId;
                        const sourceX: number = (value % (newTileSet.tileWidth / mapData.resolution)) * mapData.resolution
                        chunk.tileSetX[x][y] = sourceX;
                        const sourceY: number = Math.floor(value / (newTileSet.tileWidth / mapData.resolution)) * mapData.resolution;
                        chunk.tileSetY[x][y] = sourceY;
                        if(layer.name === LAYER_NAME_DOORS){
                            break;
                        }
                        mapData.ctx.drawImage(mapData.textures.get(newTileSet.path), sourceX, sourceY, mapData.resolution, mapData.resolution, dx, dy, mapData.resolution, mapData.resolution);
                        break;
                    }
                }
            }
        }
    }
}

