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
        this.room.state.notesState.content = "a";
        this.room.state.notesState.lengths.push(1);
        console.log("Notes: " + this.room.state.notesState.content + " " + this.room.state.notesState.lengths.at(0));
    }
    onJoin() {

    }
    onLeave() {

    }
    onDispose() {
        
    }

    private initNotes(client: Client, id: number) {
        if (this.room.state.notesState.markers[client.id] === null) {
            this.room.state.notesState.markers[client.id] = 0;
            console.log(this.room.state.notesState.markers[client.id])
        }
    }

    private enterNotes(client: Client, key: string, id: number) {
        if (key === "backspace" && this.room.state.notesState.markers[client.id] > 0) {
            this.room.state.notesState.content = this.room.state.notesState.content.substr(0,this.room.state.notesState.markers[client.id] - 1) + this.room.state.notesState.content.substr(this.room.state.notesState.markers[client.id]);
        }
        this.room.state.notesState.content = this.room.state.notesState.content.substr(0,this.room.state.notesState.markers[client.id]) + key + this.room.state.notesState.content.substr(this.room.state.notesState.markers[client.id]);


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