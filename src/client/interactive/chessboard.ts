import {Interactive} from "./interactive";
import {Room} from "colyseus.js";
import {State} from "../../common";
import {createCloseInteractionButton, getRoom, removeCloseInteractionButton} from "../util";
import {ChessState} from "../../common/rooms/schema/state";
import {MessageType} from "../../common/util";
import {checkInputMode} from "../main";

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
}

function drawBorder(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    context.save();
    context.fillStyle = "red";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const maxLength = Math.min(canvas.width, canvas.height);
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
    const maxLength = Math.min(canvas.width, canvas.height);
    context.translate(borderSize, borderSize);
    context.beginPath();
    context.rect(0, 0, maxLength - borderSizeDouble, maxLength - borderSizeDouble);
    context.clip();
}

function drawBoard(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    context.save();
    cropCanvas(canvas, context);
    context.fillStyle = "white";
    const maxLength = Math.min(canvas.width - borderSizeDouble, canvas.height - borderSizeDouble);
    context.fillRect(0, 0, maxLength, maxLength);
    const squareLength = maxLength / 8;
    context.fillStyle = "black";
    for (let i = 0; i < 8; i++) {
        const pos = i * squareLength;
        // Draw Vertical Lines
        context.beginPath();
        context.moveTo(pos, 0);
        context.lineTo(pos, maxLength);
        context.stroke();
        // Draw Horizontal Lines
        context.beginPath();
        context.moveTo(0, pos);
        context.lineTo(maxLength, pos);
        context.stroke();
    }
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const text: string = getField(x, y);
            const textMetrics = context.measureText(text);
            const posX = (x + 0.5) * squareLength - (textMetrics.width / 2);
            const posY = (y + 0.5) * squareLength;
            // context.fillText(text, posX, posY);
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
    const maxLength: number = Math.min(canvas.width - borderSizeDouble, canvas.height - borderSizeDouble);
    const squareLength: number = maxLength / 8;
    context.fillStyle = "blue";
    const [currentFieldX, currentFieldY] = getCoordinates(currentField);
    context.fillRect(currentFieldX * squareLength, currentFieldY * squareLength, squareLength + 1, squareLength + 1);
    for (const move of moves) {
        context.fillStyle = getMoveColor(pieces, move);
        const [fieldX, fieldY] = getCoordinates(move);
        context.fillRect(fieldX * squareLength, fieldY * squareLength, squareLength + 1, squareLength + 1);
    }
    context.restore();
}

function drawPieces(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pieces: { [key: string]: string }) {
    context.save();
    cropCanvas(canvas, context);
    const maxLength = Math.min(canvas.width - borderSizeDouble, canvas.height - borderSizeDouble);
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
    const clientRect = canvas.getBoundingClientRect();
    return [event.clientX - clientRect.left - borderSize, event.clientY - clientRect.top - borderSize];
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

export class ChessBoard extends Interactive {

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
            checkInputMode();
            this.initListeners();
            createCloseInteractionButton(() => this.leave());
        } else {
            console.warn("You're already in a Game!");
        }
    }

    private initListeners() {
        this.canvas.addEventListener('mousedown', this.onClick);
        this.room.onMessage(MessageType.CHESS_INIT, gameId => {
            if (!gameId) {
                console.warn("Got CHESS_INIT message without a gameId")
                return;
            }
            ourGameId = gameId;
            ourChessState = this.room.state.chessStates[gameId];
            ourGame = new jsChessEngine.Game(ourChessState.configuration);
        });
        this.room.onMessage(MessageType.CHESS_MOVE, message => {
            if (!ourGame || ourGameId !== message?.gameId) {
                return;
            }
            ourGame.move(message.from, message.to);
        });
    }

    loop() {
        if (ourChessState) {
            redraw(this.canvas, this.context, ourChessState.configuration, currentMoves);
        }
    }

    leave() {
        removeCloseInteractionButton();
        this.hide();
        this.room.removeAllListeners();
        this.room.send(MessageType.CHESS_LEAVE);
        ourGame = null;
        ourChessState = null;
        ourGameId = null;
        checkInputMode();
    }

    private onClick(event: MouseEvent) {
        if (!ourGame) {
            return;
        }
        const [cursorX, cursorY] = getCursorPosition(this.canvas, event);
        const maxLength: number = Math.min(this.canvas.width - borderSizeDouble, this.canvas.height - borderSizeDouble);
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
