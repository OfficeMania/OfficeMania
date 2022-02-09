import { Room } from "colyseus/lib/Room";
import { get } from "jquery";
import { Direction, MessageType, State, STEP_SIZE } from "../../common";
import { getCorrectedPlayerCoordinates, getOurPlayer, getRoom, xCorrection, yCorrection } from "../util";
import { Interactive } from "./interactive";


export class Chair extends Interactive {
    //helps to know where the player schould sit
    posX: number;
    posY: number;

    constructor(direction: Direction, posX: number, posY: number){
        super("Chair");
        this.posX = posX;
        this.posY = posY;
        this.chairDirection = direction;
    }

    loop() {

    }

    onInteraction() {
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
    }
}