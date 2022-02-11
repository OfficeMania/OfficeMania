import { MapInfo } from "../map";
import { MapData } from "../newMap";

type ResultSpace = { x: number, y: number };
type ResultChunkSpace = { chunkX: number, dataX: number, chunkY: number, dataY: number };

abstract class AbstractSpace {

    // To ... from this

    abstract toCanvas(x: number, y: number): ResultSpace;

    abstract toMapJson(x: number, y: number): ResultSpace;

    abstract toMapJsonInteractive(x: number, y: number): ResultSpace;

    abstract toNewMap(x: number, y: number): ResultSpace;

    abstract toOldMapChunk(x: number, y: number): ResultChunkSpace;

    abstract toOldMapSolidInfo(x: number, y: number): ResultSpace;

    // From ... to this

    abstract fromCanvas(x: number, y: number): ResultSpace;

    abstract fromMapJson(x: number, y: number): ResultSpace;

    abstract fromMapJsonInteractive(x: number, y: number): ResultSpace;

    abstract fromNewMap(x: number, y: number): ResultSpace;

    abstract fromOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace;

    abstract fromOldMapSolidInfo(x: number, y: number): ResultSpace;

}

abstract class AbstractChunkSpace {

    // To ... from this

    abstract toCanvas(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace;

    abstract toMapJson(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace;

    abstract toMapJsonInteractive(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace;

    abstract toNewMap(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace;

    abstract toOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultChunkSpace;

    abstract toOldMapSolidInfo(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace;

    // From ... to this

    abstract fromCanvas(x: number, y: number): ResultChunkSpace;

    abstract fromMapJson(x: number, y: number): ResultChunkSpace;

    abstract fromMapJsonInteractive(x: number, y: number): ResultChunkSpace;

    abstract fromNewMap(x: number, y: number): ResultChunkSpace;

    abstract fromOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultChunkSpace;

    abstract fromOldMapSolidInfo(x: number, y: number): ResultChunkSpace;

}

const TILE_SIZE = 48;
const STEP_SIZE = TILE_SIZE / 2;

class CanvasSpace extends AbstractSpace {

    toCanvas(x: number, y: number): ResultSpace {
        return { x, y };
    }

    toMapJson(x: number, y: number): ResultSpace {
        const newMapSpace: ResultSpace = NEW_MAP.fromCanvas(x, y);
        return NEW_MAP.toMapJson(newMapSpace.x, newMapSpace.y);
    }

    toMapJsonInteractive(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(x, y);
        return MAP_JSON.toMapJsonInteractive(mapJsonSpace.x, mapJsonSpace.y);
    }

    toNewMap(x: number, y: number): ResultSpace {
        return NEW_MAP.fromCanvas(x, y);
    }

    toOldMapChunk(x: number, y: number): ResultChunkSpace {
        return OLD_MAP_CHUNK.fromCanvas(x, y);
    }

    toOldMapSolidInfo(x: number, y: number): ResultSpace {
        return OLD_MAP_SOLID_INFO.fromCanvas(x, y);
    }

    fromCanvas(x: number, y: number): ResultSpace {
        return { x, y };
    }

    fromMapJson(x: number, y: number): ResultSpace {
        const newMapSpace: ResultSpace = NEW_MAP.fromMapJson(x, y);
        return NEW_MAP.toCanvas(newMapSpace.x, newMapSpace.y);
    }

    fromMapJsonInteractive(x: number, y: number): ResultSpace {
        return MAP_JSON_INTERACTIVE.toCanvas(x, y);
    }

    fromNewMap(x: number, y: number): ResultSpace {
        return NEW_MAP.toCanvas(x, y);
    }

    fromOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        return OLD_MAP_CHUNK.toCanvas(chunkX, dataX, chunkY, dataY);
    }

    fromOldMapSolidInfo(x: number, y: number): ResultSpace {
        return OLD_MAP_SOLID_INFO.toCanvas(x, y);
    }

}

class MapJsonSpace extends AbstractSpace {

    toCanvas(x: number, y: number): ResultSpace {
        return CANVAS.fromMapJson(x, y);
    }

    toMapJson(x: number, y: number): ResultSpace {
        return { x, y };
    }

    toMapJsonInteractive(x: number, y: number): ResultSpace {
        return { x: x * TILE_SIZE, y: y * TILE_SIZE };
    }

    toNewMap(x: number, y: number): ResultSpace {
        return NEW_MAP.fromMapJson(x, y);
    }

    toOldMapChunk(x: number, y: number): ResultChunkSpace {
        const dataX: number = mod(x, 16);
        const dataY: number = mod(y, 16);
        return { chunkX: x - dataX, dataX, chunkY: y - dataY, dataY };
    }

    toOldMapSolidInfo(x: number, y: number): ResultSpace {
        return OLD_MAP_SOLID_INFO.fromMapJson(x, y);
    }

    fromCanvas(x: number, y: number): ResultSpace {
        return CANVAS.toMapJson(x, y);
    }

    fromMapJson(x: number, y: number): ResultSpace {
        return { x, y };
    }

    fromMapJsonInteractive(x: number, y: number): ResultSpace {
        return MAP_JSON_INTERACTIVE.toMapJson(x, y);
    }

    fromNewMap(x: number, y: number): ResultSpace {
        return NEW_MAP.toMapJson(x, y);
    }

    fromOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        return OLD_MAP_CHUNK.toMapJson(chunkX, dataX, chunkY, dataY);
    }

    fromOldMapSolidInfo(x: number, y: number): ResultSpace {
        return OLD_MAP_SOLID_INFO.toMapJson(x, y);
    }

}

class MapJsonInteractiveSpace extends AbstractSpace {

    toCanvas(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(x, y);
        return MAP_JSON.toCanvas(mapJsonSpace.x, mapJsonSpace.y);
    }

    toMapJson(x: number, y: number): ResultSpace {
        // FIXME JavaScript modulo does not work like expected. 2 % 3 should be 2 and is 2, but -2 % 3 should be -1, but is -2
        if (x % STEP_SIZE !== 0) {
            x = x - (x % STEP_SIZE);
        }
        if (y % STEP_SIZE !== 0) {
            y = y - (y % STEP_SIZE);
        }
        return {
            x: Math.floor(x / TILE_SIZE),
            y: Math.floor(y / TILE_SIZE),
        };
    }

    toMapJsonInteractive(x: number, y: number): ResultSpace {
        return { x, y };
    }

    toNewMap(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(x, y);
        return MAP_JSON.toNewMap(mapJsonSpace.x, mapJsonSpace.y);
    }

    toOldMapChunk(x: number, y: number): ResultChunkSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(x, y);
        return MAP_JSON.toOldMapChunk(mapJsonSpace.x, mapJsonSpace.y);
    }

    toOldMapSolidInfo(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(x, y);
        return MAP_JSON.toOldMapSolidInfo(mapJsonSpace.x, mapJsonSpace.y);
    }

    fromCanvas(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = MAP_JSON.fromCanvas(x, y);
        return this.fromMapJson(mapJsonSpace.x, mapJsonSpace.y);
    }

    fromMapJson(x: number, y: number): ResultSpace {
        return MAP_JSON.toMapJsonInteractive(x, y);
    }

    fromMapJsonInteractive(x: number, y: number): ResultSpace {
        return { x, y };
    }

    fromNewMap(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = MAP_JSON.fromNewMap(x, y);
        return this.fromMapJson(mapJsonSpace.x, mapJsonSpace.y);
    }

    fromOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        const mapJsonSpace: ResultSpace = MAP_JSON.fromOldMapChunk(chunkX, dataX, chunkY, dataY);
        return this.fromMapJson(mapJsonSpace.x, mapJsonSpace.y);
    }

    fromOldMapSolidInfo(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = MAP_JSON.fromOldMapSolidInfo(x, y);
        return this.fromMapJson(mapJsonSpace.x, mapJsonSpace.y);
    }

}

class NewMapSpace extends AbstractSpace {

