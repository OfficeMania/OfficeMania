
import { MachineType} from "../../../server/handler/machinehandler";
import { Machine } from "../machine";

export class WaterCooler extends Machine{

    constructor(){
        super("Water Cooler", MachineType.WATER);
    }
}
