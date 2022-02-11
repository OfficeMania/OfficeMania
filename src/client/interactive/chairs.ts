import { Room } from "colyseus/lib/Room";
import { get } from "jquery";
import { Direction, MessageType, State, STEP_SIZE } from "../../common";
import { getCorrectedPlayerCoordinates, getOurPlayer, getRoom, sendNotification, xCorrection, yCorrection } from "../util";
import { Interactive } from "./interactive";


export class Chair extends Interactive {
    //helps to know where the player schould sit
    posX: number;
    posY: number;

    isUsed: boolean;

    constructor(direction: Direction, posX: number, posY: number){
        super("Chair");
        this.posX = posX;
        this.posY = posY;
        this.chairDirection = direction;
        this.isUsed = false;
    }

    loop() {

    }

    onInteraction() {
        this.sync();
        if(!this.isUsed){
            let player = getOurPlayer();
            let x = this.posX *STEP_SIZE + xCorrection * STEP_SIZE;
            let y = this.posY *STEP_SIZE + yCorrection * STEP_SIZE;
            /*
            player.lastScaledY.pop();
            player.lastScaledY.unshift(player.scaledY);
            player.lastScaledX.pop();
            player.lastScaledY.unshift(player.scaledX);
            */
            player.positionX = x;
            player.positionY = y;
            
            getRoom().send(MessageType.SIT, [x, y]);
        } else {
            sendNotification("You can not sit on someone else's lap");
        }
    }

    sync() {
        this.isUsed = getRoom().state.chairStates[this.posX + "" + this.posY]?.isClosed;
    }
}