
import { MachineType } from "../../../common/handler/machine-handler";
import { Machine } from "../machine";

export class VendingMachine extends Machine {

    constructor(){
        super("Vending Machine", MachineType.VENDING);
    }
}
