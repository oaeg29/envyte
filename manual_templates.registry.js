/*
  Dev-time manual template registry.
  Index mapping in script_10.js:
  0 = generate_manual_points()
  1..N = enabled entries below in this source order.
*/

window.STEM_MANUAL_TEMPLATE_SOURCES = [
  {
    id: 'path-1-svg-file',
    label: 'Path 1 (SVG file)',
    sourceType: 'svgFile',
    src: 'svgs/path_1.svg',
    rotationDeg: 10, // applied before left/right mirroring
    // targetPointCount: 7, // optional override; by default it infers from SVG path anchors
    // autoOpenClosedPath defaults to true for SVG sources.
    // Set false only if you intentionally want full closed contours.
    // autoOpenClosedPath: false,
    enabled: true,
  },


    {
    id: 'path-2-svg-file',
    label: 'Path 2 (SVG file)',
    sourceType: 'svgFile',
    src: 'svgs/path_2.svg',
    rotationDeg: 35, // applied before left/right mirroring
    // targetPointCount: 7, // optional override; by default it infers from SVG path anchors
    // autoOpenClosedPath defaults to true for SVG sources.
    // Set false only if you intentionally want full closed contours.
    // autoOpenClosedPath: false,
    enabled: true,
  },

  // Example: inline SVG path data.
  {
    id: 'example-svg-path-d',
    label: 'Example Path D',
    sourceType: 'svgPathD',
    d: 'M0,0 C30,-40 70,-40 100,0',
    enabled: false,
  },

  // Example: explicit point list.
  {
    id: 'example-points',
    label: 'Example Points',
    sourceType: 'points',
    points: [
      { x: 0, y: 0 },
      { x: 20, y: -40 },
      { x: 45, y: -65 },
      { x: 80, y: -95 },
    ],
    enabled: false,
  },
];