    private _map: MapData;
    private _translateX: number = -(-2 * 16); // lowestMapX = -32
    private _translateY: number = -(-3 * 16); // lowestMapY = -48

    get map(): MapData {
        return this._map;
    }

    set map(value: MapData) {
        this._map = value;
    }

    private get translateX(): number {
        return this._translateX;
    }

    private set translateX(value: number) {
        this._translateX = value;
    }

    private get translateY(): number {
        return this._translateY;
    }

    private set translateY(value: number) {
        this._translateY = value;
    }

    toCanvas(x: number, y: number): ResultSpace {
        return {
            x: (x + this.translateX) * TILE_SIZE,
            y: (y + this.translateY) * TILE_SIZE,
        };
    }

    toMapJson(x: number, y: number): ResultSpace {
        return { x, y };
    }

    toMapJsonInteractive(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(x, y);
        return MAP_JSON.toMapJsonInteractive(mapJsonSpace.x, mapJsonSpace.y);
    }

    toNewMap(x: number, y: number): ResultSpace {
        return { x, y };
    }

    toOldMapChunk(x: number, y: number): ResultChunkSpace {
        const mapJsonSpace: ResultSpace = MAP_JSON.fromNewMap(x, y);
        return MAP_JSON.toOldMapChunk(mapJsonSpace.x, mapJsonSpace.y);
    }

