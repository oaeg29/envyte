(function initStemWarpUserConfig(global) {
  function createStemWarpUserConfig(runtime) {
    const safeRuntime = runtime && typeof runtime === 'object' ? runtime : {};
    const gradient = safeRuntime.gradient;
    const valScaling = Number.isFinite(Number(safeRuntime.valScaling)) ? Number(safeRuntime.valScaling) : 0.01;
    const defaultCountPerSide = Number.isFinite(Number(safeRuntime.defaultCountPerSide))
      ? Math.max(1, Math.floor(Number(safeRuntime.defaultCountPerSide)))
      : 9;

    return {
  backgroundColor: gradient,
  globalFoliageScale: 0.85, // global foliage multiplier (branches + stems + leaves + flowers)

  noise: {
    // stepSize: 2,
    // scale: 2.2,
    // timeStep: 1 / 300,
    // checkpointCount: 20,
    // checkpointSpacingSteps: 2,

    stepSize: 0.1,
    scale: 20,
    timeStep: 1 / 300,
    checkpointCount: 20,
    checkpointSpacingSteps: 2,
  },

  path: {
    smoothingSubdivisionsPerSpan: 10,
  },
 
  pathGeneration: {
    
    mode: 'manualTemplate', // random | manualTemplate
    useAbsoluteNoiseX: false, // if true, X/lateral noise uses abs()
    useAbsoluteNoiseY: false, // if true, Y/forward noise uses abs()
    absoluteNoiseXRatio: 0.4, // when useAbsoluteNoiseX=false, blend signed->absolute by this ratio (0..1)
    absoluteNoiseYRatio: 0.9, // when useAbsoluteNoiseY=false, blend signed->absolute by this ratio (0..1)
    // templateScale: 0.5,
    templateScaleRangeMin: 0.2,
    templateScaleRangeMax: 0.5,
    baseRotationDeg: 5, // rotates generated base path around its seed before rendering
    templateNoiseAmount: 40 * valScaling,
    templateNoiseStep: 1 / 7.5,
    templateNoiseAmount2: 25 * valScaling,
    templateNoiseStep2: 1 / 0.5,
    templateNoiseAmount3: 40 * valScaling,
    templateNoiseStep3: 1 / 3,
    templateNoiseHighpassWindow3: 23,
    templateNoiseDirectionalBias: 0.8,
    templateInheritCheckpointSpacingSteps: true,
    alignTemplateToGrowth: true,
    templatePickMode: 'random', // random | fixed
    templatePickDeterministic: true,
    fixedTemplateIndex: 2,
    // Additional base templates (arrays of {x,y}) besides generate_manual_points().
    manualTemplates: [],
  },

  brush: {
    stripWidth: 0.3,
    stripWidthMobile: null, // null uses stripWidth; set a number to override on likely-mobile devices
    scale: 0.18,
    sclale: undefined, // typo compatibility
    thicknessTaperEnabled: true,
    thicknessMinScale: 0.48,
    thicknessTaperExponent: 0.2,
    thicknessMinWidth: 0, // absolute minimum rendered width in px (applied when taper is enabled)
    globalHueDeg: 5,
    globalBrightness: 0.89,
    randomizeBranchFilter: true,
    randomHueMinDeg: 15,
    randomHueMaxDeg: 0,
    randomBrightnessMin: 1.05,
    randomBrightnessMax: 0.9,
    randomFilterVariantCount: 15,
    randomFilterAssignmentMode: 'inheritParent', // perBranch | inheritParent
    pathOffset: 0,
    repeatGap: 0,
    repeatOverlap: 0.13, //usually 0.2
    repeatOverlapMobile: null, // null uses repeatOverlap; set a number to override on likely-mobile devices
    startOffset: 0,
    cropPartialRepeat: true,
  },

  seeds: {
    countPerSide: defaultCountPerSide,
    sidePad: -0.14, // interpreted by sidePadBasis
    sidePadBasis: 'videoWidthRatio', // px | videoWidthRatio | viewportWidthRatio
    sideAnchorXMode: 'videoCenter', // viewportEdges | videoCenter
    sideMargin: 2,
    mode: 'explicitYRatios', // autoSpacing | explicitYRatios
    explicitYRatioBasis: 'video', // video | viewport
    explicitYRatios: [0.05, 0.1, 0.3, 0.5, 0.4 , 0.45, 0.89, 0.85, 0.9, 0.81, 0.75], // shared ratios for both sides (0..1 or 0..100)
    explicitYRatiosBySide: null, // optional { left: [...], right: [...] }
    explicitYRatiosLeft: null, // optional side override list
    explicitYRatiosRight: null, // optional side override list
    startY: window.innerHeight * 0.05, // explicit first-seed Y; null randomizes first seed per side
    randomizeSpacing: true, // if true, per-seed spacing is sampled in [minSpacing, maxSpacing]
    minSpacing: window.innerHeight/ defaultCountPerSide, // minimum vertical distance between seeds on the same side
    // minSpacing: 300,
    maxSpacing: null, // when null + randomizeSpacing=true, an automatic max is derived from minSpacing
  },

  // offshoot: {
  //   enabled: true,
  //   deterministic: true,
  //   maxDepth: 1,
  //   countRange: [0, 5],
  //   spawnTMin: 0.01,
  //   spawnTMax: 0.96,
  //   biasExponent: 1.6,
  //   angleDegRange: [0,1],
  //   sideMode: 'alternate', // random | left | right | alternate
  //   depthScale: 0.7,
  //   minSpawnSpacingT: 0,
  //   maxSpawnAttemptsPerChild: 80,
  //   maxTotalBranches: 500,
  // },

  offshoot: {
    enabled: true,
    deterministic: true,
    maxDepth: 1,
    countRange: [0, 10],
    spawnTMin: 0.01,
    spawnTMax: 0.96,
    biasExponent: 1.6,
    angleDegRange: [0,0],
    sideMode: 'alternate', // random | left | right | alternate
    depthScale: 0.6,
    minSpawnSpacingT: 0.02,
    maxSpawnAttemptsPerChild: 800,
    maxTotalBranches: 200,
    pathGenerationMode: 'inherit', // inherit | random | manualTemplate
    templateIndexPool: [2], // e.g. [1, 4, 7] => randomly pick one for each offshoot
    centerBlockEnabled: true, // clip offshoot branches when they enter the center block area
     centerBlockHalfWidthPxVideoHeightRatio: 0.17, // X half-width as ratio of sampled video height
    centerBlockHalfHeightAbovePxVideoHeightRatio: 0.8, // Y extent above center as ratio of sampled video height
    centerBlockHalfHeightBelowPxVideoHeightRatio: 0.8,  // Y extent below center as ratio of sampled video height
  },

  priority: {
    enabled: true,
    endpointCullRadiusPxVideoHeightRatio: 0.045,
    squares: [
      {
        enabled: true,
        centerXRatio: 0.4,
        centerYRatio: 0.4,
        sizeXRatio: 0.15,
        sizeYRatio: 0.12,
      },
      {
        enabled: false,
        centerXRatio: 0.5,
        centerYRatio: 0.5,
        sizeXRatio: 0.25,
        sizeYRatio: 0.25,
      },
      {
        enabled: false,
        centerXRatio: 0.5,
        centerYRatio: 0.5,
        sizeXRatio: 0.25,
        sizeYRatio: 0.25,
      },
      {
        enabled: false,
        centerXRatio: 0.5,
        centerYRatio: 0.5,
        sizeXRatio: 0.25,
        sizeYRatio: 0.25,
      },
      {
        enabled: false,
        centerXRatio: 0.5,
        centerYRatio: 0.5,
        sizeXRatio: 0.25,
        sizeYRatio: 0.25,
      },
    ],
    debug: {
      enabled: false,
      drawOnFrontLayer: true,
      strokeStyle: 'rgba(255, 120, 70, 0.95)',
      fillStyle: 'rgba(255, 120, 70, 0.12)',
      lineWidthPx: 2,
      showCulledEndpointCircles: true,
      culledCircleStrokeStyle: 'rgba(255, 65, 65, 0.98)',
      culledCircleFillStyle: 'rgba(255, 65, 65, 0.14)',
    },
  },

  branchGrowth: {
    enabled: true,
    mode: 'linearBySeedY', // simultaneous | linearBySeedY
    linearSweepDirection: 'up', // down (top->bottom) | up (bottom->top)
    linearSweepDurationSec: 6, // sweep time across root seed Y range
    speedMode: 'rate', // duration | rate
    totalDurationSec: 1.5,
    pixelsPerSecond: 50,
    growthEase: 'easeOut', // linear | easeIn | easeOut | easeInOut
    growthEasePower: 1,
    autoStart: true,
    requireFoliageLoadedBeforeStart: true,
    useOffscreenLayerCache: true,
    overlayPromotionGrowthOnMode: 'growthON', // growthON only: matchGrowthOff | firstExitCutover
  },

  frameJumpHotkeys: {
    enabled: true,
    timelineFps: 30,
    bindings: {
      1: 0,
      2: 130,
      3: 261,
      4: null,
      5: null,
      6: null,
    },
  },

  heroPlaybackGate: {
    enabled: true,
    frameRate: 30,
    introPauseFrame: 125,
    postButtonPauseFrame: 273,
    growthStartFrame: 253,
    pauseGuardFrames: 2,
    startDelayAfterSplashDismissMs: 500,
    monitorUseVideoFrameCallback: true,
    videoWiggle: {
      enabled: true,
      maxAngleDeg: 5.4,
      durationMs: 760,
      speedHz: 5.8,
      dampingStrength: 3.2,
      anchorOffsetXRatio: 0,
      anchorOffsetYRatio: 0,
      delayAfterIntroPauseMs: 0,
    },
    openButton: {
      centerXRatio: 0.498, // 49.8% of rendered video width
      centerYRatio: 0.7497135, // 78.97135% of rendered video height
      diameterRatio: 0.092, // 6.2% of rendered video size (min(width,height))
      hitMarginPercentOfButtonSize: 200, // 0..100 extra size percentage
      enableBeforeIntroPauseFrames: 10, // enable interaction this many frames before introPauseFrame
    },
    wiggleButton: {
      enabled: true,
      centerXRatio: 0.5, // ratio of rendered video width
      centerYRatio: 0.70, // ratio of rendered video height
      sizeXRatio: 0.43, // ratio of rendered video size (min(width,height))
      sizeYRatio: 0.27, // ratio of rendered video size (min(width,height))
      enableBeforeIntroPauseFrames: 10, // enable interaction this many frames before introPauseFrame
    },
    wiggleButtonDebug: {
      enabled: false,
      drawOnFrontLayer: true,
      strokeStyle: 'rgba(95, 175, 255, 0.98)',
      fillStyle: 'rgba(95, 175, 255, 0.16)',
      lineWidthPx: 2,
    },
    openButtonDebug: {
      enabled: false,
      drawOnFrontLayer: true,
      showBaseButtonCircle: true,
      showPaddedHitCircle: true,
      baseStrokeStyle: 'rgba(35, 208, 140, 0.95)',
      baseFillStyle: 'rgba(35, 208, 140, 0.10)',
      hitStrokeStyle: 'rgba(255, 170, 80, 0.98)',
      hitFillStyle: 'rgba(255, 170, 80, 0.12)',
      lineWidthPx: 2,
    },
    openButtonArrow: {
      enabled: true,
      spritePath: './arrow_2.png',
      centerXRatio: 0.498,
      centerYRatio: 0.42,
      sizeRatio: 0.19, // width ratio against rendered video min(width,height)
      appearAfterFrame: 90,
      maxOpacity: 1,
      fadeOutAfterOpenButtonClick: true,
      fadeOutDurationSec: 0.45,
    },
  },

  loadingScreen: {
    enabled: true,
    messageText: 'please wait, \n something special is loading',
    textSizePx: 17,
    edgePaddingPx: 30,
    messageMaxWidthPx: 300,
    dotsGapFromTextPx: 10, // distance between message text and loading dots row
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, "Times New Roman", serif',
    fontWeight: 100,
    lineHeight: 1.2,
    textColor: '#000000',
    textDropShadowEnabled: false,
    colorModel: 'hslOffsets', // hslOffsets | explicit
    hslBaseHue: 222, // base (darkest) hue
    hslBaseSaturation: 2, // base (darkest) saturation %
    hslBaseLightness: 17, // base (darkest) lightness %
    // Per-stop H/S/L offsets from base, as [h, s, l]
    hslStopOffsets: {
      linearBottom: [0, 0, 0],
      linearMid: [0, 0, 10],
      linearTop: [0, 0, 10],
      radialEnd: [0, 0, 30],
      radialMid: [0, 0, 40],
      radialStart: [0, 0, 60],
    },
    debugFreezeVisible: false, // keep splash pinned on screen for tuning
    dotsLineHeight: 0.5, // line-height used by the loading dots row only
    // Legacy global interval + step fallback (used if hslStopOffsets entries are missing)
    // hslHueInterval: 0, // per-step hue delta
    // hslSaturationInterval: 0, // per-step saturation delta
    // hslLightnessInterval: 10, // per-step lightness delta
    // gradientStepLinearBottom: 0, // base + interval * step
    // gradientStepLinearMid: 1,
    // gradientStepLinearTop: 2,
    // gradientStepRadialEnd: 2,
    // gradientStepRadialMid: 4,
    // gradientStepRadialStart: 6,
    // gradientLinearBottomAlpha: 0.995,
    // gradientLinearMidAlpha: 0.985,
    // gradientLinearTopAlpha: 0.97,
    // gradientRadialEndAlpha: 0,
    // gradientRadialMidAlpha: 0.16,
    // gradientRadialStartAlpha: 0.36,


    //     hslHueInterval: 0, // per-step hue delta
    // hslSaturationInterval: 0, // per-step saturation delta
    // hslLightnessInterval: 10, // per-step lightness delta
    // gradientStepLinearBottom: 0, // base + interval * step
    // gradientStepLinearMid: 1,
    // gradientStepLinearTop: 2,
    // gradientStepRadialEnd: 2,
    // gradientStepRadialMid: 4,
    // gradientStepRadialStart: 6,
    // gradientLinearBottomAlpha: 1,
    // gradientLinearMidAlpha: 1,
    // gradientLinearTopAlpha: 0.5,
    // gradientRadialEndAlpha: 1,
    // gradientRadialMidAlpha: 1,
    // gradientRadialStartAlpha: 1,



          hslHueInterval: 0, // per-step hue delta
    hslSaturationInterval: 0, // per-step saturation delta
    hslLightnessInterval: 10, // per-step lightness delta
    gradientStepLinearBottom: 0, // base + interval * step
    gradientStepLinearMid: 1,
    gradientStepLinearTop: 2,
    gradientStepRadialEnd: 2,
    gradientStepRadialMid: 4,
    gradientStepRadialStart: 6,
    gradientLinearBottomAlpha: 0,
    gradientLinearMidAlpha: 0,
    gradientLinearTopAlpha: 0,
    gradientRadialEndAlpha: 0,
    gradientRadialMidAlpha: 0,
    gradientRadialStartAlpha: 0,

    // Legacy explicit colors (used only when colorModel === 'explicit')
    // gradientRadialStart: 'rgba(248, 251, 255, 0.36)',
    // gradientRadialMid: 'rgba(238, 243, 248, 0.16)',
    // gradientRadialEnd: 'rgba(255, 255, 255, 0)',
    // gradientLinearTop: 'rgba(28, 38, 52, 0.97)',
    // gradientLinearMid: 'rgba(18, 26, 38, 0.985)',
    // gradientLinearBottom: 'rgba(12, 18, 27, 0.995)',
    washEnabled: false,
    washDurationMs: 1200,
    fadeOutDurationMs: 200,
    washCenterColor: 'rgba(255, 255, 255, 0)',
    washMidColor: 'rgba(255, 255, 255, 0.84)',
    washMid2Color: 'rgba(255, 255, 255, 0.45)',
    washEdgeColor: 'rgba(255, 255, 255, 0.12)',
    washOuterColor: 'rgba(255, 255, 255, 0)',
    washScaleStart: 0.05, // starting bloom scale
    washScaleEnd: 10, // ending bloom scale (increase to fill the whole screen)
    washOpacityStart: 1,
    washOpacityPeak: 0,
    washOpacityEnd: 0,
    washCenterStopPercent: 0, // radial gradient stop locations for bloom
    washMidStopPercent: 25,
    washMid2StopPercent: 48,
    washEdgeStopPercent: 72,
    washOuterStopPercent: 100,
  },

  // wash1: {
  //   enabled: true,
  //   triggerFrame: 56, // fires when hero video playback frame crosses this value
  //   retriggerOnLoop: true,
  //   positionBasis: 'video', // video | viewport
  //   centerXRatio: 0.5,
  //   centerYRatio: 0.5,
  //   offsetXPx: 0,
  //   offsetYPx: 0,
  //   // Uses loadingScreen wash values as fallbacks, but you can override here:
  //   durationMs: 700,
  //   centerColor: 'rgba(255, 229, 61, 0.81)',
  //   midColor: 'rgba(255, 217, 0, 0.44)',
  //   edgeColor: 'rgba(136, 178, 215, 0.61)',
  //   scaleStart: 0.1,
  //   scaleEnd: 10,
  //   opacityStart: 0.3,
  //   opacityPeak: 1,
  //   opacityEnd: 0,
  //   centerStopPercent: 0,
  //   midStopPercent: 25,
  //   edgeStopPercent: 58,
  // },


    wash1: {
    enabled: false,
    triggerFrame: 56, // fires when hero video playback frame crosses this value
    retriggerOnLoop: true,
    positionBasis: 'video', // video | viewport
    centerXRatio: 0.5,
    centerYRatio: 0.67,
    offsetXPx: 0,
    offsetYPx: 0,
    // Uses loadingScreen wash values as fallbacks, but you can override here:
    durationMs: 700,
    centerColor: 'rgb(161, 214, 228)',
    midColor: 'rgba(242, 234, 182, 0.63)',
    mid2Color: 'rgba(255, 246, 209, 0.75)',
    edgeColor: 'rgba(136, 178, 215, 0)',
    outerColor: 'rgba(136, 178, 215, 0)',
    scaleStart: 0.1,
    scaleEnd: 5,
    opacityStart: 1,
    opacityPeak: 1,
    opacityEnd: 0,
    centerStopPercent: 12,
    midStopPercent: 24,
    mid2StopPercent: 34,
    edgeStopPercent: 74,
    outerStopPercent: 100,
  },

  wash2: {
    enabled: false,
    triggerFrame: 175, // fires when hero video playback frame crosses this value
    retriggerOnLoop: true,
    positionBasis: 'video', // video | viewport
    centerXRatio: 0.5,
    centerYRatio: 0.67,
    offsetXPx: 0,
    offsetYPx: 0,
    // Uses loadingScreen wash values as fallbacks, but you can override here:
    durationMs: 2000,
    centerColor: 'rgb(161, 214, 228)',
    midColor: 'rgba(242, 234, 182, 0.63)',
    mid2Color: 'rgba(255, 246, 209, 0.75)',
    edgeColor: 'rgba(136, 178, 215, 0)',
    outerColor: 'rgba(136, 178, 215, 0)',
    scaleStart: 0.1,
    scaleEnd: 5,
    opacityStart: 1,
    opacityPeak: 1,
    opacityEnd: 1,
    centerStopPercent: 12,
    midStopPercent: 24,
    mid2StopPercent: 34,
    edgeStopPercent: 74,
    outerStopPercent: 100,
  },


  centerOverlayImage: {
    enabled: true,
    spritePath: './test_page2.png', // fallback/default page path; section pageIndex controls active page when swipeSections is enabled
    scale: 0.4, // interpreted by scaleMode
    scaleMode: 'videoSizeRatio', // multiplier | videoSizeRatio
    offsetXPx: 0,
    offsetYPx: -0.0520833333, // interpreted by offsetYMode
    offsetYMode: 'videoSizeRatio', // px | videoSizeRatio
    displayAfterFrame: 255,
    maxOpacity: 1,
    fadeInEnabled: true,
    fadeInDurationSec: 0.45,
  },

  swipeSections: {
    enabled: true,
    // Ordered page list used by section.pageIndex (1-based).
    pages: [
      './test_page.png',
      './page_2.1.png',
      './page_3.2.png',
      './page_4.png',
    ],
    // Section count is derived from this array length.
    sections: [
      {
        id: 'section-1',
        frame: 273,
        pageIndex: 1, // 1-based index into swipeSections.pages
        // Optional per-section Y placement override for centerOverlayImage.
        // Ratio uses the same video-size basis as centerOverlayImage.offsetYMode='videoSizeRatio'.
        centerOverlayOffsetYVideoHeightRatio: -0.0520833333,
      },
      {
        id: 'section-2',
        frame: 300,
        pageIndex: 2,
        // centerOverlayOffsetYVideoHeightRatio: -0.0520833333 + -0.095, // example of a per-section Y offset tweak
        centerOverlayOffsetYVideoHeightRatio: -0.0520833333, // example of a per-section Y offset tweak

        button: {
          enabled: true,
          text: 'View Location',
          link: 'https://www.google.com/maps/dir//Sonesta+Hotel+Tower+%26+Casino+Cairo%D8%8C+Sonesta+Cairo+Hotel%D8%8C+3+El+Tayaran+St,+Ash+Sharekat,+Nasr+City,+Cairo+Governorate+4450113%E2%80%AD/@30.0789591,31.314985,17z/data=!4m20!1m10!3m9!1s0x14583e4709298029:0x12ce28bf24f83939!2sSonesta+Hotel+Tower+%26+Casino+Cairo!5m2!4m1!1i2!8m2!3d30.0789591!4d31.3175599!16s%2Fg%2F1tdjn3ms!4m8!1m0!1m5!1m1!1s0x14583e4709298029:0x12ce28bf24f83939!2m2!1d31.3175599!2d30.0789591!3e0!5m1!1e4?entry=ttu&g_ep=EgoyMDI2MDUwMi4wIKXMDSoASAFQAw%3D%3D',
          pngSrc: './loc_pin.png',
          pngFit: 'contain',
          offsetXVideoHeightRatio: 0,
          offsetYVideoHeightRatio: 0.18,
          widthVideoHeightRatio: 0.08,
          heightVideoHeightRatio: 0.08,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          textColor: '#1f1b17',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '18px',
          padding: '8px 16px',
          animation: {
            hoverScale: 1.08,
            transitionDurationMs: 180,
            transitionEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          },
          debug: {
            enabled: false,
            outlineStyle: '2px dashed rgba(255, 20, 20, 0.9)',
            outlineOffset: '3px',
          },
        },
      },
      {
        id: 'section-3',
        frame: 327,
        pageIndex: 3,
        centerOverlayOffsetYVideoHeightRatio: -0.0520833333,
      },
      {
        id: 'section-4',
        frame: 354,
        pageIndex: 4,
        centerOverlayOffsetYVideoHeightRatio: -0.0520833333,
      },
    ],
    input: {
      wheelEnabled: true,
      touchEnabled: true,
      wheelDeltaThresholdPx: 95,
      wheelCooldownMs: 0, // optional legacy throttle after trigger (ms)
      wheelGestureQuietWindowMs: 80, // reset gesture latch after no wheel events for this long (ms)
      wheelGestureResetDeltaPx: 12, // minimum opposite-direction delta to reset latch early (px)
      wheelDirectionResetEnabled: true, // allows immediate opposite-direction wheel gesture reset
      touchSwipeThresholdPx: 42, // minimum touch distance before swipe triggers (px)
      touchMinFlickVelocityPxPerMs: 0.62, // OR-rule with distance threshold; useful for short fast flicks
      touchAxisLockRatio: 1.2,
      touchPreventDefault: true, // preventDefault only after swipe intent is locked
      touchCancelOnMultiTouch: true, // cancel swipe candidate when a second finger appears
      touchRequireOverlayWrapBandStart: true,
      touchFallbackToFullscreenWhenOverlayWrapDisabled: true,
    },
    transition: {
      timingMode: 'matchFrameDelta', // matchFrameDelta | fixedDuration | instant
      speedMultiplier: 1, // >1 is faster
      fixedDurationMs: 520, // used only by timingMode=fixedDuration
      minDurationMs: 220,
      maxDurationMs: 6000,
      rapidSwipeMode: 'ignore', // canonical toggle: ignore | retarget
    },
    overlayTransition: {
      mode: 'fade', // fade | none
      fadeOutDurationMs: 170,
      fadeInDurationMs: 230,
      swapNearTargetProgress: 0.85, // 0..1; when the target image path swaps during section travel
    },
    rsvp: {
      enabled: true,
      sectionId: 'section-3',
      initialState: {
        name: '',
        response: null, // yes | no | null
      },
      nameField: {
        offsetXVideoHeightRatio: 0,
        offsetYVideoHeightRatio: -0.11,
        widthVideoHeightRatio: 0.36,
        heightVideoHeightRatio: 0.088,
        fontFamily: 'ZeinaRsvpScript',
        fontSourcePath: './PinyonScript-Regular.ttf', // local path to font file, e.g. './fonts/ZeinaRsvpScript.woff2'
        fontWeight: 500,
        fontStyle: 'normal',
        fontSizeVideoHeightRatio: 0.042,
        textColor: '#1f1b17',
        textAlign: 'center',
        maxLength: 120,
        autoFitEnabled: true,
        autoFitMinFontSizeRatio: 0.62, // min rendered size = base font size * this ratio
        autoFitStepPx: 0.5, // shrink step used while text overflows field width
        autoFitHorizontalPaddingPx: 4, // reserved horizontal fit margin inside the field
      },
      debug: {
        enabled: false, // set true to render RSVP layout debug rectangles
        showNameFieldRect: true,
        showButtonRects: true,
        showConfirmButtonRect: true,
        strokeColor: 'rgba(255, 120, 120, 0.95)',
        lineWidthPx: 2,
      },
      buttons: {
        spritePath: './yes&no.png', // sprite-sheet path (2x2 default mapping: yes row0, no row1; unselected col0, selected col1)
        spriteCellWidth: 44,
        spriteCellHeight: 44,
        spriteScale: 8.3295454546,
        spriteCols: 2,
        spriteRows: 2,
        yes: {
          offsetXVideoHeightRatio: -0.081,
          offsetYVideoHeightRatio: 0.098,
          widthVideoHeightRatio: 0.11,
          heightVideoHeightRatio: 0.11,
        },
        no: {
          offsetXVideoHeightRatio: 0.081,
          offsetYVideoHeightRatio: 0.098,
          widthVideoHeightRatio: 0.11,
          heightVideoHeightRatio: 0.11,
        },
        confirm: {
          enabled: true,
          offsetXVideoHeightRatio: 0,
          offsetYVideoHeightRatio: 0.2,
          widthVideoHeightRatio: 0.14,
          heightVideoHeightRatio: 0.07,
          spritePath: 'confirm.png', // optional dedicated confirm sprite-sheet path; empty = fallback to default button sprite
          spriteCellWidth: 733,
          spriteCellHeight: 366.5,
          spriteScale: 1,
          spriteCols: 1,
          spriteRows: 2,
          unselectedRow: 0,
          selectedRow: 1,
          col: 0,
          appsScript: {
            enabled: true,
            webAppUrl: 'https://script.google.com/macros/s/AKfycbyYesFFD1SUCSgvCtEzR9fAB3Qo-iFRBflAwGSdYIWhD4Py_1P5QW2L1EVq4OcCamcdUw/exec', // paste deployed Google Apps Script Web App URL
            mode: 'no-cors',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            payload: {}, // optional extra fields merged into { name, rsvp }
          },
          submitUrl: '',
          submitMethod: 'POST',
          submitHeaders: {
            'Content-Type': 'application/json',
          },
          submitPayload: {},
        },
        animation: {
          hoverScale: 1.06,
          selectedScale: 1.14, // post-click persistent enlargement
          transitionDurationMs: 180,
          transitionEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
  },

  floralResponsiveScale: {
    enabled: true,
    // [viewportWidthCssPx, scaleFactor]
    points: [
      [390, 0.62],
      [768, 0.78],
      [1024, 0.9],
      [1366, 1.0],
    ],
    globalMultiplier: 1.5, // global floral size multiplier (applies to full foliage: branches + leaves + flowers)
    pointerModifierEnabled: true,
    pointerCoarseMultiplier: 0.95, // touch-first devices
    pointerFineMultiplier: 1.0, // mouse/trackpad devices
    pointerNoneMultiplier: 1.0,
    pointerUnknownMultiplier: 1.0,
    dprModifierEnabled: false,
    dprBaseline: 2,
    dprStrength: 0.14, // mild; > baseline shrinks slightly, < baseline grows slightly
    dprMultiplierClamp: [0.92, 1.08],
    landscapeModifierEnabled: true,
    landscapeMultiplier: 1.5, // applied only when viewportWidth > viewportHeight
    finalScaleClamp: [0.25, 10],
  },

  overlayWrap: {
    enabled: true,
    animationOnly: false,
    centerHalfWidthPxFromVideoEnabled: true,
    centerHalfWidthPxVideoHeightRatio: 0.187760416667, // 16.2760416667% of rendered hero video height
    centerHalfWidthPxVideoHeightRatioBottom: 0.21, // second width ratio used below the switch Y
    centerHalfWidthSwitchYVideoHeightRatio: 0.78, // switch Y as % of initially sampled video height (0..1 or 0..100)
    centerHalfWidthPx: 50, // fallback when video size is unavailable
    skipHiddenBackDrawEnabled: true,
    spriteHiddenCullInnerPaddingPx: 0,
    spriteHiddenCullRadiusScale: 0.2, // 0.05..1 scales the hidden-cull test circle radius
    debugHiddenSpriteCullCirclesEnabled: false,
    debugHiddenSpriteCullCirclesMode: 'culled', // culled | all
    debugHiddenSpriteCullCirclesMaxPerFrame: 400,
    debugHiddenSpriteCullCircleStrokeVisible: 'rgba(90, 220, 120, 0.55)',
    debugHiddenSpriteCullCircleStrokeCulled: 'rgba(255, 80, 80, 0.65)',
    debugHiddenSpriteCullCircleLineWidth: 1,
    showCenterBandOverlay: false,
    centerBandOverlayFill: 'rgba(255, 95, 95, 0.16)',
    centerBandOverlayStroke: 'rgba(255, 95, 95, 0.85)',
    centerBandOverlayLineWidth: 1.5,
  },

  motion: {
    swayMode: 'influence', // always | influence
    maxSwayFps: 24, // <=0 disables cap for interaction-only render loop
    leafViewportCullingEnabled: true,
    flowerViewportCullingEnabled: true,
    swayFastPathEnabled: true,
    swayPerfLogEnabled: false,
  },

  renderDpr: {
    enabled: true,
    mobileOnly: true,
    mobileCap: 2,
    desktopCap: null, // ignored when mobileOnly=true; null disables desktop cap
  },

  safariTopTintShim: {
    enabled: true, // iOS Safari 26 top-bar tint shim experiment
    iosOnly: true,
    iosMinMajor: 26,
    rootBackgroundOnly: false, // false => allow shim on base relative166 mode too
    opacity: 0.01, // if Safari ignores this, set to 1 while keeping shim height tiny
  },

  flowers: {
    enabled: true,
    renderer: 'pixi', // pixi | canvas
    pixiEnabled: true,
    baked: {
      enabled: false,
      manifestPath: './flowers/flowers_atlas_manifest_master.json',
      fallbackToLive: false,
      allowFilenameFallback: true,
      forceCanvasRenderer: true,
      playbackFps: 0, // 0 = use FPS from manifest
      playbackSpeedMultiplier: 1.6, // >1 speeds up baked motion cycle playback
      neutralFrameIndex: null, // null = use neutral index from manifest
      frameInterpolationEnabled: false, // when true: nearest-frame interpolation (no alpha cross-fade)
      logEnabled: false,
    },
    performanceProfile: 'auto', // auto | desktop | mobile
    autoProfile: {
      mobileMaxHardwareConcurrency: 6,
      mobileMinDevicePixelRatio: 2,
      mobileMaxViewportWidth: 1024,
      influenceDynamicCapRange: [14, 20], // [min, max] chosen by device budget
      influenceNoPointerFallBoostRange: [3.0, 4.0], // [min, max]
      mouseSpeedSwayAffectRange: [0.1, 0.2], // [min, max]
      interactionRadiusScaleRange: [0.82, 1.0], // [min, max] multiplier on swayInteractionRadiusFactor
      minSwayFallSpeed: 1.5,
    },
    assignmentMode: 'mixed', // single | mixed
    singleType: 'lily',
    mixRatios: {

      lily: 1,
      blue: 1,
    },
    endpointDirectionTailLengthPx: 26,
    endpointDirectionSampleCount: 5,
    drawSize: 67,
    swayInteractionRadiusFactor: 3.1,
    swayRiseSpeed: 5.5,
    swayFallSpeed: 0.5,
    swayEpsilon: 0.0008,
    mouseSpeedSwayAffect: 0.7,
    influenceDynamicCapEnabled: true,
    influenceDynamicCap: 28,
    influenceNoPointerFallBoost: 1.2,
    influenceJumpCountsTowardCap: true,
    alwaysAnimatedCacheEnabled: true,
    alwaysAnimatedCacheFps: 12,
    swaySpriteDebugEnabled: false,
    swaySpriteDebugFrameStep: 1,
    blueSwayRotateAroundPetalOrigin: false,
    blueJumpRotateAroundPetalOrigin: true,
    swayJumpRotateAroundPetalOrigin: true,
    jumpEnabled: true,
    jumpInteractionRadiusFactor: 1.4,
    jumpStrengthDeg: 15,
    jumpAttackSpeedDegPerSec: 60,
    jumpReturnSpeedDegPerSec: 55,
    jumpDistanceExponent: 1,
    jumpJitterDeg: 30,
    jumpEpsilonDeg: 0.5,
    backfacing: false,
    petalToggleAnimationDurationSec: 0.4,
    petalToggleAnimationEasePower: 1,
    petalToggleOpenBounceAmount: 0.6,
    petalToggleOpenBounceOscillations: 1,
    petalToggleSpriteSwapProgress: 0.97,
    petalToggleEdgePairFlipEnabled: false,
    petalToggleEdgePairFlipBackProgress: 0.67,
    petalToggleEdgePairUseInnerSpritesEnabled: true,
    petalTogglePairSpeedDisparityEnabled: true,
    petalTogglePairSpeedStep: 0.1,
    petalTogglePairSpeedCurve: 0,
    performance: {
      activeLayerCacheEnabled: true,
      logEnabled: false,
      logIntervalMs: 1000,
    },
    types: {
      lily: {
        method: 'sweep3', // legacy | sweep | sweep2 | sweep3
        spritePath: './lily_sprite.png',
        spriteCellWidth: 44,
        spriteCellHeight: 44,
        spriteScale: 8.3333333,
        spriteCols: 8,
        spriteRows: 6,
        spriteRow: 1,
        petalCountRange: [8, 8],
        alignToBranchDirection: true,
        alignmentDamping: 0.3,
        petalBaseCenterDeg: 50,
        petalSpreadDeg: 70,
        displacementSpace: 'flower', // flower | screen
        stamenRowMode: 'fixedRow', // petalRow | fixedRow
        stamenFixedRow: 1, // 1-based row
        stamenCount: 2, // total stamens per flower
        stamenAdditionalMode: 'rowList', // randomRows | rowList
        stamenRowList: [2,3,4,5,6,7,8], // 1-based rows used when stamenAdditionalMode='rowList'
        closedUseMiddlePetalSprite: true, // if true, closed lilies use the closed-lily sheet (random variant per flower)
        closedSpritePath: './closed_lily.png',
        closedSpriteCols: 8,
        closedSpriteRows: 1,
        closedSpriteScale: 4.1590909091,
        growth: {
          enabled: true,
          tipLeadFraction: 0.4, // 0..1, show flower this far before branch tip reaches final endpoint
          sizeMinScale: 0.05, // 0..1 fraction of final lily draw size
          sizeDurationSec: 4, // time from minScale to full size
          sizeEase: 'easeInOut', // linear | easeIn | easeOut | easeInOut
          sizeEasePower: 4, // easing curve strength
          openAutoEnabled: true, // when false, lilies remain closed after growth
          openDelayMs:200, // delay after branch growth completes before lilies begin opening
          openSweepDirection: 'down', // down = top lilies open first, up = bottom lilies open first
          openSweepDurationSec: 0.8, // time for the lily-open wave to travel across flowers
          openPetalDurationSec: 0.4, // per-lily opening duration once wave reaches it
          openPetalEase: 'easeOut', // linear | easeIn | easeOut | easeInOut
          openPetalEasePower: 2, // easing curve strength for per-lily opening
        },
        pairRotationDegByRowPair: {
          1: { 1: 20, 2: 13, 3: 30},
          2: { 1: 15, 2: 10, 3: 48 },
          3: { 1: 15, 2: 20, 3: 60 },
          4: { 1: 10, 2: 10, 3: 45 },
          5: { 1: 10, 2: 15, 3: 30 },
          6: { 1: 20, 2: 10, 3: 70 },
          7: { 1: 0, 2: 0, 3: 0 },
          8: { 1: 0, 2: 0, 3: 0 },
        },
        pairDisplacementYByRowPair: {
          1: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 5, left: 5 } },
          2: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 10, left: 12 } },
          3: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 2, left: 5 } },
          4: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 4, left: 0 } },
          5: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          6: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 13, left: 10 } },
          7: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          8: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
        },
        pairDisplacementXByRowPair: {
          1: { 1: { right: 0, left: -5 }, 2: { right: 0, left: 0 }, 3: { right: -5, left: -5 } },
          2: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 5, left: 3 } },
          3: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 6, left: 9 } },
          4: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          5: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          6: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 5, left: 7 } },
          7: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          8: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
        },
        hoverAmplitudeDegRange: [2, 12],
        hoverSpeedRange: [2.2, 4.2],
      },
      blue: {
        spritePath: './blue_sprite_2_upscaled.png',
        spritePathPool: [
          './blue_sprite_2.png','./blue_sprite_1.png','./blue_sprite_3.png', './blue_sprite.png',
          './blue_sprite_2.png'

          // './blue_sprite_4.2.png', './blue_sprite_5.png'
        ], // one full sprite sheet is picked per blue flower
        spriteCellWidth: 44,
        spriteCellHeight: 44,
        spriteScale: 8.3333333,
        spriteCols: 10,
        spriteRows: 10,
        baseSize: 50, // circle radius in px for point cloud generation
        density: 130, // fixed number of points per flower
        centerBiasExponent: 1, // larger = stronger center clustering
        pointDrawSize: 40,
        drawOrder: 'random', // outerFirst | random
        growth: {
          enabled: true,
          tipLeadFraction: 0.4, // 0..1, show flower this far before branch tip reaches final endpoint
          sizeMinScale: 0.09, // 0..1 fraction of final blue point sprite size
          sizeDurationSec: 3.5, // time for blue point sprite size growth
          sizeEase: 'easeIn', // linear | easeIn | easeOut | easeInOut
          sizeEasePower: 4, // easing curve strength for blue point sprite size growth
          sizeEaseInPower: 4.5, // used by easeIn/easeInOut entry-half; defaults to sizeEasePower
          sizeEaseOutPower: 4, // used by easeOut/easeInOut exit-half; defaults to sizeEasePower
          positionMinScale: 0.05, // 0..1 radial spread from center at spawn time
          positionDurationSec: 5, // time for blue radial spread growth
          positionEase: 'easeInOut', // linear | easeIn | easeOut | easeInOut
          positionEasePower: 4, // easing curve strength for blue radial spread growth
          positionEaseInPower: 3, // used by easeIn/easeInOut entry-half; defaults to positionEasePower
          positionEaseOutPower: 4, // used by easeOut/easeInOut exit-half; defaults to positionEasePower
        },
        hoverAmplitudeDegRange: [2, 6],
        hoverSpeedRange: [2.2, 4.2],
      },
    },
  },

  leaves: {
    enabled: true,
    deterministic: true,
    spritePath: './leaves_new.png',
    spriteCellWidth: 44,
    spriteCellHeight: 45.819,
    spriteScale: 8.3333333,
    spriteCols: 10,
    spriteRows: 8,
    spriteRowRange: [0, 2], // 1-based inclusive [min, max]
    drawSize: 30,
    drawSizeRange: [30,70], // [min, max]; overrides fixed drawSize when provided
    drawSizeBaseMultiplier: 0.1, // 1 at branch base, linearly blends to this value at branch tip
    drawSizeBaseMultiplierEaseIn: 0.1, // 0 = linear; closer to 1 delays size change until near the tip
    growthEnabled: true,
    growthMinScale: 0.05, // 0..1 fraction of final leaf drawSize
    growthDurationSec: 1, // time from minScale to full size
    growthEase: 'easeOut', // linear | easeIn | easeOut | easeInOut
    growthEasePower: 2, // easing curve strength
    swayEnabled: true,
    swayInteractionRadiusFactor: 2.1,
    swayRiseSpeed: 5.5,
    swayFallSpeed: 0.5,
    swayEpsilon: 0.0008,
    mouseSpeedSwayAffect: 0.7,
    swayAmplitudeDegRange: [0.8, 12.6],
    swaySpeedRange: [1.9, 2.8],
    countRange: [2, 10],
    spawnTMin: 0.01,
    spawnTMax: 0.5,
    spawnBiasMode: 'towardBase', // uniform | towardBase | towardTip
    spawnBiasExponent: 4, // >1 strengthens bias
    minSpawnSpacingT: 0.001,
    maxSpawnAttemptsPerLeaf: 1,
    sideMode: 'alternate', // random | left | right | alternate
    rotationAwayFromNormalDegRange: [0,80],
  },

  performance: {
    enabled: false,
    logIntervalMs: 1000,
  },

  debug: {
    // enabled: true,
    showStripBounds: false,
    showStripCenters: true,
    showPathOutline: true,
    showTangents: false,
    showNormals: false,
    showControlPoints: true,
    showControlCurve: true,
    pathSampleStep: 8,
    vectorSampleSpacing: 120,
  },
    };
  }

  global.STEM_WARP_USER_CONFIG = createStemWarpUserConfig({
    gradient: undefined,
    valScaling: 0.0001,
    defaultCountPerSide: 9,
  });
})(typeof window !== 'undefined' ? window : globalThis);
