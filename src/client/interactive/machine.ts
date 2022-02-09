import { Room } from "colyseus.js";
import { Interactive } from "./interactive";
import { getInputMode, setInputMode } from "../input";
import { createCloseInteractionButton, getRoom, InputMode, removeCloseInteractionButton } from "../util";
import { MachineType, MessageType, State } from "../../common";
import { checkInputMode } from "../main";

export class Machine extends Interactive {


    ctx: CanvasRenderingContext2D;
    room: Room<State>;
    mtype: MachineType;
    type: MessageType;
    constructor(name: string, mtype: MachineType){
        super(name, false, 1);
        this.ctx = this.canvas.getContext("2d");
        this.room = getRoom();
        this.mtype = mtype;
        this.getMessageType();
        this.initPrinting();
    }

    loop() {}

    onInteraction() {
        //TODO: would love to have inputmode check server side, not yet doable
        if(getInputMode() !== InputMode.INTERACTION) {
            this.canvas.style.visibility = "visible";
            this.canvas.getContext("2d").textAlign = "center";
            createCloseInteractionButton(() => this.leave());
            checkInputMode();
            this.room.send(MessageType.MACHINE_INTERACT, this.mtype);
        }
        else this.leave();

    }


    leave() {
        removeCloseInteractionButton();
        this.canvas.style.visibility = "hidden";
        setInputMode(InputMode.NORMAL);
    }

    initPrinting() {
        this.room.onMessage(this.type, (message) => {
            this.ctx.textAlign = "left";
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(200, 200, this.canvas.width - 400, this.canvas.height - 400);
            this.ctx.fillStyle = "rgb(75, 71, 152)";
            this.ctx.fillRect(210, 210, this.canvas.width - 420, this.canvas.height - 420);

            this.ctx.fillStyle = "white";
            this.ctx.font = "50px MobileFont";
            this.ctx.lineWidth = 3;

            var subs = message.split('\n');
            let i = 0;
            let j = 0;
            while(i < subs.length) {
                let times = Math.floor(subs[i]?.length / 30);
                for(let k = 0; k <= times; k++) {
                    if(k === times){
                        this.ctx.fillText(subs[i]?.slice(30 * k, subs[i]?.length), 250, 300 + (50 * j));
                        j++;
                    } else {
                        this.ctx.fillText(subs[i]?.slice(30 * k, (30 * k) + 30), 250, 300 + (50 * j));
                        j++;
                    }
                }
                i++;
            }
        })

    }
    getMessageType(){
        if (this.mtype === MachineType.COFFEE) {
            this.type = MessageType.MACHINE_COFFEE;
        }
        else if (this.mtype === MachineType.VENDING) {
            this.type = MessageType.MACHINE_VENDING;
        }
        else if (this.mtype === MachineType.WATER) {
            this.type = MessageType.MACHINE_WATER;
        }
    }
}
