import { getInputMode, setInputMode } from "../input";
import { checkInputMode } from "../main";
import { createCloseInteractionButton, InputMode, removeCloseInteractionButton } from "../util";
import { Interactive } from "./interactive";


export class Computer extends Interactive {

    ctx: CanvasRenderingContext2D;
    iframe: HTMLIFrameElement = document.createElement("iframe");

    constructor(){
        super("Computer", false, 1);
        this.ctx = this.canvas.getContext("2d");
        this.iframe.id = "computer-iframe";
        this.iframe.src = "https://www.tu-braunschweig.de/";
        this.ctx.fillStyle = "white";
        this.ctx.font = "50px sans-serif";
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 7;
        this.ctx.strokeText("Loading...", 550, 200);
        this.ctx.lineWidth = 1;
        this.ctx.fillText("Loading...", 550, 200);
    }


    /*<iframe src="https://www.tu-braunschweig.de/" style="height:500px;width:500px" title="Iframe Example">*/

    onInteraction() {
        if(getInputMode() !== InputMode.INTERACTION) {
            this.canvas.style.visibility = "visible";
            createCloseInteractionButton(() => this.leave());
            checkInputMode();
            document.getElementById("interactive-bar").prepend(this.iframe);
        }
        else this.leave();
    }

    loop() {}

    leave() {
        removeCloseInteractionButton();
        this.canvas.style.visibility = "hidden";
        document.getElementById("computer-iframe").remove();
        setInputMode(InputMode.NORMAL);
    }
}