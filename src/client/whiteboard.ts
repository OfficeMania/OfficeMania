

export class Whiteboard{

    private isVisible: boolean = false;
    private canvas: HTMLCanvasElement; 
    private ctx;
    private x: number;
    private y: number;
    


    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
        
        let ctx = canvas.getContext("2d");
        this.ctx = ctx;

        document.addEventListener('mousedown', function(event) {
            if(event.target === canvas){
                alert("yes");
            } else {
                alert("no");
            }
            
                }, false);

        canvas.addEventListener('mousemove', this.draw);
        //canvas.addEventListener('mousedown', this.setPosition);
        canvas.addEventListener('mouseenter', this.setPosition);

        canvas.width = 1920
        canvas.height = 1080
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black"
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.stroke();   
    }

    getIsVisible(){
        return this.isVisible;
    }

    toggelIsVisible(){
        if(this.isVisible === true){
            this.isVisible = false;
        } else {
            this.isVisible = true;
        }
    }

    getCanvas(){
        return this.canvas
    }

    // new position from mouse event
    setPosition(e) {
        console.log("lol")
        this.x = e.clientX;
        this.y = e.clientY;
    }

    draw(e) {
        // mouse left button must be pressed
        if (e.buttons !== 1) return;
      
        this.ctx.beginPath(); // begin
      
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#c0392b';
      
        this.ctx.moveTo(this.x, this.y); // from
        this.setPosition(e);
        this.ctx.lineTo(this.x, this.y); // to
      
        this.ctx.stroke(); // draw it!
      }
  


}

export function drawWhiteboard(canvas: HTMLCanvasElement, whiteboard: HTMLCanvasElement){

}