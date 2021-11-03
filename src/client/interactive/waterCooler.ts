import { Room } from "colyseus.js";
import {Interactive} from "./interactive";
import {getInputMode, setInputMode} from "../input";
import {createCloseInteractionButton, getRoom, InputMode, removeCloseInteractionButton, } from "../util";
import { MessageType } from "../../common/util";
import { checkInputMode } from "../main";
import { State } from "../../common";
import { MachineType} from "../../common/handler/machinehandler";

export class WaterCooler extends Interactive{

    ctx: CanvasRenderingContext2D;
    room: Room<State>;
    constructor(){
        super("Water Cooler", false, 1);
        this.ctx = this.canvas.getContext("2d");
        this.room = getRoom();
        this.initPrinting();
    }

    loop() {}

    onInteraction() {
        if(getInputMode() !== InputMode.INTERACTION) {
            this.canvas.style.visibility = "visible";
            this.canvas.getContext("2d").textAlign = "center";
            createCloseInteractionButton(() => this.leave());
            checkInputMode();
            this.room.send(MessageType.MACHINE_INTERACT, MachineType.WATER);
        }
        else this.leave();
        
    }


    leave() {
        removeCloseInteractionButton();
        this.canvas.style.visibility = "hidden";
        setInputMode(InputMode.NORMAL);
    }
    
    initPrinting() {
        this.room.onMessage(MessageType.MACHINE_WATER, (message) => {
            this.ctx.textAlign = "left";
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "rgb(0, 4, 120)";
            this.ctx.fillRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);
    
            this.ctx.fillStyle = "white";
            this.ctx.font = "50px MobileFont"; 
            this.ctx.lineWidth = 3;
    
            var subs = message.split('\n');
            let i = 0;
            let j = 0;
            while(i < subs.length) {
                let times = Math.floor(subs[i]?.length / 40);
                for(let k = 0; k <= times; k++) {
                    if(k === times){
                        this.ctx.fillText(subs[i]?.slice(40 * k, subs[i]?.length), 100, 100 + (50 * j));
                        j++;
                    } else {
                        this.ctx.fillText(subs[i]?.slice(40 * k, (40 * k) + 40), 100, 100 + (50 * j));
                        j++;
                    }
                }
                i++;
            }
        });
    }
}