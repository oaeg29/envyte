(function initStemWarpUserConfig(global) {
  global.STEM_WARP_USER_CONFIG = {
  backgroundColor: undefined,
  globalFoliageScale: 0.85,
  noise: {
    stepSize: 0.1,
    scale: 20,
    timeStep: 0.0033333333333333335,
    checkpointCount: 20,
    checkpointSpacingSteps: 2
  },
  path: {
    smoothingSubdivisionsPerSpan: 10
  },
  pathGeneration: {
    mode: 'manualTemplate',
    useAbsoluteNoiseX: false,
    useAbsoluteNoiseY: false,
    absoluteNoiseXRatio: 0.4,
    absoluteNoiseYRatio: 0.9,
    templateScaleRangeMin: 0.2,
    templateScaleRangeMax: 0.5,
    baseRotationDeg: 5,
    templateNoiseAmount: 0.4,
    templateNoiseStep: 0.13333333333333333,
    templateNoiseAmount2: 0.25,
    templateNoiseStep2: 2,
    templateNoiseAmount3: 0.4,
    templateNoiseStep3: 0.3333333333333333,
    templateNoiseHighpassWindow3: 23,
    templateNoiseDirectionalBias: 0.8,
    templateInheritCheckpointSpacingSteps: true,
    alignTemplateToGrowth: true,
    templatePickMode: 'random',
    templatePickDeterministic: true,
    fixedTemplateIndex: 2,
    manualTemplates: []
  },
  brush: {
    stripWidth: 0.3,
    scale: 0.18,
    sclale: undefined,
    thicknessTaperEnabled: true,
    thicknessMinScale: 0.48,
    thicknessTaperExponent: 0.2,
    thicknessMinWidth: 0,
    globalHueDeg: 5,
    globalBrightness: 0.89,
    randomizeBranchFilter: true,
    randomHueMinDeg: 15,
    randomHueMaxDeg: 0,
    randomBrightnessMin: 1.05,
    randomBrightnessMax: 0.9,
    randomFilterVariantCount: 15,
    randomFilterAssignmentMode: 'inheritParent',
    pathOffset: 0,
    repeatGap: 0,
    repeatOverlap: 0.13,
    startOffset: 0,
    cropPartialRepeat: true
  },
  seeds: {
    countPerSide: 9,
    sidePad: -0.85 * window.innerWidth,
    sideMargin: 2,
    mode: 'explicitYRatios',
    explicitYRatioBasis: 'video',
    explicitYRatios: [
      0.05,
      0.1,
      0.3,
      0.5,
      0.4,
      0.45,
      0.89,
      0.85,
      0.9
    ],
    explicitYRatiosBySide: null,
    explicitYRatiosLeft: null,
    explicitYRatiosRight: null,
    startY: window.innerHeight * 0.05,
    randomizeSpacing: true,
    minSpacing: window.innerHeight / 9,
    maxSpacing: null
  },
  offshoot: {
    enabled: true,
    deterministic: true,
    maxDepth: 1,
    countRange: [
      0,
      10
    ],
    spawnTMin: 0.01,
    spawnTMax: 0.96,
    biasExponent: 1.6,
    angleDegRange: [
      45,
      45
    ],
    sideMode: 'alternate',
    depthScale: 0.6,
    minSpawnSpacingT: 0.02,
    maxSpawnAttemptsPerChild: 800,
    maxTotalBranches: 200,
    pathGenerationMode: 'inherit',
    templateIndexPool: [
      2
    ],
    centerBlockEnabled: true,
    centerBlockHalfWidthPxVideoHeightRatio: 0.182,
    centerBlockHalfHeightAbovePxVideoHeightRatio: 0.8,
    centerBlockHalfHeightBelowPxVideoHeightRatio: 0.8
  },
  branchGrowth: {
    enabled: true,
    mode: 'linearBySeedY',
    linearSweepDirection: 'up',
    linearSweepDurationSec: 3.25,
    speedMode: 'rate',
    totalDurationSec: 1.5,
    pixelsPerSecond: 160,
    growthEase: 'easeOut',
    growthEasePower: 1,
    autoStart: true,
    requireFoliageLoadedBeforeStart: true,
    useOffscreenLayerCache: true
  },
  frameJumpHotkeys: {
    enabled: true,
    timelineFps: 30,
    bindings: {
      '1': 0,
      '2': 130,
      '3': 261,
      '4': null,
      '5': null,
      '6': null
    }
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
      delayAfterIntroPauseMs: 0
    },
    openButton: {
      centerXRatio: 0.498,
      centerYRatio: 0.7897135,
      diameterRatio: 0.062,
      hitMarginPercentOfButtonSize: 150,
      enableBeforeIntroPauseFrames: 10
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
      lineWidthPx: 2
    },
    openButtonArrow: {
      enabled: true,
      spritePath: './arrow_2.png',
      centerXRatio: 0.498,
      centerYRatio: 0.42,
      sizeRatio: 0.19,
      appearAfterFrame: 90,
      maxOpacity: 1,
      fadeOutAfterOpenButtonClick: true,
      fadeOutDurationSec: 0.45
    }
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
    fadeInDurationSec: 0.45
  },
  floralResponsiveScale: {
    enabled: true,
    points: [
      [
        390,
        0.62
      ],
      [
        768,
        0.78
      ],
      [
        1024,
        0.9
      ],
      [
        1366,
        1
      ]
    ],
    globalMultiplier: 1.5,
    pointerModifierEnabled: true,
    pointerCoarseMultiplier: 0.95,
    pointerFineMultiplier: 1,
    pointerNoneMultiplier: 1,
    pointerUnknownMultiplier: 1,
    dprModifierEnabled: false,
    dprBaseline: 2,
    dprStrength: 0.14,
    dprMultiplierClamp: [
      0.92,
      1.08
    ],
    landscapeModifierEnabled: true,
    landscapeMultiplier: 3,
    finalScaleClamp: [
      0.25,
      10
    ]
  },
  overlayWrap: {
    enabled: true,
    animationOnly: false,
    centerHalfWidthPxFromVideoEnabled: true,
    centerHalfWidthPxVideoHeightRatio: 0.187760416667,
    centerHalfWidthPxVideoHeightRatioBottom: 0.21,
    centerHalfWidthSwitchYVideoHeightRatio: 0.78,
    centerHalfWidthPx: 50,
    skipHiddenBackDrawEnabled: false,
    showCenterBandOverlay: false,
    centerBandOverlayFill: 'rgba(255, 95, 95, 0.16)',
    centerBandOverlayStroke: 'rgba(255, 95, 95, 0.85)',
    centerBandOverlayLineWidth: 1.5
  },
  motion: {
    swayMode: 'influence',
    maxSwayFps: 24,
    leafViewportCullingEnabled: true,
    flowerViewportCullingEnabled: true,
    swayFastPathEnabled: true,
    swayPerfLogEnabled: false
  },
  flowers: {
    enabled: true,
    renderer: 'pixi',
    pixiEnabled: true,
    baked: {
      enabled: false,
      manifestPath: './flowers/flowers_atlas_manifest_master.json',
      fallbackToLive: false,
      allowFilenameFallback: true,
      forceCanvasRenderer: true,
      playbackFps: 0,
      playbackSpeedMultiplier: 1.6,
      neutralFrameIndex: null,
      frameInterpolationEnabled: false,
      logEnabled: false
    },
    performanceProfile: 'auto',
    autoProfile: {
      mobileMaxHardwareConcurrency: 6,
      mobileMinDevicePixelRatio: 2,
      mobileMaxViewportWidth: 1024,
      influenceDynamicCapRange: [
        14,
        20
      ],
      influenceNoPointerFallBoostRange: [
        3,
        4
      ],
      mouseSpeedSwayAffectRange: [
        0.1,
        0.2
      ],
      interactionRadiusScaleRange: [
        0.82,
        1
      ],
      minSwayFallSpeed: 1.5
    },
    assignmentMode: 'mixed',
    singleType: 'lily',
    mixRatios: {
      lily: 1,
      blue: 1
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
      logIntervalMs: 1000
    },
    types: {
      lily: {
        method: 'sweep3',
        spritePath: './lily_sprite.png',
        spriteCellWidth: 44,
        spriteCellHeight: 44,
        spriteScale: 8.3333333,
        spriteCols: 8,
        spriteRows: 6,
        spriteRow: 1,
        petalCountRange: [
          8,
          8
        ],
        alignToBranchDirection: true,
        alignmentDamping: 0.3,
        petalBaseCenterDeg: 50,
        petalSpreadDeg: 70,
        displacementSpace: 'flower',
        stamenRowMode: 'fixedRow',
        stamenFixedRow: 1,
        stamenCount: 2,
        stamenAdditionalMode: 'rowList',
        stamenRowList: [
          2,
          3,
          4,
          5,
          6,
          7,
          8
        ],
        closedUseMiddlePetalSprite: true,
        pairRotationDegByRowPair: {
          '1': {
            '1': 20,
            '2': 13,
            '3': 30
          },
          '2': {
            '1': 15,
            '2': 10,
            '3': 48
          },
          '3': {
            '1': 15,
            '2': 20,
            '3': 60
          },
          '4': {
            '1': 10,
            '2': 10,
            '3': 45
          },
          '5': {
            '1': 10,
            '2': 15,
            '3': 30
          },
          '6': {
            '1': 20,
            '2': 10,
            '3': 70
          },
          '7': {
            '1': 0,
            '2': 0,
            '3': 0
          },
          '8': {
            '1': 0,
            '2': 0,
            '3': 0
          }
        },
        pairDisplacementYByRowPair: {
          '1': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 5,
              left: 5
            }
          },
          '2': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 10,
              left: 12
            }
          },
          '3': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 2,
              left: 5
            }
          },
          '4': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 4,
              left: 0
            }
          },
          '5': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 0,
              left: 0
            }
          },
          '6': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 13,
              left: 10
            }
          },
          '7': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 0,
              left: 0
            }
          },
          '8': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 0,
              left: 0
            }
          }
        },
        pairDisplacementXByRowPair: {
          '1': {
            '1': {
              right: 0,
              left: -5
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: -5,
              left: -5
            }
          },
          '2': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 5,
              left: 3
            }
          },
          '3': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 6,
              left: 9
            }
          },
          '4': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 0,
              left: 0
            }
          },
          '5': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 0,
              left: 0
            }
          },
          '6': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 5,
              left: 7
            }
          },
          '7': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 0,
              left: 0
            }
          },
          '8': {
            '1': {
              right: 0,
              left: 0
            },
            '2': {
              right: 0,
              left: 0
            },
            '3': {
              right: 0,
              left: 0
            }
          }
        },
        hoverAmplitudeDegRange: [
          2,
          12
        ],
        hoverSpeedRange: [
          2.2,
          4.2
        ]
      },
      blue: {
        spritePath: './blue_sprite_2_upscaled.png',
        spritePathPool: [
          './blue_sprite_2.png',
          './blue_sprite_1.png',
          './blue_sprite_3.png',
          './blue_sprite.png',
          './blue_sprite_2.png'
        ],
        spriteCellWidth: 44,
        spriteCellHeight: 44,
        spriteScale: 8.3333333,
        spriteCols: 10,
        spriteRows: 10,
        baseSize: 50,
        density: 130,
        centerBiasExponent: 1,
        pointDrawSize: 40,
        drawOrder: 'random',
        hoverAmplitudeDegRange: [
          2,
          6
        ],
        hoverSpeedRange: [
          2.2,
          4.2
        ]
      }
    }
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
    spriteRowRange: [
      0,
      2
    ],
    drawSize: 30,
    drawSizeRange: [
      30,
      70
    ],
    drawSizeBaseMultiplier: 0.1,
    drawSizeBaseMultiplierEaseIn: 0.1,
    growthEnabled: true,
    growthMinScale: 0.05,
    growthDurationSec: 1,
    growthEase: 'easeOut',
    growthEasePower: 2,
    swayEnabled: true,
    swayInteractionRadiusFactor: 2.1,
    swayRiseSpeed: 5.5,
    swayFallSpeed: 0.5,
    swayEpsilon: 0.0008,
    mouseSpeedSwayAffect: 0.7,
    swayAmplitudeDegRange: [
      0.8,
      12.6
    ],
    swaySpeedRange: [
      1.9,
      2.8
    ],
    countRange: [
      2,
      10
    ],
    spawnTMin: 0.01,
    spawnTMax: 0.5,
    spawnBiasMode: 'towardBase',
    spawnBiasExponent: 4,
    minSpawnSpacingT: 0.001,
    maxSpawnAttemptsPerLeaf: 1,
    sideMode: 'alternate',
    rotationAwayFromNormalDegRange: [
      0,
      80
    ]
  },
  performance: {
    enabled: false,
    logIntervalMs: 1000
  },
  debug: {
    showStripBounds: false,
    showStripCenters: true,
    showPathOutline: true,
    showTangents: false,
    showNormals: false,
    showControlPoints: true,
    showControlCurve: true,
    pathSampleStep: 8,
    vectorSampleSpacing: 120
  }
};
})(typeof window !== 'undefined' ? window : globalThis);
