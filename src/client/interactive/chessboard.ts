import {Interactive} from "./interactive";
import {Room} from "colyseus.js";
import {State} from "../../common";
import {createCloseInteractionButton, getRoom, removeCloseInteractionButton} from "../util";
import {ChessState} from "../../common/rooms/schema/state";
import {MessageType} from "../../common/util";
import {checkInputMode} from "../main";
import {ChessColor, getOppositeChessColor} from "../../common/handler/chesshandler";
import {chessExportButton, chessImportButton, interactiveBarChess} from "../static";

const jsChessEngine = require('js-chess-engine');

enum ChessSquareColor {
    NORMAL_WHITE = "white",
    NORMAL_GRAY = "gray",
    POSSIBLE = "rgba(144, 238, 144, 0.75)",
    OWN = "rgba(0, 0, 255, 0.75)",
    MOVE = "rgba(0, 255, 0, 0.75)",
    KICK = "rgba(255, 0, 0, 0.75)",
    CASTLING = "rgba(255, 255, 0, 0.75)", //TODO Doesn't seem to be implemented in the chess engine to show the tower as a possible field
    CHECK = "rgba(255, 165, 0, 0.75)",
    CHECK_CANT_MOVE = "rgba(255, 69, 0, 0.75)"
}

const borderSize: number = 20;
const borderSizeHalf: number = borderSize / 2;
const borderSizeQuarter: number = borderSize / 4;
const borderSizeDouble: number = borderSize * 2;

function redraw(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, history: { [key: string]: any }[], configuration: any, moves: string[], possibleMoves: { [key: string]: string[] }, turned: boolean) {
    drawBorder(canvas, context, turned);
    drawBoard(canvas, context);
    drawMoves(canvas, context, configuration.pieces, moves, possibleMoves, turned);
    drawCheck(canvas, context, configuration, possibleMoves, turned);
    drawPieces(canvas, context, configuration.pieces, turned);
    drawHistory(canvas, context, history);
    drawResult(canvas, context, configuration);
}

function drawBorder(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, turned: boolean) {
    context.save();
    context.fillStyle = "burlywood";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const maxLength = getMaxLength(canvas, 0);
    const squareLength = maxLength / 8;
    context.fillStyle = "black";
    context.font = "15px Arial sans-serif";
    for (let i = 0; i < 8; i++) {
        const pos = i * squareLength;
        // Draw Numbers
        const rowText = rows[turned ? 7 - i : i];
        const textMetricsRow = context.measureText(rowText);
        const rowPos = pos + squareLength / 2 + borderSize - borderSizeQuarter * i;
        context.fillText(rowText, borderSizeQuarter, rowPos);
        context.fillText(rowText, maxLength - textMetricsRow.width - borderSizeQuarter, rowPos);
        // Draw Characters
        const colText = cols[turned ? 7 - i : i];
        const textMetricsCol = context.measureText(colText);
        const colPos = pos + squareLength / 2 + borderSize - borderSizeQuarter * i - textMetricsCol.width;
        context.fillText(colText, colPos, borderSize - borderSizeQuarter);
        context.fillText(colText, colPos, maxLength - borderSizeQuarter);
    }
    context.restore();
}

function cropCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const maxLength = getMaxLength(canvas);
    context.translate(borderSize, borderSize);
    context.beginPath();
    context.rect(0, 0, maxLength, maxLength);
    context.clip();
}

function drawBoard(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    context.save();
    cropCanvas(canvas, context);
    context.fillStyle = ChessSquareColor.NORMAL_WHITE;
    const maxLength = getMaxLength(canvas);
    context.fillRect(0, 0, maxLength, maxLength);
    const squareLength = maxLength / 8;
    context.fillStyle = ChessSquareColor.NORMAL_GRAY;
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            if (x % 2 === y % 2) {
                continue;
            }
            const posX = x * squareLength;
            const posY = y * squareLength;
            // Draw Gray Squares
            context.fillRect(posX, posY, squareLength, squareLength);
        }
    }
    context.restore();
}

