/**
 * for use of $<>("") to get the correct type of object
 */
function $<T extends HTMLElement>(a: string) {
    return <T>document.getElementById(a);
}

/**
 * Yes "[Interactive](https://en.wiktionary.org/wiki/interactive#Noun)" is a noun
 */
export class Interactive {

    private _name: string;
    private _singleton: boolean;
    private _maxPlayer: number;
    canvas: HTMLCanvasElement;
    interactiveBar = $<HTMLDivElement>("interactive-bar");
    buttonBar = $<HTMLDivElement>("panel-buttons-interaction")
    

    constructor(name: string, singleton: boolean = true, maxPlayer: number = 1) {
        this._name = name;
        this._singleton = singleton;
        this._maxPlayer = maxPlayer;
        this.canvas = $<HTMLCanvasElement>("interactive");
    }

    /**
     * gets the name of the interactive
     */
    get name(): string {
        return this._name;
    }

    /**
     * sets the name of the interactive
     */
    set name(value: string) {
        this._name = value;
    }

    /**
     * gets if an interactive can be created more than once (e.g. multiple game sessions) or
     * if an interactive only has a single entity at most (e.g. a door can only be opened or closed once at a time
     */
    get singleton(): boolean {
        return this._singleton;
    }

    /**
     * sets if an interactive can be created more than once (e.g. multiple game sessions) or
     * if an interactive only has a single entity at most (e.g. a door can only be opened or closed once at a time
     */
    set singleton(value: boolean) {
        this._singleton = value;
    }

    /**
     * gets the maximum number of players per interactive (e.g. a door can only be accessed by one player at a time,
     * but a game instance may have 3 players per game and unrestricted number of sessions)
     */
    get maxPlayer(): number {
        return this._maxPlayer;
    }

    /**
     * sets the maximum number of players per interactive (e.g. a door can only be accessed by one player at a time,
     * but a game instance may have 3 players per game and unrestricted number of sessions)
     */
    set maxPlayer(value: number) {
        this._maxPlayer = value;
    }

    onInteraction(): void {
        console.warn("Not implemented on this Interactive");
    }

}

