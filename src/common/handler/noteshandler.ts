import { Client, Room } from "colyseus";
import { State } from "../schema/state";
import { Direction, MessageType } from "../util";
import { Handler } from "./handler";



export class NotesHandler implements Handler{

    room: Room<State>;

    oldContents: string[] = [];
    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.NOTES_CREATE, (client, message) => {this.initNotes(client)})
        this.room.onMessage(MessageType.NOTES_ENTER, (client, message) => {this.enterNotes(client, message)})
        this.room.onMessage(MessageType.NOTES_MARKER, (client, message) => {this.modifyMarkers(this.room.state.notesState.markersX.get(client.sessionId), this.room.state.notesState.markersY.get(client.sessionId), client.sessionId, message)})
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
        this.room.state.notesState.markersX.set(client.sessionId, 0);
        this.room.state.notesState.markersY.set(client.sessionId, 0);
    }

    private enterNotes(client: Client, key: string) {
        console.log("inserting: " + key);
        let markerX = this.room.state.notesState.markersX.get(client.sessionId)
        let line = this.room.state.notesState.markersY.get(client.sessionId);
        console.log("at: ", markerX, line)
        this.oldContents = [];
        this.room.state.notesState.contents.forEach(content => this.oldContents.push(content));
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
                this.modifyMarkers(markerX, line, client.sessionId, Direction.LEFT);
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "ArrowRight":
                this.modifyMarkers(markerX, line, client.sessionId, Direction.RIGHT);
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "ArrowUp":
                this.modifyMarkers(markerX, line, client.sessionId, Direction.UP);
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "ArrowDown":
                this.modifyMarkers(markerX, line, client.sessionId, Direction.DOWN);
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "Delete":
                if (markerX + 1 < this.room.state.notesState.contents.at(line).length) {
                    this.moveEverything(Direction.LEFT, markerX + 1, line);
                }
                else if (line + 1 < this.room.state.notesState.contents.length){
                    this.moveEverything(Direction.UP, 0, line + 1);
                }
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            case "End":
                this.room.state.notesState.markersX.set(client.sessionId, this.oldContents[line].length)
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;
            case "Home":
                this.room.state.notesState.markersX.set(client.sessionId, 0);
                this.room.state.notesState.change = !this.room.state.notesState.change;
                break;

            default:
                //maybe for clipboard?
                if(key.length > 1) {
                    console.log("Not implemented")
                    break;
                }
                console.log("modifying: " + markerX + line);
                let contents: string[] = []
                this.room.state.notesState.contents.forEach(content => contents.push(content));
                this.room.state.notesState.contents.forEach(content => this.room.state.notesState.contents.pop());
                if (contents[line] === "") {
                    console.log("empty", line)
                    contents[line] = key;
                }
                else {
                    contents[line] = contents[line].substring(0, markerX) + key + contents[line].substring(markerX);
                }
                contents.forEach(content => this.room.state.notesState.contents.push(content));
                //this.room.state.notesState.contents.forEach(content => console.log(`[${content}]`));
                this.moveEverything(Direction.RIGHT, markerX, line);
                this.room.state.notesState.change = !this.room.state.notesState.change;

        }

    }

    //handles moving all the markers, correcting the line lengths
    //direction: either of 4, currently never right, thats being handled manually
    //fromposx: position of marker before insertion/deletion
    private moveEverything(direction: Direction, fromPosX: number, line: number){
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
        //modify all client markers in the same originating line and/or the following lines, depending on operation
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
                    if (direction === Direction.UP) {
                        markerPos = this.oldContents[line - 1].length;
                        this.room.state.notesState.markersX.set(clientid, markerPos);
                        console.log("markerPos is now", markerPos)
                    }
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
    //moves markers
    private modifyMarkers(markerX: number, line: number, clientid: string, direction: Direction) {
        //move marker up a line if possible, adjust x position if there was any overhang
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

        //move marker down a line if possible, adjust x position if there was any overhang
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

        //move marker left or up if possible, adjust y position if necessary
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

        //move marker right or down if possible, adjust y position if necessary
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