function drawMoves(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pieces: any, moves: string[], possibleMoves: { [key: string]: string[] }, turned: boolean) {
    context.save();
    cropCanvas(canvas, context);
    const maxLength = getMaxLength(canvas);
    const squareLength: number = maxLength / 8;
    if (moves) {
        drawSquare(context, squareLength, currentField, ChessSquareColor.OWN, turned);
        for (const move of moves) {
            drawSquare(context, squareLength, move, getMoveColor(pieces, move), turned);
        }
    } else {
        if (possibleMoves) {
            for (const move of Object.keys(possibleMoves)) {
                drawSquare(context, squareLength, move, ChessSquareColor.POSSIBLE, turned);
            }
        }
    }
    context.restore();
}

function drawCheck(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, configuration: any, possibleMoves: { [key: string]: string[] }, turned: boolean) {
    if (!configuration?.check) {
        return;
    }
    context.save();
    cropCanvas(canvas, context);
    const maxLength = getMaxLength(canvas);
    const squareLength: number = maxLength / 8;
    const king: string = configuration.turn === ChessColor.WHITE ? "K" : "k";
    const field: string = Object.entries(configuration.pieces).find(entry => entry[1] === king)[0];
    if (field) {
        const color = possibleMoves && Object.keys(possibleMoves).includes(field) ? ChessSquareColor.CHECK : ChessSquareColor.CHECK_CANT_MOVE;
        drawSquare(context, squareLength, field, color, turned);
    }
    context.restore();
}

function drawSquare(context: CanvasRenderingContext2D, squareLength: number, field: string, color: string, turned: boolean) {
    context.fillStyle = color;
    const [fieldX, fieldY] = getCoordinates(field, turned);
    context.fillRect(fieldX * squareLength, fieldY * squareLength, squareLength, squareLength);
}

function drawPieces(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pieces: { [key: string]: string }, turned: boolean) {
    context.save();
    cropCanvas(canvas, context);
    const maxLength = getMaxLength(canvas);
    const squareLength = maxLength / 8;
    context.fillStyle = "black";
    context.font = "15px Arial sans-serif";
    for (const field in pieces) {
        const piece: string = pieces[field];
        const [x, y] = getCoordinates(field, turned);
        const textMetrics = context.measureText(piece);
        const textPosX: number = (x + 0.5) * squareLength - (textMetrics.width / 2);
        const textPosY: number = (y + 0.5) * squareLength;
        context.fillText(piece, textPosX, textPosY);
        const imgPosX: number = x * squareLength;
        const imgPosY: number = y * squareLength;
        context.drawImage(images[piece], imgPosX, imgPosY, squareLength, squareLength);
    }
    context.restore();
}

function drawHistory(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, history: { [key: string]: any }[]) {
    context.save();
    context.fillStyle = "black";
    context.font = "50px Menlo monospace underline";
    const posX: number = canvas.width * 3 / 4 - canvas.width / 7;
    let posY = 50;
    context.fillText("History", posX - 50, posY);
    posY += 50;
    context.font = "25px Menlo monospace";
    let lastPieceCount: number = null;
    let lastMove = null;
    const reversedHistory = JSON.parse(JSON.stringify(history)).reverse();
    for (const move of reversedHistory) {
        const pieceCount: number = Object.keys(move.configuration.pieces).length;
        const pieceLost: boolean = lastPieceCount && pieceCount < lastPieceCount;
        lastPieceCount = pieceCount;
        posY += drawHistoryMove(context, lastMove, posX, posY, pieceLost);
        lastMove = move;
    }
    drawHistoryMove(context, lastMove, posX, posY, false);
    context.restore();
}

function drawHistoryMove(context: CanvasRenderingContext2D, move: any, posX: number, posY: number, pieceLost: boolean): number {
    if (!move) {
        return 0;
    }
    const from: string = move.from;
    // const to: string = move.to + (pieceLost ? "*" : "");
    const to: string = move.to;
    const text: string = from + ":" + to;
    const textMetricsFrom = context.measureText(from);
    const textMetricsTo = context.measureText(to);
    const textMetrics = context.measureText(text);
    const textHeight: number = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
    context.fillText(text, posX - textMetrics.width + textMetricsTo.width, posY);
    return textHeight + 20;
}

function drawResult(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, configuration: any) {
    if (configuration?.isFinished) {
        const winner: ChessColor = getOppositeChessColor(configuration.turn);
        const text: string = `Winner is: ${winner}`;
        context.save();
        context.font = "150px Arial bold";
        const textMetrics = context.measureText(text);
        context.fillStyle = "rgba(255, 255, 255, 0.85)";
        context.fillRect((canvas.width - textMetrics.width) / 2, canvas.height / 2 - textMetrics.actualBoundingBoxAscent, textMetrics.width, textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent);
        context.fillStyle = "black";
        context.fillText(text, (canvas.width - textMetrics.width) / 2, canvas.height / 2);
        context.restore();
    }
}

