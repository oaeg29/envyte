(function initStemWarpConfigDefaults(global) {
  function createStemWarpConfigDefaults(runtime) {
    const safeRuntime = runtime && typeof runtime === 'object' ? runtime : {};
    const gradient = safeRuntime.gradient;
    const valScaling = Number.isFinite(Number(safeRuntime.valScaling)) ? Number(safeRuntime.valScaling) : 0.01;
    const defaultCountPerSide = Number.isFinite(Number(safeRuntime.defaultCountPerSide))
      ? Math.max(1, Math.floor(Number(safeRuntime.defaultCountPerSide)))
      : 9;

    return {
  backgroundColor: 'transparent',
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
    startOffset: 0,
    cropPartialRepeat: true,
  },

  seeds: {
    countPerSide: defaultCountPerSide,
    sidePad: -0.85 * window.innerWidth,
    sideMargin: 2,
    mode: 'explicitYRatios', // autoSpacing | explicitYRatios
    explicitYRatioBasis: 'video', // video | viewport
    explicitYRatios: [0.05, 0.1, 0.3, 0.5, 0.4 , 0.45, 0.89, 0.85, 0.9], // shared ratios for both sides (0..1 or 0..100)
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
    angleDegRange: [45,45],
    sideMode: 'alternate', // random | left | right | alternate
    depthScale: 0.6,
    minSpawnSpacingT: 0.02,
    maxSpawnAttemptsPerChild: 800,
    maxTotalBranches: 200,
    pathGenerationMode: 'inherit', // inherit | random | manualTemplate
    templateIndexPool: [2], // e.g. [1, 4, 7] => randomly pick one for each offshoot
    centerBlockEnabled: true, // clip offshoot branches when they enter the center block area
     centerBlockHalfWidthPxVideoHeightRatio: 0.182, // X half-width as ratio of sampled video height
    centerBlockHalfHeightAbovePxVideoHeightRatio: 0.8, // Y extent above center as ratio of sampled video height
    centerBlockHalfHeightBelowPxVideoHeightRatio: 0.8,  // Y extent below center as ratio of sampled video height
  },

  branchGrowth: {
    enabled: true,
    mode: 'linearBySeedY', // simultaneous | linearBySeedY
    linearSweepDirection: 'up', // down (top->bottom) | up (bottom->top)
    linearSweepDurationSec: 3.25, // sweep time across root seed Y range
    speedMode: 'rate', // duration | rate
    totalDurationSec: 1.5,
    pixelsPerSecond: 160,
    growthEase: 'easeOut', // linear | easeIn | easeOut | easeInOut
    growthEasePower: 1,
    autoStart: true,
    requireFoliageLoadedBeforeStart: true,
    useOffscreenLayerCache: true,
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
    postButtonPauseFrame: 261,
    growthStartFrame: 253,
    pauseGuardFrames: 2,
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
      centerYRatio: 0.7897135, // 78.97135% of rendered video height
      diameterRatio: 0.062, // 6.2% of rendered video size (min(width,height))
      hitMarginPercentOfButtonSize: 150, // 0..100 extra size percentage
      enableBeforeIntroPauseFrames: 10, // enable interaction this many frames before introPauseFrame
    },
    openButtonDebug: {
      enabled: true,
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

  centerOverlayImage: {
    enabled: true,
    spritePath: './test_page2.png',
    scale: 0.25,
    offsetXPx: 0,
    offsetYPx: -80,
    displayAfterFrame: 255,
    maxOpacity: 1,
    fadeInEnabled: true,
    fadeInDurationSec: 0.45,
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
    globalMultiplier: 1.5, // global floral size multiplier (applies to leaves + flowers)
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
    landscapeMultiplier: 3.0, // applied only when viewportWidth > viewportHeight
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
    skipHiddenBackDrawEnabled: false,
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
    mobileCap: 2.0,
    desktopCap: null, // ignored when mobileOnly=true; null disables desktop cap
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
        closedUseMiddlePetalSprite: true, // if true, closed lilies use middle petal sprite for every petal
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

  global.createStemWarpConfigDefaults = createStemWarpConfigDefaults;
})(typeof window !== 'undefined' ? window : globalThis);
