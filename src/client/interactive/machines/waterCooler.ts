
import { MachineType } from "../../../common/handler/machine";
import { Machine } from "../machine";

export class WaterCooler extends Machine{

    constructor(){
        super("Water Cooler", MachineType.WATER);
    }
}
