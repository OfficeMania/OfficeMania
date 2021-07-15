import {getRoom, loadImage} from "./util";
import {Room} from "colyseus.js";
import {Interactive} from "./interactive/interactive"
import {Door, DoorDirection} from "./interactive/door";
import {PingPongTable} from "./interactive/pingpongtable";
import {State} from "../common";
import {MessageType} from "../common/util";

export {convertMapData, mapInfo, drawMap, fillSolidInfos, solidInfo}

//map which contains infos if something is solid

class solidInfo {

    isSolid: boolean;
    content: Interactive;
    roomId: number;

    constructor() {
        this.isSolid = false
        this.content = null;
        this.roomId = 0;
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

}

//only important for infinite maps
class chunk {

    element: number[][];
    tilesetForElement: tileset[][];
    tilesetX: number[][];
    tilesetY: number[][];
    posX: number;
    posY: number;

    constructor(entries: number[], xPos: number, yPos: number) {
        this.tilesetForElement = [];
        for (let a = 0; a < 16; a++) {
            this.tilesetForElement[a] = [];
        }

        this.tilesetX = [];
        for (let a = 0; a < 16; a++) {
            this.tilesetX[a] = [];
        }

        this.tilesetY = [];
        for (let a = 0; a < 16; a++) {
            this.tilesetY[a] = [];
        }

        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                this.tilesetForElement[i][j] = null;
                this.tilesetX[i][j] = null;
                this.tilesetY[i][j] = null;
            }
        }

        this.element = [];
        for (let a = 0; a < 16; a++) {
            this.element[a] = [];
        }

        for (let i: number = 0; i < entries.length; i++) {
            this.element[i % 16][Math.floor(i / 16)] = entries[i];
        }

        this.posX = xPos;
        this.posY = yPos;
    }

}

class mapInfo {
    lowestX: number;
    lowestY: number;
    highestY: number;
    highestX: number;
    layers: layer[];
    tilesets: tileset[];
    heightOfMap: number;
    widthOfMap: number;
    ctx: CanvasRenderingContext2D;
    textures: Map<string, HTMLImageElement>;
    resolution: number;
    canvas: HTMLCanvasElement;

    constructor(layers: layer[], tilesets: tileset[], canvas: HTMLCanvasElement, resolution: number, textures: Map<string, HTMLImageElement>, lowestX: number, lowestY: number, highestY: number, highestX: number) {
        this.lowestX = lowestX;
        this.lowestY = lowestY;
        this.highestY = highestY;
        this.highestX = highestX;
        this.layers = layers;
        this.tilesets = tilesets;
        this.heightOfMap = canvas.height / (resolution);
        this.widthOfMap = canvas.width / (resolution);
        this.ctx = canvas.getContext("2d");
        this.textures = textures;
        this.resolution = resolution;
        this.canvas = canvas;
    }

}

class layer {

    name: string;
    chunks: chunk[];

    constructor(x: number[], y: number[], data: saveArray[], layerName: string) {
        this.chunks = [];
        this.name = layerName;

        const tempData: number[] = [];

        for (let i = 0; i < x.length; i++) {
            for (let a = 0; a < 256; a++) {
                tempData[a] = data[i].array[a];
            }
            this.chunks.push(new chunk(tempData, x[i], y[i]));
        }
    }

}

class saveArray {

    array: number[];

    constructor(a: number[]) {
        this.array = [];
        a.forEach(item => this.array.push(item));
    }

}

