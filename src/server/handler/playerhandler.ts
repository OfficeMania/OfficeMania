import { Handler } from "./handler";
import { Client, Room } from "colyseus";
import {
    checkDisplayName,
    checkUsername,
    Direction,
    ensureCharacter,
    ensureDisplayName,
    ensureRole,
    ensureUserId,
    literallyUndefined,
    MessageType,
    PlayerState,
    sanitizeDisplayName,
    sanitizeUsername,
    State,
    STEP_SIZE,
} from "../../common";
import { User } from "../database/entity/user";
import { changeSitting } from "./chairHandler";

export interface AuthData {
    userSettings?: UserSettings;
    inviteCodeToken?: string;
}

export interface UserSettings {
    id: string;
    role: string;
    username: string;
    displayName?: string;
    character?: string;
}

export class PlayerHandler implements Handler {
    private room: Room<State>;

    init(room: Room<State>): void {
        this.room = room;
    }

    onCreate(options: any): void {
        //receives movement from all the clients
        this.room.onMessage(MessageType.MOVE, (client: Client, message: Direction) => this.onMove(this.room, client, message));
        //recives sync message
        this.room.onMessage(MessageType.SYNC, (client: Client, message: number[]) => this.onSync(client, message));
        //receives name changes
        this.room.onMessage(MessageType.UPDATE_USERNAME, (client: Client, message: string) =>
            this.onUsernameUpdate(client, message)
        );
        this.room.onMessage(MessageType.UPDATE_DISPLAY_NAME, (client: Client, message: string) =>
            this.onDisplayNameUpdate(client, message)
        );
        //receives character changes
        this.room.onMessage(MessageType.UPDATE_CHARACTER, (client: Client, message: string) =>
            this.onCharacterUpdate(client, message)
        );
        //receives participant id changes
        //TODO Maybe let the server join the jitsi conference too (without mic/cam) and then authenticate via the jitsi chat, that a player is linked to a participantId, so that one cannot impersonate another one.
        this.room.onMessage(MessageType.UPDATE_PARTICIPANT_ID, (client: Client, message: string) =>
            this.updateParticipantId(client, message)
        );

        this.room.onMessage(MessageType.SIT, (client: Client, message) => this.onSit(this.room, client, message))
    }

    onJoin(client: Client): void {
        const authData: AuthData = client.userData as AuthData;
        const userSettings: UserSettings | undefined = authData.userSettings;
        const playerState: PlayerState = new PlayerState();
        playerState.loggedIn = userSettings?.id !== undefined || authData?.inviteCodeToken !== undefined;
        playerState.userId = ensureUserId(userSettings?.id);
        playerState.userRole = ensureRole(userSettings?.role);
        playerState.username = ensureDisplayName(userSettings?.username);
        playerState.displayName = ensureDisplayName(userSettings?.displayName);
        playerState.character = ensureCharacter(userSettings?.character);
        playerState.x = 0;
        playerState.y = 0;
        playerState.cooldown = 0;
        playerState.participantId = null;
        this.setPlayerData(client, playerState);
    }

    onLeave(client: Client, consented: boolean): void {
        this.setPlayerData(client, null);
    }

    onDispose(): void {
        //Nothing?
    }

    private getPlayerData(client: Client): PlayerState {
        return this.room.state.players[client.sessionId];
    }

    private setPlayerData(client: Client, playerState?: PlayerState): void {
        if (playerState) {
            this.room.state.players[client.sessionId] = playerState;
        } else {
            delete this.room.state.players[client.sessionId];
        }
    }

    private onMove(room: Room<State>, client: Client, direction: Direction): void {
        const playerState: PlayerState = this.getPlayerData(client);
        if(playerState.isSitting === true) {
            playerState.isSitting = false;
            changeSitting(room, client, playerState.x + "" + playerState.y);
        }
        switch (direction) {
            case Direction.DOWN: {
                playerState.y++;
                break;
            }
            case Direction.UP: {
                playerState.y--;
                break;
            }
            case Direction.LEFT: {
                playerState.x--;
                break;
            }
            case Direction.RIGHT: {
                playerState.x++;
                break;
            }
        }
    }

    private onSync(client: Client, coordinates: number[]): void {
        const playerState: PlayerState = this.getPlayerData(client);
        playerState.x = coordinates[0];
        playerState.y = coordinates[1];
    }

    private onUsernameUpdate(client: Client, username: string): Promise<void> {
        //console.debug(`Incoming Username Update: ${username}`);
        if (!checkUsername(username)) {
            //TODO Somehow notify the Player about the wrong username?
            this.updateUsername(client, this.getPlayerData(client).username);
            return;
        }
        username = sanitizeUsername(username);
        const playerState: PlayerState = this.getPlayerData(client);
        if (literallyUndefined(playerState.userId)) {
            this.updateUsername(client, username);
            return;
        }
        return User.findOne(playerState.userId)
            .then(user => {
                user.username = username;
                return user.save().then(() => this.updateUsername(client, username));
            })
            .catch(console.error);
    }

    private onDisplayNameUpdate(client: Client, displayName?: string): Promise<void> {
        //console.debug(`Incoming Display Name Update: ${displayName}`);
        const remove: boolean = !displayName;
        if (!checkDisplayName(displayName)) {
            //TODO Somehow notify the Player about the wrong display name?
            this.updateDisplayName(client, this.getPlayerData(client).displayName);
            return;
        }
        displayName = sanitizeDisplayName(displayName);
        const playerState: PlayerState = this.getPlayerData(client);
        if (literallyUndefined(playerState.userId)) {
            if (remove) {
                return;
            }
            this.updateDisplayName(client, ensureDisplayName(displayName));
            return;
        }
        return User.findOne(playerState.userId)
            .then(user => {
                user.displayName = displayName;
                return user.save().then(() => this.updateDisplayName(client, remove ? user.username : displayName));
            })
            .catch(console.error);
    }

    private onCharacterUpdate(client: Client, character?: string): Promise<void> {
        //console.debug(`Incoming Character Update: ${character}`);
        character = ensureCharacter(character);
        const playerState: PlayerState = this.getPlayerData(client);
        if (literallyUndefined(playerState.userId)) {
            this.updateCharacter(client, character);
            return;
        }
        return User.findOne(playerState.userId)
            .then(user => {
                user.character = character;
                return user.save().then(() => this.updateCharacter(client, character));
            })
            .catch(console.error);
    }

    private updateParticipantId(client: Client, value: string): void {
        const playerState: PlayerState = this.getPlayerData(client);
        playerState.participantId = value;
        //client.send(MessageType.UPDATE_PARTICIPANT_ID, value);
    }

    private updateUsername(client: Client, value: string): void {
        const playerState: PlayerState = this.getPlayerData(client);
        playerState.displayName = value;
        client.send(MessageType.UPDATE_USERNAME, value);
    }

    private updateDisplayName(client: Client, value: string): void {
        const playerState: PlayerState = this.getPlayerData(client);
        playerState.displayName = value;
        client.send(MessageType.UPDATE_DISPLAY_NAME, value);
    }

    private updateCharacter(client: Client, value: string): void {
        const playerState: PlayerState = this.getPlayerData(client);
        playerState.character = value;
        client.send(MessageType.UPDATE_CHARACTER, value);
    }

    private onSit(room: Room<State>, client:Client, message): void {
        const playerState: PlayerState = this.getPlayerData(client);
        playerState.isSitting = true;
        //correct coordinates
        playerState.x = message.xPos;
        playerState.y = message.yPos;
        changeSitting(room, client, playerState.x + "" + playerState.y);
    }
}
