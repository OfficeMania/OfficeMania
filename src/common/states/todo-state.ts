import { Schema, type } from "@colyseus/schema";

export class TodoState extends Schema {
    @type("string")
    listId: string;

    @type("string")
    content: string;

    @type("string")
    isUsed: string;
}
