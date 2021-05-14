export {drawMapWithChunks}

//only important for infinit maps
class chunk {

    element: number[][];
    posX: number;
    posY: number;

    chunk (entries: number[], xPos: number, yPos: number) {

        for (let i: number = 0; i < entries.length; i++) {
            this.element[i % 16][Math.floor(i / 16)] = entries[i];
        }
        this.posX = xPos;
        this.posY = yPos;
    }
}
let chunkArray: chunk[];

//the resolution is 48 and shouldnt be changed, would be to complicated to get the rigth resolution
let resolution: number;
resolution = 48;

//important for drawing, infinite maps work only with chunks
let isInfinity: boolean;

//the spawncoordinates
let startPosX: number;
let startPosY: number;

//the heigth and width of the map on screen
let mapHeight: number;
let mapWidth: number;

//TODO create canvas with good scale of the map

class tileset {

    firstGridId: number;
    path: string;
    tileWidth: number;
    tileHeight: number;

    tileset (firstId: number, source: string) {

        this.firstGridId = firstId;
        this.path = source;
    }

    calculateHeightAndWidth(path: string) {

        //calculate the width and height with the resolution and the number of pixels from the tilesetfile
    }
}

let tilesetArray: tileset[];
let sortedTilesetArray: tileset[];

function fillSortedTilesetArray(tileset: tileset[]) {

    //fill the sortedTilesetArray with sorted elements from the tilesetArray
}

function readMap() {

    // must be changed to an filereader
    let rawdata = ("/Users/michaelgoslar/Desktop/Map.json")

    let map = JSON.parse(rawdata);
}

function convertXCoordinate(x: number, c:chunk): number {

    return (x + c.posX - (startPosX - Math.floor(mapWidth/2)))
}

function convertYCoordinate(y: number, c:chunk): number {

    return (y + c.posY - (startPosY - Math.floor(mapHeight/2)))
}



//code for infinit maps
function drawMapWithChunks () {

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
        
                                //saves a tileset, we need this to find the rigth one
                                let newTileset:tileset = null;
        
                                for (let i = 0; 0 < sortedTilesetArray.length; i++) {
        
                                    if (c.element[x][y] >= sortedTilesetArray[i].firstGridId) {
        
                                        newTileset = sortedTilesetArray[i];
                                    }
        
                                    //if this is true we found the rigth tileset with help of the firstGridId
                                    if (c.element[x][y] < newTileset.firstGridId || i === (sortedTilesetArray.length - 1)) {
        
                                        var value = c.element[x][y] - sortedTilesetArray[i].firstGridId;
                                        
                                        //calculates the rigth postion from the needed texture
                                        var sourceX = (value % newTileset.tileWidth) * resolution
                                        var sourceY = Math.floor(value / newTileset.tileHeight) * resolution;
        
                                        canvas.drawImage(img, sourceX, sourceY, resolution, resolution, convertedX, convertedY, resolution, resolution);
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