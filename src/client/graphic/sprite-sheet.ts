import {TILE_SIZE} from "../player";

export async function createSpriteSheet(image: HTMLImageElement): Promise<SpriteSheet> {
    return new SpriteSheet(await createImageBitmap(image));
}

export default class SpriteSheet {

    private readonly _texture: ImageBitmap;
    private readonly _tileWidth: number;
    private readonly _tileHeight: number;

    constructor(texture: ImageBitmap, tileWidth: number = TILE_SIZE, tileHeight: number = TILE_SIZE) {
        this._texture = texture;
        this._tileWidth = tileWidth;
        this._tileHeight = tileHeight;
    }

    protected get texture(): ImageBitmap {
        return this._texture;
    }

    protected get tileWidth(): number {
        return this._tileWidth;
    }

    protected get tileHeight(): number {
        return this._tileHeight;
    }

    draw(context: CanvasRenderingContext2D, spriteCol: number, spriteRow: number, dx: number, dy: number): void {
        context.drawImage(this.texture, spriteCol * this.tileWidth, spriteRow * this.tileHeight, this.tileWidth, this.tileHeight, dx, dy, this.tileWidth, this.tileHeight);
    }

}
