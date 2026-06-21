// Mock DOM and Browser features that JSDOM doesn't support fully
window.HTMLCanvasElement.prototype.getContext = type => {
  if (type === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      measureText: jest.fn(() => ({ width: 100 })),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      roundRect: jest.fn(),
      setLineDash: jest.fn(),
    };
  }
  return null;
};
window.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,');
window.HTMLCanvasElement.prototype.toBlob = jest.fn(cb => {
  if (cb) cb(new Blob());
});

// Mock scrollTo / scrollIntoView
window.Element.prototype.scrollIntoView = jest.fn();
window.Element.prototype.animate = jest.fn().mockReturnValue({
  onfinish: null,
  addEventListener: jest.fn(),
});
window.scrollTo = jest.fn();

// Mock IntersectionObserver
window.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock external libraries loaded via CDN
window.DOMPurify = {
  sanitize: jest.fn(val => val),
};

window.lucide = {
  createIcons: jest.fn(),
};

window.google = {
  accounts: {
    id: {
      initialize: jest.fn(),
      renderButton: jest.fn(),
      prompt: jest.fn(),
      disableAutoSelect: jest.fn(),
    },
  },
};

window.confetti = jest.fn();
window.html2canvas = jest.fn().mockResolvedValue(document.createElement('canvas'));

// Mock Leaflet
const markerMock = {
  addTo: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
};
const mapMock = {
  setView: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  removeLayer: jest.fn().mockReturnThis(),
  panTo: jest.fn().mockReturnThis(),
  flyTo: jest.fn().mockReturnThis(),
  invalidateSize: jest.fn().mockReturnThis(),
};
window.L = {
  map: jest.fn().mockReturnValue(mapMock),
  tileLayer: jest.fn().mockReturnValue({ addTo: jest.fn() }),
  divIcon: jest.fn(opts => opts),
  marker: jest.fn().mockReturnValue(markerMock),
};

// Mock Chart.js
window.Chart = class Chart {
  constructor() {
    this.data = { labels: [], datasets: [{ data: [] }] };
  }
  destroy() {}
  update() {}
};

// Mock Three.js
window.THREE = {
  Scene: class {
    add() {}
  },
  PerspectiveCamera: class {
    position = { z: 0 };
    updateProjectionMatrix() {}
  },
  WebGLRenderer: class {
    setSize() {}
    setPixelRatio() {}
    domElement = document.createElement('div');
    render() {}
  },
  Group: class {
    add() {}
    rotation = { x: 0, y: 0, z: 0 };
  },
  SphereGeometry: class {},
  MeshBasicMaterial: class {},
  Mesh: class {
    rotation = { x: 0, y: 0, z: 0 };
  },
  BufferGeometry: class {
    setAttribute() {}
  },
  BufferAttribute: class {},
  Points: class {},
  PointsMaterial: class {},
  RingGeometry: class {},
  DoubleSide: 2,
  AmbientLight: class {},
  DirectionalLight: class {},
  Color: class {},
  AdditiveBlending: 1,
};

// Mock Firebase
window.firebase = {
  initializeApp: jest.fn(),
  database: jest.fn().mockReturnValue({
    ref: jest.fn().mockReturnValue({
      on: jest.fn((evt, cb) =>
        cb({ val: () => ({ testKey: { text: 'Mock Pledge', category: 'diet' } }) })
      ),
      push: jest.fn().mockResolvedValue(),
    }),
  }),
};

// Mock requestAnimationFrame
window.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
window.cancelAnimationFrame = jest.fn();

// Copy window mocks to Node global object for direct require contexts
global.lucide = window.lucide;
global.L = window.L;
global.Chart = window.Chart;
global.THREE = window.THREE;
global.google = window.google;
global.confetti = window.confetti;
global.html2canvas = window.html2canvas;
global.firebase = window.firebase;
global.IntersectionObserver = window.IntersectionObserver;
global.DOMPurify = window.DOMPurify;
