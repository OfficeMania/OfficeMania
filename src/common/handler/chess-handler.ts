export enum ChessColor {
    BLACK = "black",
    WHITE = "white",
}

export function getOppositeChessColor(chessColor: ChessColor): ChessColor {
    return chessColor === ChessColor.WHITE ? ChessColor.BLACK : ChessColor.WHITE;
}
