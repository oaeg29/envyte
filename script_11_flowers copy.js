(function attachStemWarpFlowerSystem11(globalScope) {
  'use strict';

  const OFFSCREEN_POINTER = -10000;
  const MAX_DT_SEC = 0.05;
  const ALWAYS_SWAY_SIM_HZ = 24;
  const ALWAYS_SWAY_SIM_DT_SEC = 1 / ALWAYS_SWAY_SIM_HZ;
  const ALWAYS_SWAY_MAX_STEPS_PER_FRAME = 4;
  const DEFAULT_LILY_SPRITE_PATH = './lily_sprite.png';
  const DEFAULT_BLUE_SPRITE_PATH = './blue_sprite_2_upscaled.png';

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function moveToward(current, target, maxStep) {
    if (current < target) {
      return Math.min(current + maxStep, target);
    }
    return Math.max(current - maxStep, target);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutPower(t, power) {
    const safeT = clamp(Number.isFinite(t) ? t : 0, 0, 1);
    const safePower = Number.isFinite(power) ? Math.max(0.01, power) : 2;
    return 1 - Math.pow(1 - safeT, safePower);
  }

  function evaluatePetalToggleAmount(
    startAmount,
    targetAmount,
    progress,
    easePower,
    openBounceAmount = 0,
    openBounceOscillations = 2,
  ) {
    const safeStart = clamp(Number.isFinite(startAmount) ? startAmount : 0, 0, 1);
    const safeTarget = clamp(Number.isFinite(targetAmount) ? targetAmount : 1, 0, 1);
    const safeProgress = clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
    const safeEasePower = Number.isFinite(easePower) ? Math.max(0.01, easePower) : 1;
    const safeBounceAmount = Number.isFinite(openBounceAmount) ? Math.max(0, openBounceAmount) : 0;
    const safeBounceOscillations = Number.isFinite(openBounceOscillations)
      ? Math.max(0.25, openBounceOscillations)
      : 2;

    const easedProgress = easeOutPower(safeProgress, safeEasePower);
    let amount = safeStart + (safeTarget - safeStart) * easedProgress;
    const isOpening = safeTarget > safeStart;

    if (isOpening && safeBounceAmount > 0) {
      const bounceStart = 0.55;
      if (safeProgress > bounceStart) {
        const bounceT = (safeProgress - bounceStart) / (1 - bounceStart);
        const wave = Math.sin(bounceT * Math.PI * safeBounceOscillations);
        const envelope = Math.pow(bounceT, 0.9) * Math.pow(1 - bounceT, 0.2);
        amount += safeBounceAmount * wave * envelope;
      }
      return clamp(amount, 0, Math.max(safeStart, safeTarget) + safeBounceAmount);
    }

    return clamp(amount, 0, 1);
  }

  function normalizeAngleRad(angle) {
    if (!Number.isFinite(angle)) {
      return 0;
    }
    let normalized = angle;
    while (normalized > Math.PI) {
      normalized -= Math.PI * 2;
    }
    while (normalized < -Math.PI) {
      normalized += Math.PI * 2;
    }
    return normalized;
  }

  function signedAngleDeltaRad(fromAngle, toAngle) {
    return normalizeAngleRad(toAngle - fromAngle);
  }

  function resolvePetalScreenOffsetsInto(petal, displacementSpace, cosCenter, sinCenter, out) {
    const localOffsetY = petal.screenOffsetY || 0;
    const localOffsetX = petal.screenOffsetX || 0;
    if (displacementSpace === 'flower') {
      out.x = localOffsetX * cosCenter - localOffsetY * sinCenter;
      out.y = localOffsetX * sinCenter + localOffsetY * cosCenter;
      return out;
    }
    out.x = localOffsetX;
    out.y = localOffsetY;
    return out;
  }

  function resolvePetalJumpOffsetRad(petal) {
    return petal.jumpAngleOffsetRad || 0;
  }

  function resolvePetalSwayOffsetRad(flower, petal) {
    let angleOffset = 0;
    const renderHoverInfluence = Number.isFinite(flower.renderHoverInfluence)
      ? flower.renderHoverInfluence
      : (Number.isFinite(flower.hoverInfluence) ? flower.hoverInfluence : 0);
    const renderMotionTime = Number.isFinite(flower.renderMotionTime)
      ? flower.renderMotionTime
      : (Number.isFinite(flower.motionTime) ? flower.motionTime : 0);
    if (renderHoverInfluence > 0 && petal.hoverAmplitudeRad && petal.hoverSpeed) {
      const wave = Math.sin(renderMotionTime * petal.hoverSpeed);
      angleOffset += wave * petal.hoverAmplitudeRad * renderHoverInfluence;
    }
    return angleOffset;
  }

  function resolvePetalMotionOffsetRad(flower, petal) {
    return resolvePetalJumpOffsetRad(petal) + resolvePetalSwayOffsetRad(flower, petal);
  }

  function resolvePetalRenderedAngleRad(flower, petal) {
    return (petal.baseAngleRad || 0) + resolvePetalMotionOffsetRad(flower, petal);
  }

  function hashSeed(value) {
    const text = String(value);
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function random() {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeRangeInput(value, fallbackMin, fallbackMax) {
    if (Array.isArray(value) && value.length >= 2) {
      const a = Number(value[0]);
      const b = Number(value[1]);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        return [Math.min(a, b), Math.max(a, b)];
      }
    }
    if (Number.isFinite(value)) {
      return [value, value];
    }
    return [fallbackMin, fallbackMax];
  }

  function sampleRange(range, rng) {
    const min = Number(range[0]);
    const max = Number(range[1]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return 0;
    }
    if (max <= min) {
      return min;
    }
    return min + (max - min) * rng();
  }

  function normalizeOneBasedRow(value, maxRows, fallbackOneBased = 1) {
    const safeMax = Number.isFinite(maxRows) ? Math.max(1, Math.floor(maxRows)) : 1;
    const fallback = Number.isFinite(fallbackOneBased)
      ? clamp(Math.floor(fallbackOneBased), 1, safeMax)
      : 1;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    return clamp(Math.floor(numeric), 1, safeMax);
  }

  function normalizeOneBasedRowList(values, maxRows) {
    if (!Array.isArray(values)) {
      return [];
    }
    const safeMax = Number.isFinite(maxRows) ? Math.max(1, Math.floor(maxRows)) : 1;
    const out = [];
    for (let i = 0; i < values.length; i += 1) {
      const numeric = Number(values[i]);
      if (!Number.isFinite(numeric)) {
        continue;
      }
      out.push(clamp(Math.floor(numeric), 1, safeMax));
    }
    return out;
  }

  function sanitizeSpritePathPool(values, fallbackPath) {
    const out = [];
    if (Array.isArray(values)) {
      for (let i = 0; i < values.length; i += 1) {
        const raw = values[i];
        if (typeof raw !== 'string') {
          continue;
        }
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
          continue;
        }
        out.push(trimmed);
      }
    }
    const fallback = (typeof fallbackPath === 'string' && fallbackPath.trim().length > 0)
      ? fallbackPath.trim()
      : DEFAULT_BLUE_SPRITE_PATH;
    if (out.length === 0) {
      out.push(fallback);
    }
    return Array.from(new Set(out));
  }

  function loadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image: ' + path));
      image.src = path;
    });
  }

  function getStableToken(endpoint, index) {
    if (endpoint && typeof endpoint.stableKey === 'string' && endpoint.stableKey.length > 0) {
      return endpoint.stableKey;
    }
    return `endpoint:${index}`;
  }

  function sanitizeAssignmentMode(mode) {
    return mode === 'mixed' ? 'mixed' : 'single';
  }

  function sanitizeSwayMode(mode) {
    return mode === 'influence' ? 'influence' : 'always';
  }

  function sanitizeSingleType(typeName, registry, fallback = 'lily') {
    if (typeof typeName === 'string' && registry[typeName]) {
      return typeName;
    }
    return fallback;
  }

  function sanitizeMixRatios(rawRatios, registry, fallback = 'lily') {
    const out = {};
    if (isPlainObject(rawRatios)) {
      const keys = Object.keys(rawRatios).sort();
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (!registry[key]) {
          continue;
        }
        const weight = Number(rawRatios[key]);
        if (Number.isFinite(weight) && weight > 0) {
          out[key] = weight;
        }
      }
    }
    if (Object.keys(out).length === 0) {
      out[fallback] = 1;
    }
    return out;
  }

  function getSpriteSourceRect(typeConfig, col, row) {
    const spriteCellWidth = Number.isFinite(typeConfig.spriteCellWidth)
      ? Math.max(1, typeConfig.spriteCellWidth)
      : 44;
    const spriteCellHeight = Number.isFinite(typeConfig.spriteCellHeight)
      ? Math.max(1, typeConfig.spriteCellHeight)
      : 45.819;
    const spriteScale = Number.isFinite(typeConfig.spriteScale)
      ? Math.max(0.01, typeConfig.spriteScale)
      : 8.3333333;

    return {
      sx: col * spriteCellWidth * spriteScale,
      sy: row * spriteCellHeight * spriteScale,
      sw: spriteCellWidth * spriteScale,
      sh: spriteCellHeight * spriteScale,
    };
  }

  function resolveCommonFlowerConfig(flowersConfig) {
    const safeConfig = isPlainObject(flowersConfig) ? flowersConfig : {};
    const performanceConfig = isPlainObject(safeConfig.performance) ? safeConfig.performance : {};
    const legacySwayRadius = Number(safeConfig.interactionRadiusFactor);
    const legacySwayRiseSpeed = Number(safeConfig.influenceRiseSpeed);
    const legacySwayFallSpeed = Number(safeConfig.influenceFallSpeed);
    const legacySwayEpsilon = Number(safeConfig.influenceEpsilon);
    const legacyBlueOriginRotate = safeConfig.swayJumpRotateAroundPetalOrigin === true;
    return {
      drawSize: Number.isFinite(safeConfig.drawSize) ? Math.max(1, safeConfig.drawSize) : 80,
      swayInteractionRadiusFactor: Number.isFinite(safeConfig.swayInteractionRadiusFactor)
        ? Math.max(0, safeConfig.swayInteractionRadiusFactor)
        : (Number.isFinite(legacySwayRadius) ? Math.max(0, legacySwayRadius) : 2.1),
      swayRiseSpeed: Number.isFinite(safeConfig.swayRiseSpeed)
        ? Math.max(0, safeConfig.swayRiseSpeed)
        : (Number.isFinite(legacySwayRiseSpeed) ? Math.max(0, legacySwayRiseSpeed) : 5.5),
      swayFallSpeed: Number.isFinite(safeConfig.swayFallSpeed)
        ? Math.max(0, safeConfig.swayFallSpeed)
        : (Number.isFinite(legacySwayFallSpeed) ? Math.max(0, legacySwayFallSpeed) : 0.5),
      swayEpsilon: Number.isFinite(safeConfig.swayEpsilon)
        ? Math.max(0, safeConfig.swayEpsilon)
        : (Number.isFinite(legacySwayEpsilon) ? Math.max(0, legacySwayEpsilon) : 0.0008),
      mouseSpeedSwayAffect: Number.isFinite(safeConfig.mouseSpeedSwayAffect)
        ? Math.max(0, safeConfig.mouseSpeedSwayAffect)
        : 0.5,
      influenceDynamicCapEnabled: safeConfig.influenceDynamicCapEnabled !== false,
      influenceDynamicCap: Number.isFinite(safeConfig.influenceDynamicCap)
        ? Math.max(0, Math.floor(safeConfig.influenceDynamicCap))
        : 28,
      influenceNoPointerFallBoost: Number.isFinite(safeConfig.influenceNoPointerFallBoost)
        ? Math.max(1, safeConfig.influenceNoPointerFallBoost)
        : 2.5,
      influenceJumpCountsTowardCap: safeConfig.influenceJumpCountsTowardCap !== false,
      blueSwayRotateAroundPetalOrigin: safeConfig.blueSwayRotateAroundPetalOrigin === undefined
        ? legacyBlueOriginRotate
        : safeConfig.blueSwayRotateAroundPetalOrigin === true,
      blueJumpRotateAroundPetalOrigin: safeConfig.blueJumpRotateAroundPetalOrigin === undefined
        ? legacyBlueOriginRotate
        : safeConfig.blueJumpRotateAroundPetalOrigin === true,
      swayJumpRotateAroundPetalOrigin: safeConfig.swayJumpRotateAroundPetalOrigin === true,
      swayMode: sanitizeSwayMode(safeConfig.swayMode),
      jumpEnabled: safeConfig.jumpEnabled !== false,
      jumpInteractionRadiusFactor: Number.isFinite(safeConfig.jumpInteractionRadiusFactor)
        ? Math.max(0, safeConfig.jumpInteractionRadiusFactor)
        : 2.1,
      jumpStrengthDeg: Number.isFinite(safeConfig.jumpStrengthDeg)
        ? Math.max(0, safeConfig.jumpStrengthDeg)
        : 42,
      jumpAttackSpeedDegPerSec: Number.isFinite(safeConfig.jumpAttackSpeedDegPerSec)
        ? Math.max(0, safeConfig.jumpAttackSpeedDegPerSec)
        : 520,
      jumpReturnSpeedDegPerSec: Number.isFinite(safeConfig.jumpReturnSpeedDegPerSec)
        ? Math.max(0, safeConfig.jumpReturnSpeedDegPerSec)
        : 58,
      jumpDistanceExponent: Number.isFinite(safeConfig.jumpDistanceExponent)
        ? Math.max(0.01, safeConfig.jumpDistanceExponent)
        : 1,
      jumpJitterDeg: Number.isFinite(safeConfig.jumpJitterDeg)
        ? Math.max(0, safeConfig.jumpJitterDeg)
        : 6,
      jumpEpsilonDeg: Number.isFinite(safeConfig.jumpEpsilonDeg)
        ? Math.max(0, safeConfig.jumpEpsilonDeg)
        : 0.05,
      backfacing: safeConfig.backfacing === true,
      petalToggleAnimationDurationSec: Number.isFinite(safeConfig.petalToggleAnimationDurationSec)
        ? Math.max(0, safeConfig.petalToggleAnimationDurationSec)
        : 0.42,
      petalToggleAnimationEasePower: Number.isFinite(safeConfig.petalToggleAnimationEasePower)
        ? Math.max(0.01, safeConfig.petalToggleAnimationEasePower)
        : 2.2,
      petalToggleOpenBounceAmount: Number.isFinite(safeConfig.petalToggleOpenBounceAmount)
        ? Math.max(0, safeConfig.petalToggleOpenBounceAmount)
        : 0,
      petalToggleOpenBounceOscillations: Number.isFinite(safeConfig.petalToggleOpenBounceOscillations)
        ? Math.max(0.25, safeConfig.petalToggleOpenBounceOscillations)
        : 2,
      petalToggleSpriteSwapProgress: Number.isFinite(safeConfig.petalToggleSpriteSwapProgress)
        ? clamp(safeConfig.petalToggleSpriteSwapProgress, 0, 1)
        : 0.14,
      petalToggleEdgePairFlipEnabled: safeConfig.petalToggleEdgePairFlipEnabled === true,
      petalToggleEdgePairFlipBackProgress: Number.isFinite(safeConfig.petalToggleEdgePairFlipBackProgress)
        ? clamp(safeConfig.petalToggleEdgePairFlipBackProgress, 0, 1)
        : 0.5,
      petalToggleEdgePairUseInnerSpritesEnabled: safeConfig.petalToggleEdgePairUseInnerSpritesEnabled === true,
      petalTogglePairSpeedDisparityEnabled: safeConfig.petalTogglePairSpeedDisparityEnabled === true,
      petalTogglePairSpeedStep: Number.isFinite(safeConfig.petalTogglePairSpeedStep)
        ? Math.max(0, safeConfig.petalTogglePairSpeedStep)
        : 0.2,
      petalTogglePairSpeedCurve: Number.isFinite(safeConfig.petalTogglePairSpeedCurve)
        ? clamp(safeConfig.petalTogglePairSpeedCurve, 0, 1)
        : 0,
      activeLayerCacheEnabled: performanceConfig.activeLayerCacheEnabled !== false,
      viewportCullingEnabled: safeConfig.viewportCullingEnabled !== false,
      swayFastPathEnabled: safeConfig.swayFastPathEnabled !== false,
      alwaysAnimatedCacheEnabled: safeConfig.alwaysAnimatedCacheEnabled !== false,
      alwaysAnimatedCacheFps: Number.isFinite(safeConfig.alwaysAnimatedCacheFps)
        ? Math.max(1, safeConfig.alwaysAnimatedCacheFps)
        : 12,
      assignmentMode: sanitizeAssignmentMode(safeConfig.assignmentMode),
      singleType: typeof safeConfig.singleType === 'string' ? safeConfig.singleType : 'lily',
      mixRatios: isPlainObject(safeConfig.mixRatios) ? safeConfig.mixRatios : { lily: 1 },
    };
  }

  function getTypeConfigs(flowersConfig) {
    if (!isPlainObject(flowersConfig) || !isPlainObject(flowersConfig.types)) {
      return {};
    }
    return flowersConfig.types;
  }

  function createDefaultLilyPairRotationDegByRowPair() {
    const out = {};
    for (let row = 1; row <= 8; row += 1) {
      out[row] = { 1: 0, 2: 0, 3: 0 };
    }
    return out;
  }

  function createDefaultLilyPairDisplacementYByRowPair() {
    const out = {};
    for (let row = 1; row <= 8; row += 1) {
      out[row] = {
        1: { right: 0, left: 0 },
        2: { right: 0, left: 0 },
        3: { right: 0, left: 0 },
      };
    }
    return out;
  }

  function createDefaultLilyPairDisplacementXByRowPair() {
    const out = {};
    for (let row = 1; row <= 8; row += 1) {
      out[row] = {
        1: { right: 0, left: 0 },
        2: { right: 0, left: 0 },
        3: { right: 0, left: 0 },
      };
    }
    return out;
  }

  function getLilyPairRotationOffsetDeg(typeConfig, rowOneBased, pairOneBased) {
    if (!isPlainObject(typeConfig) || !isPlainObject(typeConfig.pairRotationDegByRowPair)) {
      return 0;
    }
    const byRow = typeConfig.pairRotationDegByRowPair;
    const rowEntry = byRow[rowOneBased] !== undefined
      ? byRow[rowOneBased]
      : byRow[String(rowOneBased)];
    if (!isPlainObject(rowEntry)) {
      return 0;
    }

    const rawValue = rowEntry[pairOneBased] !== undefined
      ? rowEntry[pairOneBased]
      : rowEntry[String(pairOneBased)];
    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  function getLilyPairDisplacementOffsets(typeConfig, mapKey, rowOneBased, pairOneBased) {
    if (!isPlainObject(typeConfig) || !isPlainObject(typeConfig[mapKey])) {
      return { right: 0, left: 0 };
    }
    const byRow = typeConfig[mapKey];
    const rowEntry = byRow[rowOneBased] !== undefined
      ? byRow[rowOneBased]
      : byRow[String(rowOneBased)];
    if (!isPlainObject(rowEntry)) {
      return { right: 0, left: 0 };
    }

    const pairEntry = rowEntry[pairOneBased] !== undefined
      ? rowEntry[pairOneBased]
      : rowEntry[String(pairOneBased)];

    if (isPlainObject(pairEntry)) {
      const right = Number(pairEntry.right);
      const left = Number(pairEntry.left);
      return {
        right: Number.isFinite(right) ? right : 0,
        left: Number.isFinite(left) ? left : 0,
      };
    }

    // Supports scalar inputs too (applies equally to both sides).
    const scalar = Number(pairEntry);
    if (!Number.isFinite(scalar)) {
      return { right: 0, left: 0 };
    }
    return { right: scalar, left: scalar };
  }

  function getLilyPairDisplacementYOffsets(typeConfig, rowOneBased, pairOneBased) {
    return getLilyPairDisplacementOffsets(
      typeConfig,
      'pairDisplacementYByRowPair',
      rowOneBased,
      pairOneBased,
    );
  }

  function getLilyPairDisplacementXOffsets(typeConfig, rowOneBased, pairOneBased) {
    return getLilyPairDisplacementOffsets(
      typeConfig,
      'pairDisplacementXByRowPair',
      rowOneBased,
      pairOneBased,
    );
  }

  function resolveLilyTypeConfig(flowersConfig) {
    const safeConfig = isPlainObject(flowersConfig) ? flowersConfig : {};
    const typeConfigs = getTypeConfigs(safeConfig);
    const lilyTypeConfig = isPlainObject(typeConfigs.lily) ? typeConfigs.lily : {};

    const legacyTopLevel = {
      method: safeConfig.method,
      spritePath: safeConfig.spritePath,
      spriteCellWidth: safeConfig.spriteCellWidth,
      spriteCellHeight: safeConfig.spriteCellHeight,
      spriteScale: safeConfig.spriteScale,
      spriteCols: safeConfig.spriteCols,
      spriteRows: safeConfig.spriteRows,
      spriteRow: safeConfig.spriteRow,
      petalCountRange: safeConfig.petalCountRange,
      alignToBranchDirection: safeConfig.alignToBranchDirection,
      alignmentDamping: safeConfig.alignmentDamping,
      petalBaseCenterDeg: safeConfig.petalBaseCenterDeg,
      petalSpreadDeg: safeConfig.petalSpreadDeg,
      pairRotationDegByRowPair: safeConfig.pairRotationDegByRowPair,
      pairDisplacementYByRowPair: safeConfig.pairDisplacementYByRowPair,
      pairDisplacementXByRowPair: safeConfig.pairDisplacementXByRowPair,
      displacementSpace: safeConfig.displacementSpace,
      stamenRowMode: safeConfig.stamenRowMode,
      stamenFixedRow: safeConfig.stamenFixedRow,
      stamenCount: safeConfig.stamenCount,
      stamenAdditionalMode: safeConfig.stamenAdditionalMode,
      stamenRowList: safeConfig.stamenRowList,
      closedUseMiddlePetalSprite: safeConfig.closedUseMiddlePetalSprite,
      hoverAmplitudeDegRange: safeConfig.hoverAmplitudeDegRange,
      hoverSpeedRange: safeConfig.hoverSpeedRange,
    };

    const defaults = {
      method: 'sweep',
      spritePath: DEFAULT_LILY_SPRITE_PATH,
      spriteCellWidth: 44,
      spriteCellHeight: 44,
      spriteScale: 8.3333333,
      spriteCols: 8,
      spriteRows: 8,
      spriteRow: 1,
      petalCountRange: [5, 6],
      alignToBranchDirection: true,
      alignmentDamping: 0,
      petalBaseCenterDeg: 0,
      petalSpreadDeg: 45,
      pairRotationDegByRowPair: createDefaultLilyPairRotationDegByRowPair(),
      pairDisplacementYByRowPair: createDefaultLilyPairDisplacementYByRowPair(),
      pairDisplacementXByRowPair: createDefaultLilyPairDisplacementXByRowPair(),
      displacementSpace: 'flower',
      stamenRowMode: 'petalRow', // petalRow | fixedRow
      stamenFixedRow: 1, // 1-based row
      stamenCount: 1, // total stamens per flower
      stamenAdditionalMode: 'randomRows', // randomRows | rowList
      stamenRowList: [1], // 1-based rows used when stamenAdditionalMode='rowList'
      closedUseMiddlePetalSprite: false, // if true, closed lilies use middle petal sprite for every petal
      hoverAmplitudeDegRange: [2, 6],
      hoverSpeedRange: [2.2, 4.2],
    };

    return {
      ...defaults,
      ...legacyTopLevel,
      ...lilyTypeConfig,
    };
  }

  function resolveBlueTypeConfig(flowersConfig) {
    const safeConfig = isPlainObject(flowersConfig) ? flowersConfig : {};
    const typeConfigs = getTypeConfigs(safeConfig);
    const blueTypeConfig = isPlainObject(typeConfigs.blue) ? typeConfigs.blue : {};

    const defaults = {
      spritePath: DEFAULT_BLUE_SPRITE_PATH,
      spritePathPool: [DEFAULT_BLUE_SPRITE_PATH],
      spriteCellWidth: 44,
      spriteCellHeight: 44,
      spriteScale: 8.3333333,
      spriteCols: 10,
      spriteRows: 10,
      baseSize: 60,
      density: 80,
      centerBiasExponent: 1.6,
      pointDrawSize: 18,
      drawOrder: 'outerFirst', // outerFirst | random
      hoverAmplitudeDegRange: [2, 6],
      hoverSpeedRange: [2.2, 4.2],
    };

    const resolved = {
      ...defaults,
      ...blueTypeConfig,
    };
    const rawSpritePathPool = blueTypeConfig.spritePathPool !== undefined
      ? blueTypeConfig.spritePathPool
      : (
        typeof blueTypeConfig.spritePath === 'string' && blueTypeConfig.spritePath.length > 0
          ? [blueTypeConfig.spritePath]
          : defaults.spritePathPool
      );
    resolved.spritePathPool = sanitizeSpritePathPool(rawSpritePathPool, resolved.spritePath);
    resolved.spritePath = resolved.spritePathPool[0] || DEFAULT_BLUE_SPRITE_PATH;
    return resolved;
  }

  function resolveLilyCenterDeg(endpoint, typeConfig) {
    const alignToBranchDirection = typeConfig.alignToBranchDirection !== false;
    const alignmentDamping = Number.isFinite(typeConfig.alignmentDamping)
      ? clamp(typeConfig.alignmentDamping, 0, 1)
      : 0;
    const alignmentInfluence = 1 - alignmentDamping;
    const branchDirectionDeg = endpoint && Number.isFinite(endpoint.tangentDeg)
      ? endpoint.tangentDeg
      : 0;
    const petalBaseCenterDeg = Number.isFinite(typeConfig.petalBaseCenterDeg)
      ? typeConfig.petalBaseCenterDeg
      : 0;

    if (!alignToBranchDirection) {
      return petalBaseCenterDeg;
    }
    return petalBaseCenterDeg + branchDirectionDeg * alignmentInfluence;
  }

  function resolveLilyAssetPath(typeConfig) {
    return (typeof typeConfig.spritePath === 'string' && typeConfig.spritePath.length > 0)
      ? typeConfig.spritePath
      : DEFAULT_LILY_SPRITE_PATH;
  }

  function resolveBlueAssetPaths(typeConfig) {
    const fallbackPath = (typeof typeConfig.spritePath === 'string' && typeConfig.spritePath.length > 0)
      ? typeConfig.spritePath
      : DEFAULT_BLUE_SPRITE_PATH;
    return sanitizeSpritePathPool(typeConfig.spritePathPool, fallbackPath);
  }

  function resolveBlueAssetPath(typeConfig, rng = null) {
    const assetPaths = resolveBlueAssetPaths(typeConfig);
    if (assetPaths.length === 0) {
      return DEFAULT_BLUE_SPRITE_PATH;
    }
    if (typeof rng === 'function' && assetPaths.length > 1) {
      const index = clamp(Math.floor(rng() * assetPaths.length), 0, assetPaths.length - 1);
      return assetPaths[index];
    }
    return assetPaths[0];
  }

  function resolveLilyMiddlePetalColumn(typeConfig) {
    const spriteCols = Number.isFinite(typeConfig.spriteCols)
      ? Math.max(1, Math.floor(typeConfig.spriteCols))
      : 8;
    const sweepColumnCount = Math.max(1, Math.min(7, spriteCols));
    return Math.floor((sweepColumnCount - 1) * 0.5);
  }

  function resolveLilyPairDistanceFromCenter(typeConfig, col) {
    const spriteCols = Number.isFinite(typeConfig.spriteCols)
      ? Math.max(1, Math.floor(typeConfig.spriteCols))
      : 8;
    const sweepColumnCount = Math.max(1, Math.min(7, spriteCols));
    const centerCol = Math.floor((sweepColumnCount - 1) * 0.5);
    const safeCol = clamp(Math.floor(col), 0, Math.max(0, sweepColumnCount - 1));
    return Math.abs(safeCol - centerCol);
  }

  function resolveLilyMaxPairDistance(typeConfig) {
    const spriteCols = Number.isFinite(typeConfig.spriteCols)
      ? Math.max(1, Math.floor(typeConfig.spriteCols))
      : 8;
    const sweepColumnCount = Math.max(1, Math.min(7, spriteCols));
    return Math.max(1, Math.floor((sweepColumnCount - 1) * 0.5));
  }

  function buildLilyLegacyFlower(endpoint, typeConfig, commonConfig, rng) {
    const spriteCols = Number.isFinite(typeConfig.spriteCols)
      ? Math.max(1, Math.floor(typeConfig.spriteCols))
      : 20;
    const spriteRow = Number.isFinite(typeConfig.spriteRow)
      ? Math.max(0, Math.floor(typeConfig.spriteRow))
      : 1;
    const petalCountRange = normalizeRangeInput(typeConfig.petalCountRange, 5, 6);
    const minPetalCount = Math.max(1, Math.floor(petalCountRange[0]));
    const maxPetalCount = Math.max(minPetalCount, Math.floor(petalCountRange[1]));
    const petalSpreadDeg = Number.isFinite(typeConfig.petalSpreadDeg)
      ? Math.max(0, typeConfig.petalSpreadDeg)
      : 75;
    const hoverAmplitudeDegRange = normalizeRangeInput(typeConfig.hoverAmplitudeDegRange, 2, 6);
    const hoverSpeedRange = normalizeRangeInput(typeConfig.hoverSpeedRange, 2.2, 4.2);

    const petalCount = maxPetalCount <= minPetalCount
      ? minPetalCount
      : (minPetalCount + Math.floor(rng() * (maxPetalCount - minPetalCount + 1)));

    const centerDeg = resolveLilyCenterDeg(endpoint, typeConfig);
    const petals = [];

    for (let i = 0; i < petalCount; i += 1) {
      const col = Math.min(spriteCols - 1, Math.floor(rng() * spriteCols));
      const divisor = Math.max(1, petalCount / 4);
      const centeredIndex = i - (petalCount - 1) * 0.5;
      const wave = Math.sin(centeredIndex / divisor);
      const petalAngleDeg = centerDeg + wave * petalSpreadDeg;

      petals.push({
        col,
        row: spriteRow,
        baseAngleRad: degToRad(petalAngleDeg),
        hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
        hoverSpeed: sampleRange(hoverSpeedRange, rng),
      });
    }

    return {
      petals,
      assetPath: resolveLilyAssetPath(typeConfig),
      centerAngleRad: degToRad(centerDeg),
      interactionRadius: commonConfig.drawSize * commonConfig.swayInteractionRadiusFactor,
    };
  }

  function buildLilySweepFlower(endpoint, typeConfig, commonConfig, rng) {
    const spriteCols = Number.isFinite(typeConfig.spriteCols)
      ? Math.max(1, Math.floor(typeConfig.spriteCols))
      : 8;
    const spriteRows = Number.isFinite(typeConfig.spriteRows)
      ? Math.max(1, Math.floor(typeConfig.spriteRows))
      : 8;
    const petalSpreadDeg = Number.isFinite(typeConfig.petalSpreadDeg)
      ? Math.max(0, typeConfig.petalSpreadDeg)
      : 75;
    const hoverAmplitudeDegRange = normalizeRangeInput(typeConfig.hoverAmplitudeDegRange, 2, 6);
    const hoverSpeedRange = normalizeRangeInput(typeConfig.hoverSpeedRange, 2.2, 4.2);

    const centerDeg = resolveLilyCenterDeg(endpoint, typeConfig);
    const sweepColumnCount = Math.max(1, Math.min(7, spriteCols));
    const centerColumnIndex = spriteCols >= 8 ? 7 : -1;
    const randomRowCount = Math.max(1, Math.min(7, spriteRows));

    function sampleRowIndex() {
      return Math.floor(rng() * randomRowCount);
    }

    const petals = [];
    let centerPetalInserted = false;
    const middleColumnIndex = Math.floor((sweepColumnCount - 1) * 0.5);

    for (let col = 0; col < sweepColumnCount; col += 1) {
      const t = sweepColumnCount <= 1 ? 0.5 : (col / (sweepColumnCount - 1));
      const wave = Math.cos((1 - t) * Math.PI);

      if (!centerPetalInserted && centerColumnIndex >= 0 && col === middleColumnIndex) {
        petals.push({
          col: centerColumnIndex,
          row: sampleRowIndex(),
          baseAngleRad: degToRad(centerDeg),
          hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
          hoverSpeed: sampleRange(hoverSpeedRange, rng),
        });
        centerPetalInserted = true;
      }

      const petalAngleDeg = centerDeg + wave * petalSpreadDeg;
      petals.push({
        col,
        row: sampleRowIndex(),
        baseAngleRad: degToRad(petalAngleDeg),
        hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
        hoverSpeed: sampleRange(hoverSpeedRange, rng),
      });
    }

    if (!centerPetalInserted && centerColumnIndex >= 0) {
      petals.push({
        col: centerColumnIndex,
        row: sampleRowIndex(),
        baseAngleRad: degToRad(centerDeg),
        hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
        hoverSpeed: sampleRange(hoverSpeedRange, rng),
      });
    }

    return {
      petals,
      assetPath: resolveLilyAssetPath(typeConfig),
      centerAngleRad: degToRad(centerDeg),
      interactionRadius: commonConfig.drawSize * commonConfig.swayInteractionRadiusFactor,
    };
  }

  function buildLilySweep2Flower(endpoint, typeConfig, commonConfig, rng) {
    const spriteCols = Number.isFinite(typeConfig.spriteCols)
      ? Math.max(1, Math.floor(typeConfig.spriteCols))
      : 8;
    const spriteRows = Number.isFinite(typeConfig.spriteRows)
      ? Math.max(1, Math.floor(typeConfig.spriteRows))
      : 8;
    const petalSpreadDeg = Number.isFinite(typeConfig.petalSpreadDeg)
      ? Math.max(0, typeConfig.petalSpreadDeg)
      : 75;
    const hoverAmplitudeDegRange = normalizeRangeInput(typeConfig.hoverAmplitudeDegRange, 2, 6);
    const hoverSpeedRange = normalizeRangeInput(typeConfig.hoverSpeedRange, 2.2, 4.2);

    const centerDeg = resolveLilyCenterDeg(endpoint, typeConfig);
    const sweepColumnCount = Math.max(1, Math.min(7, spriteCols));
    const centerColumnIndex = spriteCols >= 8 ? 7 : -1;
    const randomRowCount = Math.max(1, Math.min(7, spriteRows));
    const selectedRow = Math.floor(rng() * randomRowCount);

    const petals = [];
    let centerPetalInserted = false;
    const middleColumnIndex = Math.floor((sweepColumnCount - 1) * 0.5);

    for (let col = 0; col < sweepColumnCount; col += 1) {
      const t = sweepColumnCount <= 1 ? 0.5 : (col / (sweepColumnCount - 1));
      const wave = Math.cos((1 - t) * Math.PI);

      if (!centerPetalInserted && centerColumnIndex >= 0 && col === middleColumnIndex) {
        petals.push({
          col: centerColumnIndex,
          row: selectedRow,
          baseAngleRad: degToRad(centerDeg),
          hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
          hoverSpeed: sampleRange(hoverSpeedRange, rng),
        });
        centerPetalInserted = true;
      }

      const petalAngleDeg = centerDeg + wave * petalSpreadDeg;
      petals.push({
        col,
        row: selectedRow,
        baseAngleRad: degToRad(petalAngleDeg),
        hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
        hoverSpeed: sampleRange(hoverSpeedRange, rng),
      });
    }

    if (!centerPetalInserted && centerColumnIndex >= 0) {
      petals.push({
        col: centerColumnIndex,
        row: selectedRow,
        baseAngleRad: degToRad(centerDeg),
        hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
        hoverSpeed: sampleRange(hoverSpeedRange, rng),
      });
    }

    return {
      petals,
      assetPath: resolveLilyAssetPath(typeConfig),
      centerAngleRad: degToRad(centerDeg),
      interactionRadius: commonConfig.drawSize * commonConfig.swayInteractionRadiusFactor,
    };
  }

  function buildLilySweep3Flower(endpoint, typeConfig, commonConfig, rng) {
    const spriteCols = Number.isFinite(typeConfig.spriteCols)
      ? Math.max(1, Math.floor(typeConfig.spriteCols))
      : 8;
    const spriteRows = Number.isFinite(typeConfig.spriteRows)
      ? Math.max(1, Math.floor(typeConfig.spriteRows))
      : 8;
    if (spriteCols < 8) {
      return buildLilySweep2Flower(endpoint, typeConfig, commonConfig, rng);
    }

    const petalSpreadDeg = Number.isFinite(typeConfig.petalSpreadDeg)
      ? Math.max(0, typeConfig.petalSpreadDeg)
      : 75;
    const hoverAmplitudeDegRange = normalizeRangeInput(typeConfig.hoverAmplitudeDegRange, 2, 6);
    const hoverSpeedRange = normalizeRangeInput(typeConfig.hoverSpeedRange, 2.2, 4.2);

    const centerDeg = resolveLilyCenterDeg(endpoint, typeConfig);
    const randomRowCount = Math.max(1, Math.min(7, spriteRows));
    const selectedRow = Math.floor(rng() * randomRowCount);

    const centerCol = 3; // Column 4 in 1-based indexing.
    const rightCols = [4, 5, 6]; // Columns 5, 6, 7.
    const leftCols = [2, 1, 0]; // Columns 3, 2, 1.
    const stamenCol = Math.max(0, spriteCols - 1); // Last column, dynamic.
    const stamenRowMode = typeConfig.stamenRowMode === 'fixedRow' ? 'fixedRow' : 'petalRow';
    const stamenAdditionalMode = typeConfig.stamenAdditionalMode === 'rowList'
      ? 'rowList'
      : 'randomRows';
    const stamenCount = Number.isFinite(typeConfig.stamenCount)
      ? Math.max(1, Math.floor(typeConfig.stamenCount))
      : 1;
    const fixedStamenRowIndex = normalizeOneBasedRow(typeConfig.stamenFixedRow, spriteRows, 1) - 1;
    const stamenRowListOneBased = normalizeOneBasedRowList(typeConfig.stamenRowList, spriteRows);

    function pushPetal(col, angleDeg, screenOffsetY = 0, screenOffsetX = 0, rowOverride = selectedRow) {
      const safeCol = clamp(Math.floor(col), 0, Math.max(0, spriteCols - 1));
      const safeRow = clamp(Math.floor(rowOverride), 0, Math.max(0, spriteRows - 1));
      petals.push({
        col: safeCol,
        row: safeRow,
        baseAngleRad: degToRad(angleDeg),
        screenOffsetY,
        screenOffsetX,
        hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
        hoverSpeed: sampleRange(hoverSpeedRange, rng),
      });
    }

    // Map cosine (-1..1) to (0..1) over center + 3 outward steps.
    function getSpreadFactor(stepIndex) {
      const totalSteps = 4;
      const t = totalSteps <= 1 ? 0 : (stepIndex / (totalSteps - 1));
      const cosineValue = Math.cos((1 - t) * Math.PI);
      return (cosineValue + 1) * 0.5;
    }

    const petals = [];
    const stamenRows = [];
    const primaryStamenRow = stamenRowMode === 'fixedRow' ? fixedStamenRowIndex : selectedRow;
    stamenRows.push(primaryStamenRow);
    for (let i = 1; i < stamenCount; i += 1) {
      if (stamenAdditionalMode === 'rowList' && stamenRowListOneBased.length > 0) {
        const oneBasedRow = stamenRowListOneBased[(i - 1) % stamenRowListOneBased.length];
        stamenRows.push(oneBasedRow - 1);
      } else {
        stamenRows.push(Math.floor(rng() * Math.max(1, spriteRows)));
      }
    }

    // Start from center (column 4).
    pushPetal(centerCol, centerDeg);

    // Then draw symmetric pairs outward: 5/3, 6/2, 7/1.
    for (let pairIndex = 0; pairIndex < 3; pairIndex += 1) {
      const pairNumber = pairIndex + 1;
      const spreadFactor = getSpreadFactor(pairIndex + 1);
      const spread = petalSpreadDeg * spreadFactor;
      const pairRotationOffsetDeg = getLilyPairRotationOffsetDeg(
        typeConfig,
        selectedRow + 1,
        pairNumber,
      );
      const pairDisplacementYOffsets = getLilyPairDisplacementYOffsets(
        typeConfig,
        selectedRow + 1,
        pairNumber,
      );
      const pairDisplacementXOffsets = getLilyPairDisplacementXOffsets(
        typeConfig,
        selectedRow + 1,
        pairNumber,
      );

      // Draw stamen(s) from the dynamic last column before the final pair (7/1).
      if (pairIndex === 2) {
        for (let s = 0; s < stamenRows.length; s += 1) {
          pushPetal(stamenCol, centerDeg, 0, 0, stamenRows[s]);
        }
      }

      pushPetal(
        rightCols[pairIndex],
        centerDeg + spread + pairRotationOffsetDeg,
        -pairDisplacementYOffsets.right,
        pairDisplacementXOffsets.right,
      );
      pushPetal(
        leftCols[pairIndex],
        centerDeg - spread - pairRotationOffsetDeg,
        -pairDisplacementYOffsets.left,
        -pairDisplacementXOffsets.left,
      );
    }

    return {
      petals,
      assetPath: resolveLilyAssetPath(typeConfig),
      centerAngleRad: degToRad(centerDeg),
      interactionRadius: commonConfig.drawSize * commonConfig.swayInteractionRadiusFactor,
    };
  }

  function buildLilyFlower(endpoint, typeConfig, commonConfig, rng) {
    const method = typeConfig.method === 'legacy'
      ? 'legacy'
      : (typeConfig.method === 'sweep2'
        ? 'sweep2'
        : (typeConfig.method === 'sweep3' ? 'sweep3' : 'sweep'));
    if (method === 'legacy') {
      return buildLilyLegacyFlower(endpoint, typeConfig, commonConfig, rng);
    }
    if (method === 'sweep2') {
      return buildLilySweep2Flower(endpoint, typeConfig, commonConfig, rng);
    }
    if (method === 'sweep3') {
      return buildLilySweep3Flower(endpoint, typeConfig, commonConfig, rng);
    }
    return buildLilySweepFlower(endpoint, typeConfig, commonConfig, rng);
  }

  function drawLilyFlower(ctx, flower, typeConfig, commonConfig, runtimeState) {
    const image = runtimeState.getImage(flower.assetPath);
    if (!image || !Array.isArray(flower.petals) || flower.petals.length === 0) {
      return false;
    }

    const drawSize = commonConfig.drawSize;
    const spriteCellHeight = Number.isFinite(typeConfig.spriteCellHeight)
      ? Math.max(1, typeConfig.spriteCellHeight)
      : 45.819;
    const displacementSpace = typeConfig.displacementSpace === 'screen' ? 'screen' : 'flower';
    const centerAngleRad = Number.isFinite(flower.centerAngleRad) ? flower.centerAngleRad : 0;
    const cosCenter = Math.cos(centerAngleRad);
    const sinCenter = Math.sin(centerAngleRad);
    const basePetalOpenAmount = runtimeState && typeof runtimeState.getPetalOpenAmount === 'function'
      ? Math.max(0, runtimeState.getPetalOpenAmount())
      : 1;
    const useClosedPetalSprites = (
      runtimeState
      && typeof runtimeState.getUseClosedPetalSprites === 'function'
      && runtimeState.getUseClosedPetalSprites() === true
    );
    const petalToggleIsActive = (
      runtimeState
      && typeof runtimeState.getPetalToggleIsActive === 'function'
      && runtimeState.getPetalToggleIsActive() === true
    );
    const petalToggleIsClosing = (
      runtimeState
      && typeof runtimeState.getPetalToggleIsClosing === 'function'
      && runtimeState.getPetalToggleIsClosing() === true
    );
    const petalToggleProgress = (
      runtimeState
      && typeof runtimeState.getPetalToggleProgress === 'function'
    )
      ? clamp(runtimeState.getPetalToggleProgress(), 0, 1)
      : 1;
    const petalToggleStartAmount = (
      runtimeState
      && typeof runtimeState.getPetalToggleStartAmount === 'function'
    )
      ? clamp(runtimeState.getPetalToggleStartAmount(), 0, 1)
      : basePetalOpenAmount;
    const petalToggleTargetAmount = (
      runtimeState
      && typeof runtimeState.getPetalToggleTargetAmount === 'function'
    )
      ? clamp(runtimeState.getPetalToggleTargetAmount(), 0, 1)
      : basePetalOpenAmount;
    const petalToggleEasePower = (
      runtimeState
      && typeof runtimeState.getPetalToggleEasePower === 'function'
    )
      ? Math.max(0.01, runtimeState.getPetalToggleEasePower())
      : 1;
    const petalToggleOpenBounceAmount = (
      runtimeState
      && typeof runtimeState.getPetalToggleOpenBounceAmount === 'function'
    )
      ? Math.max(0, runtimeState.getPetalToggleOpenBounceAmount())
      : 0;
    const petalToggleOpenBounceOscillations = (
      runtimeState
      && typeof runtimeState.getPetalToggleOpenBounceOscillations === 'function'
    )
      ? Math.max(0.25, runtimeState.getPetalToggleOpenBounceOscillations())
      : 2;
    const edgePairFlipEnabled = commonConfig.petalToggleEdgePairFlipEnabled === true;
    const edgePairFlipBackProgress = clamp(commonConfig.petalToggleEdgePairFlipBackProgress, 0, 1);
    const closingEdgePairFlipBackProgress = 1 - edgePairFlipBackProgress;
    const openingEdgePairFlipBackProgress = 1 - edgePairFlipBackProgress;
    const edgePairUseInnerSpritesEnabled = commonConfig.petalToggleEdgePairUseInnerSpritesEnabled === true;
    const pairSpeedDisparityEnabled = commonConfig.petalTogglePairSpeedDisparityEnabled === true;
    const pairSpeedStep = Math.max(0, Number(commonConfig.petalTogglePairSpeedStep) || 0);
    const pairSpeedCurve = clamp(Number(commonConfig.petalTogglePairSpeedCurve) || 0, 0, 1);
    const maxPairDistance = resolveLilyMaxPairDistance(typeConfig);
    const drawBackfacing = commonConfig.backfacing === true;
    const useClosedMiddlePetalSprite = (
      typeConfig.closedUseMiddlePetalSprite === true
      && useClosedPetalSprites
    );
    const useFastPath = commonConfig.swayFastPathEnabled === true;
    const canUseFastPath = (
      useFastPath
      && !petalToggleIsActive
      && drawBackfacing === false
      && useClosedMiddlePetalSprite === false
      && basePetalOpenAmount >= 0.999999
    );
    if (canUseFastPath) {
      for (let i = 0; i < flower.petals.length; i += 1) {
        const petal = flower.petals[i];
        const sourceRect = petal.sourceRect || getSpriteSourceRect(typeConfig, petal.col, petal.row);
        const openAngle = (petal.baseAngleRad || 0) + resolvePetalMotionOffsetRad(flower, petal);
        let x = flower.x;
        let y = flower.y;
        const localOffsetX = petal.screenOffsetX || 0;
        const localOffsetY = petal.screenOffsetY || 0;
        if (displacementSpace === 'flower') {
          x += localOffsetX * cosCenter - localOffsetY * sinCenter;
          y += localOffsetX * sinCenter + localOffsetY * cosCenter;
        } else {
          x += localOffsetX;
          y += localOffsetY;
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(openAngle);
        ctx.drawImage(
          image,
          sourceRect.sx,
          sourceRect.sy,
          sourceRect.sw,
          sourceRect.sh,
          -drawSize * 0.5,
          -drawSize + ((2.2 / spriteCellHeight) * drawSize),
          drawSize,
          drawSize,
        );
        ctx.restore();
      }
      return true;
    }
    const closedMiddlePetalColumn = resolveLilyMiddlePetalColumn(typeConfig);
    const offsetScratch = { x: 0, y: 0 };

    const petalCount = flower.petals.length;
    const startIndex = drawBackfacing ? petalCount - 1 : 0;
    const endIndexExclusive = drawBackfacing ? -1 : petalCount;
    const indexStep = drawBackfacing ? -1 : 1;

    for (let i = startIndex; i !== endIndexExclusive; i += indexStep) {
      const petal = flower.petals[i];
      const isLastOuterPairPetal = petal.col === 0 || petal.col === 6;
      let petalOpenAmount = basePetalOpenAmount;
      if (pairSpeedDisparityEnabled && petalToggleIsActive && pairSpeedStep > 0) {
        const pairDistance = resolveLilyPairDistanceFromCenter(typeConfig, petal.col);
        const normalizedDistance = maxPairDistance > 0 ? clamp(pairDistance / maxPairDistance, 0, 1) : 0;
        const expPower = 1 + pairSpeedCurve * 4;
        const exponentialDistance = Math.pow(normalizedDistance, expPower) * maxPairDistance;
        const shapedPairDistance = (
          pairDistance * (1 - pairSpeedCurve)
          + exponentialDistance * pairSpeedCurve
        );
        const speedMultiplier = 1 + pairSpeedStep * shapedPairDistance;
        const adjustedProgress = clamp(petalToggleProgress * speedMultiplier, 0, 1);
        petalOpenAmount = evaluatePetalToggleAmount(
          petalToggleStartAmount,
          petalToggleTargetAmount,
          adjustedProgress,
          petalToggleEasePower,
          petalToggleOpenBounceAmount,
          petalToggleOpenBounceOscillations,
        );
      }

      // Use distance-from-closed (0..1) instead of animation-time progress.
      const closedDistance = clamp(petalOpenAmount, 0, 1);
      const isInsideEdgePairToggleWindow = (
        petalToggleIsActive
        && !useClosedPetalSprites
        && isLastOuterPairPetal
        && (
          petalToggleIsClosing
            ? (closedDistance <= closingEdgePairFlipBackProgress)
            : (closedDistance < openingEdgePairFlipBackProgress)
        )
      );
      const shouldFlipEdgePair = edgePairFlipEnabled && isInsideEdgePairToggleWindow;
      let sourceCol = useClosedMiddlePetalSprite ? closedMiddlePetalColumn : petal.col;
      if (
        edgePairUseInnerSpritesEnabled
        && isInsideEdgePairToggleWindow
        && !useClosedMiddlePetalSprite
      ) {
        if (sourceCol === 0) {
          sourceCol = 1;
        } else if (sourceCol === 6) {
          sourceCol = 5;
        }
      }
      let sourceRect = petal.sourceRect;
      if (useClosedMiddlePetalSprite) {
        sourceRect = petal.closedMiddleSourceRect || sourceRect;
      } else if (
        edgePairUseInnerSpritesEnabled
        && isInsideEdgePairToggleWindow
        && !useClosedPetalSprites
      ) {
        sourceRect = petal.innerSourceRect || sourceRect;
      }
      if (!sourceRect) {
        sourceRect = getSpriteSourceRect(typeConfig, sourceCol, petal.row);
      }

      const motionOffsetRad = resolvePetalMotionOffsetRad(flower, petal);
      const baseOpenAngle = petal.baseAngleRad || 0;
      const openAngle = baseOpenAngle + motionOffsetRad;
      const angle = centerAngleRad + (openAngle - centerAngleRad) * petalOpenAmount;
      resolvePetalScreenOffsetsInto(petal, displacementSpace, cosCenter, sinCenter, offsetScratch);
      const blendedOffsetX = offsetScratch.x * petalOpenAmount;
      const blendedOffsetY = offsetScratch.y * petalOpenAmount;
      ctx.save();
      ctx.translate(flower.x + blendedOffsetX, flower.y + blendedOffsetY);
      ctx.rotate(angle);
      if (shouldFlipEdgePair) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        image,
        sourceRect.sx,
        sourceRect.sy,
        sourceRect.sw,
        sourceRect.sh,
        -drawSize * 0.5,
        -drawSize + ((2.2 / spriteCellHeight) * drawSize),
        drawSize,
        drawSize,
      );
      ctx.restore();
    }

    return true;
  }

  function buildBlueFlower(endpoint, typeConfig, commonConfig, rng) {
    const spriteCols = Number.isFinite(typeConfig.spriteCols)
      ? Math.max(1, Math.floor(typeConfig.spriteCols))
      : 10;
    const spriteRows = Number.isFinite(typeConfig.spriteRows)
      ? Math.max(1, Math.floor(typeConfig.spriteRows))
      : 10;
    const baseSize = Number.isFinite(typeConfig.baseSize)
      ? Math.max(0.01, typeConfig.baseSize)
      : 60;
    const density = Number.isFinite(typeConfig.density)
      ? Math.max(1, Math.floor(typeConfig.density))
      : 80;
    const centerBiasExponent = Number.isFinite(typeConfig.centerBiasExponent)
      ? Math.max(0.01, typeConfig.centerBiasExponent)
      : 1.6;
    const hoverAmplitudeDegRange = normalizeRangeInput(typeConfig.hoverAmplitudeDegRange, 2, 6);
    const hoverSpeedRange = normalizeRangeInput(typeConfig.hoverSpeedRange, 2.2, 4.2);
    const drawOrder = typeConfig.drawOrder === 'random' ? 'random' : 'outerFirst';

    const points = [];
    const radiusSq = baseSize * baseSize;
    for (let i = 0; i < density; i += 1) {
      const theta = rng() * Math.PI * 2;
      const u = rng();
      const rNorm = Math.pow(Math.sqrt(u), centerBiasExponent);
      const radialDistance = baseSize * rNorm;
      const offsetX = Math.cos(theta) * radialDistance;
      const offsetY = Math.sin(theta) * radialDistance;

      const halfChordX = Math.sqrt(Math.max(0, radiusSq - offsetY * offsetY));
      const halfChordY = Math.sqrt(Math.max(0, radiusSq - offsetX * offsetX));
      const xProgress = halfChordX > 1e-6 ? (offsetX + halfChordX) / (2 * halfChordX) : 0.5;
      const yProgress = halfChordY > 1e-6 ? (offsetY + halfChordY) / (2 * halfChordY) : 0.5;
      const col = clamp(
        Math.round(xProgress * Math.max(0, spriteCols - 1)),
        0,
        Math.max(0, spriteCols - 1),
      );
      const row = clamp(
        Math.round(yProgress * Math.max(0, spriteRows - 1)),
        0,
        Math.max(0, spriteRows - 1),
      );

      points.push({
        offsetX,
        offsetY,
        radialDistance,
        distanceSq: offsetX * offsetX + offsetY * offsetY,
        col,
        row,
        baseAngleRad: Math.atan2(offsetY, offsetX),
        hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
        hoverSpeed: sampleRange(hoverSpeedRange, rng),
      });
    }

    if (drawOrder === 'outerFirst') {
      points.sort((a, b) => b.distanceSq - a.distanceSq);
    }

    return {
      petals: points,
      assetPath: resolveBlueAssetPath(typeConfig, rng),
      centerAngleRad: 0,
      interactionRadius: commonConfig.drawSize * commonConfig.swayInteractionRadiusFactor,
    };
  }

  function drawBlueFlower(ctx, flower, typeConfig, commonConfig, runtimeState) {
    const image = runtimeState.getImage(flower.assetPath);
    if (!image || !Array.isArray(flower.petals) || flower.petals.length === 0) {
      return false;
    }

    const pointDrawSize = Number.isFinite(typeConfig.pointDrawSize)
      ? Math.max(1, typeConfig.pointDrawSize)
      : 18;
    const halfPointSize = pointDrawSize * 0.5;
    const swayAroundPersonalOrigin = commonConfig.blueSwayRotateAroundPetalOrigin === true;
    const jumpAroundPersonalOrigin = commonConfig.blueJumpRotateAroundPetalOrigin === true;
    const useFastPath = commonConfig.swayFastPathEnabled === true;
    const orbitIsStatic = swayAroundPersonalOrigin && jumpAroundPersonalOrigin;
    const orbitUsesCombinedRotation = !swayAroundPersonalOrigin && !jumpAroundPersonalOrigin;

    for (let i = 0; i < flower.petals.length; i += 1) {
      const point = flower.petals[i];
      const sourceRect = point.sourceRect || getSpriteSourceRect(typeConfig, point.col, point.row);
      const radialDistance = Number.isFinite(point.radialDistance) ? point.radialDistance : 0;
      const baseAngle = point.baseAngleRad || 0;
      const swayOffset = resolvePetalSwayOffsetRad(flower, point);
      const jumpOffset = resolvePetalJumpOffsetRad(point);

      let x;
      let y;
      if (orbitIsStatic && useFastPath) {
        x = flower.x + (Number.isFinite(point.offsetX) ? point.offsetX : 0);
        y = flower.y + (Number.isFinite(point.offsetY) ? point.offsetY : 0);
      } else if (orbitUsesCombinedRotation && useFastPath) {
        const totalOffset = swayOffset + jumpOffset;
        const c = Math.cos(totalOffset);
        const s = Math.sin(totalOffset);
        const baseCos = Number.isFinite(point.baseCos) ? point.baseCos : Math.cos(baseAngle);
        const baseSin = Number.isFinite(point.baseSin) ? point.baseSin : Math.sin(baseAngle);
        x = flower.x + ((baseCos * c - baseSin * s) * radialDistance);
        y = flower.y + ((baseSin * c + baseCos * s) * radialDistance);
      } else {
        let orbitalAngle = baseAngle;
        if (!swayAroundPersonalOrigin) {
          orbitalAngle += swayOffset;
        }
        if (!jumpAroundPersonalOrigin) {
          orbitalAngle += jumpOffset;
        }
        x = flower.x + Math.cos(orbitalAngle) * radialDistance;
        y = flower.y + Math.sin(orbitalAngle) * radialDistance;
      }

      let spriteAngle = 0;
      if (swayAroundPersonalOrigin) {
        spriteAngle += swayOffset;
      }
      if (jumpAroundPersonalOrigin) {
        spriteAngle += jumpOffset;
      }

      if (Math.abs(spriteAngle) > 1e-8) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(spriteAngle);
        ctx.drawImage(
          image,
          sourceRect.sx,
          sourceRect.sy,
          sourceRect.sw,
          sourceRect.sh,
          -halfPointSize,
          -halfPointSize,
          pointDrawSize,
          pointDrawSize,
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          image,
          sourceRect.sx,
          sourceRect.sy,
          sourceRect.sw,
          sourceRect.sh,
          x - halfPointSize,
          y - halfPointSize,
          pointDrawSize,
          pointDrawSize,
        );
      }
    }

    return true;
  }

  const FLOWER_TYPE_REGISTRY = {
    lily: {
      resolveTypeConfig(flowersConfig) {
        return resolveLilyTypeConfig(flowersConfig);
      },

      getAssetPaths(typeConfig) {
        return [resolveLilyAssetPath(typeConfig)];
      },

      buildFlower(endpoint, typeConfig, commonConfig, rng) {
        return buildLilyFlower(endpoint, typeConfig, commonConfig, rng);
      },

      drawFlower(ctx, flower, typeConfig, commonConfig, runtimeState) {
        return drawLilyFlower(ctx, flower, typeConfig, commonConfig, runtimeState);
      },
    },
    blue: {
      resolveTypeConfig(flowersConfig) {
        return resolveBlueTypeConfig(flowersConfig);
      },

      getAssetPaths(typeConfig) {
        return resolveBlueAssetPaths(typeConfig);
      },

      buildFlower(endpoint, typeConfig, commonConfig, rng) {
        return buildBlueFlower(endpoint, typeConfig, commonConfig, rng);
      },

      drawFlower(ctx, flower, typeConfig, commonConfig, runtimeState) {
        return drawBlueFlower(ctx, flower, typeConfig, commonConfig, runtimeState);
      },
    },
  };

  function resolveTypeConfig(typeName, flowersConfig) {
    const entry = FLOWER_TYPE_REGISTRY[typeName] || FLOWER_TYPE_REGISTRY.lily;
    return entry.resolveTypeConfig(flowersConfig);
  }

  function resolveTypeNameForEndpoint(endpoint, index, commonConfig) {
    const fallbackType = 'lily';
    const mode = sanitizeAssignmentMode(commonConfig.assignmentMode);

    if (mode === 'single') {
      return sanitizeSingleType(commonConfig.singleType, FLOWER_TYPE_REGISTRY, fallbackType);
    }

    const ratios = sanitizeMixRatios(commonConfig.mixRatios, FLOWER_TYPE_REGISTRY, fallbackType);
    const entries = Object.entries(ratios);
    if (entries.length <= 1) {
      return entries[0] ? entries[0][0] : fallbackType;
    }

    let total = 0;
    for (let i = 0; i < entries.length; i += 1) {
      total += entries[i][1];
    }
    if (total <= 0) {
      return fallbackType;
    }

    const stableToken = getStableToken(endpoint, index);
    const rng = mulberry32(hashSeed(`${stableToken}|flower-type`));
    const target = rng() * total;

    let cumulative = 0;
    for (let i = 0; i < entries.length; i += 1) {
      cumulative += entries[i][1];
      if (target <= cumulative) {
        return entries[i][0];
      }
    }

    return entries[entries.length - 1][0];
  }

  function createFlowerSystem() {
    const state = {
      flowers: [],
      activeFlowerIndices: [],
      staticLayerActiveSnapshot: [],
      petalOpenAmount: 1,
      useClosedPetalSprites: false,
      petalToggleTransition: {
        active: false,
        startAmount: 1,
        targetAmount: 1,
        startTimeMs: 0,
        durationMs: 0,
        easePower: 2.2,
        openBounceAmount: 0,
        openBounceOscillations: 2,
        spriteSwapProgress: 0.14,
        isClosing: false,
        progress: 1,
      },
      mouseX: OFFSCREEN_POINTER,
      mouseY: OFFSCREEN_POINTER,
      mouseSpeedPxPerSec: 0,
      mouseLastSampleX: OFFSCREEN_POINTER,
      mouseLastSampleY: OFFSCREEN_POINTER,
      mouseLastSampleMs: 0,
      lastUpdateMs: 0,
      alwaysSimLastMs: 0,
      alwaysSimAccumulatorSec: 0,
      alwaysRenderAlpha: 0,
      staticLayerCanvas: null,
      staticLayerCtx: null,
      staticLayerDirty: true,
      staticLayerScaleX: 1,
      staticLayerScaleY: 1,
      imageCache: new Map(),
      imageLoadPromises: new Map(),
      performance: {
        updateTotalMs: 0,
        updateSamples: 0,
        drawTotalMs: 0,
        drawSamples: 0,
        staticLayerRebuildCount: 0,
        staticLayerRebuildTotalMs: 0,
        staticLayerRebuildLastMs: 0,
        activeFlowerCount: 0,
        simStepTotalMs: 0,
        simStepSamples: 0,
        totalSimSteps: 0,
        interpolatedFrames: 0,
        perfStartMs: performance.now(),
      },
    };

    function markStaticLayerDirty() {
      state.staticLayerDirty = true;
    }

    function invalidateAllFlowerRenderCaches() {
      for (let i = 0; i < state.flowers.length; i += 1) {
        const flower = state.flowers[i];
        if (flower && flower.renderCache) {
          flower.renderCache.valid = false;
        }
      }
    }

    function resetStaticLayerActiveSnapshot() {
      state.staticLayerActiveSnapshot = [];
    }

    function ensureStaticLayerCanvas(width, height, scaleX = 1, scaleY = 1) {
      const safeWidth = Number.isFinite(width) ? Math.max(1, Math.floor(width)) : 1;
      const safeHeight = Number.isFinite(height) ? Math.max(1, Math.floor(height)) : 1;
      const safeScaleX = Number.isFinite(scaleX) && Math.abs(scaleX) > 1e-8 ? Math.abs(scaleX) : 1;
      const safeScaleY = Number.isFinite(scaleY) && Math.abs(scaleY) > 1e-8 ? Math.abs(scaleY) : 1;
      if (!state.staticLayerCanvas) {
        state.staticLayerCanvas = document.createElement('canvas');
        state.staticLayerCtx = state.staticLayerCanvas.getContext('2d');
        markStaticLayerDirty();
      }
      if (
        state.staticLayerCanvas.width !== safeWidth
        || state.staticLayerCanvas.height !== safeHeight
      ) {
        state.staticLayerCanvas.width = safeWidth;
        state.staticLayerCanvas.height = safeHeight;
        markStaticLayerDirty();
      }
      if (
        Math.abs(state.staticLayerScaleX - safeScaleX) > 1e-8
        || Math.abs(state.staticLayerScaleY - safeScaleY) > 1e-8
      ) {
        state.staticLayerScaleX = safeScaleX;
        state.staticLayerScaleY = safeScaleY;
        markStaticLayerDirty();
      }
      if (state.staticLayerCtx) {
        state.staticLayerCtx.setTransform(state.staticLayerScaleX, 0, 0, state.staticLayerScaleY, 0, 0);
        state.staticLayerCtx.imageSmoothingEnabled = true;
      }
      return state.staticLayerCtx;
    }

    function hasActiveMembershipChanged() {
      const previous = state.staticLayerActiveSnapshot;
      const current = state.activeFlowerIndices;
      if (previous.length !== current.length) {
        return true;
      }
      for (let i = 0; i < current.length; i += 1) {
        if (previous[i] !== current[i]) {
          return true;
        }
      }
      return false;
    }

    function syncActiveMembershipSnapshot() {
      if (!hasActiveMembershipChanged()) {
        return false;
      }
      state.staticLayerActiveSnapshot = state.activeFlowerIndices.slice();
      markStaticLayerDirty();
      return true;
    }

    function getImage(path) {
      if (typeof path !== 'string' || path.length === 0) {
        return null;
      }
      return state.imageCache.get(path) || null;
    }

    function loadSprite(spritePath) {
      const nextSpritePath = (typeof spritePath === 'string' && spritePath.length > 0)
        ? spritePath
        : DEFAULT_LILY_SPRITE_PATH;

      const cachedImage = state.imageCache.get(nextSpritePath);
      if (cachedImage) {
        return Promise.resolve(cachedImage);
      }

      const inFlight = state.imageLoadPromises.get(nextSpritePath);
      if (inFlight) {
        return inFlight;
      }

      const promise = loadImage(nextSpritePath)
        .then((image) => {
          state.imageCache.set(nextSpritePath, image);
          markStaticLayerDirty();
          invalidateAllFlowerRenderCaches();
          return image;
        })
        .finally(() => {
          state.imageLoadPromises.delete(nextSpritePath);
        });

      state.imageLoadPromises.set(nextSpritePath, promise);
      return promise;
    }

    async function loadAssets(flowersConfig) {
      const commonConfig = resolveCommonFlowerConfig(flowersConfig || {});
      const assignmentMode = sanitizeAssignmentMode(commonConfig.assignmentMode);
      const typeNames = [];

      if (assignmentMode === 'mixed') {
        const sanitizedRatios = sanitizeMixRatios(commonConfig.mixRatios, FLOWER_TYPE_REGISTRY, 'lily');
        const ratioTypeNames = Object.keys(sanitizedRatios);
        for (let i = 0; i < ratioTypeNames.length; i += 1) {
          typeNames.push(ratioTypeNames[i]);
        }
      } else {
        typeNames.push(sanitizeSingleType(commonConfig.singleType, FLOWER_TYPE_REGISTRY, 'lily'));
      }

      if (typeNames.length === 0) {
        typeNames.push('lily');
      }

      const uniqueTypeNames = Array.from(new Set(typeNames));
      const pathsToLoad = [];
      for (let i = 0; i < uniqueTypeNames.length; i += 1) {
        const typeName = uniqueTypeNames[i];
        const entry = FLOWER_TYPE_REGISTRY[typeName] || FLOWER_TYPE_REGISTRY.lily;
        const typeConfig = resolveTypeConfig(typeName, flowersConfig || {});
        const assetPaths = entry.getAssetPaths(typeConfig);
        for (let p = 0; p < assetPaths.length; p += 1) {
          const path = assetPaths[p];
          if (typeof path === 'string' && path.length > 0) {
            pathsToLoad.push(path);
          }
        }
      }

      const uniquePaths = Array.from(new Set(pathsToLoad));
      const results = await Promise.allSettled(uniquePaths.map((path) => loadSprite(path)));

      let loadedCount = 0;
      for (let i = 0; i < results.length; i += 1) {
        if (results[i].status === 'fulfilled') {
          loadedCount += 1;
        }
      }

      if (uniquePaths.length > 0 && loadedCount === 0) {
        const firstFailure = results.find((result) => result.status === 'rejected');
        if (firstFailure && firstFailure.reason instanceof Error) {
          throw firstFailure.reason;
        }
        throw new Error('Failed to load any flower assets.');
      }

      return {
        requested: uniquePaths.length,
        loaded: loadedCount,
      };
    }

    function setEndpoints(endpoints, flowersConfig) {
      const source = Array.isArray(endpoints) ? endpoints : [];
      const safeFlowersConfig = isPlainObject(flowersConfig) ? flowersConfig : {};
      const commonConfig = resolveCommonFlowerConfig(safeFlowersConfig);

      state.flowers = [];
      state.alwaysSimAccumulatorSec = 0;
      state.alwaysSimLastMs = 0;
      state.alwaysRenderAlpha = 0;
      for (let i = 0; i < source.length; i += 1) {
        const endpoint = source[i];
        const typeName = resolveTypeNameForEndpoint(endpoint, i, commonConfig);
        const entry = FLOWER_TYPE_REGISTRY[typeName] || FLOWER_TYPE_REGISTRY.lily;
        const typeConfig = resolveTypeConfig(typeName, safeFlowersConfig);

        const stableToken = getStableToken(endpoint, i);
        const rng = mulberry32(hashSeed(`${stableToken}|flower`));
        const built = entry.buildFlower(endpoint, typeConfig, commonConfig, rng);
        if (!built || !Array.isArray(built.petals) || built.petals.length === 0) {
          continue;
        }
        const petals = [];
        const spriteCols = Number.isFinite(typeConfig.spriteCols)
          ? Math.max(1, Math.floor(typeConfig.spriteCols))
          : 1;
        const spriteRows = Number.isFinite(typeConfig.spriteRows)
          ? Math.max(1, Math.floor(typeConfig.spriteRows))
          : 1;
        const closedMiddlePetalCol = resolveLilyMiddlePetalColumn(typeConfig);

        for (let p = 0; p < built.petals.length; p += 1) {
          const rawPetal = built.petals[p] || {};
          const col = clamp(
            Number.isFinite(rawPetal.col) ? Math.floor(rawPetal.col) : 0,
            0,
            Math.max(0, spriteCols - 1),
          );
          const row = clamp(
            Number.isFinite(rawPetal.row) ? Math.floor(rawPetal.row) : 0,
            0,
            Math.max(0, spriteRows - 1),
          );
          const offsetX = Number.isFinite(rawPetal.offsetX) ? rawPetal.offsetX : 0;
          const offsetY = Number.isFinite(rawPetal.offsetY) ? rawPetal.offsetY : 0;
          const sourceRect = getSpriteSourceRect(typeConfig, col, row);
          const normalizedPetal = {
            col,
            row,
            sourceRect,
            baseAngleRad: Number.isFinite(rawPetal.baseAngleRad) ? rawPetal.baseAngleRad : 0,
            baseCos: 0,
            baseSin: 0,
            screenOffsetY: Number.isFinite(rawPetal.screenOffsetY) ? rawPetal.screenOffsetY : 0,
            screenOffsetX: Number.isFinite(rawPetal.screenOffsetX) ? rawPetal.screenOffsetX : 0,
            offsetX,
            offsetY,
            radialDistance: Number.isFinite(rawPetal.radialDistance)
              ? Math.max(0, rawPetal.radialDistance)
              : Math.hypot(offsetX, offsetY),
            distanceSq: Number.isFinite(rawPetal.distanceSq)
              ? rawPetal.distanceSq
              : (offsetX * offsetX + offsetY * offsetY),
            hoverAmplitudeRad: Number.isFinite(rawPetal.hoverAmplitudeRad)
              ? rawPetal.hoverAmplitudeRad
              : 0,
            hoverSpeed: Number.isFinite(rawPetal.hoverSpeed) ? rawPetal.hoverSpeed : 0,
            jumpAngleOffsetRad: 0,
            jumpTargetAngleOffsetRad: 0,
          };
          normalizedPetal.baseCos = Math.cos(normalizedPetal.baseAngleRad);
          normalizedPetal.baseSin = Math.sin(normalizedPetal.baseAngleRad);

          if (typeName === 'lily') {
            let innerCol = col;
            if (col === 0) {
              innerCol = Math.min(Math.max(0, spriteCols - 1), 1);
            } else if (col === 6) {
              innerCol = Math.max(0, Math.min(spriteCols - 1, 5));
            }
            normalizedPetal.innerSourceRect = getSpriteSourceRect(typeConfig, innerCol, row);
            normalizedPetal.closedMiddleSourceRect = getSpriteSourceRect(
              typeConfig,
              closedMiddlePetalCol,
              row,
            );
          }

          petals.push(normalizedPetal);
        }

        const drawSize = commonConfig.drawSize;
        const interactionRadius = Number.isFinite(built.interactionRadius)
          ? Math.max(0, built.interactionRadius)
          : drawSize * commonConfig.swayInteractionRadiusFactor;

        state.flowers.push({
          type: typeName,
          typeConfig,
          assetPath: typeof built.assetPath === 'string' ? built.assetPath : '',
          centerAngleRad: Number.isFinite(built.centerAngleRad) ? built.centerAngleRad : 0,
          branchId: endpoint && Number.isFinite(endpoint.branchId) ? endpoint.branchId : null,
          x: endpoint && Number.isFinite(endpoint.x) ? endpoint.x : 0,
          y: endpoint && Number.isFinite(endpoint.y) ? endpoint.y : 0,
          petals,
          interactionRadius,
          hoverInfluence: 0,
          prevHoverInfluence: 0,
          renderHoverInfluence: 0,
          targetInfluence: 0,
          motionTime: 0,
          prevMotionTime: 0,
          renderMotionTime: 0,
          wasInsideRange: false,
          isSwayActive: false,
          hasJumpMotion: false,
          isActive: false,
          renderCache: {
            canvas: null,
            ctx: null,
            valid: false,
            widthCss: 0,
            heightCss: 0,
            widthPx: 0,
            heightPx: 0,
            originXCss: 0,
            originYCss: 0,
            scaleX: 1,
            scaleY: 1,
            petalOpenAmount: 1,
            useClosedPetalSprites: false,
            alwaysPoseKey: '',
          },
        });
      }

      state.activeFlowerIndices = [];
      resetStaticLayerActiveSnapshot();
      markStaticLayerDirty();
      state.lastUpdateMs = 0;
    }

    function setMousePosition(x, y) {
      const nextX = Number.isFinite(x) ? x : OFFSCREEN_POINTER;
      const nextY = Number.isFinite(y) ? y : OFFSCREEN_POINTER;
      const nowMs = performance.now();
      if (
        nextX !== OFFSCREEN_POINTER
        && nextY !== OFFSCREEN_POINTER
        && state.mouseLastSampleX !== OFFSCREEN_POINTER
        && state.mouseLastSampleY !== OFFSCREEN_POINTER
        && state.mouseLastSampleMs > 0
      ) {
        const dtSec = Math.max(1e-4, (nowMs - state.mouseLastSampleMs) / 1000);
        const dx = nextX - state.mouseLastSampleX;
        const dy = nextY - state.mouseLastSampleY;
        state.mouseSpeedPxPerSec = Math.hypot(dx, dy) / dtSec;
      }
      state.mouseLastSampleX = nextX;
      state.mouseLastSampleY = nextY;
      state.mouseLastSampleMs = nowMs;
      state.mouseX = nextX;
      state.mouseY = nextY;
    }

    function clearMousePosition() {
      state.mouseX = OFFSCREEN_POINTER;
      state.mouseY = OFFSCREEN_POINTER;
      state.mouseSpeedPxPerSec = 0;
      state.mouseLastSampleX = OFFSCREEN_POINTER;
      state.mouseLastSampleY = OFFSCREEN_POINTER;
      state.mouseLastSampleMs = 0;
    }

    function setPetalOpenAmount(nextAmount) {
      const numeric = Number(nextAmount);
      if (!Number.isFinite(numeric)) {
        return state.petalOpenAmount;
      }
      state.petalOpenAmount = clamp(numeric, 0, 1);
      state.useClosedPetalSprites = state.petalOpenAmount <= 0.001;
      state.petalToggleTransition.active = false;
      state.petalToggleTransition.isClosing = false;
      state.petalToggleTransition.progress = 1;
      markStaticLayerDirty();
      invalidateAllFlowerRenderCaches();
      return state.petalOpenAmount;
    }

    function togglePetalOpenState() {
      state.petalOpenAmount = state.petalOpenAmount >= 0.5 ? 0 : 1;
      state.useClosedPetalSprites = state.petalOpenAmount <= 0.001;
      state.petalToggleTransition.active = false;
      state.petalToggleTransition.isClosing = false;
      state.petalToggleTransition.progress = 1;
      markStaticLayerDirty();
      invalidateAllFlowerRenderCaches();
      return state.petalOpenAmount;
    }

    function animateTogglePetalOpenState(flowersConfig, nowMs) {
      const commonConfig = resolveCommonFlowerConfig(flowersConfig || {});
      const startAmount = clamp(state.petalOpenAmount, 0, 1);
      const targetAmount = startAmount >= 0.5 ? 0 : 1;
      const durationMs = Math.max(0, commonConfig.petalToggleAnimationDurationSec * 1000);
      const startTimeMs = Number.isFinite(nowMs) ? nowMs : performance.now();

      state.petalToggleTransition = {
        active: durationMs > 0,
        startAmount,
        targetAmount,
        startTimeMs,
        durationMs,
        easePower: commonConfig.petalToggleAnimationEasePower,
        openBounceAmount: commonConfig.petalToggleOpenBounceAmount,
        openBounceOscillations: commonConfig.petalToggleOpenBounceOscillations,
        spriteSwapProgress: commonConfig.petalToggleSpriteSwapProgress,
        isClosing: targetAmount < startAmount,
        progress: 0,
      };

      if (durationMs <= 0) {
        state.petalOpenAmount = targetAmount;
        state.useClosedPetalSprites = targetAmount <= 0.001;
        state.petalToggleTransition.progress = 1;
      }
      markStaticLayerDirty();
      invalidateAllFlowerRenderCaches();

      return state.petalOpenAmount;
    }

    function getPetalOpenAmount() {
      return state.petalOpenAmount;
    }

    function getUseClosedPetalSprites() {
      return state.useClosedPetalSprites === true;
    }

    function getPetalToggleIsActive() {
      return Boolean(state.petalToggleTransition && state.petalToggleTransition.active);
    }

    function getPetalToggleIsClosing() {
      return Boolean(state.petalToggleTransition && state.petalToggleTransition.isClosing);
    }

    function getPetalToggleProgress() {
      return state.petalToggleTransition && Number.isFinite(state.petalToggleTransition.progress)
        ? state.petalToggleTransition.progress
        : 1;
    }

    function getPetalToggleStartAmount() {
      return state.petalToggleTransition && Number.isFinite(state.petalToggleTransition.startAmount)
        ? clamp(state.petalToggleTransition.startAmount, 0, 1)
        : clamp(state.petalOpenAmount, 0, 1);
    }

    function getPetalToggleTargetAmount() {
      return state.petalToggleTransition && Number.isFinite(state.petalToggleTransition.targetAmount)
        ? clamp(state.petalToggleTransition.targetAmount, 0, 1)
        : clamp(state.petalOpenAmount, 0, 1);
    }

    function getPetalToggleEasePower() {
      return state.petalToggleTransition && Number.isFinite(state.petalToggleTransition.easePower)
        ? Math.max(0.01, state.petalToggleTransition.easePower)
        : 1;
    }

    function getPetalToggleOpenBounceAmount() {
      return state.petalToggleTransition && Number.isFinite(state.petalToggleTransition.openBounceAmount)
        ? Math.max(0, state.petalToggleTransition.openBounceAmount)
        : 0;
    }

    function getPetalToggleOpenBounceOscillations() {
      return state.petalToggleTransition && Number.isFinite(state.petalToggleTransition.openBounceOscillations)
        ? Math.max(0.25, state.petalToggleTransition.openBounceOscillations)
        : 2;
    }

    function applyJumpAt(x, y, flowersConfig) {
      if (!Number.isFinite(x) || !Number.isFinite(y) || state.flowers.length === 0) {
        return 0;
      }

      const commonConfig = resolveCommonFlowerConfig(flowersConfig || {});
      if (!commonConfig.jumpEnabled) {
        return 0;
      }

      const jumpRadius = commonConfig.drawSize * commonConfig.jumpInteractionRadiusFactor;
      if (!(jumpRadius > 0)) {
        return 0;
      }
      const jumpRadiusSq = jumpRadius * jumpRadius;
      const maxJumpRad = degToRad(commonConfig.jumpStrengthDeg);
      const jumpJitterRad = degToRad(commonConfig.jumpJitterDeg);
      const distanceExponent = commonConfig.jumpDistanceExponent;
      const offsetScratch = { x: 0, y: 0 };
      let affectedFlowers = 0;

      for (let i = 0; i < state.flowers.length; i += 1) {
        const flower = state.flowers[i];
        if (!Array.isArray(flower.petals) || flower.petals.length === 0) {
          continue;
        }

        const dx = flower.x - x;
        const dy = flower.y - y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq > jumpRadiusSq) {
          continue;
        }

        const distance = Math.sqrt(distanceSq);
        const proximity = 1 - distance / jumpRadius;
        const influence = Math.pow(clamp(proximity, 0, 1), distanceExponent);
        if (influence <= 0) {
          continue;
        }

        const typeConfig = flower.typeConfig || {};
        const displacementSpace = typeConfig.displacementSpace === 'screen' ? 'screen' : 'flower';
        const centerAngleRad = Number.isFinite(flower.centerAngleRad) ? flower.centerAngleRad : 0;
        const cosCenter = Math.cos(centerAngleRad);
        const sinCenter = Math.sin(centerAngleRad);
        const spriteCellHeight = Number.isFinite(typeConfig.spriteCellHeight)
          ? Math.max(1, typeConfig.spriteCellHeight)
          : 45.819;
        const drawSize = commonConfig.drawSize;
        const petalCenterLocalY = (
          -drawSize
          + ((2.2 / spriteCellHeight) * drawSize)
          + (drawSize * 0.5)
        );

        for (let p = 0; p < flower.petals.length; p += 1) {
          const petal = flower.petals[p];
          let renderedAngle = resolvePetalRenderedAngleRad(flower, petal);
          let petalWorldX = flower.x;
          let petalWorldY = flower.y;
          if (flower.type === 'blue') {
            const swayAroundPersonalOrigin = commonConfig.blueSwayRotateAroundPetalOrigin === true;
            const jumpAroundPersonalOrigin = commonConfig.blueJumpRotateAroundPetalOrigin === true;
            const baseAngle = petal.baseAngleRad || 0;
            const swayOffset = resolvePetalSwayOffsetRad(flower, petal);
            const jumpOffset = resolvePetalJumpOffsetRad(petal);

            let orbitalAngle = baseAngle;
            if (!swayAroundPersonalOrigin) {
              orbitalAngle += swayOffset;
            }
            if (!jumpAroundPersonalOrigin) {
              orbitalAngle += jumpOffset;
            }

            const radialDistance = Number.isFinite(petal.radialDistance) ? petal.radialDistance : 0;
            petalWorldX += Math.cos(orbitalAngle) * radialDistance;
            petalWorldY += Math.sin(orbitalAngle) * radialDistance;

            if (swayAroundPersonalOrigin || jumpAroundPersonalOrigin) {
              renderedAngle = 0;
              if (swayAroundPersonalOrigin) {
                renderedAngle += swayOffset;
              }
              if (jumpAroundPersonalOrigin) {
                renderedAngle += jumpOffset;
              }
            } else {
              renderedAngle = orbitalAngle;
            }
          } else {
            resolvePetalScreenOffsetsInto(
              petal,
              displacementSpace,
              cosCenter,
              sinCenter,
              offsetScratch,
            );
            const cosAngle = Math.cos(renderedAngle);
            const sinAngle = Math.sin(renderedAngle);
            petalWorldX = flower.x + offsetScratch.x - (sinAngle * petalCenterLocalY);
            petalWorldY = flower.y + offsetScratch.y + (cosAngle * petalCenterLocalY);
          }
          const awayAngleRad = Math.atan2(petalWorldY - y, petalWorldX - x);
          const deltaAwayRad = signedAngleDeltaRad(renderedAngle, awayAngleRad);
          const directionalKickRad = clamp(deltaAwayRad, -maxJumpRad, maxJumpRad) * influence;
          const jitterKickRad = (Math.random() * 2 - 1) * jumpJitterRad * influence;
          const nextOffsetRad = (Number.isFinite(petal.jumpTargetAngleOffsetRad) ? petal.jumpTargetAngleOffsetRad : 0)
            + directionalKickRad
            + jitterKickRad;
          petal.jumpTargetAngleOffsetRad = clamp(nextOffsetRad, -maxJumpRad, maxJumpRad);
        }
        flower.hasJumpMotion = true;
        affectedFlowers += 1;
      }

      return affectedFlowers;
    }

    function stepFlowersAlwaysSway(commonConfig, dtSec, mouseSwayScale) {
      state.activeFlowerIndices = [];
      const swayInteractionRadius = commonConfig.drawSize * commonConfig.swayInteractionRadiusFactor;
      const jumpAttackSpeedRadPerSec = degToRad(commonConfig.jumpAttackSpeedDegPerSec);
      const jumpReturnSpeedRadPerSec = degToRad(commonConfig.jumpReturnSpeedDegPerSec);
      const jumpEpsilonRad = degToRad(commonConfig.jumpEpsilonDeg);

      for (let i = 0; i < state.flowers.length; i += 1) {
        const flower = state.flowers[i];
        flower.interactionRadius = swayInteractionRadius;
        flower.targetInfluence = 1;

        const influenceSpeed = flower.targetInfluence > flower.hoverInfluence
          ? commonConfig.swayRiseSpeed
          : commonConfig.swayFallSpeed;

        flower.hoverInfluence = moveToward(
          flower.hoverInfluence,
          flower.targetInfluence,
          influenceSpeed * mouseSwayScale * dtSec,
        );

        flower.isSwayActive = flower.hoverInfluence > 0 || flower.targetInfluence > 0;
        let hasJumpMotion = flower.hasJumpMotion === true;
        if (hasJumpMotion && Array.isArray(flower.petals) && flower.petals.length > 0) {
          hasJumpMotion = false;
          for (let p = 0; p < flower.petals.length; p += 1) {
            const petal = flower.petals[p];
            const currentJumpOffset = petal.jumpAngleOffsetRad || 0;
            const currentJumpTarget = petal.jumpTargetAngleOffsetRad || 0;
            const nextJumpTarget = moveToward(currentJumpTarget, 0, jumpReturnSpeedRadPerSec * dtSec);
            petal.jumpTargetAngleOffsetRad = Math.abs(nextJumpTarget) <= jumpEpsilonRad ? 0 : nextJumpTarget;
            const nextJumpOffset = moveToward(
              currentJumpOffset,
              petal.jumpTargetAngleOffsetRad,
              jumpAttackSpeedRadPerSec * dtSec,
            );
            petal.jumpAngleOffsetRad = Math.abs(nextJumpOffset) <= jumpEpsilonRad ? 0 : nextJumpOffset;
            if (petal.jumpAngleOffsetRad !== 0 || petal.jumpTargetAngleOffsetRad !== 0) {
              hasJumpMotion = true;
            }
          }
        }
        flower.hasJumpMotion = hasJumpMotion;

        if (flower.isSwayActive || hasJumpMotion) {
          flower.motionTime += dtSec * mouseSwayScale;
          state.activeFlowerIndices.push(i);
          flower.isActive = true;
        } else {
          flower.isActive = false;
        }

        flower.wasInsideRange = false;
      }

      state.performance.activeFlowerCount = state.activeFlowerIndices.length;
      return state.activeFlowerIndices.length;
    }

    function updateAlwaysSwayTemporal(commonConfig, nowMs) {
      const updateTimeMs = Number.isFinite(nowMs) ? nowMs : performance.now();
      if (!Number.isFinite(state.alwaysSimLastMs) || state.alwaysSimLastMs <= 0) {
        state.alwaysSimLastMs = updateTimeMs;
      }
      const elapsedSec = clamp((updateTimeMs - state.alwaysSimLastMs) / 1000, 0, MAX_DT_SEC);
      state.alwaysSimLastMs = updateTimeMs;
      state.alwaysSimAccumulatorSec = Math.max(0, (state.alwaysSimAccumulatorSec || 0) + elapsedSec);

      const mouseSpeedDecayPxPerSec = 2600;
      state.mouseSpeedPxPerSec = moveToward(
        state.mouseSpeedPxPerSec || 0,
        0,
        mouseSpeedDecayPxPerSec * elapsedSec,
      );
      const mouseSpeedNorm = clamp((state.mouseSpeedPxPerSec || 0) / 1600, 0, 1);
      const mouseSpeedSwayAffect = Math.max(0, Number(commonConfig.mouseSpeedSwayAffect) || 0);
      const mouseSwayScale = clamp(1 + (mouseSpeedNorm * mouseSpeedSwayAffect), 1, 8);

      let steps = 0;
      while (
        state.alwaysSimAccumulatorSec >= ALWAYS_SWAY_SIM_DT_SEC
        && steps < ALWAYS_SWAY_MAX_STEPS_PER_FRAME
      ) {
        const stepStartMs = performance.now();
        for (let i = 0; i < state.flowers.length; i += 1) {
          const flower = state.flowers[i];
          flower.prevHoverInfluence = Number.isFinite(flower.hoverInfluence) ? flower.hoverInfluence : 0;
          flower.prevMotionTime = Number.isFinite(flower.motionTime) ? flower.motionTime : 0;
        }
        stepFlowersAlwaysSway(commonConfig, ALWAYS_SWAY_SIM_DT_SEC, mouseSwayScale);
        const stepElapsedMs = Math.max(0, performance.now() - stepStartMs);
        state.performance.simStepTotalMs += stepElapsedMs;
        state.performance.simStepSamples += 1;
        state.performance.totalSimSteps += 1;
        state.alwaysSimAccumulatorSec -= ALWAYS_SWAY_SIM_DT_SEC;
        steps += 1;
      }
      if (steps === 0) {
        for (let i = 0; i < state.flowers.length; i += 1) {
          const flower = state.flowers[i];
          if (!Number.isFinite(flower.prevHoverInfluence)) {
            flower.prevHoverInfluence = Number.isFinite(flower.hoverInfluence) ? flower.hoverInfluence : 0;
          }
          if (!Number.isFinite(flower.prevMotionTime)) {
            flower.prevMotionTime = Number.isFinite(flower.motionTime) ? flower.motionTime : 0;
          }
        }
      }
      state.alwaysRenderAlpha = clamp(
        state.alwaysSimAccumulatorSec / ALWAYS_SWAY_SIM_DT_SEC,
        0,
        1,
      );
      state.performance.interpolatedFrames += 1;
      return state.activeFlowerIndices.length;
    }

    function update(flowersConfig, nowMs, commonConfigOverride = null) {
      if (state.flowers.length === 0) {
        state.activeFlowerIndices = [];
        resetStaticLayerActiveSnapshot();
        markStaticLayerDirty();
        state.performance.activeFlowerCount = 0;
        state.lastUpdateMs = Number.isFinite(nowMs) ? nowMs : performance.now();
        return 0;
      }

      const commonConfig = commonConfigOverride || resolveCommonFlowerConfig(flowersConfig || {});
      const updateTimeMs = Number.isFinite(nowMs) ? nowMs : performance.now();
      if (!Number.isFinite(state.lastUpdateMs) || state.lastUpdateMs <= 0) {
        state.lastUpdateMs = updateTimeMs;
      }
      const dtSec = clamp((updateTimeMs - state.lastUpdateMs) / 1000, 0, MAX_DT_SEC);
      state.lastUpdateMs = updateTimeMs;

      if (state.petalToggleTransition && state.petalToggleTransition.active) {
        const transition = state.petalToggleTransition;
        const durationMs = Math.max(0, Number(transition.durationMs) || 0);
        const elapsedMs = Math.max(0, updateTimeMs - (Number(transition.startTimeMs) || 0));
        const progress = durationMs > 1e-6 ? clamp(elapsedMs / durationMs, 0, 1) : 1;
        transition.progress = progress;
        state.petalOpenAmount = evaluatePetalToggleAmount(
          transition.startAmount,
          transition.targetAmount,
          progress,
          transition.easePower,
          transition.openBounceAmount,
          transition.openBounceOscillations,
        );

        const spriteSwapProgress = clamp(transition.spriteSwapProgress, 0, 1);
        if (transition.targetAmount < transition.startAmount) {
          // Closing: switch to closed sprites near the start of the animation.
          state.useClosedPetalSprites = progress >= spriteSwapProgress;
        } else if (transition.targetAmount > transition.startAmount) {
          // Opening: use the inverted threshold of the configured swap progress.
          const openingSpriteSwapProgress = 1 - spriteSwapProgress;
          state.useClosedPetalSprites = progress < openingSpriteSwapProgress;
        } else {
          state.useClosedPetalSprites = state.petalOpenAmount <= 0.001;
        }

        if (progress >= 1) {
          state.petalOpenAmount = clamp(transition.targetAmount, 0, 1);
          state.useClosedPetalSprites = state.petalOpenAmount <= 0.001;
          transition.progress = 1;
          state.petalToggleTransition.active = false;
        }
      } else {
        state.useClosedPetalSprites = state.petalOpenAmount <= 0.001;
        if (state.petalToggleTransition) {
          state.petalToggleTransition.progress = 1;
        }
      }

      if (commonConfig.swayMode === 'always') {
        return updateAlwaysSwayTemporal(commonConfig, updateTimeMs);
      }

      state.activeFlowerIndices = [];
      const swayInteractionRadius = commonConfig.drawSize * commonConfig.swayInteractionRadiusFactor;
      const jumpAttackSpeedRadPerSec = degToRad(commonConfig.jumpAttackSpeedDegPerSec);
      const jumpReturnSpeedRadPerSec = degToRad(commonConfig.jumpReturnSpeedDegPerSec);
      const jumpEpsilonRad = degToRad(commonConfig.jumpEpsilonDeg);
      const mouseSpeedDecayPxPerSec = 2600;
      state.mouseSpeedPxPerSec = moveToward(
        state.mouseSpeedPxPerSec || 0,
        0,
        mouseSpeedDecayPxPerSec * dtSec,
      );
      const mouseSpeedNorm = clamp((state.mouseSpeedPxPerSec || 0) / 1600, 0, 1);
      const mouseSpeedSwayAffect = Math.max(0, Number(commonConfig.mouseSpeedSwayAffect) || 0);
      const mouseSwayAdd = mouseSpeedNorm * mouseSpeedSwayAffect;
      const mouseSwayScale = clamp(
        1 + mouseSwayAdd,
        1,
        8,
      );
      const pointerPresent = Number.isFinite(state.mouseX) && Number.isFinite(state.mouseY)
        && state.mouseX !== OFFSCREEN_POINTER && state.mouseY !== OFFSCREEN_POINTER;
      const dynamicCapEnabled = commonConfig.swayMode === 'influence'
        && commonConfig.influenceDynamicCapEnabled === true
        && commonConfig.influenceDynamicCap > 0;
      const dynamicCap = dynamicCapEnabled ? commonConfig.influenceDynamicCap : 0;
      const dynamicCandidates = [];

      for (let i = 0; i < state.flowers.length; i += 1) {
        const flower = state.flowers[i];
        flower.interactionRadius = swayInteractionRadius;

        const dx = state.mouseX - flower.x;
        const dy = state.mouseY - flower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const isInsideRange = distance <= flower.interactionRadius;

        const swayMode = commonConfig.swayMode;
        if (swayMode === 'always') {
          flower.targetInfluence = 1;
        } else if (isInsideRange) {
          flower.targetInfluence = (1 - distance / flower.interactionRadius) * mouseSwayScale;
        } else {
          flower.targetInfluence = 0;
        }

        if (
          swayMode === 'influence'
          && isInsideRange
          && !flower.wasInsideRange
          && flower.hoverInfluence <= commonConfig.swayEpsilon
        ) {
          flower.motionTime = 0;
        }

        const influenceSpeed = flower.targetInfluence > flower.hoverInfluence
          ? commonConfig.swayRiseSpeed
          : commonConfig.swayFallSpeed;
        const influenceSpeedScaled = (
          !pointerPresent && flower.targetInfluence === 0
        )
          ? (influenceSpeed * commonConfig.influenceNoPointerFallBoost)
          : influenceSpeed;

        flower.hoverInfluence = moveToward(
          flower.hoverInfluence,
          flower.targetInfluence,
          influenceSpeedScaled * mouseSwayScale * dtSec,
        );

        if (
          flower.targetInfluence === 0
          && flower.hoverInfluence <= commonConfig.swayEpsilon
        ) {
          flower.hoverInfluence = 0;
        }

        flower.isSwayActive = flower.hoverInfluence > 0 || flower.targetInfluence > 0;
        let hasJumpMotion = flower.hasJumpMotion === true;
        if (hasJumpMotion && Array.isArray(flower.petals) && flower.petals.length > 0) {
          hasJumpMotion = false;
          for (let p = 0; p < flower.petals.length; p += 1) {
            const petal = flower.petals[p];
            const currentJumpOffset = petal.jumpAngleOffsetRad || 0;
            const currentJumpTarget = petal.jumpTargetAngleOffsetRad || 0;

            // Slow settle: target decays to neutral.
            const nextJumpTarget = moveToward(currentJumpTarget, 0, jumpReturnSpeedRadPerSec * dtSec);
            petal.jumpTargetAngleOffsetRad = Math.abs(nextJumpTarget) <= jumpEpsilonRad ? 0 : nextJumpTarget;

            // Fast attack: displayed offset chases target.
            const nextJumpOffset = moveToward(
              currentJumpOffset,
              petal.jumpTargetAngleOffsetRad,
              jumpAttackSpeedRadPerSec * dtSec,
            );
            petal.jumpAngleOffsetRad = Math.abs(nextJumpOffset) <= jumpEpsilonRad ? 0 : nextJumpOffset;

            if (petal.jumpAngleOffsetRad !== 0 || petal.jumpTargetAngleOffsetRad !== 0) {
              hasJumpMotion = true;
            }
          }
        }
        flower.hasJumpMotion = hasJumpMotion;

        if (flower.isSwayActive || hasJumpMotion) {
          flower.motionTime += dtSec * mouseSwayScale;
        }
        flower._candidateActive = Boolean(flower.isSwayActive || hasJumpMotion);
        flower._forceActive = hasJumpMotion && commonConfig.influenceJumpCountsTowardCap !== true;
        flower._dynamicPriority = (
          (Number(flower.hoverInfluence) || 0)
          + (Number(flower.targetInfluence) || 0) * 0.5
          + (isInsideRange ? 0.25 : 0)
          + (hasJumpMotion ? 0.2 : 0)
        );
        if (flower._candidateActive && !flower._forceActive) {
          dynamicCandidates.push(i);
        }

        flower.wasInsideRange = isInsideRange;
      }

      let allowedDynamic = null;
      if (dynamicCapEnabled && dynamicCandidates.length > dynamicCap) {
        dynamicCandidates.sort((a, b) => {
          const aFlower = state.flowers[a];
          const bFlower = state.flowers[b];
          return (Number(bFlower._dynamicPriority) || 0) - (Number(aFlower._dynamicPriority) || 0);
        });
        allowedDynamic = new Set(dynamicCandidates.slice(0, dynamicCap));
      }

      state.activeFlowerIndices = [];
      for (let i = 0; i < state.flowers.length; i += 1) {
        const flower = state.flowers[i];
        if (!flower._candidateActive) {
          flower.isActive = false;
          continue;
        }
        if (flower._forceActive) {
          flower.isActive = true;
          state.activeFlowerIndices.push(i);
          continue;
        }
        if (!allowedDynamic || allowedDynamic.has(i)) {
          flower.isActive = true;
          state.activeFlowerIndices.push(i);
        } else {
          flower.isActive = false;
        }
      }

      state.performance.activeFlowerCount = state.activeFlowerIndices.length;

      return state.activeFlowerIndices.length;
    }

    function drawFlowerRecord(ctx, flower, flowersConfig, commonConfig, runtimeState) {
      if (!ctx || !flower) {
        return false;
      }
      const typeName = FLOWER_TYPE_REGISTRY[flower.type] ? flower.type : 'lily';
      const entry = FLOWER_TYPE_REGISTRY[typeName] || FLOWER_TYPE_REGISTRY.lily;
      const typeConfig = flower.typeConfig || resolveTypeConfig(typeName, flowersConfig || {});
      return entry.drawFlower(ctx, flower, typeConfig, commonConfig, runtimeState) === true;
    }

    function drawFlowerByIndex(ctx, index, flowersConfig, commonConfig, runtimeState) {
      if (!ctx || index < 0 || index >= state.flowers.length) {
        return false;
      }
      return drawFlowerRecord(ctx, state.flowers[index], flowersConfig, commonConfig, runtimeState);
    }

    function getOutputScale(ctx) {
      const transform = ctx && ctx.getTransform ? ctx.getTransform() : null;
      const scaleX = transform ? Math.abs(transform.a) : 1;
      const scaleY = transform ? Math.abs(transform.d) : 1;
      return {
        x: scaleX > 1e-8 ? scaleX : 1,
        y: scaleY > 1e-8 ? scaleY : 1,
      };
    }

    function estimateFlowerCacheRadiusCss(flower, commonConfig) {
      if (!flower) {
        return 16;
      }
      const petals = Array.isArray(flower.petals) ? flower.petals : [];
      if (flower.type === 'blue') {
        const typeConfig = flower.typeConfig || {};
        const pointDrawSize = Number.isFinite(typeConfig.pointDrawSize)
          ? Math.max(1, typeConfig.pointDrawSize)
          : 18;
        let maxDistance = 0;
        for (let i = 0; i < petals.length; i += 1) {
          const petal = petals[i];
          const radialDistance = Number.isFinite(petal.radialDistance) ? petal.radialDistance : 0;
          if (radialDistance > maxDistance) {
            maxDistance = radialDistance;
          }
        }
        return Math.max(8, maxDistance + pointDrawSize + 8);
      }

      const drawSize = Number.isFinite(commonConfig.drawSize) ? Math.max(1, commonConfig.drawSize) : 80;
      let maxOffset = 0;
      for (let i = 0; i < petals.length; i += 1) {
        const petal = petals[i];
        const ox = petal.screenOffsetX || 0;
        const oy = petal.screenOffsetY || 0;
        const distance = Math.hypot(ox, oy);
        if (distance > maxOffset) {
          maxOffset = distance;
        }
      }
      return Math.max(8, drawSize * 1.25 + maxOffset + 10);
    }

    function ensureFlowerRenderCache(ctx, flower, flowersConfig, commonConfig, runtimeState, options = null) {
      if (!ctx || !flower) {
        return null;
      }

      const cache = flower.renderCache || (flower.renderCache = {
        canvas: null,
        ctx: null,
        valid: false,
        widthCss: 0,
        heightCss: 0,
        widthPx: 0,
        heightPx: 0,
        originXCss: 0,
        originYCss: 0,
        scaleX: 1,
        scaleY: 1,
        petalOpenAmount: 1,
        useClosedPetalSprites: false,
        alwaysPoseKey: '',
      });

      const outputScale = getOutputScale(ctx);
      const radiusCss = estimateFlowerCacheRadiusCss(flower, commonConfig);
      const widthCss = Math.max(2, Math.ceil(radiusCss * 2));
      const heightCss = widthCss;
      const widthPx = Math.max(1, Math.ceil(widthCss * outputScale.x));
      const heightPx = Math.max(1, Math.ceil(heightCss * outputScale.y));
      const originXCss = widthCss * 0.5;
      const originYCss = heightCss * 0.5;
      const usesPetalToggleState = flower.type === 'lily';
      const petalOpenAmount = runtimeState.getPetalOpenAmount();
      const useClosedPetalSprites = runtimeState.getUseClosedPetalSprites() === true;
      const dynamicPose = options && options.dynamicPose === true;
      const poseKey = dynamicPose && typeof options.poseKey === 'string' ? options.poseKey : '';

      if (!cache.canvas) {
        cache.canvas = document.createElement('canvas');
        cache.ctx = cache.canvas.getContext('2d');
        cache.valid = false;
      }

      let shouldRebuild = cache.valid !== true;
      if (cache.widthPx !== widthPx || cache.heightPx !== heightPx) {
        cache.canvas.width = widthPx;
        cache.canvas.height = heightPx;
        cache.widthPx = widthPx;
        cache.heightPx = heightPx;
        shouldRebuild = true;
      }
      if (
        Math.abs(cache.scaleX - outputScale.x) > 1e-8
        || Math.abs(cache.scaleY - outputScale.y) > 1e-8
      ) {
        cache.scaleX = outputScale.x;
        cache.scaleY = outputScale.y;
        shouldRebuild = true;
      }
      if (cache.widthCss !== widthCss || cache.heightCss !== heightCss) {
        cache.widthCss = widthCss;
        cache.heightCss = heightCss;
        shouldRebuild = true;
      }
      if (
        usesPetalToggleState
        && (
          Math.abs((cache.petalOpenAmount || 0) - petalOpenAmount) > 1e-6
          || cache.useClosedPetalSprites !== useClosedPetalSprites
        )
      ) {
        shouldRebuild = true;
      }
      if (dynamicPose && cache.alwaysPoseKey !== poseKey) {
        shouldRebuild = true;
      }
      if (cache.originXCss !== originXCss || cache.originYCss !== originYCss) {
        cache.originXCss = originXCss;
        cache.originYCss = originYCss;
        shouldRebuild = true;
      }

      if (!shouldRebuild || !cache.ctx) {
        return cache;
      }

      const rebuildStartMs = performance.now();
      cache.ctx.imageSmoothingEnabled = true;
      cache.ctx.setTransform(1, 0, 0, 1, 0, 0);
      cache.ctx.clearRect(0, 0, cache.canvas.width, cache.canvas.height);
      cache.ctx.setTransform(cache.scaleX, 0, 0, cache.scaleY, 0, 0);
      const staticFlower = {
        ...flower,
        x: cache.originXCss,
        y: cache.originYCss,
        hoverInfluence: dynamicPose
          ? (Number.isFinite(flower.hoverInfluence) ? flower.hoverInfluence : 0)
          : 0,
        renderHoverInfluence: dynamicPose
          ? (Number.isFinite(flower.renderHoverInfluence) ? flower.renderHoverInfluence : 0)
          : 0,
        targetInfluence: dynamicPose
          ? (Number.isFinite(flower.targetInfluence) ? flower.targetInfluence : 0)
          : 0,
        motionTime: dynamicPose
          ? (Number.isFinite(flower.motionTime) ? flower.motionTime : 0)
          : 0,
        renderMotionTime: dynamicPose
          ? (Number.isFinite(flower.renderMotionTime) ? flower.renderMotionTime : 0)
          : 0,
      };
      drawFlowerRecord(cache.ctx, staticFlower, flowersConfig, commonConfig, runtimeState);
      cache.petalOpenAmount = usesPetalToggleState ? petalOpenAmount : (cache.petalOpenAmount || 1);
      cache.useClosedPetalSprites = usesPetalToggleState ? useClosedPetalSprites : (cache.useClosedPetalSprites === true);
      cache.alwaysPoseKey = dynamicPose ? poseKey : '';
      cache.valid = true;

      const rebuildElapsedMs = performance.now() - rebuildStartMs;
      state.performance.staticLayerRebuildCount += 1;
      state.performance.staticLayerRebuildTotalMs += rebuildElapsedMs;
      state.performance.staticLayerRebuildLastMs = rebuildElapsedMs;
      return cache;
    }

    function drawFlowerFromCache(ctx, flower, flowersConfig, commonConfig, runtimeState) {
      const cache = ensureFlowerRenderCache(ctx, flower, flowersConfig, commonConfig, runtimeState);
      if (!cache || !cache.canvas || cache.valid !== true) {
        return false;
      }
      ctx.drawImage(
        cache.canvas,
        flower.x - cache.originXCss,
        flower.y - cache.originYCss,
        cache.widthCss,
        cache.heightCss,
      );
      return true;
    }

    function drawFlowerFromAnimatedAlwaysCache(
      ctx,
      flower,
      flowersConfig,
      commonConfig,
      runtimeState,
    ) {
      const alwaysCacheFps = Math.max(1, Number(commonConfig.alwaysAnimatedCacheFps) || 12);
      const poseFrame = Math.floor((Number(flower.renderMotionTime) || 0) * alwaysCacheFps);
      const poseInfluence = Math.floor((Number(flower.renderHoverInfluence) || 0) * 32);
      const poseKey = `${poseFrame}:${poseInfluence}`;
      const cache = ensureFlowerRenderCache(
        ctx,
        flower,
        flowersConfig,
        commonConfig,
        runtimeState,
        { dynamicPose: true, poseKey },
      );
      if (!cache || !cache.canvas || cache.valid !== true) {
        return false;
      }
      ctx.drawImage(
        cache.canvas,
        flower.x - cache.originXCss,
        flower.y - cache.originYCss,
        cache.widthCss,
        cache.heightCss,
      );
      return true;
    }

    function isFlowerOutsideViewport(ctx, flower, commonConfig) {
      if (!commonConfig || commonConfig.viewportCullingEnabled !== true || !ctx || !flower) {
        return false;
      }
      const width = Number.isFinite(ctx.canvas && ctx.canvas.width) ? ctx.canvas.width : 0;
      const height = Number.isFinite(ctx.canvas && ctx.canvas.height) ? ctx.canvas.height : 0;
      if (width <= 0 || height <= 0) {
        return false;
      }
      const scale = getOutputScale(ctx);
      const maxXCss = width / Math.max(1e-8, scale.x);
      const maxYCss = height / Math.max(1e-8, scale.y);
      const radiusCss = estimateFlowerCacheRadiusCss(flower, commonConfig);
      return (
        (flower.x + radiusCss) < 0
        || (flower.y + radiusCss) < 0
        || (flower.x - radiusCss) > maxXCss
        || (flower.y - radiusCss) > maxYCss
      );
    }

    function draw(ctx, flowersConfig, commonConfig) {
      if (!ctx || state.flowers.length === 0) {
        return { drawnCount: 0, culledCount: 0 };
      }

      const runtimeState = {
        getImage,
        getPetalOpenAmount,
        getUseClosedPetalSprites,
        getPetalToggleIsActive,
        getPetalToggleIsClosing,
        getPetalToggleProgress,
        getPetalToggleStartAmount,
        getPetalToggleTargetAmount,
        getPetalToggleEasePower,
        getPetalToggleOpenBounceAmount,
        getPetalToggleOpenBounceOscillations,
      };

      const petalToggleActive = getPetalToggleIsActive();
      const usePerFlowerCache = commonConfig.activeLayerCacheEnabled;
      const useAlwaysInterpolation = commonConfig.swayMode === 'always';
      const useAlwaysAnimatedCache = (
        useAlwaysInterpolation
        && usePerFlowerCache
        && commonConfig.swayFastPathEnabled === true
        && commonConfig.alwaysAnimatedCacheEnabled === true
        && !petalToggleActive
      );
      const alpha = useAlwaysInterpolation ? clamp(state.alwaysRenderAlpha, 0, 1) : 1;
      let drawnCount = 0;
      let culledCount = 0;

      // Render in two passes so lilies always sit on top of non-lily flowers.
      for (let layerPass = 0; layerPass < 2; layerPass += 1) {
        const renderLilies = layerPass === 1;
        for (let i = 0; i < state.flowers.length; i += 1) {
          const flower = state.flowers[i];
          const isLily = flower && flower.type === 'lily';
          if (isLily !== renderLilies) {
            continue;
          }
          if (useAlwaysInterpolation) {
            const prevInfluence = Number.isFinite(flower.prevHoverInfluence)
              ? flower.prevHoverInfluence
              : (Number.isFinite(flower.hoverInfluence) ? flower.hoverInfluence : 0);
            const prevMotionTime = Number.isFinite(flower.prevMotionTime)
              ? flower.prevMotionTime
              : (Number.isFinite(flower.motionTime) ? flower.motionTime : 0);
            flower.renderHoverInfluence = lerp(prevInfluence, Number(flower.hoverInfluence) || 0, alpha);
            flower.renderMotionTime = lerp(prevMotionTime, Number(flower.motionTime) || 0, alpha);
          } else {
            flower.renderHoverInfluence = Number.isFinite(flower.hoverInfluence) ? flower.hoverInfluence : 0;
            flower.renderMotionTime = Number.isFinite(flower.motionTime) ? flower.motionTime : 0;
          }
          if (isFlowerOutsideViewport(ctx, flower, commonConfig)) {
            culledCount += 1;
            continue;
          }

          const shouldBypassCacheForFlower = petalToggleActive && isLily;
          if (useAlwaysAnimatedCache) {
            const drewAnimatedCache = drawFlowerFromAnimatedAlwaysCache(
              ctx,
              flower,
              flowersConfig,
              commonConfig,
              runtimeState,
            );
            if (drewAnimatedCache) {
              drawnCount += 1;
              continue;
            }
          }
          if (usePerFlowerCache && !flower.isActive && !shouldBypassCacheForFlower) {
            const drewFromCache = drawFlowerFromCache(
              ctx,
              flower,
              flowersConfig,
              commonConfig,
              runtimeState,
            );
            if (drewFromCache) {
              drawnCount += 1;
              continue;
            }
          }
          drawFlowerByIndex(ctx, i, flowersConfig, commonConfig, runtimeState);
          drawnCount += 1;
        }
      }
      return { drawnCount, culledCount };
    }

    function render(ctx, flowersConfig, nowMs) {
      const safeFlowersConfig = flowersConfig || {};
      const commonConfig = resolveCommonFlowerConfig(safeFlowersConfig);

      const updateStartMs = performance.now();
      const activeCount = update(safeFlowersConfig, nowMs, commonConfig);
      const updateElapsedMs = performance.now() - updateStartMs;
      state.performance.updateTotalMs += updateElapsedMs;
      state.performance.updateSamples += 1;

      const drawStartMs = performance.now();
      const drawStats = draw(ctx, safeFlowersConfig, commonConfig) || { drawnCount: 0, culledCount: 0 };
      const drawElapsedMs = performance.now() - drawStartMs;
      state.performance.drawTotalMs += drawElapsedMs;
      state.performance.drawSamples += 1;

      return {
        activeCount,
        flowerCount: state.flowers.length,
        updateMs: updateElapsedMs,
        drawMs: drawElapsedMs,
        drawnCount: Number.isFinite(drawStats.drawnCount) ? drawStats.drawnCount : 0,
        culledCount: Number.isFinite(drawStats.culledCount) ? drawStats.culledCount : 0,
      };
    }

    function hasRenderableFlowers() {
      if (state.flowers.length === 0) {
        return false;
      }
      for (let i = 0; i < state.flowers.length; i += 1) {
        const flower = state.flowers[i];
        if (flower.assetPath && state.imageCache.has(flower.assetPath)) {
          return true;
        }
      }
      return false;
    }

    function getPerformanceSnapshot() {
      const perf = state.performance;
      const updateSamples = Math.max(0, perf.updateSamples);
      const drawSamples = Math.max(0, perf.drawSamples);
      const rebuildCount = Math.max(0, perf.staticLayerRebuildCount);
      const simStepSamples = Math.max(0, perf.simStepSamples);
      const perfElapsedSec = Math.max(
        1e-6,
        (performance.now() - (Number.isFinite(perf.perfStartMs) ? perf.perfStartMs : performance.now())) / 1000,
      );
      return {
        avgUpdateMs: updateSamples > 0 ? perf.updateTotalMs / updateSamples : 0,
        avgDrawMs: drawSamples > 0 ? perf.drawTotalMs / drawSamples : 0,
        activeFlowerCount: perf.activeFlowerCount,
        flowerCount: state.flowers.length,
        simStepsPerSecond: (Number(perf.totalSimSteps) || 0) / perfElapsedSec,
        simStepMsAvg: simStepSamples > 0 ? perf.simStepTotalMs / simStepSamples : 0,
        interpolatedFrames: Number(perf.interpolatedFrames) || 0,
        staticLayerRebuildCount: rebuildCount,
        avgStaticLayerRebuildMs: rebuildCount > 0
          ? perf.staticLayerRebuildTotalMs / rebuildCount
          : 0,
        lastStaticLayerRebuildMs: perf.staticLayerRebuildLastMs,
        staticLayerDirty: state.staticLayerDirty === true,
      };
    }

    function needsContinuousFrames() {
      return state.activeFlowerIndices.length > 0
        || Boolean(state.petalToggleTransition && state.petalToggleTransition.active);
    }

    return {
      setEndpoints,
      setMousePosition,
      clearMousePosition,
      setPetalOpenAmount,
      togglePetalOpenState,
      animateTogglePetalOpenState,
      getPetalOpenAmount,
      applyJumpAt,
      loadAssets,
      loadSprite,
      render,
      getPerformanceSnapshot,
      hasRenderableFlowers,
      needsContinuousFrames,
    };
  }

  globalScope.StemWarpFlowerSystem11 = {
    createFlowerSystem,
  };
})(window);
