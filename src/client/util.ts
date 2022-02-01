import { Client, Room } from "colyseus.js";
import { State } from "../common";
import { Player, STEP_SIZE } from "./player";
import { MapInfo, solidInfo } from "./map";
import {
    Direction,
    KEY_CAMERA_DEVICE_ID,
    KEY_CHARACTER,
    KEY_CURRENT_VERSION,
    KEY_DISPLAY_NAME,
    KEY_MIC_DEVICE_ID,
    KEY_SPEAKER_DEVICE_ID,
    literallyUndefined,
    MessageType,
} from "../common/util";
import { characters, checkInputMode } from "./main";
import { bsWelcomeModal, panelButtonsInteraction, usernameInputWelcome, welcomeModal } from "./static";
import { createAnimatedSpriteSheet } from "./graphic/animated-sprite-sheet";
import AnimationData, { createAnimationData } from "./graphic/animation-data";
import { PlayerState } from "../common/schema/player";
import { textchatPlayerOnChange } from "./textchat";
import { updateUsers } from "./conference/conference";

export enum InputMode {
    NORMAL = "normal",
    IGNORE = "ignore",
    INTERACTION = "interaction",
    BACKPACK = "backpack",
}

export type InitState = [Room<State>, Player];
export type PlayerRecord = { [key: string]: Player };

let _client: Client = undefined;
let _room: Room<State> = undefined;
let _collisionInfo: solidInfo[][] = undefined;
let _mapInfo: MapInfo = undefined;
let _ourPlayer: Player = undefined;
let _players: PlayerRecord = undefined;
let _chatEnabled: boolean = false;

export function setClient(client: Client) {
    _client = client;
}

export function getClient(): Client {
    return _client;
}

export function setRoom(room: Room<State>) {
    _room = room;
}

export function getRoom(): Room<State> {
    return _room;
}

export function setMapInfo(mapInfo: MapInfo) {
    _mapInfo = mapInfo;
}

export function getMapInfo(): MapInfo {
    return _mapInfo;
}

export function setCollisionInfo(collisionInfo: solidInfo[][]) {
    _collisionInfo = collisionInfo;
}

export function getCollisionInfo(): solidInfo[][] {
    return _collisionInfo;
}

export function setOurPlayer(player: Player) {
    _ourPlayer = player;
}

