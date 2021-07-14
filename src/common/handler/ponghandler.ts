import {Direction, MessageType} from "../util";
import {PongState} from "../rooms/schema/state";

function onPongMove(message: string, gameState: PongState, pos: number, callback: (newPos: number) => void) {
    switch (message) {
        case Direction.UP: {
            if (pos > 0) {
                callback(pos - gameState.velocities.at(1));
            } else {
                callback(0);
            }
            break;
        }
        case Direction.DOWN: {
            if (pos + gameState.sizes.at(1) < 1000) {
                callback(pos + gameState.velocities.at(1));
            } else {
                callback(1000 - gameState.sizes.at(1));
            }
            break;
        }
    }
}

export function onPongMessage() {
    this.onMessage(MessageType.MOVE_PONG, (client, message) => {
        const gameState: PongState = this.state.pongStates[this.getPongGame(client).toString()]
        if (!gameState) {
            return;
        }
        if (gameState.playerIds.at(0) === client.sessionId) {
            onPongMove(message, gameState, gameState.posPlayerA, (newPos: number) => gameState.posPlayerA = newPos);
        } else if (gameState.playerIds.at(1) === client.sessionId) {
            onPongMove(message, gameState, gameState.posPlayerB, (newPos: number) => gameState.posPlayerB = newPos);
        }
    });
}
