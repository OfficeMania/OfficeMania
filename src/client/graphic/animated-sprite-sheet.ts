import SpriteSheet from "./sprite-sheet";
import AnimationData from "./animation-data";

export async function createAnimatedSpriteSheet(
    image: HTMLImageElement,
    animations: { [key: string]: AnimationData },
    tileWidth: number = undefined,
    tileHeight: number = undefined
): Promise<AnimatedSpriteSheet> {
    return new AnimatedSpriteSheet(await createImageBitmap(image), animations, tileWidth, tileHeight);
}

export default class AnimatedSpriteSheet extends SpriteSheet {
    private readonly _animations: { [key: string]: AnimationData };

    constructor(
        texture: ImageBitmap,
        animations: { [key: string]: AnimationData },
        tileWidth: number = undefined,
        tileHeight: number = undefined
    ) {
        super(texture, tileWidth, tileHeight);
        this._animations = animations;
    }

    private get animations(): { [p: string]: AnimationData } {
        return this._animations;
    }

    private getAnimation(animation: string): AnimationData {
        return this.animations[animation];
    }

    drawAnimationStep(
        context: CanvasRenderingContext2D,
        animation: string,
        animationStep: number,
        dx: number,
        dy: number
    ): void {
        const animationData = this.getAnimation(animation);
        const [spriteCol, spriteRow]: [number, number] = animationData.getStep(animationStep);
        super.draw(context, spriteCol, spriteRow, dx, dy);
    }
}
