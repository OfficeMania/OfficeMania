export class door {

    isClosed: boolean;
    direction: number;
    playerId: string;

    constructor() {

    }

    proofIfClosed(playerDirection: number) {

        //TODO
        if(this.isClosed){
            //if direction is inside the room then return false
            return true;
        } else{
            return false;
        }
    }

    lockDoor(id: string) {
        if(this.isClosed){
            //error
        } else{
            //if you are not allowed to close this door
            if(this.direction === 5){
                //error
            } else{
                this.playerId = id;
                this.isClosed = true;
            }
        }
        //TODO
    }

    openDoor(id: string) {

        //TODO
        if(!this.isClosed){
            //error
        } else{
            if(id === this.playerId){
                this.isClosed = false;
            } else{
                //error
            }
        }
    }
}
