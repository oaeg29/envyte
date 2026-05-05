(function initStemWarpUserConfig(global) {
  global.STEM_WARP_USER_CONFIG = {
    globalFoliageScale: 0.85,

    pathGeneration: {
      mode: 'manualTemplate',
      templateScaleRangeMin: 0.2,
      templateScaleRangeMax: 0.5,
      baseRotationDeg: 5,
      fixedTemplateIndex: 2,
    },

    seeds: {
      countPerSide: 9,
      mode: 'explicitYRatios',
      explicitYRatioBasis: 'video',
      explicitYRatios: [0.05, 0.1, 0.3, 0.5, 0.4, 0.45, 0.89, 0.85, 0.9],
    },

    offshoot: {
      enabled: true,
      maxDepth: 1,
      countRange: [0, 10],
      angleDegRange: [45, 45],
      templateIndexPool: [2],
      centerBlockEnabled: true,
      centerBlockHalfWidthPxVideoHeightRatio: 0.182,
      centerBlockHalfHeightAbovePxVideoHeightRatio: 0.8,
      centerBlockHalfHeightBelowPxVideoHeightRatio: 0.8,
    },

    branchGrowth: {
      enabled: true,
      mode: 'linearBySeedY',
      linearSweepDirection: 'up',
      linearSweepDurationSec: 3.25,
      speedMode: 'rate',
      pixelsPerSecond: 160,
      growthEase: 'easeOut',
      growthEasePower: 1,
      autoStart: true,
      requireFoliageLoadedBeforeStart: true,
    },

    heroPlaybackGate: {
      enabled: true,
      frameRate: 30,
      introPauseFrame: 125,
      postButtonPauseFrame: 261,
      growthStartFrame: 253,
      openButton: {
        centerXRatio: 0.498,
        centerYRatio: 0.7897135,
        diameterRatio: 0.062,
        hitMarginPercentOfButtonSize: 150,
      },
      videoWiggle: {
        enabled: true,
        maxAngleDeg: 5.4,
        durationMs: 760,
        speedHz: 5.8,
        dampingStrength: 3.2,
        delayAfterIntroPauseMs: 0,
      },
      openButtonArrow: {
        enabled: true,
        spritePath: './arrow_2.png',
        centerXRatio: 0.498,
        centerYRatio: 0.42,
        sizeRatio: 0.19,
        appearAfterFrame: 90,
        fadeOutDurationSec: 0.45,
      },
    },

    heroVideoDebug: {
      enabled: true,
      iosOnly: true,
      frameRate: 30,
      testFrameCount: 150,
      requireCanPlayTypeCheck: true,
      labelEnabled: true,
      holdAfterEachMs: 300,
      loadTimeoutMs: 15000,
      playTimeoutMs: 15000,
      chooseFirstPlayableAsFinalSource: true,
      candidateSources: [
        {
          path: './hero_vid_for_ios.mov',
          type: 'video/quicktime; codecs="hvc1.1.6.H120.b0"',
        },
        {
          path: './hero_vid_for_ios_1.mp4',
          type: 'video/mp4; codecs="hvc1"',
        },
        {
          path: './hero_vid_for_ios_2.mp4',
          type: 'video/mp4; codecs="hvc1"',
        },
        {
          path: './hero_vid_for_ios_3.mov',
          type: 'video/quicktime; codecs="hvc1.1.6.H120.b0"',
        },
        {
          path: './hero_vid_for_ios_4.mov',
          type: 'video/quicktime; codecs="hvc1.1.6.H120.b0"',
        },
        {
          path: './vids/hero_vid_for_ios.mp4',
          type: 'video/mp4; codecs="hvc1"',
        },
        {
          path: './vids/hero_vid_for_ios_clean.mp4',
          type: 'video/mp4; codecs="hvc1"',
        },
      ],
      candidatePaths: [
        './hero_vid_for_ios.mov',
        './hero_vid_for_ios_1.mp4',
        './hero_vid_for_ios_2.mp4',
        './hero_vid_for_ios_3.mov',
        './hero_vid_for_ios_4.mov',
        './vids/hero_vid_for_ios.mp4',
        './vids/hero_vid_for_ios_clean.mp4',
      ],
    },

    overlayWrap: {
      enabled: true,
      centerHalfWidthPxFromVideoEnabled: true,
      centerHalfWidthPxVideoHeightRatio: 0.187760416667,
      centerHalfWidthPxVideoHeightRatioBottom: 0.21,
      centerHalfWidthSwitchYVideoHeightRatio: 0.78,
      skipHiddenBackDrawEnabled: false,
      showCenterBandOverlay: false,
    },

    floralResponsiveScale: {
      enabled: true,
      globalMultiplier: 1.5,
      landscapeModifierEnabled: true,
      landscapeMultiplier: 3.0,
    },

    motion: {
      swayMode: 'influence',
      maxSwayFps: 24,
      swayPerfLogEnabled: false,
    },

    flowers: {
      enabled: true,
      renderer: 'pixi',
      baked: {
        enabled: false,
        manifestPath: './flowers/flowers_atlas_manifest_master.json',
        fallbackToLive: false,
        playbackSpeedMultiplier: 1.6,
        frameInterpolationEnabled: false,
      },
      assignmentMode: 'mixed',
      mixRatios: {
        lily: 1,
        blue: 1,
      },
      drawSize: 67,
      swayInteractionRadiusFactor: 3.1,
      influenceDynamicCapEnabled: true,
      influenceDynamicCap: 28,
    },

    leaves: {
      enabled: true,
      spritePath: './leaves_new.png',
      spriteCols: 10,
      spriteRows: 8,
      spriteRowRange: [0, 2],
      drawSizeRange: [30, 70],
      swayAmplitudeDegRange: [0.8, 12.6],
      swaySpeedRange: [1.9, 2.8],
      countRange: [2, 10],
      spawnBiasMode: 'towardBase',
      spawnBiasExponent: 4,
    },

    performance: {
      enabled: false,
      logIntervalMs: 1000,
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