export function getOurPlayer(): Player {
    return _ourPlayer;
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

export function areWeLoggedIn(): boolean {
    const ourPlayer: Player = getOurPlayer();
    return !literallyUndefined(ourPlayer.userId);
}

/*
 * This function returns a promise that is resolve when the image is loaded
 * from the url. Note that this function currently does no error handling.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise(resolve => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
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
    return client.joinOrCreate<State>("turoom").then(room => {
        return new Promise(resolve => {
            /*
             * This method is called when the server adds new players to its state.
             * To keep synced to the server state, we save the newly added player...
             *
             * See: https://docs.colyseus.io/state/schema/#onadd-instance-key
             */
            room.state.players.onAdd = async (playerState: PlayerState, sessionId: string) => {
                // console.log("Add", sessionId, playerState);

                let player: Player = {
                    userId: playerState.userId,
                    roomId: sessionId,
                    username: playerState.username,
                    displayName: playerState.displayName,
                    participantId: null,
                    character: playerState.character,
                    positionX: 0,
                    positionY: 0,
                    scaledX: 0,
                    scaledY: 0,
                    lastScaledX: [0, 0, 0, 0, 0],
                    lastScaledY: [0, 0, 0, 0, 0],
                    moveDirection: null,
                    moveTime: 0,
                    priorDirections: [],
                    facing: Direction.DOWN,
                    standing: 0,
                    moving: 0,
                    animationName: undefined,
                    animationStep: 0,
                    whiteboard: 0,
                    previousDirection: Direction.DOWN,
                    changeDirection: false,
                    waitBeforeMoving: 0,
                    backpack: null,
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

                //logic for updating playerinfo for textchat
                playerOnChangeFunctions(playerState);
            };

            /*
             * ... but once a player becomes inactive (according to the server) we
             * also delete it from our record
             *
             * See: https://docs.colyseus.io/state/schema/#onremove-instance-key
             */
            room.state.players.onRemove = (playerData, sessionId) => {
                console.log("Remove", sessionId);
                delete players[sessionId];
                //trigger onchange when removing player
                playerData.triggerAll();
            };
            //room.state.players.onChange = (_, sessionId) => {}

            //any time a player changes anything this happens:
            //logic for updating playerinfo for textchat
            room.state.players.forEach((player, sessionId) => {
                playerOnChangeFunctions(player);
            })

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
    date.setTime(date.getTime() + expirationDays * 24 * 60 * 60 * 1000);
    document.cookie = `${key}=${value};expires=${date.toUTCString()};path=${path}`;
}

export function getCookie(key: string) {
    return document.cookie.match("(^|;)\\s*" + key + "\\s*=\\s*([^;]+)")?.pop() || "";
}

//const xCorrection = Math.abs(_mapInfo.lowestX - _mapInfo.highestX) - START_POSITION_X;
//const yCorrection = Math.abs(_mapInfo.lowestX - _mapInfo.highestX) - START_POSITION_X;
const xCorrection = -74;
const yCorrection = -79;

export function getCorrectedPlayerFacingCoordinates(player: Player): [number, number] {
    let deltaX = 0;
    let deltaY = 0;
    switch (player.facing) {
        case Direction.LEFT:
            deltaX -= 2;
            break;
        case Direction.RIGHT:
            deltaX += 2;
            break;
        case Direction.UP:
            deltaY -= 2;
            break;
        case Direction.DOWN:
            deltaY += 2;
            break;
    }
    return [
        Math.round(player.positionX / STEP_SIZE - xCorrection + deltaX),
        Math.round(player.positionY / STEP_SIZE - yCorrection + deltaY),
    ];
}

export function getCorrectedPlayerCoordinates(player: Player): [number, number] {
    return [
        Math.round(player.positionX / STEP_SIZE - xCorrection),
        Math.round(player.positionY / STEP_SIZE - yCorrection),
    ];
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
    const currentX = progress => Math.floor(oneX + (twoX - oneX) * progress);
    const currentY = progress => Math.floor(oneY + (twoY - oneY) * progress);
    for (let i = 0; i <= length; i++) {
        const progress = i / length;
        const x = currentX(progress);
        const y = currentY(progress);
        if (collisionInfo[x][y]?.isSolid || collisionInfo[x][y]?.content?.proofIfClosed()) {
            return false;
        }
    }
    return true;
}

// // Username

// Get/Set

export function getUsername(): string {
    return getOurPlayer().username;
}

export function setUsername(value: string): void {
    getOurPlayer().username = value;
}

// Update

export function updateUsername(value: string): void {
    getRoom().send(MessageType.UPDATE_USERNAME, value);
}

// // Display Name

// Get/Set

export function getDisplayName(): string {
    return getOurPlayer().displayName;
}

export function setDisplayName(value: string): void {
    getOurPlayer().displayName = value;
}

// Update

export function updateDisplayName(value?: string): void {
    getRoom().send(MessageType.UPDATE_DISPLAY_NAME, value);
    getRoom().send(MessageType.CHAT_UPDATE_DISPLAY_NAME, value);
}

// Local Get/Set

export function setLocalDisplayName(value?: string): void {
    localStorage.setItem(KEY_DISPLAY_NAME, value);
}

export function getLocalDisplayName(): string {
    return localStorage.getItem(KEY_DISPLAY_NAME);
}

// // Character

// Get/Set

export function getCharacter(): string {
    return getOurPlayer().character;
}

export function setCharacter(value: string): void {
    getOurPlayer().character = value;
}

// Update

export function updateCharacter(value?: string): void {
    getRoom().send(MessageType.UPDATE_CHARACTER, value);
}

// Local Get/Set

export function setLocalCharacter(value: string) {
    localStorage.setItem(KEY_CHARACTER, value);
}

export function getLocalCharacter(): string {
    return localStorage.getItem(KEY_CHARACTER);
}

export function payRespect() {
    console.log("F's in chat");
}

//sprite dimensions (from movement)
const playerWidth: number = 48;
const playerHeight: number = 2 * playerWidth;

export function loadUser(): void {
    //load or ask for name
    const username = getUsername();
    if (username && username !== "") {
        setUsername(username);
    } else {
        document.getElementById("name-form").addEventListener(
            "submit",
            function (e) {
                setUsername(usernameInputWelcome.value);
                e.preventDefault();
                bsWelcomeModal.hide();
                welcomeModal.style.display = "none";
                checkInputMode();
            },
            false
        );
    }
    if (!areWeLoggedIn()) {
        //load displayName
        const displayName: string = getLocalDisplayName();
        if (displayName && displayName !== "") {
            updateDisplayName(displayName);
        }
    }
}

export async function loadCharacter(): Promise<void> {
    //loads character animations
    const characterAnimationsJson: { [key: string]: any } = await fetch(
        "/assets/animation/character-animations.json"
    ).then(response => response.json());
    const characterAnimations: { [key: string]: AnimationData } = createAnimationData(characterAnimationsJson);

    //loads character sprite paths from the server (from movement)
    for (const path of getRoom().state.playerSpritePaths) {
        //characters[path] = await loadImage("/img/characters/" + path);
        characters[path] = await createAnimatedSpriteSheet(
            await loadImage("/img/characters/" + path),
            characterAnimations,
            playerWidth,
            playerHeight
        );
    }
    if (!areWeLoggedIn()) {
        //load character
        const character: string = getLocalCharacter();
        if (character && character !== "") {
            updateCharacter(character);
        }
    }
}

export function setMicDeviceId(value: string) {
    localStorage.setItem(KEY_MIC_DEVICE_ID, value);
}

export function getMicDeviceId(): string {
    return localStorage.getItem(KEY_MIC_DEVICE_ID);
}

export function setSpeakerDeviceId(value: string) {
    localStorage.setItem(KEY_SPEAKER_DEVICE_ID, value);
}

export function getSpeakerDeviceId(): string {
    return localStorage.getItem(KEY_SPEAKER_DEVICE_ID);
}

export function setCameraDeviceId(value: string) {
    localStorage.setItem(KEY_CAMERA_DEVICE_ID, value);
}

export function getCameraDeviceId(): string {
    return localStorage.getItem(KEY_CAMERA_DEVICE_ID);
}

export function setCurrentVersion(value: number) {
    localStorage.setItem(KEY_CURRENT_VERSION, String(value));
}

export function getCurrentVersion(): number {
    return Number(localStorage.getItem(KEY_CURRENT_VERSION));
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
        console.log("no pid");
        return null;
    }
    const players = getPlayers();
    if (!players) {
        console.log("no players");
        return null;
    }
    for (const player of Object.values(players)) {
        if (player?.participantId === participantId) {
            return player;
        }
    }
    console.log("not in players");
    return null;
}

