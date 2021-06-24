import { loadImage } from "./util";
import { Room } from "colyseus.js";

export {convertMapData, mapInfo, drawMap, fillSolidInfos, solidInfo}

//map which contains infos if something is solid

class solidInfo {

    isSolid: boolean;
    content: number;

    constructor() {

        this.isSolid = false
        this.content = 0;
    }

    setIsSolid() {
        this.isSolid = true;
    }

    setContent(content: number) {
        this.content = content;
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
    currentX: number;
    currentY: number;
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
        this.currentX = 0;
        this.currentY = 15;
        this.textures = textures;
        this.resolution = resolution;
        this.canvas = canvas;
    }

    updateScaling(scaling: number) {

        this.heightOfMap = this.heightOfMap / scaling;
        this.widthOfMap = this.widthOfMap / scaling;
        this.ctx.scale(scaling, scaling);
    }

    updatePos(posX: number, posY: number) {

        this.currentX = posX;
        this.currentY = posY;
    }

}

class layer {

    name: string;
    chunks: chunk[];

    constructor(x:number[], y:number[], data:saveArray[], layerName: string) {

        this.chunks = [];
        this.name = layerName;

        let tempData: number[] = [];

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

        for (let i = 0; i < a.length; i++) {

            this.array.push(a[i]);
        }
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

        for (let i = 0; i < paths.length; i++) {
            
            if (paths[i].includes(source)) {

                return paths[i];
            }
        }
    }
}

function fillSolidInfos(map: mapInfo) {

    let solidInfoMap: solidInfo[][];
    let height = Math.abs(map.lowestY - map.highestY);
    let width = Math.abs(map.lowestX - map.highestX);
    let mapStartX = map.lowestX;
    let mapStartY = map.lowestY;

    solidInfoMap = [];
    for (let i = 0; i < height * 2; i++) {
        solidInfoMap[i] = [];
        for (let j = 0; j < width * 2; j++) {
            solidInfoMap[i][j] = new solidInfo();
        }
    }

    for (let l = 0; l < map.layers.length; l++) {

        if (map.layers[l].name.search("solid") !== -1 || map.layers[l].name.search("content") !== -1) {

            for (let c = 0; c < map.layers[l].chunks.length; c++) {

                for (let y = 0; y < 16; y++) {

                    for (let x = 0; x < 16; x++) {

                        if (map.layers[l].name.search("solid") !== -1 === true && map.layers[l].chunks[c].element[x][y] !== 0 && map.layers[l].chunks[c].element[x][y] < 16) {
                            
                            let numbBin: string = map.layers[l].chunks[c].element[x][y].toString(2);
                            let fillerString: string = "";
                            console.log(numbBin)

                            if (numbBin.length < 4) {

                                for (let i = 0; i < 4 - numbBin.length; i++) {
                                    fillerString.concat("0");
                                }
                                numbBin = fillerString.concat(numbBin);
                            }
                            
                            //makes diffrent quarters of a block solid
                            if (numbBin.charAt(0) === "1") {
                                solidInfoMap[(x + map.layers[l].chunks[c].posX - mapStartX) * 2][(y + map.layers[l].chunks[c].posY - mapStartY) * 2].setIsSolid();
                            } 
                            if (numbBin.charAt(1) === "1") {
                                solidInfoMap[(x + map.layers[l].chunks[c].posX - mapStartX) * 2 + 1][(y + map.layers[l].chunks[c].posY - mapStartY) * 2].setIsSolid();
                            } 
                            if (numbBin.charAt(2) === "1") {
                                solidInfoMap[(x + map.layers[l].chunks[c].posX - mapStartX) * 2][(y + map.layers[l].chunks[c].posY - mapStartY) * 2 + 1].setIsSolid();
                            } 
                            if (numbBin.charAt(3) === "1") {
                                solidInfoMap[(x + map.layers[l].chunks[c].posX - mapStartX) * 2 + 1][(y + map.layers[l].chunks[c].posY - mapStartY) * 2 + 1].setIsSolid();
                            } 
                        }
                        else if (map.layers[l].name.search("content") !== -1 && map.layers[l].chunks[c].element[x][y] !== 0) {

                            solidInfoMap[(x + map.layers[l].chunks[c].posX - mapStartX) * 2][(y + map.layers[l].chunks[c].posY - mapStartY) * 2].setContent(map.layers[l].chunks[c].element[x][y]);
                            solidInfoMap[(x + map.layers[l].chunks[c].posX - mapStartX) * 2 + 1][(y + map.layers[l].chunks[c].posY - mapStartY) * 2].setContent(map.layers[l].chunks[c].element[x][y]);
                            solidInfoMap[(x + map.layers[l].chunks[c].posX - mapStartX) * 2][(y + map.layers[l].chunks[c].posY - mapStartY) * 2 + 1].setContent(map.layers[l].chunks[c].element[x][y]);
                            solidInfoMap[(x + map.layers[l].chunks[c].posX - mapStartX) * 2 + 1][(y + map.layers[l].chunks[c].posY - mapStartY) * 2 + 1].setContent(map.layers[l].chunks[c].element[x][y]);
                        }
                    }
                }
            }
        }
    }
    return solidInfoMap;
}