    toOldMapSolidInfo(x: number, y: number): ResultSpace {
        return OLD_MAP_SOLID_INFO.fromNewMap(x, y);
    }

    fromCanvas(x: number, y: number): ResultSpace {
        return {
            x: (x / TILE_SIZE) - this.translateX,
            y: (y / TILE_SIZE) - this.translateY,
        };
    }

    fromMapJson(x: number, y: number): ResultSpace {
        return { x, y };
    }

    fromMapJsonInteractive(x: number, y: number): ResultSpace {
        return MAP_JSON_INTERACTIVE.toNewMap(x, y);
    }

    fromNewMap(x: number, y: number): ResultSpace {
        return { x, y };
    }

    fromOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        const mapJsonSpace: ResultSpace = MAP_JSON.fromOldMapChunk(chunkX, dataX, chunkY, dataY);
        return MAP_JSON.toNewMap(mapJsonSpace.x, mapJsonSpace.y);
    }

    fromOldMapSolidInfo(x: number, y: number): ResultSpace {
        return OLD_MAP_SOLID_INFO.toNewMap(x, y);
    }

}

class OldMapChunkSpace extends AbstractChunkSpace {

    toCanvas(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        const mapJsonSpace: ResultSpace = MAP_JSON.fromOldMapChunk(chunkX, dataX, chunkY, dataY);
        return MAP_JSON.toCanvas(mapJsonSpace.x, mapJsonSpace.y);
    }

    toMapJson(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        return { x: chunkX + dataX, y: chunkY + dataY };
    }

    toMapJsonInteractive(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(chunkX, dataX, chunkY, dataY);
        return MAP_JSON.toMapJsonInteractive(mapJsonSpace.x, mapJsonSpace.y);
    }

    toNewMap(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        return NEW_MAP.fromOldMapChunk(chunkX, dataX, chunkY, dataY);
    }

    toOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultChunkSpace {
        return { chunkX, dataX, chunkY, dataY };
    }

    toOldMapSolidInfo(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(chunkX, dataX, chunkY, dataY);
        return MAP_JSON.toOldMapSolidInfo(mapJsonSpace.x, mapJsonSpace.y);
    }

    fromCanvas(x: number, y: number): ResultChunkSpace {
        const mapJsonSpace: ResultSpace = MAP_JSON.fromCanvas(x, y);
        return MAP_JSON.toOldMapChunk(mapJsonSpace.x, mapJsonSpace.y);
    }

    fromMapJson(x: number, y: number): ResultChunkSpace {
        return MAP_JSON.toOldMapChunk(x, y);
    }

    fromMapJsonInteractive(x: number, y: number): ResultChunkSpace {
        return MAP_JSON_INTERACTIVE.toOldMapChunk(x, y);
    }

    fromNewMap(x: number, y: number): ResultChunkSpace {
        return NEW_MAP.toOldMapChunk(x, y);
    }

    fromOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultChunkSpace {
        return { chunkX, dataX, chunkY, dataY };
    }

    fromOldMapSolidInfo(x: number, y: number): ResultChunkSpace {
        return OLD_MAP_SOLID_INFO.toOldMapChunk(x, y);
    }

}

class OldMapSolidInfoSpace extends AbstractSpace {

    private _map: MapInfo;
    private _translateX: number = -(-2 * 16); // lowestMapX = -32
    private _translateY: number = -(-3 * 16); // lowestMapY = -48

    get map(): MapInfo {
        return this._map;
    }

    set map(value: MapInfo) {
        this._map = value;
    }

