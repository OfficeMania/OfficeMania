import { Handler } from "./handler";
import { Client, Room } from "colyseus";
import { State } from "../../common/states/state";
import { PlayerState } from "../../common/states/player-state";
import {
    checkDisplayName,
    checkUsername,
    Direction,
    ensureCharacter,
    ensureDisplayName,
    ensureUserId,
    literallyUndefined,
    MessageType,
} from "../../common/util";
import { findUserById } from "../database/entities/user";

export interface AuthData {
    userSettings?: UserSettings;
}

export interface UserSettings {
    id: string;
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
        this.room.onMessage(MessageType.MOVE, (client: Client, message: Direction) => this.onMove(client, message));
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
    }

    onJoin(client: Client): void {
        const authData: AuthData = client.userData as AuthData;
        const userSettings: UserSettings | undefined = authData.userSettings;
        const playerState: PlayerState = new PlayerState();
        playerState.userId = ensureUserId(userSettings?.id);
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

    private onMove(client: Client, direction: Direction): void {
        const playerState: PlayerState = this.getPlayerData(client);
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
        username = checkUsername(username);
        const playerState: PlayerState = this.getPlayerData(client);
        if (literallyUndefined(playerState.userId)) {
            this.updateUsername(client, username);
            return;
        }
        return findUserById(playerState.userId)
            .then(user =>
                user
                    .update({ username }, { where: { id: user.getId() } })
                    .then(() => this.updateUsername(client, username))
            )
            .catch(console.error);
    }

    private onDisplayNameUpdate(client: Client, displayName?: string): Promise<void> {
        //console.debug(`Incoming Display Name Update: ${displayName}`);
        const remove: boolean = !displayName;
        displayName = checkDisplayName(displayName);
        const playerState: PlayerState = this.getPlayerData(client);
        if (literallyUndefined(playerState.userId)) {
            this.updateDisplayName(client, ensureDisplayName(displayName));
            return;
        }
        return findUserById(playerState.userId)
            .then(user =>
                user
                    .update({ displayName }, { where: { id: user.getId() } })
                    .then(() => this.updateDisplayName(client, remove ? user.getUsername() : displayName))
            )
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
        return findUserById(playerState.userId)
            .then(user =>
                user
                    .update({ character }, { where: { id: user.getId() } })
                    .then(() => this.updateCharacter(client, character))
            )
            .catch(console.error);
    }

    private updateParticipantId(client: Client, value: string): void {
        const playerState: PlayerState = this.getPlayerData(client);
        playerState.participantId = value;
        client.send(MessageType.UPDATE_PARTICIPANT_ID, value);
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
}
