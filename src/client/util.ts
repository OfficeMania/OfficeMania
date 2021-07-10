import {Client, Room} from "colyseus.js";
import {State} from "../common";
import {Player} from "./player";
import {solidInfo} from "./map";
import {KEY_CAMERA_DEVICE_ID, KEY_CHARACTER, KEY_MIC_DEVICE_ID, KEY_USERNAME} from "../common/util";

export type InitState = [Room<State>, Player];
export type PlayerRecord = { [key: string]: Player }

export enum Direction {
    LEFT = "left",
    RIGHT = "right",
    UP = "up",
    DOWN = "down"
}

let _room: Room<State> = undefined;
let _players: PlayerRecord = undefined;
let _chatEnabled: boolean = false;

export function setRoom(room: Room<State>) {
    _room = room;
}

export function getRoom(): Room<State> {
    return _room;
}

export function setPlayers(players: PlayerRecord) {
    _players = players;
}

export function getPlayers(): PlayerRecord {
    return _players;
}

export function setChatEnabled(chatEnabled: boolean) {
    _chatEnabled = chatEnabled;
}

export function getChatEnabled(): boolean {
    return _chatEnabled;
}

/*
 * This function returns a promise that is resolve when the image is loaded
 * from the url. Note that this function currently does no error handling.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        let image = new Image();
        image.addEventListener("load", () => {
            resolve(image);
        });
        image.src = url;
    });
}

/*
 * This method joins a server room and initializes the synchronization between
 * the server state and the client state. The sync-initialization MUST happen
 * immediately after we join the server (i.e. in this function), because on each
 * update colyseus only sends differences. Thus, if we miss the initial update,
 * we work on incomplete data.
 *
 * This function is asynchronous and returns a promise: Once the server confirms
 * that we joined the room and adds our player to its state, the promise is
 * resolved.
 *
 * See: https://docs.colyseus.io/client/client/#joinorcreate-roomname-string-options-any
 */
export async function joinAndSync(client: Client, players: PlayerRecord): Promise<InitState> {
    return client.joinOrCreate<State>("turoom").then((room) => {
        return new Promise((resolve) => {
            /*
            * This method is called when the server adds new players to its state.
            * To keep synced to the server state, we save the newly added player...
            *
            * See: https://docs.colyseus.io/state/schema/#onadd-instance-key
            */
            room.state.players.onAdd = (playerData, sessionId) => {
                console.log("Add", sessionId, playerData);

                let player: Player = {
                    id: sessionId,
                    name: "",
                    participantId: null,
                    character: "Adam_48x48.png",
                    positionX: 0,
                    positionY: 0,
                    scaledX: 0,
                    scaledY: 0,
                    lastScaledX: [0, 0, 0, 0, 0],
                    lastScaledY: [0, 0, 0, 0, 0],
                    moveDirection: null,
                    moveTime: 0,
                    prioDirection: [],
                    facing: Direction.DOWN,
                    standing: 0,
                    moving: 0,
                    spriteX: 144,
                    spriteY: 0,
                    whiteboard: 0
                };
                players[sessionId] = player;

                /*
                 * If the sessionId of the added player and the room's session id
                 * are equal, the server added our player. Now, the room and our
                 * player are initizialed and we can resolve the promise.
                 */
                if (sessionId === room.sessionId) {
                    resolve([room, player]);
                }
                //onUserUpdate(players);
            };

            /*
            * ... but once a player becomes inactive (according to the server) we
            * also delete it from our record
            *
            * See: https://docs.colyseus.io/state/schema/#onremove-instance-key
            */
            room.state.players.onRemove = (_, sessionId) => {
                console.log("Remove", sessionId);
                delete players[sessionId];
                //onUserUpdate(players);
            };
            /**room.state.players.onChange = (_, sessionId) => {
                onUserUpdate(players);
            }*/

            /*
             * If the room has any other state that needs to be observed, the
             * code needs to be placed here:
             *
             * ...
             */
        });
    });
}

export function setOneTimeCookie(key: string, value: string, path: string = "/") {
    document.cookie = `${key}=${value};path=${path}`;
}

export function setCookie(key: string, value: string, expirationDays: number = 1, path: string = "/") {
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    document.cookie = `${key}=${value};expires=${date.toUTCString()};path=${path}`;
}

