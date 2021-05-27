import { loadImage } from "./util";
import { Room } from "colyseus.js";

export {drawMapWithChunks, convertMapData}

//only important for infinite maps
class chunk {

    element: number[][];
    posX: number;
    posY: number;

    constructor(entries: number[], xPos: number, yPos: number) {

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

class layer {

    name: string;
    chunks: chunk[];
    isSolid: boolean;

    constructor(x:number[], y:number[], data:saveArray[], layerName: string) {

        this.chunks = [];
        this.name = layerName;

        if (layerName.search("solid")) {
            this.isSolid = true;
        } else { this.isSolid = false; }

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

let layerArray: layer[];
let paths: string[];

//the resolution is 48 and shouldn't be changed, would be too complicated to get the right resolution
let resolution: number;

//important for drawing, infinite maps work only with chunks
let isInfinite: boolean;

//the spawn coordinates
let startPosX: number;
let startPosY: number;

//the current Position from the player
let currentX: number;
let currentY: number;

//the height and width of the map on screen. Let Height and Width be odd, so player is displayed in middle of the screen
let mapHeight: number;
let mapWidth: number;
let ctx: CanvasRenderingContext2D;

let textures: Map<string, HTMLImageElement>;
//TODO create canvas with good scale of the map

let tilesetArray: tileset[];

async function convertMapData(mapdata:string, room: Room, canvas: HTMLCanvasElement) {

    canvas.height = 1008;
    canvas.width = 1008;
    
    ctx = canvas.getContext("2d");

    paths = [];

    for (let i = 0; i < room.state.templatePaths.length; i++) {

        paths.push(room.state.templatePaths[i]);
    }

    textures = new Map<string, HTMLImageElement>();
    let image: HTMLImageElement;

    let map = JSON.parse(mapdata);


    startPosX = 0;
    startPosY = 0;

    currentX = startPosX;
    currentY = startPosY;

    if (map.infinite === "true") {
        isInfinite = true;
    } else { isInfinite = false; }
    
    resolution = parseInt(map.tileheight);

    mapWidth = canvas.width / resolution;
    mapHeight = canvas.height / resolution;

    layerArray = [];
    tilesetArray = [];

    let xPos: number[] = [];
    let yPos: number[] = [];
    let dataArray: saveArray[] = [];
    let x: string;
    let y: string;

    for (let l = 0; l < map.layers.length; l++) {

        for (let c = 0; c < map.layers[l].chunks.length; c++) {

            x = map.layers[l].chunks[c].x;
            y = map.layers[l].chunks[c].y;

            xPos.push(parseInt(x));
            yPos.push(parseInt(y));

            dataArray.push(new saveArray(map.layers[l].chunks[c].data));
        }

        layerArray.push(new layer(xPos, yPos, dataArray, map.layers[l].name))
    }

    for (let t = 0; t < map.tilesets.length; t++) {

        tilesetArray.push(new tileset(parseInt(map.tilesets[t].firstgid), map.tilesets[t].source));

        image = await loadImage(tilesetArray[t].path);

        tilesetArray[t].tileWidth = image.naturalWidth;
        textures.set(tilesetArray[t].path, image);
    }

    drawMapWithChunks();
}

function convertXCoordinate(x: number, c:chunk): number {

    return (x + c.posX - (currentX - Math.floor(mapWidth/2)))
}

function convertYCoordinate(y: number, c:chunk): number {

    return (y + c.posY - (currentY - Math.floor(mapHeight/2)))
}



//code for infinite maps
function drawMapWithChunks () {

    layerArray.forEach(function(l: layer) {

        l.chunks.forEach(function(c: chunk) {

            let convertedY: number = convertYCoordinate(c.posY, c);
            let convertedX: number = convertXCoordinate(c.posX, c);

            //checks if the full chunk is not on the map on the screen
            if(!(convertedX + 16 < 0 || convertedY + 16 < 0 || convertedX > mapWidth - 1 || convertedY > mapHeight - 1)) {

                for (let y = 0; y < 16; y++) {

                    //checks if the y coordinate would be seen on the screen, only works with an odd mapHeigtht
                    convertedY = convertYCoordinate(y, c);
                    if (!(convertedY < 0 || convertedY > mapHeight - 1)) {
    
                        for (let x = 0; x < 16; x++) {
    
                            //if the value is 0 we do not need to draw
                            if (c.element[x][y] !== 0) {
                            
                                //checks if the x coordiante would be seen on the screen, only works with an odd mapWidth
                                convertedX = convertXCoordinate(x, c);
                                if (!(convertedX < 0 || convertedX > mapWidth - 1)) {
        
                                    //saves a tileset, we need this to find the right one
                                    let newTileset: tileset = null;
        
                                    for (let i = 0; i < tilesetArray.length; i++) {
        
                                        if (c.element[x][y] >= tilesetArray[i].firstGridId || tilesetArray.length === 1) {
        
                                            newTileset = tilesetArray[i];
                                        }

                                        let value: number;
                                        let sourceX: number;
                                        let sourceY: number;
                                        //if this is true we found the right tileset with help of the firstGridId
                                        if (c.element[x][y] < newTileset.firstGridId || i === (tilesetArray.length - 1)) {
        
                                            value = c.element[x][y] - tilesetArray[i].firstGridId;
                                        
                                            //calculates the right position from the required texture
                                            sourceX = (value % (newTileset.tileWidth / resolution)) * resolution
                                            sourceY = Math.floor(value / (newTileset.tileWidth / resolution)) * resolution;

                                            //Create an array with used templates to boost performance
                                            ctx.drawImage(textures.get(newTileset.path), sourceX, sourceY, resolution, resolution, convertedX * resolution, convertedY * resolution, resolution, resolution);
                                            i = tilesetArray.length;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    })
}
