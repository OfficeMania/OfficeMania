function drawMap () {

    let chunk:number[];

    var path = "/Users/michaelgoslar/Desktop/Texturepacks/Modern_Interiors/1_Interiors/48x48/Old_Stuff/Tileset_48x48_4.png"

    var img = new Image;

    img.src = path;

    for (let i:number = 0; i < 64; i++) {
        chunk.push(i);
    }

    for (let index = chunk.length - 1; index > -1; index--) {

        var value = chunk[index];

        var sourceX = (value % 10) * 48
        var sourceY = Math.floor(value / 10) * 48

        var destinationX = (index % 16)
        var destinationY = Math.floor(index / 16)

        canves.drawImage(img, sourceX, sourceY, 48, 48, destinationX, destinationY, 48, 48);
    }
}

const fs = require("fs");

let rawdata = fs.readFileSync("/Users/michaelgoslar/Desktop/Map.json")

let map = JSON.parse(rawdata);

drawMap();