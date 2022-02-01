
import { MachineType } from "../../../server/handler/machinehandler";
import { Machine } from "../machine";

export class VendingMachine extends Machine {

    constructor(){
        super("Vending Machine", MachineType.VENDING);
    }
}
