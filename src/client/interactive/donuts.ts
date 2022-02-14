import { getOurPlayer } from "../util";
import { Interactive } from "./interactive";

export class Donuts extends Interactive {

    constructor() {
        super("Donut", true, 1);
    }

    onInteraction() {
        var min = Math.ceil(0) + 1;
        var max = Math.floor(5);
        let i = (Math.floor(Math.random() * (max - min)) + min);

        var text = this.getItemForNumber(i);

        getOurPlayer().backpack.getItem(text);

    }

    getItemForNumber(i: number): string {
        switch (i) {
            case 1: {
                return "strawberry donut"
            }
            case 2: {
                return "sprincle donut";
            }
            case 3: {
                return "chocloate donut";
            }
            case 4: {
                return "vanile donut";
            }
        }
        return null;
    }
}