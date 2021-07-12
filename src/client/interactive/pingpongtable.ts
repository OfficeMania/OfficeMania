import { MessageType } from "../../common/util";
import { checkInputMode } from "../main";
import { getOurPlayer, getRoom } from "../util";
import { Interactive } from "./interactive";

export class PingPongTable extends Interactive{
    
    
    onInteraction() {
        const ourPlayer = getOurPlayer();
        getRoom().send(MessageType.INTERACTION, "pong");
        console.log("success");
        checkInputMode();
    }
}