import { Handler } from "./handler";
import { Client, Room } from "colyseus";
import { PlayerData, State } from "../rooms/schema/state";
import {
    checkDisplayName,
    Direction,
    ensureCharacter,
    ensureDisplayName,
    ensureUserId,
    literallyUndefined,
    MessageType,
} from "../util";
import User, { findUserById } from "../database/entities/user";

export interface UserData {
    id: string;
    name?: string;
    character?: string;
}

export class PlayerHandler implements Handler {
    private room: Room<State>;

    init(room: Room<State>): void {
        this.room = room;
    }

    onCreate(options: any): void {
        //receives movement from all the clients
        this.room.onMessage(MessageType.MOVE, this.onMove);
        //recives sync message
        this.room.onMessage(MessageType.SYNC, this.onSync);
        //receives character changes
        this.room.onMessage(MessageType.UPDATE_CHARACTER, this.onCharacterUpdate);
        //receives name changes
        this.room.onMessage(MessageType.UPDATE_DISPLAY_NAME, this.onDisplayNameUpdate);
        //receives participant id changes
        //TODO Maybe let the server join the jitsi conference too (without mic/cam) and then authenticate via the jitsi chat, that a player is linked to a participantId, so that one cannot impersonate another one.
        this.room.onMessage(MessageType.UPDATE_PARTICIPANT_ID, this.updateParticipantId);
    }

    onJoin(client: Client): void {
        const userData: UserData | undefined = client.userData as UserData;
        const playerData: PlayerData = new PlayerData();
        playerData.userId = ensureUserId(userData?.id);
        playerData.name = ensureDisplayName(userData?.name);
        playerData.character = ensureCharacter(userData?.character);
        playerData.x = 0;
        playerData.y = 0;
        playerData.cooldown = 0;
        playerData.participantId = null;
        this.setPlayerData(client, playerData);
    }

    onLeave(client: Client, consented: boolean): void {
        this.setPlayerData(client, null);
    }

    onDispose(): void {
        //Nothing?
    }

    private getPlayerData(client: Client): PlayerData {
        return this.room.state.players[client.sessionId];
    }

    private setPlayerData(client: Client, playerData?: PlayerData): void {
        if (playerData) {
            this.room.state.players[client.sessionId] = playerData;
        } else {
            delete this.room.state.players[client.sessionId];
        }
    }

    private onMove(client: Client, direction: Direction): void {
        const playerData: PlayerData = this.getPlayerData(client);
        switch (direction) {
            case Direction.DOWN: {
                playerData.y++;
                break;
            }
            case Direction.UP: {
                playerData.y--;
                break;
            }
            case Direction.LEFT: {
                playerData.x--;
                break;
            }
            case Direction.RIGHT: {
                playerData.x++;
                break;
            }
        }
    }

    private onSync(client: Client, coordinates: number[]): void {
        const playerData: PlayerData = this.getPlayerData(client);
        playerData.x = coordinates[0];
        playerData.y = coordinates[1];
    }

    private onCharacterUpdate(client: Client, character?: string): Promise<void> {
        character = ensureCharacter(character);
        const playerData: PlayerData = this.getPlayerData(client);
        if (literallyUndefined(playerData.userId)) {
            this.updateCharacter(client, character);
            return;
        }
        return findUserById(playerData.userId).then(user => {
            user.setCharacter(character);
            User.upsert(user).then(() => this.updateCharacter(client, character));
        });
    }

    private onDisplayNameUpdate(client: Client, displayName?: string): Promise<void> {
        const remove: boolean = !displayName;
        displayName = checkDisplayName(displayName);
        const playerData: PlayerData = this.getPlayerData(client);
        if (literallyUndefined(playerData.userId)) {
            this.updateDisplayName(client, ensureDisplayName(displayName));
            return;
        }
        return findUserById(playerData.userId).then(user => {
            user.setDisplayName(remove ? null : displayName);
            User.upsert(user).then(() => this.updateDisplayName(client, remove ? user.getUsername() : displayName));
        });
    }

    private updateParticipantId(client: Client, value: string): void {
        const playerData: PlayerData = this.getPlayerData(client);
        playerData.participantId = value;
        client.send(MessageType.UPDATE_PARTICIPANT_ID, value);
    }

    private updateDisplayName(client: Client, value: string): void {
        const playerData: PlayerData = this.getPlayerData(client);
        playerData.name = value;
        client.send(MessageType.UPDATE_DISPLAY_NAME, value);
    }

    private updateCharacter(client: Client, value: string): void {
        const playerData: PlayerData = this.getPlayerData(client);
        playerData.character = value;
        client.send(MessageType.UPDATE_CHARACTER, value);
    }
}
