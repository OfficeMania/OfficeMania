import { MessageType } from "../../common/util";
import { checkInputMode } from "../main";
import { getOurPlayer, getRoom } from "../util";
import { Interactive } from "./interactive";
import { Pong } from "./pong";

export class PingPongTable extends Interactive{
    pong: Pong[];
    constructor() {
        super("pingpongtable", false, 2)
    }
    
    onInteraction() {
        const ourPlayer = getOurPlayer();
        getRoom().send(MessageType.INTERACTION, "pong");
        console.log("success");
        checkInputMode();
    }
}