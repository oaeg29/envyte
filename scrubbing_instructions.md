To scrub to a specific frame, you need to:

1. **Know your video's frame rate** (fps)
2. **Convert frame number to time** using: `time = frameNumber / frameRate`
3. **Set `currentTime`** to that time

**Example:**

```javascript
const frameRate = 30; // Your video's fps (30, 60, etc.)

function goToFrame(frameNumber) {
  video.currentTime = frameNumber / frameRate;
}

// Usage:
goToFrame(100); // Jump to frame 100
goToFrame(250); // Jump to frame 250
```

**Getting the current frame:**

```javascript
function getCurrentFrame() {
  return Math.floor(video.currentTime * frameRate);
}

console.log(getCurrentFrame()); // Logs current frame number
```

**Listen for frame changes:**

```javascript
video.addEventListener("timeupdate", () => {
  const currentFrame = Math.floor(video.currentTime * frameRate);
  console.log("Frame:", currentFrame);
});
```

**Find out your video's fps:**
If you don't know the frame rate, check your video file properties or test it:

```javascript
// Play for 1 second and count frames
let frameCount = 0;
video.addEventListener("timeupdate", () => {
  frameCount++;
});
video.play();
// After 1 second, frameCount ≈ fps
```

What frame rate is your video?
