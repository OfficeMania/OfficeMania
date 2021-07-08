import { Room } from "colyseus.js";
import { State } from "../common";
import { loadImage } from "./util";



export class Whiteboard{

    private isVisible: boolean = false;
    private canvas: HTMLCanvasElement; 
    private x: number = 0;
    private y: number = 0;
    private offsetX: number = 100;
    private offsetY: number = 100;
    private room: Room<State>;
    


    constructor(canvas: HTMLCanvasElement, room: Room<State>){
        this.room = room;
        this.canvas = canvas;
        let ctx = canvas.getContext("2d");


        canvas.addEventListener('mousemove', (e) => {this.draw(e, this)});
        canvas.addEventListener('mousedown', (e) => {this.setPosition(e, this)});
        canvas.addEventListener('mouseenter', (e) => {this.setPosition(e, this)});

        canvas.width = 1280;
        canvas.height = 720; 
        
        
        this.setup(canvas, ctx);
    }

    private setup(canvas, ctx){
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black"
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.stroke(); 
    }

    getIsVisible(){
        return this.isVisible;
    }

    toggelIsVisible(){
        if(this.isVisible === true){
            this.isVisible = false;
            this.canvas.style.visibility = "hidden";
        } else {
            this.isVisible = true;
            this.canvas.style.visibility = "visible";
        }
    }

    getCanvas(){
        return this.canvas
    }

    resize(width: number, height: number){
        this.offsetX = Math.round(width/2) - Math.round(this.canvas.width/2);
        this.offsetY = Math.round(height/2) - Math.round(this.canvas.height/2);

        this.canvas.style.left = this.offsetX + "px";
        this.canvas.style.top = this.offsetY + "px";
    }

    //doesnt really work
    async resize2(width: number, height: number){
        var imageSrc = this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        var oldWidth = this.canvas.width;
        var oldHeight = this.canvas.height;
        this.canvas.width = width - 200;
        this.canvas.height = height - 200;
        var ctx = this.canvas.getContext("2d");
        var image = await loadImage(imageSrc)
        ctx.drawImage(image, 0, 0, oldWidth, oldHeight, 0, 0, width - 200, height - 200);
    }

    // new position from mouse event
    private setPosition(e, whiteboard: Whiteboard) {
        whiteboard.x = e.clientX - whiteboard.offsetX;
        whiteboard.y = e.clientY - whiteboard.offsetY;
    }

    private draw(e, whiteboard: Whiteboard) {
        // mouse left button must be pressed
        if (e.buttons !== 1) return;
        var ctx = whiteboard.canvas.getContext("2d");

        ctx.beginPath(); // begin
        
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#c0392b';
        
        whiteboard.room.send("startPoint", [whiteboard.x, whiteboard.y])
        ctx.moveTo(whiteboard.x, whiteboard.y); // from
        whiteboard.setPosition(e, whiteboard);
        whiteboard.room.send("endPoint", [whiteboard.x, whiteboard.y])
        ctx.lineTo(whiteboard.x, whiteboard.y); // to
      
        ctx.stroke(); // draw it!
      }
  


}

export function drawWhiteboard(canvas: HTMLCanvasElement, whiteboard: HTMLCanvasElement){

}