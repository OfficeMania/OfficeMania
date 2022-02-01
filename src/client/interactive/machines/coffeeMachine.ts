
import { MachineType } from "../../../common/handler/machine";
import { Machine } from "../machine";

export class CoffeeMachine extends Machine {

    constructor(){
        super("Coffee Machine", MachineType.COFFEE);
    }
}
