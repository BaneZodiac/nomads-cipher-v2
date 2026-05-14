// ============================================
// ORANGE GLOBE — 3D Earth-style globe using cobe
// Light orange glow, smooth rotation
// ============================================

/**
 * Creates an interactive 3D globe on the given canvas element using cobe.
 * @param {string|HTMLCanvasElement} canvasEl - The canvas element or its ID
 * @returns {Promise<{globe: object, dispose: Function}>}
 */
export async function createOrangeGlobe(canvasEl) {
  const canvas = typeof canvasEl === "string" ? document.getElementById(canvasEl) : canvasEl;
  if (!canvas) return null;

  const { default: createGlobe } = await import('cobe');

  // Colors: warm light orange glow
  const glowColor = [1, 0.58, 0.2];
  const baseColor = [0.15, 0.08, 0.02];
  const markerColor = [1, 0.7, 0.3];

  const markers = [
    { location: [40.7128, -74.006], size: 0.04 },
    { location: [34.0522, -118.2437], size: 0.03 },
    { location: [37.7749, -122.4194], size: 0.03 },
    { location: [43.6532, -79.3832], size: 0.03 },
    { location: [-23.5505, -46.6333], size: 0.03 },
    { location: [-34.6037, -58.3816], size: 0.03 },
    { location: [51.5074, -0.1278], size: 0.04 },
    { location: [48.8566, 2.3522], size: 0.04 },
    { location: [52.52, 13.405], size: 0.04 },
    { location: [41.9028, 12.4964], size: 0.03 },
    { location: [55.7558, 37.6173], size: 0.03 },
    { location: [59.3293, 18.0686], size: 0.03 },
    { location: [35.6762, 139.6503], size: 0.04 },
    { location: [39.9042, 116.4074], size: 0.04 },
    { location: [22.3193, 114.1694], size: 0.03 },
    { location: [1.3521, 103.8198], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.03 },
    { location: [37.5665, 126.978], size: 0.03 },
    { location: [25.2048, 55.2708], size: 0.03 },
    { location: [31.2304, 121.4737], size: 0.04 },
    { location: [-26.2041, 28.0473], size: 0.03 },
    { location: [30.0444, 31.2357], size: 0.03 },
    { location: [-33.8688, 151.2093], size: 0.03 },
    { location: [-37.8136, 144.9631], size: 0.03 },
  ];

  let phi = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetPhi = 0;
  let targetTheta = 0;
  let currentTheta = 0;

  const onMouseMove = (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    targetPhi = mouseX * 0.5;
    targetTheta = mouseY * 0.2;
  };

  document.addEventListener('mousemove', onMouseMove);

  const size = Math.min(window.innerWidth * 0.7, 600);
  canvas.width = size * 2;
  canvas.height = size * 2;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  const globe = createGlobe(canvas, {
    devicePixelRatio: 2,
    width: size * 2,
    height: size * 2,
    phi: 0,
    theta: 0,
    dark: 0.9,
    scale: 1.1,
    diffuse: 1.2,
    mapSamples: 16000,
    mapBrightness: 8,
    baseColor,
    markerColor,
    glowColor,
    markers,
    onRender: (state) => {
      phi += 0.003;
      currentTheta += (targetTheta - currentTheta) * 0.02;
      state.phi = phi + targetPhi * 0.3;
      state.theta = currentTheta;
    },
  });

  const onResize = () => {
    const newSize = Math.min(window.innerWidth * 0.7, 600);
    canvas.width = newSize * 2;
    canvas.height = newSize * 2;
    canvas.style.width = newSize + 'px';
    canvas.style.height = newSize + 'px';
  };

  window.addEventListener('resize', onResize);

  return {
    globe,
    dispose: () => {
      globe.destroy();
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    },
  };
}
