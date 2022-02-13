import { ArraySchema, Schema, type } from "@colyseus/schema";

export class WhiteboardPlayerPathState extends Schema {
    @type({ array: "number" })
    points: ArraySchema<number> = new ArraySchema<number>();

    @type("string")
    color: string;

    @type("number")
    size: number;
}