function isPieceBlack(piece: string): boolean {
    return piece && piece === piece.toLowerCase();
}

function isPieceWhite(piece: string): boolean {
    return piece && piece === piece.toUpperCase();
}

function getMoveColor(pieces: any, move: string): string {
    const piece: string = pieces[move];
    if (!piece) {
        return ChessSquareColor.MOVE;
    }
    const isCurrentBlack: boolean = isPieceBlack(pieces[currentField]);
    const isBlack: boolean = isPieceBlack(piece);
    return isCurrentBlack === isBlack ? ChessSquareColor.CASTLING : ChessSquareColor.KICK;
}

function getMaxLength(canvas: HTMLCanvasElement, offset: number = borderSizeDouble): number {
    return Math.min(canvas.width - offset, canvas.height - offset);
}

const cols: string[] = ["A", "B", "C", "D", "E", "F", "G", "H"];
const rows: string[] = ["8", "7", "6", "5", "4", "3", "2", "1"];

function getField(col: number, row: number, turned: boolean): string {
    if (turned) {
        return cols[7 - col] + rows[7 - row];
    }
    return cols[col] + rows[row];
}

function getCoordinates(field: string, turned: boolean): [number, number] {
    if (!field || field.length !== 2) {
        return null;
    }
    if (turned) {
        return [7 - cols.indexOf(field.charAt(0)), 7 - rows.indexOf(field.charAt(1))];
    }
    return [cols.indexOf(field.charAt(0)), rows.indexOf(field.charAt(1))];
}

const imageSources: { [key: string]: string } = {
    'K': "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
    'Q': "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
    'R': "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
    'B': "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
    'N': "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
    'P': "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
    'k': "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
    'q': "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
    'r': "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
    'b': "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
    'n': "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
    'p': "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg"
}

const images: { [key: string]: HTMLImageElement } = {};

function createImg(entry: [string, string]) {
    const image: HTMLImageElement = document.createElement("img");
    image.src = entry[1];
    images[entry[0]] = image;
}

Object.entries(imageSources).forEach(createImg);

function getCursorPosition(canvas: HTMLCanvasElement, event: MouseEvent): [number, number] {
    const clientRect = canvas?.getBoundingClientRect();
    if (!clientRect) {
        return [null, null];
    }
    const scaleX: number = canvas.width / clientRect.width;
    const scaleY: number = canvas.height / clientRect.height;
    return [(event.clientX - clientRect.left - borderSize) * scaleX, (event.clientY - clientRect.top - borderSize) * scaleY];
}

let currentField: string = null;
let currentMoves: string[] = null;
let allMoves: { [key: string]: string[] } = null;
let ourHistory: { [key: string]: any }[] = null;

function setCurrentMoves(field: string, moves: string[] = null) {
    currentField = field;
    currentMoves = moves;
}

function setAllMoves(moves: { [key: string]: string[] }) {
    allMoves = moves;
}

function setOurHistory(history: { [key: string]: any }[]) {
    ourHistory = history;
}

function updateGame() {
    setAllMoves(ourGame.moves());
    setOurHistory(ourGame.getHistory());
}

let ourGame;
let ourChessState: ChessState;
let ourGameId: string;

function resetVariables() {
    ourGame = null;
    ourChessState = null;
    ourGameId = null;
    currentField = null;
    currentMoves = null;
}

export class ChessBoard extends Interactive { //TODO Use the rest of the space on the canvas for a history of moves?

    room: Room<State>;
    context: CanvasRenderingContext2D = this.canvas.getContext("2d");

    constructor() {
        super("Chess Board", false, 2);
        this.room = getRoom();
    }

