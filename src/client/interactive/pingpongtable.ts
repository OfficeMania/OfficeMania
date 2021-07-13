import { MessageType } from "../../common/util";
import { checkInputMode } from "../main";
import { getOurPlayer, getRoom } from "../util";
import { Interactive } from "./interactive";

export class PingPongTable extends Interactive{

    constructor() {

        super("Pingpongtable", true, 2);
    }
    
    
    onInteraction() {
        const ourPlayer = getOurPlayer();
        getRoom().send(MessageType.INTERACTION, "pong");
        console.log("success");
        checkInputMode();
    }
}