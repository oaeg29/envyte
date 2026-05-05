(function attachStemWarpFlowerSystem11(globalScope) {
  'use strict';

  const OFFSCREEN_POINTER = -10000;
  const MAX_DT_SEC = 0.05;

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

  function loadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image: ' + path));
      image.src = path;
    });
  }

  function getSpriteSourceRect(flowersConfig, col, row) {
    const spriteCellWidth = Number.isFinite(flowersConfig.spriteCellWidth)
      ? Math.max(1, flowersConfig.spriteCellWidth)
      : 44;
    const spriteCellHeight = Number.isFinite(flowersConfig.spriteCellHeight)
      ? Math.max(1, flowersConfig.spriteCellHeight)
      : 45.819;
    const spriteScale = Number.isFinite(flowersConfig.spriteScale)
      ? Math.max(0.01, flowersConfig.spriteScale)
      : 8.3333333;

    return {
      sx: col * spriteCellWidth * spriteScale,
      sy: row * spriteCellHeight * spriteScale,
      sw: spriteCellWidth * spriteScale,
      sh: spriteCellHeight * spriteScale,
    };
  }

  function createFlowerFromEndpoint(endpoint, index, flowersConfig) {
    const spriteCols = Number.isFinite(flowersConfig.spriteCols)
      ? Math.max(1, Math.floor(flowersConfig.spriteCols))
      : 20;
    const spriteRow = Number.isFinite(flowersConfig.spriteRow)
      ? Math.max(0, Math.floor(flowersConfig.spriteRow))
      : 1;
    const petalCountRange = normalizeRangeInput(flowersConfig.petalCountRange, 5, 6);
    const minPetalCount = Math.max(1, Math.floor(petalCountRange[0]));
    const maxPetalCount = Math.max(minPetalCount, Math.floor(petalCountRange[1]));
    const alignToBranchDirection = flowersConfig.alignToBranchDirection !== false;
    const branchDirectionDeg = (
      endpoint && Number.isFinite(endpoint.tangentDeg)
    )
      ? endpoint.tangentDeg
      : 0;
    const petalBaseCenterDeg = Number.isFinite(flowersConfig.petalBaseCenterDeg)
      ? flowersConfig.petalBaseCenterDeg
      : -40;
    const resolvedCenterDeg = alignToBranchDirection
      ? branchDirectionDeg + petalBaseCenterDeg
      : petalBaseCenterDeg;
    const petalSpreadDeg = Number.isFinite(flowersConfig.petalSpreadDeg)
      ? Math.max(0, flowersConfig.petalSpreadDeg)
      : 75;
    const hoverAmplitudeDegRange = normalizeRangeInput(flowersConfig.hoverAmplitudeDegRange, 2, 6);
    const hoverSpeedRange = normalizeRangeInput(flowersConfig.hoverSpeedRange, 2.2, 4.2);

    const stableToken = endpoint && typeof endpoint.stableKey === 'string'
      ? endpoint.stableKey
      : `endpoint:${index}`;
    const rng = mulberry32(hashSeed(`${stableToken}|flower`));
    const petalCount = maxPetalCount <= minPetalCount
      ? minPetalCount
      : (minPetalCount + Math.floor(rng() * (maxPetalCount - minPetalCount + 1)));

    const petals = [];
    for (let i = 0; i < petalCount; i += 1) {
      const col = Math.min(spriteCols - 1, Math.floor(rng() * spriteCols));
      const divisor = Math.max(1, petalCount / 4);
      const centeredIndex = i - (petalCount - 1) * 0.5;
      const wave = Math.sin(centeredIndex / divisor);
      const petalAngleDeg = resolvedCenterDeg + wave * petalSpreadDeg;
      petals.push({
        col,
        row: spriteRow,
        baseAngleRad: degToRad(petalAngleDeg),
        hoverAmplitudeRad: degToRad(sampleRange(hoverAmplitudeDegRange, rng)),
        hoverSpeed: sampleRange(hoverSpeedRange, rng),
      });
    }

    const drawSize = Number.isFinite(flowersConfig.drawSize)
      ? Math.max(1, flowersConfig.drawSize)
      : 80;
    const interactionRadiusFactor = Number.isFinite(flowersConfig.interactionRadiusFactor)
      ? Math.max(0, flowersConfig.interactionRadiusFactor)
      : 2.1;

    return {
      branchId: endpoint && Number.isFinite(endpoint.branchId) ? endpoint.branchId : null,
      x: endpoint && Number.isFinite(endpoint.x) ? endpoint.x : 0,
      y: endpoint && Number.isFinite(endpoint.y) ? endpoint.y : 0,
      petals,
      interactionRadius: drawSize * interactionRadiusFactor,
      hoverInfluence: 0,
      targetInfluence: 0,
      motionTime: 0,
      wasInsideRange: false,
    };
  }

  function createFlowerSystem() {
    const state = {
      spriteImage: null,
      flowers: [],
      activeFlowerIndices: [],
      mouseX: OFFSCREEN_POINTER,
      mouseY: OFFSCREEN_POINTER,
      lastUpdateMs: 0,
      spritePath: '',
      spriteLoadPromise: null,
      spriteLoadToken: 0,
    };

    function setEndpoints(endpoints, flowersConfig) {
      const source = Array.isArray(endpoints) ? endpoints : [];
      state.flowers = [];
      for (let i = 0; i < source.length; i += 1) {
        state.flowers.push(createFlowerFromEndpoint(source[i], i, flowersConfig || {}));
      }
      state.activeFlowerIndices = [];
      state.lastUpdateMs = 0;
    }

    function setMousePosition(x, y) {
      state.mouseX = Number.isFinite(x) ? x : OFFSCREEN_POINTER;
      state.mouseY = Number.isFinite(y) ? y : OFFSCREEN_POINTER;
    }

    function clearMousePosition() {
      state.mouseX = OFFSCREEN_POINTER;
      state.mouseY = OFFSCREEN_POINTER;
    }

    async function loadSprite(spritePath) {
      const nextSpritePath = (typeof spritePath === 'string' && spritePath.length > 0)
        ? spritePath
        : './test_sprite4.png';

      if (state.spriteImage && state.spritePath === nextSpritePath) {
        return state.spriteImage;
      }
      if (state.spriteLoadPromise && state.spritePath === nextSpritePath) {
        return state.spriteLoadPromise;
      }

      const token = state.spriteLoadToken + 1;
      state.spriteLoadToken = token;
      state.spritePath = nextSpritePath;

      state.spriteLoadPromise = loadImage(nextSpritePath)
        .then((image) => {
          if (token === state.spriteLoadToken) {
            state.spriteImage = image;
          }
          return image;
        })
        .catch((error) => {
          if (token === state.spriteLoadToken) {
            state.spriteImage = null;
          }
          throw error;
        })
        .finally(() => {
          if (token === state.spriteLoadToken) {
            state.spriteLoadPromise = null;
          }
        });

      return state.spriteLoadPromise;
    }

    function update(flowersConfig, nowMs) {
      if (!state.spriteImage || state.flowers.length === 0) {
        state.activeFlowerIndices = [];
        state.lastUpdateMs = Number.isFinite(nowMs) ? nowMs : performance.now();
        return 0;
      }

      const updateTimeMs = Number.isFinite(nowMs) ? nowMs : performance.now();
      if (!Number.isFinite(state.lastUpdateMs) || state.lastUpdateMs <= 0) {
        state.lastUpdateMs = updateTimeMs;
      }
      const dtSec = clamp((updateTimeMs - state.lastUpdateMs) / 1000, 0, MAX_DT_SEC);
      state.lastUpdateMs = updateTimeMs;

      const drawSize = Number.isFinite(flowersConfig.drawSize)
        ? Math.max(1, flowersConfig.drawSize)
        : 80;
      const interactionRadiusFactor = Number.isFinite(flowersConfig.interactionRadiusFactor)
        ? Math.max(0, flowersConfig.interactionRadiusFactor)
        : 2.1;
      const influenceRiseSpeed = Number.isFinite(flowersConfig.influenceRiseSpeed)
        ? Math.max(0, flowersConfig.influenceRiseSpeed)
        : 5.5;
      const influenceFallSpeed = Number.isFinite(flowersConfig.influenceFallSpeed)
        ? Math.max(0, flowersConfig.influenceFallSpeed)
        : 0.5;
      const influenceEpsilon = Number.isFinite(flowersConfig.influenceEpsilon)
        ? Math.max(0, flowersConfig.influenceEpsilon)
        : 0.0008;

      state.activeFlowerIndices = [];
      const interactionRadius = drawSize * interactionRadiusFactor;

      for (let i = 0; i < state.flowers.length; i += 1) {
        const flower = state.flowers[i];
        flower.interactionRadius = interactionRadius;

        const dx = state.mouseX - flower.x;
        const dy = state.mouseY - flower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const isInsideRange = distance <= flower.interactionRadius;

        if (isInsideRange) {
          flower.targetInfluence = 1 - distance / flower.interactionRadius;
        } else {
          flower.targetInfluence = 0;
        }

        if (
          isInsideRange
          && !flower.wasInsideRange
          && flower.hoverInfluence <= influenceEpsilon
        ) {
          flower.motionTime = 0;
        }

        const influenceSpeed = flower.targetInfluence > flower.hoverInfluence
          ? influenceRiseSpeed
          : influenceFallSpeed;

        flower.hoverInfluence = moveToward(
          flower.hoverInfluence,
          flower.targetInfluence,
          influenceSpeed * dtSec,
        );

        if (
          flower.targetInfluence === 0
          && flower.hoverInfluence <= influenceEpsilon
        ) {
          flower.hoverInfluence = 0;
        }

        if (flower.hoverInfluence > 0 || flower.targetInfluence > 0) {
          flower.motionTime += dtSec;
          state.activeFlowerIndices.push(i);
        }

        flower.wasInsideRange = isInsideRange;
      }

      return state.activeFlowerIndices.length;
    }

    function draw(ctx, flowersConfig) {
      if (!ctx || !state.spriteImage || state.flowers.length === 0) {
        return;
      }

      const drawSize = Number.isFinite(flowersConfig.drawSize)
        ? Math.max(1, flowersConfig.drawSize)
        : 80;
      const spriteCellHeight = Number.isFinite(flowersConfig.spriteCellHeight)
        ? Math.max(1, flowersConfig.spriteCellHeight)
        : 45.819;

      for (let i = 0; i < state.flowers.length; i += 1) {
        const flower = state.flowers[i];
        for (let p = 0; p < flower.petals.length; p += 1) {
          const petal = flower.petals[p];
          const sourceRect = getSpriteSourceRect(flowersConfig, petal.col, petal.row);

          let angle = petal.baseAngleRad;
          if (flower.hoverInfluence > 0) {
            const wave = Math.sin(flower.motionTime * petal.hoverSpeed);
            angle += wave * petal.hoverAmplitudeRad * flower.hoverInfluence;
          }

          ctx.save();
          ctx.translate(flower.x, flower.y);
          ctx.rotate(angle);
          ctx.drawImage(
            state.spriteImage,
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
      }
    }

    function render(ctx, flowersConfig, nowMs) {
      const safeFlowersConfig = flowersConfig || {};
      const activeCount = update(safeFlowersConfig, nowMs);
      draw(ctx, safeFlowersConfig);
      return {
        activeCount,
        flowerCount: state.flowers.length,
      };
    }

    function hasRenderableFlowers() {
      return Boolean(state.spriteImage) && state.flowers.length > 0;
    }

    function needsContinuousFrames() {
      return state.activeFlowerIndices.length > 0;
    }

    return {
      setEndpoints,
      setMousePosition,
      clearMousePosition,
      loadSprite,
      render,
      hasRenderableFlowers,
      needsContinuousFrames,
    };
  }

  globalScope.StemWarpFlowerSystem11 = {
    createFlowerSystem,
  };
})(window);
