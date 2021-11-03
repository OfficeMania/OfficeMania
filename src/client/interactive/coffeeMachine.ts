import { Room } from "colyseus.js";
import {Interactive} from "./interactive";
import {getInputMode, setInputMode} from "../input";
import {createCloseInteractionButton, getRoom, InputMode, removeCloseInteractionButton, } from "../util";
import { MessageType } from "../../common/util";
import { checkInputMode } from "../main";
import { State } from "../../common";
import { MachineType} from "../../common/handler/machinehandler";
import { Machine } from "./machine";
export class CoffeeMachine extends Machine {

    constructor(){
        super("Coffee Machine", MachineType.COFFEE);
    }

}
