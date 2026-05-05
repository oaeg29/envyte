const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

function drawBackground() {
  ctx.fillStyle = 'rgb(188, 231, 242)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawBackground();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

var spriteNumber = 24; // Change this to select different sprites from the sprite sheet
var spriteType = 1; // Change this to select different types of sprites (if your sprite sheet has multiple rows)
 var sourceX = spriteNumber * 44; // x coordinate of the top left corner of the sub-rectangle of the source image to draw into the destination context.
 var sourceY = spriteType * 45.819; // y coordinate of the top left corner of the sub-rectangle of the source image to draw into the destination context.
 var sourceWidth = 44; // width of the sub-rectangle of the source image to draw into the destination context.
 var sourceHeight = 45.819; // height of the sub-rectangle of the source image to draw into the destination context.
 var destX = 0; // x coordinate in the destination canvas at which to place the top-left corner of the source image.
 var destY = 0; // y coordinate in the destination canvas at which to place the top-left corner of the source image.
 var scale = 80;
 var destWidth = scale; // width to draw the image in the destination canvas. This allows scaling of the drawn image.
 var destHeight = scale; // height to draw the image in the destination canvas. This allows scaling of the drawn image.  
 
 var myfactor = 12.5; // Adjust this factor to control the scaling of the source image
 var sourceX_adj = sourceX*myfactor;
 var sourceY_adj = sourceY*myfactor;
 var sourceWidth_adj = sourceWidth*myfactor;
 var sourceHeight_adj = sourceHeight*myfactor;

// //displays an image
// const img = new Image();
// img.onload = function() {
//  // draw image parameters are
//  ctx.drawImage(img,sourceX_adj,sourceY_adj,sourceWidth_adj,sourceHeight_adj,destX,destY,destWidth,destHeight);
  
// };
// img.src = '/test_sprite1.png'; // Placeholder image URL

// //moving my mouse should change the sprite number accoridng to the x position, and the y posiiton should change sprite type
// canvas.addEventListener('mousemove', function(event) { 
//   spriteNumber = Math.floor((event.clientX / canvas.width) * 10); // Adjust the multiplier as needed
//   spriteType = Math.floor((event.clientY / canvas.height) * 5); // Adjust the multiplier as needed

//   // Update the source coordinates based on the new sprite number and type
//   var sourceX = spriteNumber * 44;
//   var sourceY = spriteType * 45.819;
//   var sourceX_adj = sourceX*myfactor;
//   var sourceY_adj = sourceY*myfactor;

//   // Clear the canvas and redraw the background
//   ctx.fillStyle = 'cyan';
//   ctx.fillRect(0, 0, canvas.width, canvas.height);

//   // Redraw the image with the updated sprite coordinates
//   ctx.drawImage(img, sourceX_adj, sourceY_adj, sourceWidth_adj, sourceHeight_adj, destX, destY, destWidth, destHeight);
// });



// creates a class called Plant that takes arguments for width and height
class Plant {
  constructor(width, height) {
    this.w = width;
    this.h = height
    //creates a new list
    this.avg_of_sprouts = 10;
    // this.number_of_sprouts = Math.floor(Math.random() * (this.avg_of_sprouts+4 - (this.avg_of_sprouts-4))) + (this.avg_of_sprouts-4);
    this.number_of_sprouts = 40;

    this.sprouts = [];

    for (let i = 0; i < this.number_of_sprouts; i++) {
      //creates a new sprout with random x and y coordinates and adds it to the list of sprouts
      let sprout = {
        x: Math.random()*this.w,
        y: Math.random()*this.h*2,
        // x: 300,
        // y: 300,
        
      };
      this.sprouts.push(sprout);
    console.log(this.sprouts);
    console.log("hey!");
  }
}


 deliver_sprite(x, y) {
    this.x = x;
    this.y = y;
    let sourceX = x * 44; // x coordinate of the top left corner of the sub-rectangle of the source image to draw into the destination context.
    let sourceY = y * 45.819;
    let sourceWidth = 44; // width of the sub-rectangle of the source image to draw into the destination context.
    let sourceHeight = 45.819; // height of the sub-rectangle of the source image to draw into the destination context.
   
    let myfactor = 12.5; // Adjust this factor to control the scaling of the source image
    let sourceX_adj = sourceX*myfactor;
    let sourceY_adj = sourceY*myfactor;
    let sourceWidth_adj = sourceWidth*myfactor;
    let sourceHeight_adj = sourceHeight*myfactor;

    return [sourceX_adj, sourceY_adj, sourceWidth_adj, sourceHeight_adj];


    }


  populate() {
    //loops through the list of sprouts and places a sprite at the x and y coordinates of each sprout
    for (let sprout of this.sprouts) {
      let rand_y = Math.floor(Math.random() * 6);
      let rand_x = Math.floor(Math.random() * 30);
    // const [sx, sy, sw, sh] = this.deliver_sprite(rand_x, rand_y);
    // ctx.drawImage(img, sx, sy, sw, sh, sprout.x, sprout.y, destWidth, destHeight);
    this.flower(sprout);
    // this.flower(sprout);



    }
  }

  flower(coords) {

    // this.x = x;
    // this.y = y;
    this.loc_x = coords.x;
    this.loc_y = coords.y;
    let y = Math.floor(Math.random() * 6);
    // let y = 4;
    // let x = Math.floor(Math.random() * 10);
    let x = 10;

    let sourceX = x * 44; // x coordinate of the top left corner of the sub-rectangle of the source image to draw into the destination context.
    let sourceY = y * 45.819;
    let sourceWidth = 44; // width of the sub-rectangle of the source image to draw into the destination context.
    let sourceHeight = 45.819; // height of the sub-rectangle of the source image to draw into the destination context.
    let myfactor = 8.3333333; // Adjust this factor to control the scaling of the source image
    let sourceX_adj = sourceX*myfactor;
    let sourceY_adj = sourceY*myfactor;
    let sourceWidth_adj = sourceWidth*myfactor;
    let sourceHeight_adj = sourceHeight*myfactor;

    let petal_count= Math.floor(Math.random() * 2) + 5; // Random number of petals between 3 and 7

    for (let i = 0; i < petal_count; i++) {
      x = Math.floor(Math.random() * 20);
      sourceX = x * 44
      myfactor = 8.33333; // Adjust this factor to control the scaling of the source image
      sourceX_adj = sourceX*myfactor;
      ctx.save(); // Save the current state of the canvas
      ctx.translate(this.loc_x,this.loc_y);
      let angleInRadians = ( ((-40+((75* Math.sin(i/(petal_count/4))))))  * (Math.PI / 180)  );
      // angleInRadians; // Calculate the angle for each petal
      ctx.rotate(angleInRadians); // Rotate the canvas context
      ctx.drawImage(img, sourceX_adj, sourceY_adj, sourceWidth_adj, sourceHeight_adj, -destWidth/2, -destHeight + ((2.2/45.819)*destHeight), destWidth, destHeight);
      ctx.restore(); 
      //draw a circle in the center of the flower
      ctx.beginPath();
      ctx.arc(30+ 40*(Math.sin((i)/(petal_count/20))), 30+(i*30), (5+destWidth/2/2/2), 0, 2 * Math.PI);
     
      //positive only sin:
      //  ((Math.sin((i)/(petal_count/4))+1)/2)

      console.log((5+destWidth/2/2/2) * (Math.sin((i)/(petal_count/20))));
      ctx.fillStyle = 'yellow';
      ctx.fill();

    }
   




  }


}


// creates a new instance of the Plant class called myPlant with width 100 and height 200
const myPlant = new Plant(500, 500);
const img = new Image();

img.onload = function() {
  myPlant.populate(); // runs only when the image is ready
    ctx.drawImage(img, sourceX_adj, sourceY_adj, sourceWidth_adj, sourceHeight_adj, 400, 100, destWidth, destHeight);

    // ctx.save(); // Save the current state of the canvas
    // ctx.translate(100,100);
    // let angleInRadians = 90 * Math.PI / 180;
    // ctx.rotate(angleInRadians); // Rotate the canvas context
    // ctx.drawImage(img, sourceX_adj, sourceY_adj, sourceWidth_adj, sourceHeight_adj, -sourceWidth, -sourceHeight*2, destWidth, destHeight);
    // ctx.restore(); 
    ctx.drawImage(img, sourceX_adj, sourceY_adj, sourceWidth_adj, sourceHeight_adj, 0, 0, destWidth, destHeight);

};

img.onerror = function() {
  console.error('failed to load', img.src);
};

img.src = '/test_sprite4.png'

// const myPlant = new Plant(100, 200);
// myPlant.populate();


