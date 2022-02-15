export interface WhiteboardPathSegmentMessage {
    whiteboardId: number;
    isEnd: boolean;
    points?: number[];
    color?: string;
    size?: number;
}
