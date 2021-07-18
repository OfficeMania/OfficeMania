import { characters } from "./main";
import { loadingScreen } from "./static";
import { loadCharacter } from "./util";


let canvas = loadingScreen;
let loadCounter: number = 0;
let spriteX: number = 0;
let spriteY: number = 0;
const playerWidth: number = 48;
const playerHeight: number = 96;
const loadHeight: number = 100;
let showLoadingScreen: boolean = true;

export async function initLoading(){
    /*if (canvas.style.display === "none") {
        console.log("Loading screen is already over");
        return;
    }*/
    const showAndRemove = () => {
        setShowLoadingscreen(false)
        document.removeEventListener('DOMContentLoaded', showAndRemove)
    };
    document.addEventListener('DOMContentLoaded', showAndRemove);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    //ctx.fillStyle = "black";
    //ctx.fillRect(200,200,200,200);
    
    let x = 0;
    //choose direction, x += dir*(6*width) (0=r, 1=u, 2=l, 3=d)
    let dir: number = 0;
    x += dir * 6 * playerWidth
    while (showLoadingScreen) {

            //counter animation
        if (loadCounter % 60 <= 10) {
            //do nothing
        } else if (loadCounter % 60 <= 20) {
            x += playerWidth;
        } else if (loadCounter % 60 <= 30) {
            x += 2 * playerWidth;
        } else if (loadCounter % 60 <= 40) {
            x += 3 * playerWidth;
        } else if (loadCounter % 60 <= 50) {
            x += 4 * playerWidth;
        } else {
            x += 5 * playerWidth;
        }

        spriteX = x;
        spriteY = 2 * playerHeight;
        console.log("holle :)")
        ctx.drawImage(characters["Adam_48x48.png"], spriteX, spriteY, playerWidth, playerHeight, Math.round((playerWidth / 2) + loadCounter), loadHeight, playerWidth, playerHeight);
        
        loadCounter++;
        if(!showLoadingScreen) {
            return;
        }
        showLoadingScreen = false;
    }
    
}   

export function setShowLoadingscreen(show: boolean) {
    console.log("called")
    showLoadingScreen = show;
}   
 
