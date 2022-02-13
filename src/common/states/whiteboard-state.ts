import { MapSchema, Schema, type } from "@colyseus/schema";
import { WhiteboardPlayerState } from "./whiteboard-player-state";

/*
 * state of whiteboard
 */
export class WhiteboardState extends Schema {
    @type({ map: WhiteboardPlayerState })
    whiteboardPlayers: MapSchema<WhiteboardPlayerState> = new MapSchema<WhiteboardPlayerState>();
}
