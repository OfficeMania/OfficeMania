import { Player, PLAYER_MOVEMENT_PER_TICK, updatePosition } from "./player";

/*
 * This file tests player.ts. Simply run "npm test" to get the test results.
 *
 * Since the function "untestedFunction" in "player.ts" is not tested, the
 * coverage is reported to be less than 100%.
 * 
 * Currently, the testEnvironment is set to node (in jest.config.js) so you
 * probably can not access browser-related- / DOM- functions (e.g. getElementById)
 */
describe("Player", () => {
    test("Player moves", () => {
        let player: Player = {
            name: "test",
            character: "Adam_48x48.png",
            positionX: 0,
            positionY: 0,
            scaledX: 0,
            scaledY: 0,
            moveDirection: null,
            moveTime: 0,
            prioDirection: [],
            facing: "down",
            standing: 0,
            moving: 0,
            spriteX: 144,
            spriteY: 0
        }

        let width = 100;

        /*{
            updatePosition(player, 0, width);
            expect(player.positionX).toBe(0);
        }

        {
            updatePosition(player, 1000, width);
            expect(player.positionX).toBe(PLAYER_MOVEMENT_PER_SECOND);
        }

        {
            updatePosition(player, 1000, width);
            expect(player.positionX).toBe(2 * PLAYER_MOVEMENT_PER_SECOND);
        }*/
    });
});