import { MapData } from "../newMap";

abstract class AbstractCoordinateUnit {

    constructor() {
    }

    abstract toCanvas(x: number, y: number): [number, number];

    abstract toSolidInfo(x: number, y: number): [number, number];

    abstract toNewMap(x: number, y: number): [number, number];

    abstract fromCanvas(x: number, y: number): [number, number];

    abstract fromSolidInfo(x: number, y: number): [number, number];

    abstract fromNewMap(x: number, y: number): [number, number];

}

const TILE_SIZE = 48;
const STEP_SIZE = TILE_SIZE / 2;

const xCorrection = -74;
const yCorrection = -79;

class CanvasCoordinateUnit extends AbstractCoordinateUnit {

    toCanvas(x: number, y: number): [number, number] {
        return [x, y];
    }

    toSolidInfo(x: number, y: number): [number, number] {
        return [
            Math.round(x / STEP_SIZE - xCorrection),
            Math.round(y / STEP_SIZE - yCorrection),
        ];
    }

    toNewMap(x: number, y: number): [number, number] {
        return NEW_MAP.fromCanvas(x, y);
    }

    fromCanvas(x: number, y: number): [number, number] {
        return [x, y];
    }

    fromSolidInfo(x: number, y: number): [number, number] {
        return SOLID_INFO.toCanvas(x, y);
    }

    fromNewMap(x: number, y: number): [number, number] {
        return NEW_MAP.toCanvas(x, y);
    }

}

class SolidInfoCoordinateUnit extends AbstractCoordinateUnit {

    toCanvas(x: number, y: number): [number, number] {
        return [
            (x + xCorrection) * STEP_SIZE,
            (y + yCorrection) * STEP_SIZE,
        ];
    }

    toSolidInfo(x: number, y: number): [number, number] {
        return [x, y];
    }

    toNewMap(x: number, y: number): [number, number] {
        return NEW_MAP.fromSolidInfo(x, y);
    }

    fromCanvas(x: number, y: number): [number, number] {
        return CANVAS.toSolidInfo(x, y);
    }

    fromSolidInfo(x: number, y: number): [number, number] {
        return [x, y];
    }

    fromNewMap(x: number, y: number): [number, number] {
        return NEW_MAP.toSolidInfo(x, y);
    }

}

class NewMapCoordinateUnit extends AbstractCoordinateUnit {

    private _map?: MapData;

    get map(): MapData {
        return this._map;
    }

    set map(value: MapData) {
        this._map = value;
    }

    toCanvas(x: number, y: number): [number, number] {
        return [
            (x + Math.abs(this._map._lowestPosx)) * TILE_SIZE,
            (y + Math.abs(this._map._lowestPosy)) * TILE_SIZE,
        ];
    }

    toSolidInfo(x: number, y: number): [number, number] {
        throw new Error("Not implemented yet"); //TODO
    }

    toNewMap(x: number, y: number): [number, number] {
        return [x, y];
    }

    fromCanvas(x: number, y: number): [number, number] {
        return [
            Math.round((x / TILE_SIZE) - Math.abs(this._map._lowestPosx)),
            Math.round((y / TILE_SIZE) - Math.abs(this._map._lowestPosy)),
        ];
    }

    fromSolidInfo(x: number, y: number): [number, number] {
        throw new Error("Not implemented yet"); //TODO
    }

    fromNewMap(x: number, y: number): [number, number] {
        return [x, y];
    }

}

export const SOLID_INFO: SolidInfoCoordinateUnit = new SolidInfoCoordinateUnit();
export const CANVAS: CanvasCoordinateUnit = new CanvasCoordinateUnit();
export const NEW_MAP: NewMapCoordinateUnit = new NewMapCoordinateUnit();

export const CoordinateUnit = {
    SOLID_INFO: SOLID_INFO,
    CANVAS: CANVAS,
    NEW_MAP: NEW_MAP,
};