    private get translateX(): number {
        return this._translateX;
    }

    private set translateX(value: number) {
        this._translateX = value;
    }

    private get translateY(): number {
        return this._translateY;
    }

    private set translateY(value: number) {
        this._translateY = value;
    }

    toCanvas(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(x, y);
        return MAP_JSON.toCanvas(mapJsonSpace.x, mapJsonSpace.y);
    }

    /**
     * Translate x 4 chunks to the left and scale it down by 2
     * <br>
     * Translate y 6 chunks to the left and scale it down by 2
     * @param x old solidInfo
     * @param y old solidInfo
     */
    toMapJson(x: number, y: number): ResultSpace {
        return {
            x: (x / 2) - this.translateX,
            y: (y / 2) - this.translateX,
        };
    }

    toMapJsonInteractive(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(x, y);
        return MAP_JSON.toMapJsonInteractive(mapJsonSpace.x, mapJsonSpace.y);
    }

    /**
     * Translate x 4 chunks to the left and scale it down by 2
     * <br>
     * Translate y 6 chunks to the left and scale it down by 2
     * @param x old solidInfo
     * @param y old solidInfo
     */
    toNewMap(x: number, y: number): ResultSpace {
        return {
            x: (x - (2 * this.translateX)) / 2,
            y: (y - (2 * this.translateY)) / 2,
        };
    }

    toOldMapChunk(x: number, y: number): ResultChunkSpace {
        const mapJsonSpace: ResultSpace = this.toMapJson(x, y);
        return MAP_JSON.toOldMapChunk(mapJsonSpace.x, mapJsonSpace.y);
    }

    toOldMapSolidInfo(x: number, y: number): ResultSpace {
        return { x, y };
    }

    fromCanvas(x: number, y: number): ResultSpace {
        const mapJsonSpace: ResultSpace = MAP_JSON.fromCanvas(x, y);
        return this.fromMapJson(mapJsonSpace.x, mapJsonSpace.y);
    }

    /**
     * Scale x up by 2 and translate it 4 chunks to the right
     * <br>
     * Scale y up by 2 and translate it 6 chunks to the right
     * @param x old solidInfo
     * @param y old solidInfo
     */
    fromMapJson(x: number, y: number): ResultSpace {
        return {
            x: (x + this.translateX) * 2,
            y: (y + this.translateY) * 2,
        };
    }

    fromMapJsonInteractive(x: number, y: number): ResultSpace {
        return MAP_JSON_INTERACTIVE.toOldMapSolidInfo(x, y);
    }

    /**
     * Scale x up by 2 and translate it 4 chunks to the right
     * <br>
     * Scale y up by 2 and translate it 6 chunks to the right
     * @param x old solidInfo
     * @param y old solidInfo
     */
    fromNewMap(x: number, y: number): ResultSpace {
        return {
            x: (x * 2) + (2 * this.translateX),
            y: (y * 2) + (2 * this.translateY),
        };
    }

    fromOldMapChunk(chunkX: number, dataX: number, chunkY: number, dataY: number): ResultSpace {
        return OLD_MAP_CHUNK.toOldMapSolidInfo(chunkX, dataX, chunkY, dataY);
    }

    fromOldMapSolidInfo(x: number, y: number): ResultSpace {
        return { x, y };
    }

}

export const CANVAS: CanvasSpace = new CanvasSpace();
export const MAP_JSON: MapJsonSpace = new MapJsonSpace();
export const MAP_JSON_INTERACTIVE: MapJsonInteractiveSpace = new MapJsonInteractiveSpace();
export const NEW_MAP: NewMapSpace = new NewMapSpace();
export const OLD_MAP_CHUNK: OldMapChunkSpace = new OldMapChunkSpace();
export const OLD_MAP_SOLID_INFO: OldMapSolidInfoSpace = new OldMapSolidInfoSpace();

export const Space = {
    MAP_JSON: MAP_JSON,
    MAP_JSON_INTERACTIVE: MAP_JSON_INTERACTIVE,
    OLD_MAP_CHUNK: OLD_MAP_CHUNK,
    OLD_MAP_SOLID_INFO: OLD_MAP_SOLID_INFO,
    CANVAS: CANVAS,
    NEW_MAP: NEW_MAP,
};

function mod(m: number, n: number) {
    return ((m % n) + n) % n;
}
