import { getInputMode, setInputMode } from "../input";
import { checkInputMode } from "../main";
import { playerLoop } from "../movement";
import { createCloseInteractionButton, InputMode, loadCharacter, removeCloseInteractionButton } from "../util";
import { Interactive } from "./interactive";


export class Computer extends Interactive {

    ctx: CanvasRenderingContext2D;
    iframe: HTMLIFrameElement = document.createElement("iframe");

    constructor(){
        super("Computer", false, 1);
        this.ctx = this.canvas.getContext("2d");
        this.iframe.id = "computer-iframe";
        this.iframe.src = "https://dustinbrett.com/";
        this.iframe.style.boxShadow = "0 0 0 10px hsl(0, 0%, 0%), 0 0 50px hsl(0, 0%, 75.3%), 0 0 0 50px hsl(0, 0%, 20.4%)"
    }

    /*<iframe src="https://www.tu-braunschweig.de/" style="height:500px;width:500px" title="Iframe Example">*/

    onInteraction() {
        if(getInputMode() !== InputMode.INTERACTION) {
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
            this.ctx.fillStyle = "white";
            this.ctx.font = "50px sans-serif";
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 7;
            this.ctx.strokeText("Loading...", 550, 200);
            this.ctx.lineWidth = 1;
            this.ctx.fillText("Loading...", 550, 200);
            this.canvas.style.visibility = "visible";
            createCloseInteractionButton(() => this.leave());
            checkInputMode();
            document.getElementById("interactive-bar").prepend(this.iframe);
            document.getElementById("computer-iframe").addEventListener("load", () => {
                this.canvas.style.visibility = "hidden";
            });
        }
        else this.leave();
    }

    loop() {}

    leave() {
        removeCloseInteractionButton();
        this.canvas.style.visibility = "hidden";
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        document.getElementById("computer-iframe").remove();
        setInputMode(InputMode.NORMAL);
    }
}