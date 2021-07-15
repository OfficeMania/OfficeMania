import {v4 as uuid4} from "uuid";

export const KEY_USERNAME = "username";
export const KEY_CHARACTER = "character";
export const KEY_MIC_DEVICE_ID = "micDeviceId";
export const KEY_CAMERA_DEVICE_ID = "cameraDeviceId";

export enum Direction {
    LEFT = "left",
    RIGHT = "right",
    UP = "up",
    DOWN = "down"
}

export enum MessageType {
    MOVE = "move",
    MOVE_PONG = "moveInteraction",
    PATH = "path",
    REDRAW = "redraw",
    UPDATE_CHARACTER = "updateCharacter",
    UPDATE_USERNAME = "updateUsername",
    UPDATE_PARTICIPANT_ID = "updateParticipantId",
    CLEAR_WHITEBOARD = "clearWhiteboard",
    INTERACTION = "interaction",
    UPDATE_INTERACTION = "updateInteraction",
    DOOR = "newDoor"
}
export enum GameMode {
    SINGLE = 1,
    MULTI = 2,
}

export function generateUUIDv4() {
    return uuid4();
}
