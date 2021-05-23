export {drawMapWithChunks, convertMapData}

//only important for infinite maps
class chunk {

    element: number[][];
    posX: number;
    posY: number;

    constructor(entries: number[], xPos: number, yPos: number) {

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

    constructor(x:number[], y:number[], data:number[][], layerName: string) {

        this.name = layerName;

        if (layerName.search("solid")) {
            this.isSolid = true;
        } else { this.isSolid = false; }

        let tempData: number[];

        for (let i = 0; i < x.length; i++) {

            for (let a = 0; a < 16; a++) {

                tempData.push(data[i][a]);
            }

            this.chunks.push(new chunk(tempData, x[0], y[i]));

            document.write("" + this.chunks[i].posX);
        }
    }
}

class tileset {

    firstGridId: number;
    path: string;
    tileWidth: number;
    tileHeight: number;

    constructor(firstId: number, source: string) {

        this.firstGridId = firstId;
        this.path = source;
    }

    calculateHeightAndWidth(path: string) {

        //calculate the width and height with the resolution and the number of pixels from the tilesetfile
    }
}

let chunkArray: chunk[];
let layerArray: layer[];

//the resolution is 48 and shouldn't be changed, would be too complicated to get the right resolution
let resolution: number;

//important for drawing, infinite maps work only with chunks
let isInfinite: boolean;

//the spawn coordinates
let startPosX: number;
let startPosY: number;

//the height and width of the map on screen. Let Height and Width be odd, so player is displayed in middle of the screen
let mapHeight: number;
let mapWidth: number;

//TODO create canvas with good scale of the map

let tilesetArray: tileset[];
let sortedTilesetArray: tileset[];

function fillSortedTilesetArray(tileset: tileset[]) {

    //fill the sortedTilesetArray with sorted elements from the tilesetArray
}
    //TODO map muss gelesen werden
        //Layer mit id
            //Ist das Layer solide? (in Namen entahlen, boolean)
            //chunkarray
                //chunks
                    //elements
                    //x,y koordinaten
        //Verwendete Tilesets speichern
            //firstgrid id 
            //source
            //welche Auflösung hat es?

function convertMapData(mapdata:string) {

    let map = JSON.parse(mapdata);

    if (map.infinite === "true") {
        isInfinite = true;
    } else { isInfinite = false; }
    
    resolution = parseInt(map.tileheight);

    let xPos: number[];
    let yPos: number[];
    let data: number[];
    let dataArray: number[][];


    //TODO herrausfinden wie man mit JSON arbeitet
    document.writeln(map.layers.chunks);

    for (let l = 0; l < map.layers.length; l++) {


        for (let c = 0; c < map.layers[l].chunks.length; c++) {

            document.writeln("" + c);

            xPos.push(parseInt(map.layers[l].chunks[c].x));
            yPos.push(parseInt(map.layers[l].chunks[c].y));

            

            dataArray.push(data);
        }

        layerArray.push(new layer(xPos, yPos, dataArray, map.layers[l].name))
    }
}

function convertStringArrayToNumbArray(text: string[]) {

    let numbers: number[];
    text.forEach(function(s){

        numbers.push(parseInt(s))
    });
    return numbers;
}

function convertXCoordinate(x: number, c:chunk): number {

    return (x + c.posX - (startPosX - Math.floor(mapWidth/2)))
}

function convertYCoordinate(y: number, c:chunk): number {

    return (y + c.posY - (startPosY - Math.floor(mapHeight/2)))
}



//code for infinite maps
function drawMapWithChunks () {

    //TODO richtiges canvas mit height und width
    let canvas: CanvasDrawImage;

    var img = new Image;

    chunkArray.forEach(function(c) {

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
                                let newTileset:tileset = null;
        
                                for (let i = 0; i < sortedTilesetArray.length; i++) {
        
                                    if (c.element[x][y] >= sortedTilesetArray[i].firstGridId) {
        
                                        newTileset = sortedTilesetArray[i];
                                    }
        
                                    //if this is true we found the right tileset with help of the firstGridId
                                    if (c.element[x][y] < newTileset.firstGridId || i === (sortedTilesetArray.length - 1)) {
        
                                        var value = c.element[x][y] - sortedTilesetArray[i].firstGridId;
                                        
                                        //calculates the right position from the required texture
                                        var sourceX = (value % newTileset.tileWidth) * resolution
                                        var sourceY = Math.floor(value / newTileset.tileHeight) * resolution;
        
                                        canvas.drawImage(img, sourceX, sourceY, resolution, resolution, convertedX, convertedY, resolution, resolution);
                                        i = sortedTilesetArray.length;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
}
