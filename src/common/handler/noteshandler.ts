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
        if (!this.room.state.notesState) {
            let newState = new NotesState();
            newState.content = "";
            this.room.state.notesState = newState;
        }
        if (!this.room.state.notesState.markers[client.id]) {
            this.room.state.notesState.markers[client.id] = 0;
        }
        console.log("Notes: " + this.room.state.notesState.content);
    }

    private enterNotes(client: Client, key: string, id: number) {
        if (!this.room.state.notesState.markers[client.id]) {
            this.room.state.notesState.markers[client.id] = 0;
        }
    }

    private modifyMarker(client: Client, direction: Direction, id: string) {
        if (direction === Direction.UP) {
            //TODO
        }
        if (direction === Direction.DOWN) {
            //TODO
        }
        if (direction === Direction.LEFT) {
            if (this.room.state.notesState.markers[client.id] === 0) {
                return;
            }
            this.room.state.notesState.markers[client.id]--;
        }
        if (direction === Direction.RIGHT) {
            if (this.room.state.notesState.content.length - 1 === this.room.state.notesState.markers[client.id]) {
                return;
            }
            this.room.state.notesState.markers[client.id]++;
        }
    }
    private checkNotes(client: Client, id: number) {
        
        
    }


} 