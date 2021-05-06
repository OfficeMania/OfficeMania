import { Player, PLAYER_MOVEMENT_PER_SECOND, updatePosition } from "./player";

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
            name: "Test",
            positionX: 0,
            positionY: 0,
            moveDown: false,
            moveUp: false,
            moveLeft: false,
            moveRight: false
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