import { Room } from "colyseus.js";
import { State } from "../../common";
import { MessageType } from "../../common/util";
import { createCloseInteractionButton, getOurPlayer, getRoom } from "../util";
import { Interactive } from "./interactive";

export class Notes extends Interactive {

    static inputs = [" ", "A", "a", "B", "b", "C", "c", "D", "d", "E", "e", "F", "f", "G", "g", "H", "h", "I", "i", "J", "j", "K", "k", "L", "l",
    "M", "m", "N", "n", "O", "o", "P", "p", "Q", "q", "R", "r", "S", "s", "T", "t", "U", "u", "V", "v", "W", "w", "X", "x", "Y", "y", "Z", "z",
    "Ä", "ä", "Ü", "ü", "Ö", "ö", "-", "_", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "'", "#", "+", "=", "*", "/", ".", ":", ",", ";",
    "?", "!", "%", "&", "(", ")", "<", ">", "|"];
    ctx: CanvasRenderingContext2D = this.canvas.getContext("2d");
    static notesID: number = 0;

    id: number = 0;
    content: string = "";

    markers = new Map;
    
    room: Room<State>;

    doLoop: boolean = false;

    constructor() {
        super("notes", false, 1);
        this.id = Notes.notesID;
        Notes.notesID++;
        this.markers.set(this.id, "");
        this.room = getRoom();
        this.room.send(MessageType.NOTES_CREATE, this.id);
        this.room.send(MessageType.NOTES_SET, [this.id, ""]);
    }

    onInteraction() {
        this.canvas.style.visibility = "visible";
        createCloseInteractionButton(() => this.leave());

        this.doLoop = true;
        //this.loop();

        this.room.send(MessageType.NOTES_ENTER, new Message("1", 1))
    }

    loop() {

    }
}
class Message {
    message: string;
    id: number;
    constructor(key: string, id: number) {
        this.message = key;
        this.id = id;
    }


}