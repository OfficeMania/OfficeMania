import {Handler} from "./handler";
import {Client, Room} from "colyseus";
import {ChessState, State} from "../rooms/schema/state";
import {generateUUIDv4, MessageType, TaskExecutor} from "../util";

const jsChessEngine = require('js-chess-engine');

enum Colors {
    BLACK = "black",
    WHITE = "white"
}

const taskExecutor: TaskExecutor<void> = new TaskExecutor<void>();
const games: { [key: string]: any } = {};

export class ChessHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.CHESS_INTERACTION, (client) => onChessInteraction(this.room, client));
        this.room.onMessage(MessageType.CHESS_MOVE, (client, message) => onChessMove(this.room, client, message));
        this.room.onMessage(MessageType.CHESS_LEAVE, (client) => leaveChessGame(this.room, client));
    }

    onJoin(client: Client) {
        //Nothing
    }

    onLeave(client: Client, consented: boolean) {
        leaveChessGame(this.room, client);
    }

    onDispose() {
        //Nothing?
    }

}

function onChessInteraction(room: Room<State>, client: Client) {
    taskExecutor.queueTask(() => joinOrCreateChessGame(room, client)).catch(console.error);
}

function onChessMove(room: Room<State>, client: Client, message) {
    const [gameId, chessState] = getChessState(room, client);
    const game = games[gameId];
    const from: string = message.from;
    const to: string = message.to;
    const colorMove: string = chessState.playerWhite === client.sessionId ? Colors.WHITE : Colors.BLACK;
    const alone: boolean = !chessState.playerWhite || !chessState.playerBlack;
    try {
        if (!alone && game.board.configuration.turn !== colorMove) {
            //Nothing, just ignore the invalid move
            return;
        }
        game.move(from, to);
        updateChessState(room, gameId, chessState);
        setTimeout(() => getChessStateClients(room, chessState).forEach(client => client.send(MessageType.CHESS_MOVE, {
            gameId,
            from,
            to
        })), 100);
    } catch (error) {
        //Nothing, just ignore the invalid move
    }
}

function leaveChessGame(room: Room<State>, client: Client) {
    const [gameId, chessState] = getChessState(room, client);
    if (!chessState) {
        return;
    }
    if (chessState.playerWhite === client.sessionId) {
        chessState.playerWhite = null;
    }
    if (chessState.playerBlack === client.sessionId) {
        chessState.playerBlack = null;
    }
    if (!chessState.playerWhite && !chessState.playerBlack) {
        room.state.chessStates.delete(gameId);
        delete games[gameId];
        games[gameId] = null;
        return;
    }
    //TODO Notify remaining Player?
}

function joinOrCreateChessGame(room: Room<State>, client: Client) {
    const [currentGameId, currentChessState] = getChessState(room, client);
    if (currentGameId || currentChessState) {
        //FIXME Already in a game?!
        return;
    }
    const [openGameId] = joinOpenChessState(room, client);
    let gameId: string = openGameId;
    if (!gameId) {
        const [newGameId] = createChessState(room, client);
        console.debug("create chess game:", newGameId);
        gameId = newGameId;
    }
    console.debug("join chess game:", gameId);
    setTimeout(() => client.send(MessageType.CHESS_INIT, gameId), 200);
}

function getChessState(room: Room<State>, client: Client): [string, ChessState] {
    for (const [key, value] of room.state.chessStates) {
        if (value.playerWhite === client.sessionId || value.playerBlack === client.sessionId) {
            return [key, value];
        }
    }
    return [null, null];
}

function joinOpenChessState(room: Room<State>, client: Client): [string, ChessState] {
    const [gameId, chessState] = getOpenChessState(room);
    if (chessState) {
        if (!chessState.playerBlack) {
            chessState.playerBlack = client.sessionId;
        } else if (!chessState.playerWhite) {
            chessState.playerWhite = client.sessionId;
        } else {
            console.warn("Tried to join a full chess state?!");
            return [null, null];
        }
    }
    return [gameId, chessState];
}

function getOpenChessState(room: Room<State>): [string, ChessState] {
    for (const [key, value] of room.state.chessStates) {
        if (!value.playerWhite || !value.playerBlack) {
            return [key, value];
        }
    }
    return [null, null];
}

function createChessState(room: Room<State>, client: Client): [string, ChessState] {
    const gameId = generateUUIDv4();
    const chessState = new ChessState();
    chessState.playerWhite = client.sessionId;
    games[gameId] = new jsChessEngine.Game();
    updateChessState(room, gameId, chessState);
    room.state.chessStates[gameId] = chessState;
    return [gameId, chessState];
}

function updateChessState(room: Room<State>, gameId: string, chessState: ChessState) {
    const game = games[gameId];
    if (!chessState || !game) {
        return;
    }
    chessState.configuration = JSON.stringify(game.board.configuration);
}

function getChessStateClients(room: Room<State>, chessState: ChessState): Client[] {
    return room.clients.filter(client => chessState.playerWhite === client.sessionId || chessState.playerBlack === client.sessionId);
}