    onInteraction() {
        if (!ourGame) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.room.send(MessageType.CHESS_INTERACTION);
            console.debug("Requesting ChessState...");
            this.show();
            checkInputMode();
            this.initListeners();
            this.showButtons();
        } else {
            console.warn("You're already in a Game!");
        }
    }

    private initListeners() { //TODO Implement option to offer a draw if half moves is greater than 100 (50 move rule) and implement the 75 move rule
        this.canvas.addEventListener('mousedown', (event) => this.onClick(event));
        this.room.onMessage(MessageType.CHESS_INIT, gameId => {
            if (!gameId) {
                console.warn("Got CHESS_INIT message without a gameId")
                this.leave();
                return;
            }
            ourGameId = gameId;
            ourChessState = this.room.state.chessStates[gameId];
            ourGame = new jsChessEngine.Game(JSON.parse(ourChessState.configuration));
            updateGame();
        });
        this.room.onMessage(MessageType.CHESS_UPDATE, (message) => {
            ourGame = new jsChessEngine.Game(message);
            updateGame();
        });
        this.room.onMessage(MessageType.CHESS_MOVE, message => {
            if (!ourGame || ourGameId !== message?.gameId) {
                return;
            }
            ourGame.move(message.from, message.to);
            updateGame();
        });
        chessImportButton.addEventListener("click", () => this.loadGameFromClipboard());
    }

    isFinished(): boolean {
        return ourGame?.board?.configuration?.isFinished;
    }

    getLoser(): string {
        if (!this.isFinished()) {
            return null;
        }
        return ourGame.board.configuration.turn;
    }

    getWinner(): string {
        if (!this.isFinished()) {
            return null;
        }
        return getOppositeChessColor(ourGame.board.configuration.turn);
    }

    loop() {
        if (ourChessState) {
            redraw(this.canvas, this.context, ourHistory, JSON.parse(ourChessState.configuration), currentMoves, allMoves, ourChessState.playerBlack === this.room.sessionId);
        }
    }

    leave() {
        this.hideButtons();
        this.hide();
        this.canvas.onmousedown = null;
        chessImportButton.click = null;
        this.room.removeAllListeners();
        this.room.send(MessageType.CHESS_LEAVE);
        resetVariables();
        checkInputMode();
    }

    private showButtons() {
        createCloseInteractionButton(() => this.leave());
        interactiveBarChess.style.visibility = "visible";
        chessImportButton.style.visibility = "visible";
        chessExportButton.style.visibility = "visible";
    }

    private hideButtons() {
        removeCloseInteractionButton();
        interactiveBarChess.style.visibility = "hidden";
        chessImportButton.style.visibility = "hidden";
        chessExportButton.style.visibility = "hidden";
    }

    private onClick(event: MouseEvent) { //FIXME Closing and opening a game again removes the drawing of possible moves
        if (!ourGame || ourGame.board?.configuration?.isFinished) {
            return;
        }
        const [cursorX, cursorY] = getCursorPosition(this.canvas, event);
        if (!cursorX || !cursorY) {
            console.warn("Why no cursor position from canvas?");
            return;
        }
        const maxLength = getMaxLength(this.canvas);
        const squareLength: number = maxLength / 8;
        const fieldX: number = Math.floor(cursorX / squareLength);
        const fieldY: number = Math.floor(cursorY / squareLength);
        const field: string = getField(fieldX, fieldY, ourChessState.playerBlack === this.room.sessionId);
        if (!field) {
            return;
        }
        // console.debug("field:", field);
        if (currentField && currentMoves && currentMoves.includes(field)) {
            console.debug(`move from ${currentField} to ${field}`);
            // ourGame.move(currentField, field);
            this.room.send(MessageType.CHESS_MOVE, {from: currentField, to: field});
            setCurrentMoves(null);
            // redraw(canvasChess, contextChess, ourGame.board.configuration);
            return;
        } else if (currentField === field) {
            setCurrentMoves(null);
            // redraw(canvasChess, contextChess, ourGame.board.configuration);
            return;
        }
        const moves: string[] = ourGame.moves(field);
        if (!moves || moves.length === 0) {
            console.debug("no moves available for this field");
            setCurrentMoves(null);
        } else {
            console.debug("moves:", moves);
            setCurrentMoves(field, moves);
        }
        // redraw(canvasChess, contextChess, ourGame.board.configuration, moves);
    }

    private loadGameFromClipboard() {
        navigator.clipboard.readText().then(text => {
            try {
                this.room.send(MessageType.CHESS_UPDATE, JSON.parse(text));
            } catch (error) {
                console.error(error);
            }
        });
    }

}

chessExportButton.addEventListener("click", () => saveGameToClipboard());

export function saveGameToClipboard() {
    if (ourChessState?.configuration) {
        navigator.clipboard.writeText(ourChessState.configuration).catch(console.error);
    }
}
