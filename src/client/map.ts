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

let resolution: number;
let tileHeight: number;
let tileWidth: number;

//important for drawing, infinite maps works with chunks only
let isInfinity: boolean;

//the spawn for joining
let startPosX: number;
let startPosY: number;

//TODO create canvas with good scale of the map

class tileset {

    firstGridId: number;
    path: string;

    tileset (firstId: number, source: string) {

        this.firstGridId = firstId;
        this.path = source;
    }
}

let tilesetArray: tileset[];

function readMap() {

    // must be changed to an filereader
    let rawdata = ("/Users/michaelgoslar/Desktop/Map.json")

    let map = JSON.parse(rawdata);
}



//code for infinit maps
function drawMapWithChunks () {

    let chunkTest:number[];

    let canvas: CanvasDrawImage;

    var img = new Image;

    //check for the firstGridId to know which texturedata is needed, and then search for number of pixels and divide this with 48 to get the width and height

    chunkArray.forEach(function(c) {

        for (let y = 0; y < 16; y++) {

            for (let x = 0; x < 16; x++) {

                var value = c.element[x][y] -1;
                
                if (value !== -1) {
                    var sourceX = (value % tileWidth) * resolution
                    var sourceY = Math.floor(value / tileHeight) * resolution;

                    canvas.drawImage(img, sourceX, sourceY, resolution, resolution, x, y, resolution, resolution);
                }
            }
        }
    })
}