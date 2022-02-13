import { Room } from "colyseus/lib/Room";
import { Direction, MessageType, State, STEP_SIZE } from "../../common";
import { getCorrectedPlayerCoordinates, getOurPlayer, getRoom, sendNotification, xCorrection, yCorrection } from "../util";
import { Interactive } from "./interactive";


export class Chair extends Interactive {
    //helps to know where the player schould sit
    posX: number;
    posY: number;

    isUsed: boolean;

    id: string;

    lastSent: number = Date.now();

    constructor(direction: Direction, posX: number, posY: number){
        super("Chair");
        this.posX = posX;
        this.posY = posY;
        this.chairDirection = direction;
        this.isUsed = false;
        let serverX = this.posX + xCorrection;
        let serverY = this.posY + yCorrection;
        this.id = serverX + "" + serverY;
        getRoom().send(MessageType.CHAIR_NEW, this.id);
    }

    loop() {

    }

    onInteraction() {
        this.sync();
        if(!this.isUsed){
            let player = getOurPlayer();
            let x = this.posX *STEP_SIZE + xCorrection * STEP_SIZE;
            let y = this.posY *STEP_SIZE + yCorrection * STEP_SIZE;

            if(this.chairDirection === Direction.DOWN /*|| this.chairDirection === Direction.UP*/) {
                y += STEP_SIZE;
            }
            
            player.positionX = x;
            player.positionY = y;
            player.scaledX = this.posX + xCorrection;
            player.scaledY = this.posY + yCorrection;
            
            getRoom().send(MessageType.SIT, {xPos: player.scaledX, yPos: player.scaledY});
        } else {
            const temp: number = Date.now();
            if (temp - this.lastSent > 2000) {
                sendNotification("You can not sit on someone else's lap");
                this.lastSent = temp;
            }
        }
    }

    sync() {
        let posX = this.posX + xCorrection;
        let posY = this.posY + yCorrection;
        this.isUsed = getRoom().state.chairStates[posX + "" + posY]?.isUsed;
    }
}