export function getCookie(key: string) {
    return document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]+)')?.pop() || '';
}

const xCorrection = -38;
const yCorrection = -83;

export function getCorrectedPlayerCoordinates(player: Player): [number, number] {
    return [player.scaledX - xCorrection, player.scaledY - yCorrection];
}

export function canSeeEachOther(playerOne: Player, playerTwo: Player, collisionInfo: solidInfo[][]): boolean {
    const [oneX, oneY] = getCorrectedPlayerCoordinates(playerOne);
    const [twoX, twoY] = getCorrectedPlayerCoordinates(playerTwo);
    if (oneX === twoX && oneY === twoY) {
        return true;
    }
    const diffX = Math.abs(oneX - twoX);
    const diffY = Math.abs(oneY - twoY);
    const length = Math.ceil(Math.sqrt(diffX * diffX + diffY * diffY));
    const currentX = (progress) => Math.floor(oneX + (twoX - oneX) * progress);
    const currentY = (progress) => Math.floor(oneY + (twoY - oneY) * progress);
    for (let i = 0; i <= length; i++) {
        const progress = i / length;
        const x = currentX(progress);
        const y = currentY(progress);
        if (collisionInfo[x][y]?.isSolid) {
            return false;
        }
    }
    return true;
}

export function setUsername(value: string, ourPlayer: Player, room: Room) {
    value = value?.slice(0, 20) || "Jimmy";
    ourPlayer.name = value;
    localStorage.setItem(KEY_USERNAME, value);
    room.send(KEY_USERNAME, value);
}

export function getUsername(): string {
    return localStorage.getItem(KEY_USERNAME);
}

export async function loadCharacter(ourPlayer: Player, room: Room, characters: { [key: string]: HTMLImageElement }) {
    //load or ask for name
    const username = getUsername();
    if (username && username !== "") {
        setUsername(username, ourPlayer, room);
    } else {
        setUsername(window.prompt("Gib dir einen Namen (max. 20 Chars)", "Jimmy")?.slice(0, 20) || "Jimmy", ourPlayer, room);
    }

    //loads character sprite paths from the server (from movement)
    for (let path of room.state.playerSpritePaths) {
        characters[path] = await loadImage("/img/characters/" + path);
    }


    //load character
    const character = getCharacter();
    if (character && character !== "") {
        setCharacter(character, ourPlayer, room, characters);
    }
}

export function setCharacter(value: string, ourPlayer: Player, room: Room, characters: { [key: string]: HTMLImageElement }) {
    const filenames = Object.keys(characters);
    if (filenames.indexOf(value) === -1) {
        value = filenames[0];
    }
    ourPlayer.character = value;
    localStorage.setItem(KEY_CHARACTER, value);
    room.send(KEY_CHARACTER, value);
}

export function getCharacter(): string {
    return localStorage.getItem(KEY_CHARACTER);
}

export function setMicDeviceId(value: string) {
    localStorage.setItem(KEY_MIC_DEVICE_ID, value);
}

export function getMicDeviceId(): string {
    return localStorage.getItem(KEY_MIC_DEVICE_ID);
}

export function setCameraDeviceId (value: string) {
    localStorage.setItem(KEY_CAMERA_DEVICE_ID, value);
}

export function getCameraDeviceId(): string {
    return localStorage.getItem(KEY_CAMERA_DEVICE_ID);
}

export function appendIcon(element: HTMLElement, icon: string): HTMLSpanElement {
    const span = document.createElement("span");
    span.classList.add("fa");
    span.classList.add(`fa-${icon}`);
    element.append(span);
    return span;
}

export function removeChildren(element: HTMLElement) {
    while (element.firstChild) {
        element.firstChild.remove();
    }
}

export function createPlayerAvatar(character: string): HTMLDivElement {
    const playerAvatar = document.createElement("div");
    playerAvatar.classList.add("player-avatar");
    playerAvatar.style.backgroundImage = `url(img/characters/${character})`;
    return playerAvatar;
}

export function getPlayerByParticipantId(participantId: string): Player {
    if (!participantId) {
        return null;
    }
    const players = getPlayers();
    if (!players) {
        return null;
    }
    for (const player of Object.values(players)) {
        if (player?.participantId === participantId) {
            return player;
        }
    }
    return null;
}
