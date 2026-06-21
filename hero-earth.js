const EcoHeroEarth = {
  init() {
    const container = document.getElementById('hero-3d-earth');
    if (!container) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();

    // Set up camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 6.2;

    // Set up renderer with alpha transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to contain all globe elements
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Inner solid globe with dark green/blue emission
    const sphereGeo = new THREE.SphereGeometry(2, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x042f22,
      transparent: true,
      opacity: 0.6,
    });
    const innerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(innerSphere);

    // 2. Holographic wireframe overlay
    const wireframeGeo = new THREE.SphereGeometry(2.02, 24, 24);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const wireframeGlobe = new THREE.Mesh(wireframeGeo, wireframeMat);
    globeGroup.add(wireframeGlobe);

    // 3. Floating points/particles for landmasses
    const pointsCount = 450;
    const pointsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pointsCount * 3);
    const colors = new Float32Array(pointsCount * 3);

    for (let i = 0; i < pointsCount; i++) {
      // Generate uniform distribution on a sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.05 + Math.random() * 0.05; // slight height noise

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Gradient colors (cyan to green)
      const colorRatio = Math.random();
      colors[i * 3] = colorRatio * 0.1; // R
      colors[i * 3 + 1] = 0.5 + colorRatio * 0.5; // G (0.5 to 1.0)
      colors[i * 3 + 2] = 0.6 + (1 - colorRatio) * 0.4; // B (0.6 to 1.0)
    }

    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    const globePoints = new THREE.Points(pointsGeo, pointsMat);
    globeGroup.add(globePoints);

    // 4. Orbital Glowing Rings
    const ringGroup = new THREE.Group();
    globeGroup.add(ringGroup);

    const ringGeo = new THREE.RingGeometry(2.5, 2.52, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const orbitRing = new THREE.Mesh(ringGeo, ringMat);
    orbitRing.rotation.x = Math.PI / 2.2;
    ringGroup.add(orbitRing);

    // Second diagonal orbit ring
    const ringGeo2 = new THREE.RingGeometry(2.7, 2.715, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
    });
    const orbitRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    orbitRing2.rotation.x = Math.PI / 4.5;
    orbitRing2.rotation.y = Math.PI / 6;
    ringGroup.add(orbitRing2);

    // Mouse interactivity variables
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', e => {
      // Normalize coordinates (-0.5 to 0.5)
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Constant slow rotation
      globeGroup.rotation.y += 0.0035;
      ringGroup.rotation.z -= 0.001;

      // Interpolate camera/group rotation target based on mouse coordinates for perspective shift
      targetX += (mouseX * 0.6 - targetX) * 0.05;
      targetY += (mouseY * 0.6 - targetY) * 0.05;

      globeGroup.rotation.x = targetY;
      globeGroup.rotation.z = -targetX * 0.5;

      renderer.render(scene, camera);
    }

    // Handle Resize
    window.addEventListener('resize', () => {
      if (!container || !renderer.domElement) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Start Animation
    animate();
  },
};

window.EcoHeroEarth = EcoHeroEarth;
document.addEventListener('DOMContentLoaded', () => EcoHeroEarth.init());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoHeroEarth;
  global.EcoHeroEarth = EcoHeroEarth;
}