//saves the paths from the templates
let paths: string[];

async function convertMapData(mapdata:string, room: Room, canvas: HTMLCanvasElement) {

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

    //zoom in and out on the map, 1 is the standart
    let scaling: number;

    //saves the tilesets from the map
    let tilesetArray: tileset[];

    paths = [];

    for (let i = 0; i < room.state.templatePaths.length; i++) {

        paths.push(room.state.templatePaths[i]);
    }

    textures = new Map<string, HTMLImageElement>();
    let image: HTMLImageElement;

    let map = JSON.parse(mapdata);

    if (map.infinite === "true") {
        isInfinite = true;
    } else { isInfinite = false; }
    
    resolution = parseInt(map.tileheight);

    canvas.height = map.height * resolution;
    canvas.width = map.width * resolution;

    mapWidth = canvas.width / (resolution * scaling);
    mapHeight = canvas.height / (resolution * scaling);

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

    for (let l = 0; l < map.layers.length; l++) {

        for (let c = 0; c < map.layers[l].chunks.length; c++) {

            x = map.layers[l].chunks[c].x;
            y = map.layers[l].chunks[c].y;

            xPos.push(parseInt(x));
            yPos.push(parseInt(y));

            dataArray.push(new saveArray(map.layers[l].chunks[c].data));

            if (!isSet) {
                lowestX = map.layers[l].chunks[c].x;
                lowestY = map.layers[l].chunks[c].y;
                highestY = map.layers[l].chunks[c].y + 15;
                highestX = map.layers[l].chunks[c].x + 15;

                isSet = true;
            }
            if (map.layers[l].chunks[c].x < lowestX) {
                lowestX = map.layers[l].chunks[c].x;
            }
            if (map.layers[l].chunks[c].y < lowestY) {
                lowestY = map.layers[l].chunks[c].y;
            }
            if (map.layers[l].chunks[c].y + 15 > highestY) {
                highestY = map.layers[l].chunks[c].y + 15;
            }
            if (map.layers[l].chunks[c].x + 15 > highestX) {
                highestY = map.layers[l].chunks[c].x + 15;
            }
        }

        layerArray.push(new layer(xPos, yPos, dataArray, map.layers[l].name))
    }
    console.log(lowestX, lowestY, highestX, highestY)

    for (let t = 0; t < map.tilesets.length; t++) {

        tilesetArray.push(new tileset(parseInt(map.tilesets[t].firstgid), map.tilesets[t].source));

        image = await loadImage(tilesetArray[t].path);

        tilesetArray[t].tileWidth = image.naturalWidth;
        textures.set(tilesetArray[t].path, image);
    }
    return new mapInfo(layerArray, tilesetArray, canvas, resolution, textures, lowestX, lowestY, highestY, highestX);
}

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

                    //checks if the y coordinate would be seen on the screen, only works with an odd mapHeigtht
                    convertedY = convertYCoordinate(y, c, mapData.currentY, mapData.heightOfMap);
                    //if (!(convertedY < 0 || convertedY > mapData.heightOfMap)) {
    
                        for (let x = 0; x < 16; x++) {
    
                            //if the value is 0 we do not need to draw
                            if (c.element[x][y] !== 0) {
                            
                                //checks if the x coordiante would be seen on the screen, only works with an odd mapWidth
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
                                        //draw the image withaout searching
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

function drawMap(mapData: mapInfo){
    mapData.layers.forEach(function (l: layer){
        l.chunks.forEach(function (c: chunk){

            //if the chunk is not animated
            if(l.name.search("animated") === -1){

                for(let x = 0; x < 16; x++){
                    for(let y = 0; y < 16; y++){

                        //dont paint if there is nothing
                        if(c.element[x][y] !== 0){
                            let positionX: number;
                            let positionY: number;

                            //calculates the position on the canvas
                            positionX = x + c.posX + Math.floor(mapData.widthOfMap / 2);
                            positionY = y + c.posY + Math.floor(mapData.heightOfMap / 2);

                            //if this Element was never painted before
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
                                        mapData.ctx.drawImage(mapData.textures.get(newTileset.path), sourceX, sourceY, mapData.resolution, mapData.resolution, positionX * mapData.resolution, positionY * mapData.resolution, mapData.resolution, mapData.resolution);
                                        i = mapData.tilesets.length;
                                    }
                                }
                            } else{
                                //draw the image withaout searching
                                mapData.ctx.drawImage(mapData.textures.get(c.tilesetForElement[x][y].path), c.tilesetX[x][y], c.tilesetY[x][y], mapData.resolution, mapData.resolution, positionX * mapData.resolution, positionY * mapData.resolution, mapData.resolution, mapData.resolution);
                            }
                        }
                    }
                }
            }else{
                //draw gif
                //https://stackoverflow.com/questions/48234696/how-to-put-a-gif-with-canvas
            }
        })
    })
}

