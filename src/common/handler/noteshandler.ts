import { inheritInnerComments } from "@babel/types";
import { Client, Room } from "colyseus";
import { driver } from "colyseus/lib/MatchMaker";
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
        this.room.onMessage(MessageType.NOTES_MARKER, (client, message) => {this.modifyMarker(this.room.state.notesState.markers.get(client.id), client.id, message)})
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
        let marker = this.room.state.notesState.markers.get(client.id)
        switch (key) {
            case "Backspace":
                if (this.room.state.notesState.markers[client.id] > 0) {
                    this.room.state.notesState.content = this.room.state.notesState.content.substr(0,this.room.state.notesState.markers[client.id] - 1) + this.room.state.notesState.content.substr(this.room.state.notesState.markers[client.id]);
                    this.moveEverything(Direction.LEFT, this.room.state.notesState.markers.get(client.id));
                }
                break;

            case "Enter":
                this.moveEverything(Direction.DOWN, this.room.state.notesState.markers.get(client.id));
                break;

            case "ArrowLeft":
                this.modifyMarker(marker, client.id, Direction.LEFT);
                break;

            case "ArrowRight":
                this.modifyMarker(marker, client.id, Direction.RIGHT);
                break;

            case "ArrowUp":
                this.modifyMarker(marker, client.id, Direction.UP);
                break;

            case "ArrowDown":
                this.modifyMarker(marker, client.id, Direction.DOWN);
                break;

            case "Delete":
                //TODO
                break;

            case "End":
                //TODO
                break;
            case "Pos1":
                //TODO
                break;

            default:
                if(key.length > 1) {
                    console.log("Not implemented")
                    break;
                }
                let content = this.room.state.notesState.content;
                if (content === "") {
                    this.room.state.notesState.content = key;
                }
                else {
                    this.room.state.notesState.content = content.substring(0,this.room.state.notesState.markers[client.id]) + key + content.substring(this.room.state.notesState.markers[client.id]);
                }
                console.log(this.room.state.notesState.content);
                this.moveEverything(Direction.RIGHT, this.room.state.notesState.markers.get(client.id));
                console.log(this.room.state.notesState.markers.get(client.id))

        }
        
        //TODO: Special cases for enter, left, right arrow, delete, end?, pos1?
        //TODO: check for overflowing lines
        
    }

    //handles moving all the markers, correcting the line lengths
    //direction: true = added a key, false: removed a key
    //frompos: position of marker before insertion/deletion 
    private moveEverything (direction: Direction, fromPos: number){
        
        let countingPos = 0;
        let counter = 0;
        //console.log(fromPos)
        this.room.state.notesState.lengths.forEach((length) => {
            if (countingPos + length >= fromPos) {
                //console.log("found in " + counter)
                if (direction === Direction.RIGHT) {
                    this.room.state.notesState.lengths.setAt(counter, length + 1);  
                }
                else if (direction === Direction.LEFT) {
                    this.room.state.notesState.lengths.setAt(counter, length - 1);
                }
                else if (direction === Direction.DOWN)
                //this.room.state.notesState.lengths.forEach((i) => {console.log(i)});
                return;
            }
            //console.log("hi")
            counter++;
        });
        this.room.state.notesState.markers.forEach((marker, clientid, map) => {
            if (marker >= fromPos) {
                this.modifyMarker(marker, clientid, direction);
            }
        });
        
        
    }
    private modifyMarker(marker: number, clientid: string, direction: Direction) {
        if (direction === Direction.UP) {
            //TODO
        }
        if (direction === Direction.DOWN) {
            //TODO
        }
        if (direction === Direction.LEFT) {
            if (marker === 0) {
                return;
            }
            this.room.state.notesState.markers.set(clientid, marker - 1);
        }
        if (direction === Direction.RIGHT) {
            if (this.room.state.notesState.content.length === marker) {
                return;
            }
            this.room.state.notesState.markers.set(clientid, marker + 1);
        }
    }
    private checkNotes(client: Client, id: number) {
        
        
    }


} 