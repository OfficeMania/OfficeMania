import { v4 as uuid4 } from "uuid";
import * as stringSanitizer from "string-sanitizer";

export const KEY_DISPLAY_NAME = "displayName";
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
    DOOR_KNOCK = "door-knock",
    DOOR_NOTIFICATION = "door-notification",
    DOOR_KNOCK_SUCCESS = "door-knock-success",
    // PlayerHandler
    MOVE = "move",
    SYNC = "sync",
    UPDATE_CHARACTER = "updateCharacter",
    UPDATE_USERNAME = "updateUsername",
    UPDATE_DISPLAY_NAME = "updateDisplayName",
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
    CHAT_LEAVE = "chatLeave",
    CHAT_UPDATE_DISPLAY_NAME = "chatUpdateDisplayName",
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

export function checkUsername(value: string): boolean {
    if (value.length < 2 || value.length > 20) {
        return false;
    }
    const lowerCase: string = value.toLowerCase();
    return lowerCase === sanitizeUsername(lowerCase);
}

export function sanitizeUsername(value: string): string {
    return stringSanitizer.sanitize(value).slice(0, 20);
}

export function checkDisplayName(value?: string): boolean {
    if (!value || value.length < 2 || value.length > 20) {
        return false;
    }
    const lowerCase: string = value.toLowerCase();
    return lowerCase === sanitizeDisplayName(lowerCase);
}

export function sanitizeDisplayName(value?: string): string | undefined {
    if (!value) {
        return;
    }
    return stringSanitizer.sanitize.keepUnicode(value).slice(0, 20);
}

export function ensureUserId(value?: string): string {
    return value || "undefined";
}

export function ensureRole(value?: string): number {
    return value ? parseInt(value, 10) : 0;
}

export function ensureDisplayName(value?: string): string {
    return value || "Jimmy";
}

export function ensureCharacter(value?: string): string {
    return value || "Adam_48x48.png"; //TODO This needs to be done from the server, because characters could change
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitFor<T>(supplier: () => T | undefined, ms = 100): Promise<T> {
    while (supplier() === undefined) {
        await sleep(ms);
    }
    return supplier();
}

export function convertOrNull<T>(input: any, converter?: (input: any) => T): T | null {
    if (input === undefined || input === null) {
        return null;
    }
    return converter(input);
}

export interface LoginInfo {
    isSignupDisabled?: boolean,
    isLoginViaCredentialsAllowed?: boolean
    isLoginViaInviteCodeAllowed?: boolean
}

export interface SignupInfo {
    isInviteCodeRequiredForSignup?: boolean,
}
