(function attachFoliageExporter(globalScope) {
  'use strict';

  const EXPORT_FPS = 30;
  const FRAME_INTERVAL_MS = 1000 / EXPORT_FPS;

  let exportState = {
    isRunning: false,
    shouldStop: false,
    currentPass: null, // 'back' or 'front'
    frameIndex: 0,
    startTime: 0,
    frames: [],
  };

  function getCanvases() {
    return {
      myCanvas: document.getElementById('myCanvas'),
      myCanvasFront: document.getElementById('myCanvasFront'),
      myCanvasFlowersBack: document.getElementById('myCanvasFlowersBack'),
      myCanvasFlowersFront: document.getElementById('myCanvasFlowersFront'),
    };
  }

  function getUI() {
    return {
      startBtn: document.getElementById('startExportBtn'),
      stopBtn: document.getElementById('stopExportBtn'),
      status: document.getElementById('exportStatus'),
      progress: document.getElementById('exportProgress'),
    };
  }

  function setStatus(message) {
    const ui = getUI();
    if (ui.status) {
      ui.status.textContent = message;
    }
  }

  function setProgress(message) {
    const ui = getUI();
    if (ui.progress) {
      ui.progress.textContent = message;
    }
  }

  function createExportCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function compositeCanvases(sourceCanvases, targetCanvas) {
    const ctx = targetCanvas.getContext('2d');
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    
    // Draw each source canvas
    for (const source of sourceCanvases) {
      if (source) {
        ctx.drawImage(source, 0, 0);
      }
    }
    
    // Check if target has any non-transparent pixels
    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    const hasContent = imageData.data.some((channel, i) => i % 4 !== 3 && channel !== 0);
    
    if (!hasContent && exportState.frameIndex < 5) {
      console.log('Frame', exportState.frameIndex, 'is empty after compositing canvases:', sourceCanvases.map(c => c ? c.id : 'null'));
    }
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
    }, 100);
  }

  function padFrameNumber(num) {
    return String(num).padStart(4, '0');
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function checkGlobalScopeReady() {
    // Wait for script_11.js to load and expose the export functions
    return (
      typeof globalScope.STEM_WARP_EXPORT_FUNCTIONS !== 'undefined' &&
      typeof globalScope.STEM_WARP_EXPORT_FUNCTIONS.resetFlowerGrowthRuntimeState === 'function' &&
      typeof globalScope.STEM_WARP_EXPORT_FUNCTIONS.areFlowersFullyOpen === 'function'
    );
  }

  function waitForGlobalScope() {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (checkGlobalScopeReady()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for system to initialize'));
      }, 10000);
    });
  }

  async function runExportPass(passType) {
    const canvases = getCanvases();
    
    // Validate canvases exist and have dimensions
    console.log('Canvas check:', {
      myCanvas: canvases.myCanvas ? { width: canvases.myCanvas.width, height: canvases.myCanvas.height } : null,
      myCanvasFront: canvases.myCanvasFront ? { width: canvases.myCanvasFront.width, height: canvases.myCanvasFront.height } : null,
      myCanvasFlowersBack: canvases.myCanvasFlowersBack ? { width: canvases.myCanvasFlowersBack.width, height: canvases.myCanvasFlowersBack.height } : null,
      myCanvasFlowersFront: canvases.myCanvasFlowersFront ? { width: canvases.myCanvasFlowersFront.width, height: canvases.myCanvasFlowersFront.height } : null,
    });
    
    const exportCanvas = createExportCanvas(
      canvases.myCanvas.width,
      canvases.myCanvas.height
    );
    
    exportState.currentPass = passType;
    exportState.frameIndex = 0;
    exportState.frames = [];
    
    setStatus(`Starting ${passType} layer export...`);
    
    const exportFuncs = globalScope.STEM_WARP_EXPORT_FUNCTIONS;
    
    // Check if PIXI apps exist
    console.log('Checking PIXI state:', {
      hasFlowerSystem: typeof window.StemWarpFlowerSystem11 !== 'undefined',
      hasSTATE: typeof exportFuncs.STATE !== 'undefined',
      hasFlowerSystemInSTATE: exportFuncs.STATE && typeof exportFuncs.STATE.flowerSystem !== 'undefined',
    });
    
    if (exportFuncs.STATE && exportFuncs.STATE.flowerSystem) {
      const flowerSystem = exportFuncs.STATE.flowerSystem;
      console.log('Flower system state:', {
        hasPixi: flowerSystem.pixi ? {
          hasBackApp: !!flowerSystem.pixi.backApp,
          hasFrontApp: !!flowerSystem.pixi.frontApp,
          backInitReady: flowerSystem.pixi.backInitReady,
          frontInitReady: flowerSystem.pixi.frontInitReady,
          surfaces: flowerSystem.pixi.surfaces,
        } : 'no pixi',
      });
    }
    
    // Wait for initialization
    await delay(500);
    
    // Stop automatic animation and use frame-by-frame rendering
    console.log('Starting frame-by-frame capture...');
    
    // Frame-by-frame capture loop with timing control
    let maxFrames = 900; // Safety limit (30 seconds at 30fps)
    let targetFrameTime = 0; // Target animation time for next frame capture
    let iterationsWithoutCapture = 0; // Safety counter to prevent infinite loop
    
    while (!exportState.shouldStop && exportState.frameIndex < maxFrames) {
      // Step animation forward by 1/30th second
      const elapsed = exportFuncs.stepAnimationFrame(1 / 30);
      
      if (elapsed === null) {
        console.error('stepAnimationFrame failed - not on export page or animation not initialized');
        break;
      }
      
      // Log flower state every iteration for debugging (both manual and auto modes)
      const flowerState = exportFuncs.STATE ? exportFuncs.STATE.flowerGrowth : null;
      if (flowerState && flowerState.openTriggered && !flowerState.openSweepCompleted) {
        console.log(`[Loop] Flower sweep active - elapsed: ${elapsed.toFixed(3)}s, target: ${targetFrameTime.toFixed(3)}s, manual: ${isManualStopMode()}`);
      }
      
      // Only capture frame when we've reached the target animation time
      if (elapsed >= targetFrameTime) {
        iterationsWithoutCapture = 0; // Reset counter when we capture
        
        // Log flower sweep state for debugging
        const flowerState = exportFuncs.STATE ? exportFuncs.STATE.flowerGrowth : null;
        if (flowerState && flowerState.openTriggered && !flowerState.openSweepCompleted) {
          console.log(`Flower sweep active - elapsed: ${elapsed.toFixed(3)}s, sweepElapsed: ${flowerState.openSweepElapsedSec ? flowerState.openSweepElapsedSec.toFixed(3) : 'N/A'}s`);
        }
        
        // Determine which canvases to composite based on pass
        const sourceCanvases = passType === 'back'
          ? [canvases.myCanvas, canvases.myCanvasFlowersBack]
          : [canvases.myCanvasFront, canvases.myCanvasFlowersFront];
        
        // Log canvas selection on first frame
        if (exportState.frameIndex === 0) {
          console.log('Compositing canvases for', passType, 'layer:', sourceCanvases.map(c => c ? c.id : 'null'));
        }
        
        // Composite and capture frame
        compositeCanvases(sourceCanvases, exportCanvas);
        
        // Small delay to ensure canvas is ready for blob conversion
        await delay(10);
        
        try {
          const blob = await canvasToBlob(exportCanvas);
          const filename = `foliage_export_${passType}/${passType}_${padFrameNumber(exportState.frameIndex)}.png`;
          exportState.frames.push({ blob, filename });
          
          setProgress(`${passType} layer: Frame ${exportState.frameIndex + 1} captured (elapsed: ${elapsed.toFixed(2)}s)`);
          exportState.frameIndex++;
        } catch (error) {
          console.error(`Error capturing frame ${exportState.frameIndex}:`, error);
          // Still increment frameIndex to keep numbering sequential even on failure
          exportState.frameIndex++;
        }
        
        // Update target to next 1/30th second
        targetFrameTime = (exportState.frameIndex) * (1 / 30);
        
        // Check if flowers are fully open (if function available and not in manual stop mode)
        if (!isManualStopMode() && typeof exportFuncs.areFlowersFullyOpen === 'function' && exportFuncs.areFlowersFullyOpen()) {
          console.log('Flowers fully open check passed at elapsed:', elapsed.toFixed(2), 's');
          setStatus(`${passType} layer: Flowers fully open, stopping capture`);
          break;
        }
        
        // Additional safety check: stop after 30 seconds of animation time (only if not in manual stop mode)
        if (!isManualStopMode() && elapsed >= 30) {
          setStatus(`${passType} layer: Reached 30s animation time, stopping capture`);
          break;
        }
      } else {
        // Not at target time yet - yield to prevent CPU spin
        await delay(1);
        iterationsWithoutCapture++;
        
        // Safety: if we've gone 1000 iterations without capturing, something is wrong
        if (iterationsWithoutCapture > 1000) {
          console.error('Infinite loop detected - elapsed never reached targetFrameTime', { elapsed, targetFrameTime });
          break;
        }
      }
    }
    
    // Download captured frames (always download even if stopped)
    setStatus(`Downloading ${exportState.frames.length} ${passType} frames...`);
    for (let i = 0; i < exportState.frames.length; i++) {
      const { blob, filename } = exportState.frames[i];
      downloadBlob(blob, filename);
      await delay(100); // Longer delay between downloads to ensure browser can initiate each
    }
    
    exportState.frames = [];
  }

  function getSelectedLayer() {
    const radios = document.querySelectorAll('input[name="layer"]');
    for (const radio of radios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return 'back'; // Default
  }

  function isManualStopMode() {
    const checkbox = document.getElementById('manualStopMode');
    return checkbox ? checkbox.checked : false;
  }

  async function startExport() {
    if (exportState.isRunning) {
      return;
    }
    
    const ui = getUI();
    ui.startBtn.disabled = true;
    ui.stopBtn.disabled = false;
    
    exportState.isRunning = true;
    exportState.shouldStop = false;
    
    try {
      setStatus('Waiting for system to initialize...');
      await waitForGlobalScope();
      
      // Get selected layer from radio buttons
      const selectedLayer = getSelectedLayer();
      
      // Export only the selected layer
      await runExportPass(selectedLayer);
      
      if (exportState.shouldStop) {
        setStatus('Export stopped by user');
      } else {
        setStatus('Export complete');
      }
    } catch (error) {
      console.error('Export error:', error);
      setStatus(`Export error: ${error.message}`);
    } finally {
      exportState.isRunning = false;
      exportState.shouldStop = false;
      ui.startBtn.disabled = false;
      ui.stopBtn.disabled = true;
    }
  }

  function stopExport() {
    if (exportState.isRunning) {
      exportState.shouldStop = true;
      setStatus('Stopping export...');
    }
  }

  function bootstrapExporter() {
    const ui = getUI();
    
    if (!ui.startBtn || !ui.stopBtn || !ui.status || !ui.progress) {
      console.error('Export UI elements not found');
      return;
    }
    
    ui.startBtn.addEventListener('click', startExport);
    ui.stopBtn.addEventListener('click', stopExport);
    
    setStatus('Ready to export. Click Start Export to begin.');
  }

  // Bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapExporter);
  } else {
    bootstrapExporter();
  }

})(window);
