import {v4 as uuid4} from "uuid";

export function generateUUIDv4() {
    return uuid4();
}

export const KEY_USERNAME = "username";
export const KEY_CHARACTER = "character";
export const KEY_MIC_DEVICE_ID = "micDeviceId";
export const KEY_CAMERA_DEVICE_ID = "cameraDeviceId";

export enum MoveDirection {
    LEFT = "moveLeft",
    RIGHT = "moveRight",
    UP = "moveUp",
    DOWN = "moveDown"
}

export enum Direction {
    LEFT = "left",
    RIGHT = "right",
    UP = "up",
    DOWN = "down"
}
