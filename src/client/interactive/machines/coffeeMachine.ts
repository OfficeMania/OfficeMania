
import { MachineType } from "../../../common";
import { Machine } from "../machine";

export class CoffeeMachine extends Machine {

    constructor(){
        super("Coffee Machine", MachineType.COFFEE);
    }
}
