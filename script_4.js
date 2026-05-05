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
const step_size = 2;
const scale = 2;
const fixed_time_step = 1 / 60;
const checkpoint_count = 5;
const checkpoint_spacing_steps = 200;
const checkpoint_hit_radius = 10;
let timeCursor = Date.now() / 1000;
let matchedCheckpointIndices = new Set();
ctx.scale(dpr, dpr);
resizeCanvas();

const path2 = new Path2D();
// console.log(dpr, dpr);

// ctx.lineWidth = 5;

function getNoiseDelta(time) {
    const x1 = time / step_size;
    const y1 = time / step_size;
    const x2 = x1 + 4895943;
    const y2 = y1 + 4838485943;

    return {
        dx: noise.perlin2(x1, y1) * scale,
        dy: Math.abs(noise.perlin2(x2, y2)) * scale * -1
    };
}

function update_position() {
    timeCursor += fixed_time_step;
    const delta = getNoiseDelta(timeCursor);
    pos_x += delta.dx;
    pos_y += delta.dy;
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
path3.arc(x, y, 10, 0, 2 * Math.PI);
ctx.strokeStyle = 'black';
ctx.stroke(path3);
ctx.fillStyle = 'rgba(124, 248, 186, 0.5)';
ctx.fill(path3);
}

function generate_points(){
    let time2 = timeCursor;
    let sim_x = pos_x;
    let sim_y = pos_y;
    const generated = [];

    for (let i = 0; i < checkpoint_count; i++) {
        for (let j = 0; j < checkpoint_spacing_steps; j++) {
            time2 += fixed_time_step;
            const delta = getNoiseDelta(time2);
            sim_x += delta.dx;
            sim_y += delta.dy;
        }
        generated.push({x: sim_x, y: sim_y});
    }

    return generated;
}


function check_match(points, current_pos){
    for (let i = 0; i < points.length; i++) {
        if (matchedCheckpointIndices.has(i)) {
            continue;
        }

        const dx = points[i].x - current_pos.x;
        const dy = points[i].y - current_pos.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared <= checkpoint_hit_radius * checkpoint_hit_radius) {
            matchedCheckpointIndices.add(i);
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
points = generate_points();
draw_Checkpoints(points);
console.log(points);
animate();


function animate() {
    update_position();
    
    // drawBackground();

    // resizeCanvas();
    drawCircle();
    const current_pos = {x: pos_x, y: pos_y};
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

