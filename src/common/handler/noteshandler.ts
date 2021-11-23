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
        this.room.onMessage(MessageType.NOTES_CREATE, (client, message) => {this.initNotes(client)})
        this.room.onMessage(MessageType.NOTES_ENTER, (client, message) => {this.enterNotes(client, message)})
        this.room.onMessage(MessageType.NOTES_MARKER, (client, message) => {this.modifyMarker(client, message)})
        this.room.state.notesState.content = "";
        this.room.state.notesState.lengths.push(0);
        console.log("Notes: " + this.room.state.notesState.content + " " + this.room.state.notesState.lengths.at(0));
    }
    onJoin() {

    }
    onLeave() {

    }
    onDispose() {
        
    }

    private initNotes(client: Client) {
        this.room.state.notesState.markers.set(client.id, 0);
        //console.log(this.room.state.notesState.markers.get(client.id))
    }

    private enterNotes(client: Client, key: string) {
        //console.log("inserting: " + key);
        if (key === "Backspace") {
            if (this.room.state.notesState.markers[client.id] > 0) {
                this.room.state.notesState.content = this.room.state.notesState.content.substr(0,this.room.state.notesState.markers[client.id] - 1) + this.room.state.notesState.content.substr(this.room.state.notesState.markers[client.id]);
                this.moveEverything(false, this.room.state.notesState.markers[client.id]);
            }
        }
        //TODO: Special cases for enter, left, right arrow, delete, end?, pos1?
        //TODO: check for overflowing lines
        else {
            let content = this.room.state.notesState.content;
            this.room.state.notesState.content = content.substr(0,this.room.state.notesState.markers[client.id]) + key + content.substr(this.room.state.notesState.markers[client.id]-1);
            //console.log(this.room.state.notesState.content);
            this.moveEverything(true, this.room.state.notesState.markers[client.id]);
        }
    }

    //handles moving all the markers, correcting the line lengths
    //direction: true = added a key, false: removed a key
    //frompos: position of marker before insertion/deletion 
    private moveEverything (direction: boolean, fromPos: number){
        
        let currentPos = 0;
        let counter = 0;
        //console.log(fromPos)
        this.room.state.notesState.lengths.forEach((length) => {
            if (currentPos + length >= fromPos) {
                //console.log("found in " + counter)
                if (direction) {
                    this.room.state.notesState.lengths.setAt(counter, length + 1);  
                }
                else {
                    this.room.state.notesState.lengths.setAt(counter, length - 1);
                }
                //this.room.state.notesState.lengths.forEach((i) => {console.log(i)});
                return;
            }
            //console.log("hi")
            counter++;
        });
        this.room.state.notesState.markers.forEach((marker, clientid, map) => {
            if (marker >= fromPos) {
                if (direction) {
                    this.room.state.notesState.markers.set(clientid, marker + 1);
                }
                else {
                    this.room.state.notesState.markers.set(clientid, marker - 1);
                }
            }
        });
        
        
    }
    private modifyMarker(client: Client, direction: Direction) {
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