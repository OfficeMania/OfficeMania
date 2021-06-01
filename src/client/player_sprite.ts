import { Room } from "colyseus.js";
import { Player, TILE_SIZE , STEP_SIZE} from "./player";

/*
 * Chooses the Player sprite dependend on walking direction and duration of walking/standing
 */
export function choosePlayerSprites(room: Room, player: Player, playerWidth: number, playerHeight: number, ownPlayer: boolean){
    if (ownPlayer === true){
        if (player.moveDirection === null){
            player.standing++;

            //only activates if player is standing long enough
            if (player.standing >= 10){
                player.moving = 0
                player.spriteY = playerHeight;
                let x = 0;

                //choose direction
                switch(player.facing){
                    case "right":{
                        break;
                    }
                    case "up":{
                        x += 6*playerWidth
                        break;
                    }
                    case "left":{
                        x += 12*playerWidth
                        break;
                    }
                    case "down":{
                        x += 18*playerWidth
                        break;
                    }
                }

                //standing animation
                if(player.standing % 300 <= 40){
                    //do nothing
                }else if(player.standing % 300 <= 80){
                    x += playerWidth;
                }else if(player.standing % 300 <= 120){
                    x += 2*playerWidth;
                }else if(player.standing % 300 <= 160){
                    x += 3*playerWidth;
                }else if(player.standing % 300 <= 200){
                    x += 4*playerWidth;
                }else{
                    x += 5*playerWidth;
                }

                player.spriteX = x;
            } else {
                player.moving++
            }
        } else{
            player.standing = 0;
            player.moving++;
            let x = 0;

            //choose direction
            switch(player.moveDirection){
                case "right":{
                    break;
                }
                case "up":{
                    x += 6*playerWidth
                    break;
                }
                case "left":{
                    x += 12*playerWidth
                    break;
                }
                case "down":{
                    x += 18*playerWidth
                    break;
                }
            }

            //moving animation
            if(player.moving % 60 <= 10){
                //do nothing
            }else if(player.moving % 60 <= 20){
                x += playerWidth;
            }else if(player.moving % 60 <= 30){
                x += 2*playerWidth;
            }else if(player.moving % 60 <= 40){
                x += 3*playerWidth;
            }else if(player.moving % 60 <= 50){
                x += 4*playerWidth;
            }else{
                x += 5*playerWidth;
            }
            
            player.spriteX = x
            player.spriteY = 2*playerHeight
        }
    } else { //all other players
        //sets facing direction to choose sprites
        if(Math.abs(player.positionX - room.state.players[player.id].x * STEP_SIZE) > Math.abs(player.positionY - room.state.players[player.id].y * STEP_SIZE)){
            if(player.positionX < room.state.players[player.id].x * STEP_SIZE){
                player.facing = "right"
            }else if(player.positionX > room.state.players[player.id].x * STEP_SIZE){
                player.facing = "left"
            }
        } else if (Math.abs(player.positionX - room.state.players[player.id].x * STEP_SIZE) < Math.abs(player.positionY - room.state.players[player.id].y * STEP_SIZE)){
            if(player.positionY < room.state.players[player.id].y * STEP_SIZE){
                player.facing = "down"
            }else if(player.positionY > room.state.players[player.id].y * STEP_SIZE){
                player.facing = "up"
            }
        }
        // player is standing
        if(player.positionX === room.state.players[player.id].x * STEP_SIZE && player.positionY === room.state.players[player.id].y * STEP_SIZE){
            player.standing++
            if (player.standing >= 10){
                player.moving = 0
                player.spriteY = playerHeight;
                let x = 0;

                //choose direction
                switch(player.facing){
                    case "right":{
                        break;
                    }
                    case "up":{
                        x += 6*playerWidth
                        break;
                    }
                    case "left":{
                        x += 12*playerWidth
                        break;
                    }
                    case "down":{
                        x += 18*playerWidth
                        break;
                    }
                }
                
                //standing animation
                if(player.standing % 300 <= 40){
                    //do nothing
                }else if(player.standing % 300 <= 80){
                    x += playerWidth;
                }else if(player.standing % 300 <= 120){
                    x += 2*playerWidth;
                }else if(player.standing % 300 <= 160){
                    x += 3*playerWidth;
                }else if(player.standing % 300 <= 200){
                    x += 4*playerWidth;
                }else{
                    x += 5*playerWidth;
                }

                player.spriteX = x;
            } else {
                player.moving++
            }
        }else{                  // player is moving
            player.standing = 0;
            player.moving++;
            let x = 0;

            //choose direction
            switch(player.facing){
                case "right":{
                    break;
                }
                case "up":{
                    x += 6*playerWidth
                    break;
                }
                case "left":{
                    x += 12*playerWidth
                    break;
                }
                case "down":{
                    x += 18*playerWidth
                    break;
                }
            }

            //moving animation
            if(player.moving % 60 <= 10){
                //do nothing
            }else if(player.moving % 60 <= 20){
                x += playerWidth;
            }else if(player.moving % 60 <= 30){
                x += 2*playerWidth;
            }else if(player.moving % 60 <= 40){
                x += 3*playerWidth;
            }else if(player.moving % 60 <= 50){
                x += 4*playerWidth;
            }else{
                x += 5*playerWidth;
            }
            
            player.spriteX = x
            player.spriteY = 2*playerHeight
        }
    }
}