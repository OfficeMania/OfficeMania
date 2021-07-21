import { loadingCat, loadingScreen } from "./static";

let canvas = loadingScreen;
let loadCounter: number = 0;
let spriteX: number = 0;
let spriteY: number = 0;
const playerWidth: number = 48;
const playerHeight: number = 96;
const playerSizeX: number = 96;
const playerSizeY: number = 192;
const loadHeight: number = 100;
let showLoadingScreen: boolean = true;
let scale: number;
const ctx = canvas.getContext("2d");
const lineThiccness: number = 8;
const writingGapX: number = 60;
const writing: boolean[][] = [[],
[false, false, true, true, false, false, true, true, true, true, false, true, true, true, true, false,  true, false,  true, true, true, true, false, true, true, true, true, false],
[false, true, false, false, true, false, true, false, false, false, false, true, false, false, false, false, true, false, true, false, false, false, false, true, false, false, false, false,],
[false, true, false, false, true, false, true, true, true, false, false, true, true, true, false, false, true, false, true, false, false, false, false, true, true, true, false, false,],
[false, true, false, false, true, false, true, false, false, false, false, true, false, false, false, false, true, false, true, false, false, false, false, true, false, false, false, false,],
[false, false, true, true, false, false, true, false, false, false, false, true, false, false, false, false, true, false, true, true, true, true, false, true, true, true, true, false,],
[],
[false, false, false, true, false, false, false, true, false, false, true, true, false, false, true, false, false, true, false, true, false, false, true, true, false, false, false, false,],
[false, false, false, true, true, false, true, true, false, true, false, false, true, false, true, true, false, true, false, true, false, true, false, false, true, false, false, false,],
[false, false, false, true, false, true, false, true, false, true, true, true, true, false, true, false, true, true, false, true, false, true, true, true, true, false, false, false,],
[false, false, false, true, false, false, false, true, false, true, false, false, true, false, true, false, false, true, false, true, false, true, false, false, true, false, false,false,],
[false, false, false, true, false, false, false, true, false, true, false, false, true, false, true, false, false, true, false, true, false, true, false, false, true, false, false,false,],
[],
]
export async function initLoadingScreenLoading(){
    /*if (canvas.style.display === "none") {
        console.log("Loading screen is already over");
        return;
    }*/
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    //ctx.fillStyle = "black";
    //ctx.fillRect(200,200,200,200);
    
    //let x = 0;
    //choose direction, x += dir*(6*width) (0=r, 1=u, 2=l, 3=d)
    //let dir: number = 0;
    //x += dir * 6 * playerWidth
    //while (loadCounter < 2000) {

            //counter animation
        //if (loadCounter % 60 <= 10) {
            //do nothing
        //} else if (loadCounter % 60 <= 20) {
        //    x += playerWidth;
        //} else if (loadCounter % 60 <= 30) {
        //    x += 2 * playerWidth;
        //} else if (loadCounter % 60 <= 40) {
        //    x += 3 * playerWidth;
        //} else if (loadCounter % 60 <= 50) {
        //    x += 4 * playerWidth;
        //} else {
        //    x += 5 * playerWidth;
        //}

        //spriteX = x;
        //spriteY = 2 * playerHeight;
        //if(loadCounter % 100 === 0) {
            //console.log("holle :)")
            ctx.fillStyle = "#d0be9c";
            //ctx.fillRect(0,0, canvas.width, canvas.height)
            writeOfficeMania(ctx);
            //ctx.drawImage(characters["Adam_48x48.png"], spriteX, spriteY, playerWidth, playerHeight, canvas.width- playerSizeX*2, canvas.height - playerSizeY*1.5, playerSizeX, playerSizeY);

        //}
        
        //loadCounter++;
    //}
    //canvas.style.visibility = "hidden";
}   

export function setShowLoadingscreen(show: boolean) {
    //console.log("called")
    showLoadingScreen = show;
    canvas.style.visibility = "hidden";
    loadingCat.style.visibility = "hidden";
}  
function writeOfficeMania(ctx: CanvasRenderingContext2D) {
    let scaleX: number = Math.floor(canvas.width / writingGapX);
    let scaleY: number = Math.floor(canvas.height / 13);
    let compensationX = 0;
    let compensationY = 0;
    if (scaleX < scaleY) {
        scale = scaleX; 
        compensationX = (writingGapX - 28)/ 2;
        while (scale*compensationY< 100) {
            compensationY++;
        }
        //console.log(compensationY);
    }
    else {
        scale = scaleY;
    }
    //console.log("canvas: " + canvas.width + " scale: " + scale);
    for(let i = 0; i < writing.length; i++) {
        let line = writing[i];
        //console.log(line.length);
        for (let j = 0; j < line.length; j++) {
            
            if (writing[i][j]) {
                ctx.fillStyle = "white";
                ctx.fillRect((j+compensationX)*scale, (i+compensationY)*scale, scale, scale);
                ctx.fillStyle = "black";
                if (!writing[i-1][j]) {
                    ctx.fillRect((j+compensationX)*scale, (i+compensationY)*scale, scale, scale/lineThiccness);
                }
                if (!writing[i+1][j]) {
                    ctx.fillRect((j+compensationX)*scale, (i+compensationY)*scale + (lineThiccness - 1)*scale/lineThiccness, scale, scale/lineThiccness);
                }
                if (!writing[i][j-1]) {
                    ctx.fillRect((j+compensationX)*scale, (i+compensationY)*scale, scale/lineThiccness, scale);
                }
                if (!writing[i][j+1]) {
                    ctx.fillRect((j+compensationX)*scale + (lineThiccness - 1)*scale/lineThiccness, (i+compensationY)*scale, scale/lineThiccness, scale);
                }
            }
            
        }
    }
}
 
