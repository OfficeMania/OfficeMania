import { getConstantValue } from "typescript";
import { setInputMode } from "./input";
import { checkInputMode } from "./main";
import { getPath, MapInfo, TileSet } from "./map";
import { backpackCanvas } from "./static";
import { createCloseInteractionButton, getMapInfo, InputMode, loadImage, removeCloseInteractionButton } from "./util";

export class Backpack {

    items: Map<string, Item>
    ctx: CanvasRenderingContext2D;
    j = 0;

    constructor() {
        this.ctx = backpackCanvas.getContext("2d");
        this.items = new Map<string, Item>();
        //TODO png has resolution=48
        var resolution = getMapInfo().resolution;
        this.items.set("strawberry donut",new Donut("Strawberry donut", "A delicious strawberry donut", "/12_Kitchen_48x48.png", 3 * resolution, 39 * resolution));
        this.items.set("sprincle donut", new Donut("Sprincle donut", "A delicious stprincle donut", "/12_Kitchen_48x48.png", 3 * resolution, 38 * resolution));
        this.items.set("chocloate donut" ,new Donut("Chocolate donut", "A delicious chocolate donut", "/12_Kitchen_48x48.png", 2 * resolution, 38 * resolution));
        this.items.set("vanile donut", new Donut("Vanille donut", "A delicious vanille donut", "/12_Kitchen_48x48.png", 2 * resolution, 38 * resolution));
    }

    draw() {
        //sync with server?
        backpackCanvas.style.visibility = "visible";
        createCloseInteractionButton(() => this.leave());
        checkInputMode();

        //this.ctx.textAlign = "left";
        this.ctx.fillStyle = "black";
        roundRect(this.ctx, 0, 0, backpackCanvas.width, backpackCanvas.height, 50);
        this.ctx.fillStyle = "white";
        roundRect(this.ctx, 5, 5, backpackCanvas.width - 10, backpackCanvas.height - 10, 50);

        var i = 1;
        this.items.forEach((value) => {
            if(value.amount >= 1) {
                this.ctx.drawImage(value.image, value.tileX, value.tileY, getMapInfo().resolution, getMapInfo().resolution, 20, 20 * i, getMapInfo().resolution, getMapInfo().resolution);
                var text = value.name + ": " + value.description;
                if (value.isNew) {
                    text = "*New* "+ value.name + ": " + value.description + " x" + value.amount ;
                }
                i += 2;
                this.ctx.fillStyle = "black";
                //TODO change font
                this.ctx.font = "25px MobileFont"; 
                this.ctx.lineWidth = 3;
                this.ctx.fillText(text, 20 + getMapInfo().resolution + 20, 20 * i)
                value.isNew = false;
            }
        })
    }

    leave() {
        removeCloseInteractionButton();
        backpackCanvas.style.visibility = "hidden";
        setInputMode(InputMode.NORMAL);
    }
    
    getItem(name: string) {
        if(this.items.get(name)) {
            this.items.get(name).increase();
        }
        //TODO sync with server
    }

    loseItem(name: string) {
        this.items.get(name).decrease();
        //TODO sync with server
    }

}


//Class to extend
class Item {

    //the picture
    image: HTMLImageElement;
    path: string;
    tileX: number;
    tileY: number;

    //other Informations
    name: string;
    description: string;
    isNew: boolean;
    amount: number = 0;

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }

    interact(): void {
        console.warn("Not implemented on this Item");
    }

    increase(): boolean {
        if(this.amount === 99) {
            console.warn("Tried to get more than 99")
            return false;
        }
        this.amount++;
        this.isNew = true;
        return true;
    }

    decrease(): boolean {
        if(this.amount === 0) {
            console.warn("Tried to decrease a non existing item")
            return false;
        }
        this.amount--;
        return true;
    }

    async getImage() {
        this.image = await loadImage(this.path);
    }

}

class Donut extends Item {

    constructor(name: string, description: string, path: string, x: number, y: number){
        super(name, description);
        super.path = getPath(path);
        this.tileX = 0;
        this.tileY = 0;
        this.getImage();
        this.tileX = x;
        this.tileY = y;
    }

    increase(): boolean{
        return super.increase();
    }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}