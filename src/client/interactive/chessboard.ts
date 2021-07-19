import {Interactive} from "./interactive";
import {Room} from "colyseus.js";
import {State} from "../../common";
import {createCloseInteractionButton, getRoom, removeCloseInteractionButton} from "../util";
import {ChessState} from "../../common/rooms/schema/state";
import {MessageType} from "../../common/util";
import {checkInputMode} from "../main";
import {ChessColor, getOppositeChessColor} from "../../common/handler/chesshandler";

const jsChessEngine = require('js-chess-engine');

const borderSize: number = 20;
const borderSizeHalf: number = borderSize / 2;
const borderSizeQuarter: number = borderSize / 4;
const borderSizeDouble: number = borderSize * 2;

function redraw(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, configuration: any, moves: string[] = null) {
    drawBorder(canvas, context);
    drawBoard(canvas, context);
    drawMoves(canvas, context, configuration.pieces, moves);
    drawPieces(canvas, context, configuration.pieces);
    drawResult(canvas, context, configuration);
}

function drawBorder(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    context.save();
    context.fillStyle = "red";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const maxLength = getMaxLength(canvas, 0);
    const squareLength = maxLength / 8;
    context.fillStyle = "black";
    for (let i = 0; i < 8; i++) {
        const pos = i * squareLength;
        // Draw Border Text
        const rowText = rows[i];
        const textMetricsRow = context.measureText(rowText);
        const rowPos = pos + squareLength / 2 + borderSize - borderSizeQuarter * i;
        context.fillText(rowText, borderSizeQuarter, rowPos);
        context.fillText(rowText, maxLength - textMetricsRow.width - borderSizeQuarter, rowPos);
        const colText = cols[i];
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
    context.fillStyle = "white";
    const maxLength = getMaxLength(canvas);
    context.fillRect(0, 0, maxLength, maxLength);
    const squareLength = maxLength / 8;
    context.fillStyle = "gray";
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

function drawMoves(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pieces: any, moves: string[]) {
    if (!moves || moves.length === 0) {
        return;
    }
    context.save();
    cropCanvas(canvas, context);
    const maxLength = getMaxLength(canvas);
    const squareLength: number = maxLength / 8;
    context.fillStyle = "blue";
    const [currentFieldX, currentFieldY] = getCoordinates(currentField);
    context.fillRect(currentFieldX * squareLength, currentFieldY * squareLength, squareLength, squareLength);
    for (const move of moves) {
        context.fillStyle = getMoveColor(pieces, move);
        const [fieldX, fieldY] = getCoordinates(move);
        context.fillRect(fieldX * squareLength, fieldY * squareLength, squareLength, squareLength);
    }
    context.restore();
}

function drawPieces(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pieces: { [key: string]: string }) {
    context.save();
    cropCanvas(canvas, context);
    const maxLength = getMaxLength(canvas);
    const squareLength = maxLength / 8;
    context.fillStyle = "black";
    for (const field in pieces) {
        const piece: string = pieces[field];
        const [x, y] = getCoordinates(field);
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
        return "green";
    }
    const isCurrentBlack: boolean = isPieceBlack(pieces[currentField]);
    const isBlack: boolean = isPieceBlack(piece);
    return isCurrentBlack === isBlack ? "yellow" : "red";
}

function getMaxLength(canvas: HTMLCanvasElement, offset: number = borderSizeDouble): number {
    return Math.min(canvas.width - offset, canvas.height - offset);
}

const cols: string[] = ["A", "B", "C", "D", "E", "F", "G", "H"];
const rows: string[] = ["8", "7", "6", "5", "4", "3", "2", "1"];

function getField(col: number, row: number): string {
    return cols[col] + rows[row];
}

function getCoordinates(field: string): [number, number] {
    if (!field || field.length !== 2) {
        return null;
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

function setCurrentMoves(field: string, moves: string[] = null) {
    currentField = field;
    currentMoves = moves;
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
            this.room.send(MessageType.CHESS_INTERACTION);
            console.debug("Requesting ChessState...");
            this.show();
            checkInputMode();
            this.initListeners();
            createCloseInteractionButton(() => this.leave());
        } else {
            console.warn("You're already in a Game!");
        }
    }

    private initListeners() {
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
        });
        this.room.onMessage(MessageType.CHESS_MOVE, message => {
            if (!ourGame || ourGameId !== message?.gameId) {
                return;
            }
            ourGame.move(message.from, message.to);
            ourGame.moves();
        });
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
            redraw(this.canvas, this.context, JSON.parse(ourChessState.configuration), currentMoves);
        }
    }

    leave() {
        removeCloseInteractionButton();
        this.hide();
        this.canvas.onmousedown = null;
        this.room.removeAllListeners();
        this.room.send(MessageType.CHESS_LEAVE);
        resetVariables();
        checkInputMode();
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
        const field: string = getField(fieldX, fieldY);
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

}
