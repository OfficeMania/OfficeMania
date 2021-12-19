import { Client, Room } from "colyseus";
import { textChangeRangeIsUnchanged } from "typescript";
import { State } from "../rooms/schema/state";
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
        this.room.onMessage(MessageType.NOTES_MARKER, (client, message) => {this.modifyMarkers(this.room.state.notesState.markersX.get(client.id), this.room.state.notesState.markersY.get(client.id), client.id, message)})
        this.room.state.notesState.contents.push("");
        this.room.state.notesState.contents.forEach(content => console.log("Notes: " + content + " "));
    }
    onJoin() {

    }
    onLeave() {

    }
    onDispose() {
        
    }

    private initNotes(client: Client) {
        this.room.state.notesState.markersX.set(client.id, 0);
        this.room.state.notesState.markersY.set(client.id, 0);
        //console.log(this.room.state.notesState.markers.get(client.id))
    }

    private enterNotes(client: Client, key: string) {
        console.log("inserting: " + key);
        let markerX = this.room.state.notesState.markersX.get(client.id)
        let line = this.room.state.notesState.markersY.get(client.id);
        console.log("at: ", markerX, line)
        switch (key) {
            case "Backspace":
                if (markerX > 0) {
                    this.moveEverything(Direction.LEFT, markerX, line);
                }
                else if (line > 0){
                    this.moveEverything(Direction.UP, markerX, line);
                }
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "Enter":
                this.moveEverything(Direction.DOWN, markerX, line);
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "ArrowLeft":
                this.modifyMarkers(markerX, line, client.id, Direction.LEFT);
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "ArrowRight":
                this.modifyMarkers(markerX, line, client.id, Direction.RIGHT);
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "ArrowUp":
                this.modifyMarkers(markerX, line, client.id, Direction.UP);
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "ArrowDown":
                this.modifyMarkers(markerX, line, client.id, Direction.DOWN);
                this.room.state.notesState.change = !this.room.state.notesState.change;
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
                console.log("modifying: " + markerX + line);
                let contents: string[] = []
                this.room.state.notesState.contents.forEach(content => contents.push(content));
                this.room.state.notesState.contents.forEach(content => this.room.state.notesState.contents.pop());
                //console.log(this.room.state.notesState.contents)
                if (contents[line] === "") {
                    console.log("empty", line)
                    contents[line] = key;
                }
                else {
                    contents[line] = contents[line].substring(0, markerX) + key + contents[line].substring(markerX);
                }
                contents.forEach(content => this.room.state.notesState.contents.push(content));
                this.room.state.notesState.contents.forEach(content => console.log(`[${content}]`));
                this.moveEverything(Direction.RIGHT, markerX, line);
                console.log(this.room.state.notesState.markersX.get(client.id) + " - " + this.room.state.notesState.markersY.get(client.id));
                this.room.state.notesState.change = !this.room.state.notesState.change;

        }
        this.room.state.notesState.contents.forEach(content => console.log(content));
        
        //TODO: Special cases for enter, left, right arrow, delete, end?, pos1?
        //TODO: check for overflowing lines --> client
        
    }

    //handles moving all the markers, correcting the line lengths
    //direction: true = added a key, false: removed a key
    //frompos: position of marker before insertion/deletion 
    private moveEverything(direction: Direction, fromPosX: number, line: number){
        //console.log(fromPos)
        let old: string[] = [];
        let counter = 0;

        switch (direction) {
            case Direction.UP:
                this.room.state.notesState.contents.forEach(content => old.push(content));
                this.room.state.notesState.contents.forEach(content => this.room.state.notesState.contents.pop());
                console.log(old);
                old.forEach(content => {
                    if (counter === line) {
                        this.room.state.notesState.contents.pop();
                        this.room.state.notesState.contents.push(old[line - 1] + content)
                    }
                    else {
                        this.room.state.notesState.contents.push(content);
                    }
                    counter++;
                });
                break;
            case Direction.DOWN:
                this.room.state.notesState.contents.forEach(content => old.push(content));
                this.room.state.notesState.contents.forEach(content => this.room.state.notesState.contents.pop());
                old.forEach(content => {
                    if (line === counter) {
                        this.room.state.notesState.contents.push("" + content.substring(0, fromPosX));
                        this.room.state.notesState.contents.push("" + content.substring(fromPosX));
                    }
                    else {
                        this.room.state.notesState.contents.push(content);
                    }
                    counter++;
                });
                this.room.state.notesState.contents.forEach(content => console.log(`[${content}]`));
                break;
            case Direction.LEFT:
                let temp: string[] = [];
                this.room.state.notesState.contents.forEach(content => temp.push(content));
                this.room.state.notesState.contents.forEach(content => this.room.state.notesState.contents.pop());
                temp[line] = "" + temp[line].substring(0, fromPosX - 1) + temp[line].substring(fromPosX);
                temp.forEach(content => this.room.state.notesState.contents.push(content));
                break;
            case Direction.RIGHT:
            default:
                //something else not possible on a keyboard
        }
        //modify all client markers in the same originating line 
        this.room.state.notesState.markersX.forEach((markerPos, clientid, map) => {
            switch (direction) {
                case Direction.LEFT:
                case Direction.RIGHT:
                    if (this.room.state.notesState.markersY.get(clientid) === line && markerPos >= fromPosX) {
                        this.modifyMarkers(markerPos, line, clientid, direction);
                    }
                    break;
                case Direction.DOWN:
                    this.room.state.notesState.markersX.set(clientid, 0);
                case Direction.UP:
                    if(this.room.state.notesState.markersY.get(clientid) === line && markerPos >= fromPosX) {
                        this.modifyMarkers(markerPos, line, clientid, direction);
                    }
                    else if(this.room.state.notesState.markersY.get(clientid) >= line) {
                        this.modifyMarkers(markerPos, line, clientid, direction);
                    }
                    break;
                default:
                    //cant happen

            }
            
        }); 
        
    }

    private modifyMarkers(markerX: number, line: number, clientid: string, direction: Direction) {
        if (direction === Direction.UP) {
            if(line === 0) {
                return;
            }
            else {
                this.room.state.notesState.markersY.set(clientid, line - 1);
                if (this.room.state.notesState.contents.at(line - 1).length < markerX){
                    this.room.state.notesState.markersX.set(clientid, this.room.state.notesState.contents.at(line - 1).length)
                }
            }
        }
        else if (direction === Direction.DOWN) {
            if(line === this.room.state.notesState.contents.length - 1) {
                return;
            }
            else {
                this.room.state.notesState.markersY.set(clientid, line + 1);
                if (this.room.state.notesState.contents.at(line + 1).length < markerX){
                    this.room.state.notesState.markersX.set(clientid, this.room.state.notesState.contents.at(line + 1).length)
                }
            }
        }
        else if (direction === Direction.LEFT) {
            if (markerX === 0) {
                if (line === 0) {
                    return;
                }
                else {
                    this.room.state.notesState.markersX.set(clientid, this.room.state.notesState.contents.at(line - 1).length);
                    this.room.state.notesState.markersY.set(clientid, line - 1);
                    return;
                }
            }
            this.room.state.notesState.markersX.set(clientid, markerX - 1);
            
        }
        else if (direction === Direction.RIGHT) {
            let rand: string = this.room.state.notesState.contents.at(line);
            console.log(rand, line);
            if (rand.length === markerX) {
                if (line === this.room.state.notesState.contents.length - 1) {
                    return;
                }
                else {
                    this.room.state.notesState.markersX.set(clientid, 0);
                    this.room.state.notesState.markersY.set(clientid, line + 1);
                    return;
                }
            }
            this.room.state.notesState.markersX.set(clientid, markerX + 1);
        }
        
    }
    private checkNotes(client: Client, id: number) {
        
        
    }


} 