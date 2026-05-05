const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
// import noise from 'noisejs';
const noise = new Noise(Math.random());

function drawBackground() {
  ctx.fillStyle = 'rgb(188, 231, 242)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const dpr = window.devicePixelRatio || 1;

function resizeCanvas() {
  canvas.width = window.innerWidth*dpr;
  canvas.height = window.innerHeight*dpr;
  drawBackground();
  
}


let points = [];
var pos_x = 200;
var pos_y = 700;
ctx.scale(dpr, dpr);
resizeCanvas();

const path2 = new Path2D();
// console.log(dpr, dpr);

var timeStart = Date.now() / 1000; // Start time in seconds

// ctx.lineWidth = 5;

function update_position(){
    var time = Date.now() / 1000; 
    var step_size = 2; // Adjust this to control the speed of movement  
    var x1 = time/step_size;
    var y1 = time/step_size;
    var x2 = x1 + 4895943;
    var y2 = y1 + 4838485943;
    var scale = 2;

   
    pos_x += noise.perlin2(x1, y1)*scale; // Adjust the divisor to control speed and multiplier for amplitude
    pos_y += Math.abs(noise.perlin2(x2,y2)) *scale *-1;
    // Set pos_y to be always positive
    // return {x: pos_x, y: pos_y};
    
    

}
function drawCircle(){
const path2 = new Path2D();
path2.arc(pos_x, pos_y, 2, 0, 2 * Math.PI);
ctx.strokeStyle = 'black';
ctx.stroke(path2);
ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
ctx.fill(path2);
}
function drawCircle_fromPos(x, y){
const path3 = new Path2D();

this.pos_x1 = x;
this.pos_y1 = y;
console.log(this.pos_x1, this.pos_y1);
path3.arc(this.pos_x1, this.pos_y1, 10, 0, 2 * Math.PI);
ctx.strokeStyle = 'black';
ctx.stroke(path3);
ctx.fillStyle = 'rgba(124, 248, 186, 0.5)';
ctx.fill(path3);
}

function generate_points(){
    let time2 = timeStart;

   
    for (let i = 0; i < 10; i++) {
    time2 += 1;
    // console.log(this.time);
    var step_size = 2; // Adjust this to control the speed of movement  
    var x1 = time2/step_size;
    var y1 = time2/step_size;
    var x2 = x1 + 4895943;
    var y2 = y1 + 4838485943;
    var scale = 2;
    pos_x += noise.perlin2(x1, y1)*scale; // Adjust the divisor to control speed and multiplier for amplitude
    pos_y += Math.abs(noise.perlin2(x2,y2)) *scale *-1;
    points.push({x: pos_x, y: pos_y});

    }

    return points;
}


function check_match(points, current_pos){
    let current_x = current_pos.x;
    let current_y = current_pos.y;
    let current = {x: current_x, y: current_y};

    this.points = points;
    for (let i = 0; i < this.points.length; i++) {
        if (this.points[i].x === current.x && this.points[i].y === current.y) {
            console.log("Match found at index: " + i);
            return true;
        }
    }
    return false;
}


function draw_Checkpoints(points){
    // points = generate_points();
    // console.log(points);
    for (let i = 0; i < points.length; i++) {
        drawCircle_fromPos(points[i].x, points[i].y);
        
}
}

  

// generate_points();
draw_Checkpoints(generate_points());
console.log(points);
animate();


function animate() {
    update_position();
    
    // drawBackground();

    // resizeCanvas();
    drawCircle();
    current_pos = {x: pos_x, y: pos_y};
    // console.log(current_pos);
    check_match(points, current_pos);
    // drawPoints();
    // console.log(timeStart);
    requestAnimationFrame(animate);
}


// drawBackground();
//

drawCircle();

const img = new Image();

img.onload = function() {



};

// bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);


img.onerror = function() {
  console.error('failed to load', img.src);
};

img.src = '/stem_2.png'

// const myPlant = new Plant(100, 200);
// myPlant.populate();

