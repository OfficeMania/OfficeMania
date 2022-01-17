import { v4 as uuid4 } from "uuid";

export const KEY_USERNAME = "username";
export const KEY_CHARACTER = "character";
export const KEY_MIC_DEVICE_ID = "micDeviceId";
export const KEY_SPEAKER_DEVICE_ID = "speakerDeviceId";
export const KEY_CAMERA_DEVICE_ID = "cameraDeviceId";
export const KEY_CURRENT_VERSION = "currentVersion";

export enum Direction {
    LEFT = "left",
    RIGHT = "right",
    UP = "up",
    DOWN = "down",
}

export enum MessageType {
    // ChessHandler
    CHESS_INTERACTION = "chess-interaction",
    CHESS_INIT = "chess-init",
    CHESS_UPDATE = "chess-update",
    CHESS_MOVE = "chess-move",
    CHESS_LEAVE = "chess-leave",
    CHESS_END = "chess-end",
    // DoorHandler
    DOOR_NEW = "door-new",
    DOOR_LOCK = "door-lock",
    DOOR_UNLOCK = "door-unlock",
    // PlayerHandler
    MOVE = "move",
    SYNC = "sync",
    UPDATE_CHARACTER = "updateCharacter",
    UPDATE_USERNAME = "updateUsername",
    UPDATE_PARTICIPANT_ID = "updateParticipantId",
    // PongHandler
    PONG_MOVE = "pongMove",
    PONG_INTERACTION = "pongInteraction",
    PONG_UPDATE = "updatePong",
    // WhiteboardHandler
    WHITEBOARD_CLEAR = "whiteboardClear",
    WHITEBOARD_SAVE = "whiteboardSave",
    WHITEBOARD_PATH = "whiteboardPath",
    WHITEBOARD_DRAW = "whiteboardDraw",
    WHITEBOARD_ERASE = "whiteboardErase",
    WHITEBOARD_REDRAW = "whiteboardRedraw",
    WHITEBOARD_CREATE = "whiteboardCreate",
    //TodoListHandler
    LIST_CREATE = "listCreate",
    LIST_USE = "listUse",
    LIST_STOPUSE = "listStopUse",
    LIST_UPDATE = "listUpdate",
    //MachineHandler
    MACHINE_INTERACT = "machineInteract",
    MACHINE_COFFEE = "machineCoffee",
    MACHINE_WATER = "machineWater",
    MACHINE_VENDING = "machineVending",
    //NotesHandler
    NOTES_CREATE = "notesCreate",
    NOTES_ENTER = "notesEnter",
    NOTES_SET = "notesSet",
    NOTES_MARKER = "notesMarker",
    //ChatHandler
    CHAT_SEND = "chatSend",
    CHAT_LOG = "chatLog",
    CHAT_UPDATE = "chatUpdate",
    CHAT_ADD = "chatAdd",
}

export enum GameMode {
    SINGLE = 1,
    MULTI = 2,
}

export function generateUUIDv4() {
    return uuid4();
}

export class TaskExecutor<T> {
    private _pending: Promise<T>;

    queueTask(task: () => T): Promise<T> {
        this._pending = this.run(task);
        return this._pending;
    }

    private async run(task: () => T): Promise<T> {
        try {
            await this._pending;
        } finally {
            //Nothing
        }
        return task();
    }
}

export function literallyUndefined(value: string): boolean {
    return !value || value === "undefined";
}
