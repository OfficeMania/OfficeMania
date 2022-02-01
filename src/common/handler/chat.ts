import { generateUUIDv4 } from "../util";

export interface ChatMessage {
    timestamp?: string;
    name?: string;
    chatId: string;
    message: string;
}

export interface ChatDTO {
    id: string;
    name: string;
    users?: string[];
}

export class Chat {
    private readonly _id: string;
    private readonly _users: string[] = [];
    private readonly _messages: ChatMessage[] = [];
    private _name: string;

    constructor(name: string, id: string = generateUUIDv4()) {
        this._id = id;
        this._name = name;
    }

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get users(): string[] {
        return this._users;
    }

    get messages(): ChatMessage[] {
        return this._messages;
    }
}
