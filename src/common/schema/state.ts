import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { ConferenceState } from "./conference-state";
import { PlayerState } from "./player-state";
import { WhiteboardState } from "./whiteboard-state";

/*
 *state of pong game
 */
export class PongState extends Schema {
    @type("string")
    playerA: string;

    @type("string")
    playerB: string;

    @type("number")
    posBallX: number;
    @type("number")
    posBallY: number;

    //proportional velocities
    @type("number")
    velBallX: number;
    @type("number")
    velBallY: number;

    @type("number")
    posPlayerA: number;

    @type("number")
    posPlayerB: number;

    @type("number")
    scoreA: number;

    @type("number")
    scoreB: number;

    //0: sizeBall, 1: sizeBat
    @type({ array: "number" })
    sizes = new ArraySchema<number>();
    //maximum velocities per frame: 0: ball, 1: bat
    @type({ array: "number" })
    velocities = new ArraySchema<number>();
}

export class DoorState extends Schema {
    @type("string")
    playerId: string;

    @type("boolean")
    isClosed: boolean;
}

export class TodoState extends Schema {
    @type("string")
    listId: string;

    @type("string")
    content: string;

    @type("string")
    isUsed: string;
}

export class NotesState extends Schema {
    //content in a single line
    @type({ map: "number" })
    markersX: MapSchema<number> = new MapSchema<number>();
    @type({ map: "number" })
    markersY: MapSchema<number> = new MapSchema<number>();
    //contents of lines
    @type({ array: "string" })
    contents: ArraySchema<string> = new ArraySchema<string>();

    @type({ array: "string" })
    oldContents: ArraySchema<string> = new ArraySchema<string>();

    @type("boolean")
    change: boolean;
}

export class ChessState extends Schema {
    @type("string")
    playerWhite: string;

    @type("string")
    playerBlack: string;

    @type("string")
    configuration: string;
}

/*
 * The state of a room. Each variable that is annotated with a @type decorator
 * automatically gets synced with the clients.
 *
 * See: https://docs.colyseus.io/state/schema/
 *
 * Note: Watching for changes only happens in a shallow fashion as far as I know.
 * So if you try to nest multiple Array- / MapSchema-objects, you might find that
 * your onChange-callback might not be called (although the state technically
 * changed). The solution for this is to add an onAdd, onRemove, onChange listener
 * to every schema.
 */
export class State extends Schema {
    @type({ map: PlayerState })
    players: MapSchema<PlayerState> = new MapSchema<PlayerState>();

    @type({ array: "string" })
    playerSpritePaths = new ArraySchema<string>();

    @type({ array: "string" })
    templatePaths = new ArraySchema<string>();

    @type(ConferenceState)
    conference: ConferenceState = new ConferenceState();

    @type({ array: WhiteboardState })
    whiteboard: ArraySchema<WhiteboardState> = new ArraySchema<WhiteboardState>();

    @type({ map: PongState })
    pongStates: MapSchema<PongState> = new MapSchema<PongState>();

    @type({ map: DoorState })
    doorStates: MapSchema<DoorState> = new MapSchema<DoorState>();

    @type({ map: TodoState })
    todoState: MapSchema<TodoState> = new MapSchema<TodoState>();

    @type({ map: ChessState })
    chessStates: MapSchema<ChessState> = new MapSchema<ChessState>();

    @type(NotesState)
    notesState: NotesState = new NotesState();
}