export function getPlayerByRoomId(playerId: string): Player {
    if (!playerId) {
        console.log("no pid");
        return null;
    }
    const players = getPlayers();
    if (!players) {
        console.log("no players");
        return null;
    }
    for (const player of Object.values(players)) {
        if (player?.roomId === playerId) {
            return player;
        }
    }
    console.log("not in players");
    return null;
}

export function appendFAIcon(element: HTMLElement, faIcon: string) {
    const em: HTMLElement = document.createElement("em");
    em.classList.add("fa", "fa-" + faIcon);
    element.append(em);
}

let interactionClosed: boolean = false;

export function createCloseInteractionButton(listener: () => void) {
    const button: HTMLButtonElement = createInteractionButton(listener, "button-close-interaction");
    appendFAIcon(button, "times");
    button.addEventListener("click", () => (interactionClosed = true));
}

export function createInteractionButton(
    listener: () => void,
    id: string = null,
    preAppend: (button: HTMLButtonElement) => void = null
): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    if (id) {
        button.id = id;
    }
    button.addEventListener("click", listener);
    preAppend && preAppend(button);
    panelButtonsInteraction.append(button);
    return button;
}

export function removeCloseInteractionButton() {
    document.getElementById("button-close-interaction")?.remove();
}

export function consumeInteractionClosed() {
    const temp: boolean = interactionClosed;
    interactionClosed = false;
    return temp;
}

export function ensureCharacter(value?: string): string {
    const filenames: string[] = Object.keys(characters);
    if (filenames.indexOf(value) === -1) {
        value = filenames[0];
    }
    return value;
}



//onchange listeners to be added to the players
function playerOnChangeFunctions(playerState: PlayerState) {
    //for updating textchat stuff
    textchatPlayerOnChange(playerState);
    //for user online list
    updateUsers();
}