class tileset {

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
const LAYER_NAME_ANIMATED: string = "animated";

function fillSolidInfos(map: mapInfo) {

    let solidInfoMap: solidInfo[][];
    const height = Math.abs(map.lowestY - map.highestY) + 32;
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

    for (const layer of map.layers) {
        const isSolidLayer = layer.name.search(LAYER_NAME_SOLID) !== -1;
        const isContentLayer = layer.name.search(LAYER_NAME_CONTENT) !== -1;
        const isRoomsLayer = layer.name.search(LAYER_NAME_ROOMS) !== -1;
        if (!(isSolidLayer || isContentLayer || isRoomsLayer)) {
            continue;
        }
        for (const chunk of layer.chunks) {
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const chunkElement = chunk.element[x][y];
                    const basePosX = (x + chunk.posX - mapStartX) * 2;
                    const basePosY = (y + chunk.posY - mapStartY) * 2;
                    if (chunkElement === 0) {
                        if (isRoomsLayer) {
                            setSolidInfoMap(solidInfoMap, basePosX, basePosY, (solidInfo) => solidInfo.setRoomId(0));
                        }
                        continue;
                    }
                    let newFirstGridId: number;
                    let newTileset: tileset;
                    const lastTileSet = map.tilesets[map.tilesets.length - 1];
                    for (const tileSet of map.tilesets) {

                        if (chunkElement >= tileSet.firstGridId || map.tilesets.length === 1) {

                            newFirstGridId = tileSet.firstGridId;
                            newTileset = tileSet;
                        }

                        let value: number;
                        if (!(newFirstGridId < tileSet.firstGridId || tileSet === lastTileSet)) {
                            continue;
                        }
                        //if this is true we found the right tileset with help of the firstGridId
                        value = chunkElement - newTileset.firstGridId + 1;
                        if (isSolidLayer && value !== 0 && value < 16) {

                            let numbBin: string = value.toString(2);
                            let fillerString: string = "";

                            if (numbBin.length < 4) {

                                for (let j = 0; j < 4 - numbBin.length; j++) {
                                    fillerString = fillerString.concat("0");
                                }
                                numbBin = fillerString.concat(numbBin);
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
                            const interactive: Interactive = getInteractive(value, basePosX, basePosY, room);
                            setSolidInfoMap(solidInfoMap, basePosX, basePosY, (solidInfo) => solidInfo.setContent(interactive));

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

function getInteractive(value: number, basePosX: number, basePosY: number, room: Room<State>) {
    switch (value) {
        //doors
        case 1: {
            room.send(MessageType.NEW_DOOR, basePosX + "." + basePosY);
            return new Door(DoorDirection.NORTH, basePosX, basePosY);
        }
        case 2: {
            room.send(MessageType.NEW_DOOR, basePosX + "." + basePosY);
            return new Door(DoorDirection.EAST, basePosX, basePosY);
        }
        case 3: {
            room.send(MessageType.NEW_DOOR, basePosX + "." + basePosY);
            return new Door(DoorDirection.SOUTH, basePosX, basePosY);
        }
        case 4: {
            room.send(MessageType.NEW_DOOR, basePosX + "." + basePosY);
            return new Door(DoorDirection.WEST, basePosX, basePosY);
        }
        case 5: {
            room.send(MessageType.NEW_DOOR, basePosX + "." + basePosY);
            return new Door(DoorDirection.ALWAYS_OPEN, basePosX, basePosY);
        }
        //pongtable
        case 6: {
            return new PingPongTable();
        }
        //whiteboard
        case 7: {
            //return new Whiteboard();
            break;
        }
    }
    return null;
}

//saves the paths from the templates
let paths: string[];

async function convertMapData(map: any, room: Room, canvas: HTMLCanvasElement) {

    //saves the layers from the map
    let layerArray: layer[];

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

    //saves the tilesets from the map
    let tilesetArray: tileset[];

    paths = [];

    room.state.templatePaths.forEach((path) => paths.push(path));

    textures = new Map<string, HTMLImageElement>();
    let image: HTMLImageElement;

    // if (map.infinite === "true") {
    //     isInfinite = true;
    // } else {
    //     isInfinite = false;
    // }

    resolution = parseInt(map.tileheight);

    canvas.height = map.height * resolution;
    canvas.width = map.width * resolution;

    // mapWidth = canvas.width / (resolution * scaling);
    // mapHeight = canvas.height / (resolution * scaling);

    layerArray = [];
    tilesetArray = [];

    let xPos: number[] = [];
    let yPos: number[] = [];
    let dataArray: saveArray[] = [];
    let x: string;
    let y: string;

    let lowestX: number;
    let lowestY: number;
    let highestY: number;
    let highestX: number;
    let isSet: boolean = false;

    for (const layer_ of map.layers) {
        for (const chunk of layer_.chunks) {
            x = chunk.x;
            y = chunk.y;
            xPos.push(parseInt(x));
            yPos.push(parseInt(y));
            dataArray.push(new saveArray(chunk.data));
            if (!isSet) {
                lowestX = chunk.x;
                lowestY = chunk.y;
                highestY = chunk.y + 15;
                highestX = chunk.x + 15;
                isSet = true;
            }
            if (chunk.x < lowestX) {
                lowestX = chunk.x;
            }
            if (chunk.y < lowestY) {
                lowestY = chunk.y;
            }
            if (chunk.y + 15 > highestY) {
                highestY = chunk.y + 15;
            }
            if (chunk.x + 15 > highestX) {
                highestY = chunk.x + 15;
            }
        }
        layerArray.push(new layer(xPos, yPos, dataArray, layer_.name));
    }
    for (let t = 0; t < map.tilesets.length; t++) {
        tilesetArray.push(new tileset(parseInt(map.tilesets[t].firstgid), map.tilesets[t].source));
        image = await loadImage(tilesetArray[t].path);
        tilesetArray[t].tileWidth = image.naturalWidth;
        textures.set(tilesetArray[t].path, image);
    }
    return new mapInfo(layerArray, tilesetArray, canvas, resolution, textures, lowestX, lowestY, highestY, highestX);
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

function drawMap(mapData: mapInfo) {
    for (const layer of mapData.layers) {
        for (const chunk of layer.chunks) {
            //if the chunk is not animated
            if (!(layer.name.search(LAYER_NAME_ANIMATED) === -1 && layer.name.search(LAYER_NAME_CONTENT) === -1 && layer.name.search(LAYER_NAME_ROOMS) === -1 && layer.name.search(LAYER_NAME_SOLID) === -1)) {
                //draw gif
                //https://stackoverflow.com/questions/48234696/how-to-put-a-gif-with-canvas
                continue;
            }
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    const chunkElement = chunk.element[x][y];
                    if (chunkElement === 0) {
                        //dont paint if there is nothing
                        continue;
                    }
                    let positionX: number;
                    let positionY: number;
                    positionX = x + chunk.posX + Math.floor(mapData.widthOfMap / 2);
                    positionY = y + chunk.posY + Math.floor(mapData.heightOfMap / 2);
                    const tileSetElement = chunk.tilesetForElement[x][y];
                    if (tileSetElement !== null) {
                        //draw the image without searching
                        mapData.ctx.drawImage(mapData.textures.get(tileSetElement.path), chunk.tilesetX[x][y], chunk.tilesetY[x][y], mapData.resolution, mapData.resolution, positionX * mapData.resolution, positionY * mapData.resolution, mapData.resolution, mapData.resolution);
                        continue;
                    }
                    //saves a tileset, we need this to find the right one
                    let newFirstGridId: number;
                    let newTileset: tileset;
                    const lastTileSet: tileset = mapData.tilesets[mapData.tilesets.length - 1];
                    for (const tileSet of mapData.tilesets) {
                        if (chunkElement >= tileSet.firstGridId || mapData.tilesets.length === 1) {
                            newFirstGridId = tileSet.firstGridId;
                            newTileset = tileSet;
                        }
                        let value: number;
                        let sourceX: number;
                        let sourceY: number;
                        //if this is true we found the right tileset with help of the firstGridId
                        if (!(newFirstGridId < tileSet.firstGridId || tileSet === lastTileSet)) {
                            continue;
                        }
                        chunk.tilesetForElement[x][y] = newTileset;
                        value = chunkElement - newTileset.firstGridId;
                        sourceX = (value % (newTileset.tileWidth / mapData.resolution)) * mapData.resolution
                        chunk.tilesetX[x][y] = sourceX;
                        sourceY = Math.floor(value / (newTileset.tileWidth / mapData.resolution)) * mapData.resolution;
                        chunk.tilesetY[x][y] = sourceY;
                        mapData.ctx.drawImage(mapData.textures.get(newTileset.path), sourceX, sourceY, mapData.resolution, mapData.resolution, positionX * mapData.resolution, positionY * mapData.resolution, mapData.resolution, mapData.resolution);
                        break;
                    }
                }
            }
        }
    }
}

