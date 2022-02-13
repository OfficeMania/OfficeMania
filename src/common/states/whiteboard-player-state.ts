import { ArraySchema, Schema, type } from "@colyseus/schema";
import { WhiteboardPlayerPathState } from "./whiteboard-player-path-state";

/*
 * state of whiteboard players (new)
 */
export class WhiteboardPlayerState extends Schema {
    @type({ array: WhiteboardPlayerPathState })
    paths: ArraySchema<WhiteboardPlayerPathState> = new ArraySchema<WhiteboardPlayerPathState>();

    @type(WhiteboardPlayerPathState)
    currentPath?: WhiteboardPlayerPathState;
}
