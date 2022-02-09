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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    writeOfficeMania(ctx);
}   

export function setShowLoadingscreen(show: boolean) {

    let opacity = 100;
    while (opacity >= 0) {
        canvas.style.opacity = opacity + "%";
        loadingCat.style.opacity = opacity + "%";
        opacity -= 0.5;
    }

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
    }
    else {
        scale = scaleY;
    }
    for(let i = 0; i < writing.length; i++) {
        let line = writing[i];
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
 
