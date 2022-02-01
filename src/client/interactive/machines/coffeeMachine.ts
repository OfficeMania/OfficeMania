
import { MachineType } from "../../../common/handler/machine-handler";
import { Machine } from "../machine";

export class CoffeeMachine extends Machine {

    constructor(){
        super("Coffee Machine", MachineType.COFFEE);
    }
}
