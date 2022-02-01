import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

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
