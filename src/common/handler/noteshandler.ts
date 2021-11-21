import { inheritInnerComments } from "@babel/types";
import { Client, Room } from "colyseus";
import { NotesState, State } from "../rooms/schema/state";
import { Direction, MessageType } from "../util";
import { Handler } from "./handler";



export class NotesHandler implements Handler{

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.NOTES_CREATE, (client, message) => {this.initNotes(client, message)})
        this.room.onMessage(MessageType.NOTES_ENTER, (client, message) => {this.enterNotes(client, message.message, message.id)})
        this.room.onMessage(MessageType.NOTES_MARKER, (client, message) => {this.modifyMarker(client, message.message, message.id)})
    }
    onJoin() {

    }
    onLeave() {

    }
    onDispose() {
        
    }

    private initNotes(client: Client, id: number) {
        if (!this.room.state.notesStates[id]) {
            let newState = new NotesState();
            newState.content = "";
            this.room.state.notesStates[id] = newState;
        }
        if (!this.room.state.notesStates[id].markers[client]) {
            this.room.state.notesStates[id].markers[client] = "0";
        }
        console.log("Notes: " + this.room.state.notesStates[id].content);
    }

    private enterNotes(client: Client, key: string, id: number) {
        if (!this.room.state.notesStates[id].markers[client.id]) {
            this.room.state.notesStates[id].markers[client.id] = 0;
        }
    }

    private modifyMarker(client: Client, direction: Direction, id: string) {

    }
    private checkNotes(client: Client, id: number) {
        
        
    }


} 