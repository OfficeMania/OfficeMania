export function createAnimationData(input: { [key: string]: any }): { [key: string]: AnimationData } {
    const animations: { [key: string]: AnimationData } = {};
    for (const animation of Object.keys(input.animations)) {
        animations[animation] = new AnimationData(input.animations[animation]); //TODO Test this
    }
    return animations;
}

export default class AnimationData {

    private readonly _steps: [number, number][];

    constructor(steps: [number, number][]) {
        this._steps = steps;
    }

    private get steps(): [number, number][] {
        return this._steps;
    }

    getStep(step: number): [number, number] {
        return this.steps[step];
    }

}
