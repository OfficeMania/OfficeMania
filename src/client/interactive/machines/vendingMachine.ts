
import { MachineType } from "../../../common";
import { Machine } from "../machine";

export class VendingMachine extends Machine {

    constructor(){
        super("Vending Machine", MachineType.VENDING);
    }
}
