import { ArraySchema, Schema, type } from "@colyseus/schema";

/*
 * state of whiteboard players (new)
 */
export class WhiteboardPlayerState extends Schema {
    @type({ array: "number" })
    paths: ArraySchema<number> = new ArraySchema<number>();

    @type({ array: "string" })
    color: ArraySchema<string> = new ArraySchema<string>();

    @type({ array: "number" })
    sizes: ArraySchema<number> = new ArraySchema<number>();
}
