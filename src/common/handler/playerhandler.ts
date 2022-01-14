import { Handler } from "./handler";
import { Client, Room } from "colyseus";
import { PlayerData, State } from "../rooms/schema/state";
import { Direction, MessageType } from "../util";
import User, { findUserById } from "../database/entities/user";

export interface UserData {
    id: string;
    name?: string;
    character?: string;
}

export class PlayerHandler implements Handler {
    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        //receives movement from all the clients
        this.room.onMessage(MessageType.MOVE, (client, message) => onMove(this.room, client, message));
        //recives sync message
        this.room.onMessage(MessageType.SYNC, (client, message) => onSync(this.room, client, message));
        //receives character changes
        this.room.onMessage(MessageType.UPDATE_CHARACTER, (client, message) => {
            const character: string = message;
            const playerData: PlayerData = this.room.state.players[client.sessionId];
            if (!playerData.userId || playerData.userId === "undefined") {
                playerData.character = character;
                return;
            }
            findUserById(playerData.userId)
                .then(user => {
                    user.setCharacter(character);
                    User.upsert(user).then(() => (playerData.character = character));
                })
                .catch(console.error);
        });
        //receives name changes
        this.room.onMessage(MessageType.UPDATE_USERNAME, (client, message) => {
            const name: string = message;
            const playerData: PlayerData = this.room.state.players[client.sessionId];
            if (!playerData.userId || playerData.userId === "undefined") {
                playerData.name = name;
                return;
            }
            findUserById(playerData.userId)
                .then(user => {
                    user.setUsername(name);
                    User.upsert(user).then(() => (playerData.name = name));
                })
                .catch(console.error);
        });
        //receives participant id changes
        //TODO Maybe let the server join the jitsi conference too (without mic/cam) and then authenticate via the jitsi chat, that a player is linked to a participantId, so that one cannot impersonate another one.
        this.room.onMessage(
            MessageType.UPDATE_PARTICIPANT_ID,
            (client, message) => (this.room.state.players[client.sessionId].participantId = message)
        );
    }

    onJoin(client: Client) {
        const userData: UserData | undefined = client.userData as UserData;
        this.room.state.players[client.sessionId] = new PlayerData();
        this.room.state.players[client.sessionId].userId = userData?.id;
        this.room.state.players[client.sessionId].name = userData?.name || "";
        this.room.state.players[client.sessionId].character = userData?.character || "Adam_48x48.png";
        this.room.state.players[client.sessionId].x = 0;
        this.room.state.players[client.sessionId].y = 0;
        this.room.state.players[client.sessionId].cooldown = 0;
        this.room.state.players[client.sessionId].participantId = null;
    }

    onLeave(client: Client, consented: boolean) {
        delete this.room.state.players[client.sessionId];
    }

    onDispose() {
        //Nothing?
    }
}

function onMove(room: Room<State>, client: Client, message: Direction) {
    switch (message) {
        case Direction.DOWN: {
            room.state.players[client.sessionId].y++;
            break;
        }
        case Direction.UP: {
            room.state.players[client.sessionId].y--;
            break;
        }
        case Direction.LEFT: {
            room.state.players[client.sessionId].x--;
            break;
        }
        case Direction.RIGHT: {
            room.state.players[client.sessionId].x++;
            break;
        }
    }
}

function onSync(room: Room<State>, client: Client, message: number[]) {
    room.state.players[client.sessionId].x = message[0];
    room.state.players[client.sessionId].y = message[1];
}
