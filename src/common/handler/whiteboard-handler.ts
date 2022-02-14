export interface WhiteboardPathSegmentMessage {
    whiteboardId: number;
    isEnd: boolean;
    points?: number[];
    colorId?: number;
    size?: number;
}
