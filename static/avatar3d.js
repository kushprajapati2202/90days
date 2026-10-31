/**
 * Ultra-Realistic 3D Human Male Muscular Anatomy Avatar
 * Developed with Three.js (r128)
 *
 * Features:
 * - Anatomically accurate athletic male physique (~12-15% body fat)
 * - 14 segmented muscle groups with raycasting interaction & luminous highlights
 * - Physically based materials (MeshPhysicalMaterial) with procedural skin micro-texture & roughness
 * - Studio lighting rig (Key, Fill, Rim/Backlight, Ambient, Ground Contact Shadow)
 * - 360-degree orbit rotation, mouse drag, scroll zoom, and mobile touch pinch-zoom
 * - Preset view transitions (Front, Back, Left Side, Right Side, Reset) with smooth damping
 * - Interactive Anatomical HUD Card displaying Scientific Name, Function, and Location
 * - Seamless two-way integration with the 3 Exercise Databases (Plan 64, Free-Exercise-DB 876, ExerciseDB 1,324)
 */

(function () {
  'use strict';

  // Complete Anatomical Muscle Dictionary with Medical & Biomechanical Data
  const ANATOMY_DATA = {
    chest: {
      key: 'chest',
      label: 'Chest (Pectorals)',
      latinName: 'M. Pectoralis Major & Minor',
      function: 'Horizontal adduction, internal rotation, and forward flexion of the humerus (pushing movements, bench press, flyes).',
      location: 'Anterior chest wall, originating from the clavicle, sternum, and costal cartilages, inserting into the greater tubercle of the humerus.'
    },
    abs: {
      key: 'abs',
      label: 'Six-Pack Abs (Core)',
      latinName: 'M. Rectus Abdominis & Transversus',
      function: 'Flexion of the lumbar spine, posterior pelvic tilt, intra-abdominal pressure stabilization, and core anti-extension.',
      location: 'Anterior abdominal wall, extending vertically between the pubic crest and the 5th–7th ribs and xiphoid process.'
    },
    obliques: {
      key: 'obliques',
      label: 'External & Internal Obliques',
      latinName: 'M. Obliquus Externus & Internus Abdominis',
      function: 'Torso lateral flexion, contralateral rotation, anti-rotational stability, and dynamic pelvic control (V-line crest).',
      location: 'Lateral abdominal flanks, originating from ribs 5–12 and inserting along the iliac crest and abdominal aponeurosis.'
    },
    shoulders: {
      key: 'shoulders',
      label: 'Shoulders (Deltoids)',
      latinName: 'M. Deltoideus (Anterior, Lateral & Posterior)',
      function: 'Arm abduction (lateral head), anterior flexion (front head), horizontal abduction/extension (rear head), and shoulder joint stabilization.',
      location: 'Caps the glenohumeral joint, originating from the clavicle and scapular spine, inserting into the deltoid tuberosity.'
    },
    biceps: {
      key: 'biceps',
      label: 'Biceps (Anterior Arms)',
      latinName: 'M. Biceps Brachii & Brachialis',
      function: 'Forearm supination, elbow flexion, and secondary forward flexion of the shoulder joint.',
      location: 'Anterior compartment of the upper arm, originating from the scapula (coracoid & supraglenoid tubercle) and inserting on the radial tuberosity.'
    },
    triceps: {
      key: 'triceps',
      label: 'Triceps (Posterior Arms)',
      latinName: 'M. Triceps Brachii (Lateral, Long & Medial Heads)',
      function: 'Elbow extension (straightening the arm) and long-head shoulder adduction and retropulsion.',
      location: 'Posterior compartment of the upper arm, originating from the infraglenoid tubercle and posterior humerus, inserting into the olecranon process of the ulna.'
    },
    forearms: {
      key: 'forearms',
      label: 'Forearms & Grip',
      latinName: 'Brachioradialis, Flexor & Extensor Carpi Groups',
      function: 'Wrist flexion, wrist extension, grip tension, and forearm pronation/supination.',
      location: 'Spans the forearm from the lateral/medial epicondyles of the humerus to the carpals, metacarpals, and phalanges.'
    },
    traps: {
      key: 'traps',
      label: 'Trapezius (Upper Back / Neck)',
      latinName: 'M. Trapezius (Superior, Medial & Inferior)',
      function: 'Scapular elevation (shrugging), upward rotation, scapular retraction, and cervical spine stabilization.',
      location: 'Diamond-shaped superficial muscle spanning from the occipital bone of the skull down the thoracic spine (T1–T12) to the clavicle and scapular spine.'
    },
    lats: {
      key: 'lats',
      label: 'Lats (V-Taper Wings)',
      latinName: 'M. Latissimus Dorsi',
      function: 'Humeral adduction, extension, internal rotation, and downward depression of the scapula (pull-ups, pulldowns, heavy rows).',
      location: 'Broad triangular muscle covering the lower thoracic and lumbar back, tapering into the bicipital groove of the humerus under the armpit.'
    },
    lowerback: {
      key: 'lowerback',
      label: 'Lower Back & Erector Spinae',
      latinName: 'M. Erector Spinae (Iliocostalis, Longissimus, Spinalis)',
      function: 'Spinal extension, posture preservation, lateral vertebral flexion, and anti-flexion shear load resistance during deadlifts and squats.',
      location: 'Vertical muscular columns flanking the lumbar and thoracic spine from the sacrum and iliac crest up along the vertebral column.'
    },
    glutes: {
      key: 'glutes',
      label: 'Glutes (Gluteal Complex)',
      latinName: 'M. Gluteus Maximus, Medius & Minimus',
      function: 'Powerful hip extension, hip abduction, external rotation, and pelvis stabilization during compound leg movements.',
      location: 'Forms the prominence of the buttocks, originating from the posterior ilium and sacrum, inserting into the iliotibial band and gluteal tuberosity of the femur.'
    },
    quads: {
      key: 'quads',
      label: 'Quadriceps (Front Thighs)',
      latinName: 'M. Quadriceps Femoris (Rectus Femoris, Vastus Lateralis/Medialis/Intermedius)',
      function: 'Knee joint extension (straightening the leg) and hip flexion (rectus femoris head during squats, lunges, and sprints).',
      location: 'Anterior compartment of the thigh, converging into the common quadriceps tendon, enclosing the patella, and anchoring into the tibial tuberosity.'
    },
    hamstrings: {
      key: 'hamstrings',
      label: 'Hamstrings (Posterior Thighs)',
      latinName: 'Biceps Femoris, Semitendinosus, Semimembranosus',
      function: 'Knee flexion, hip extension, and deceleration of the lower leg during dynamic athletic strides and deadlifts.',
      location: 'Posterior compartment of the thigh, originating from the ischial tuberosity (sit bone) and inserting on the tibia and fibula below the knee.'
    },
    calves: {
      key: 'calves',
      label: 'Calves & Shins',
      latinName: 'M. Gastrocnemius, Soleus & Tibialis Anterior',
      function: 'Plantarflexion of the foot (raising onto toes), ankle propulsion, and knee stabilization; anterior head provides dorsiflexion.',
      location: 'Posterior lower leg, originating from femoral condyles and tibia/fibula, inserting into the calcaneus via the Achilles tendon.'
    }
  };

  class RealisticAnatomyAvatar3D {
    constructor() {
      this.container = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      // Muscle Mesh Registry
      this.muscleMeshes = {};       // muscleKey -> Array of Mesh objects
      this.allInteractiveMeshes = []; // Flattened list for raycaster
      this.selectedMuscleKey = null;
      this.hoveredMuscleKey = null;

      // Materials
      this.skinMaterial = null;
      this.jointMaterial = null;
      this.highlightMaterial = null;
      this.hoverMaterial = null;
      this.shadowTexture = null;

      // Spherical Camera Orbit State
      this.spherical = {
        radius: 3.2,
        theta: 0.15,          // Horizontal angle (radians)
        phi: 1.45             // Vertical angle (radians, ~83 deg)
      };
      this.targetSpherical = { ...this.spherical };
      this.cameraLookAt = new THREE.Vector3(0, 0.95, 0); // Focus at athletic core height
      this.minRadius = 1.4;
      this.maxRadius = 5.0;
      this.minPhi = 0.2;
      this.maxPhi = Math.PI - 0.2;

      // Pointer / Drag State
      this.isDragging = false;
      this.previousPointerPos = { x: 0, y: 0 };
      this.touchDistance = 0;
      this.autoRotate = false;
      this.autoRotateSpeed = 0.006;
      this.isAnimatingView = false;

      // Render Loop
      this.animationFrameId = null;
      this.isInitialized = false;
    }

    init(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.warn(`[Avatar3D] Container #${containerId} not found.`);
        return;
      }

      // Check for Three.js
      if (typeof THREE === 'undefined') {
        console.error('[Avatar3D] Three.js library is not loaded.');
        return;
      }

      const width = this.container.clientWidth || 400;
      const height = this.container.clientHeight || 450;

      // 1. Renderer Setup
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Clear container and attach canvas
      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.domElement);
      this.renderer.domElement.style.outline = 'none';
      this.renderer.domElement.style.touchAction = 'none';
      this.renderer.domElement.style.cursor = 'grab';

      // 2. Scene & Camera Setup
      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
      this.updateCameraPosition();

      // 3. Procedural Textures & Materials
      this.createProceduralTextures();
      this.createMaterials();

      // 4. Lighting Rig
      this.setupLighting();

      // 5. Build Anatomical Model
      this.buildRealisticAnatomyModel();

      // 6. Ground Shadow
      this.createGroundShadow();

      // 7. Event Listeners
      this.setupInteractionListeners();

      // 8. Start Animation Loop
      this.animate = this.animate.bind(this);
      this.animate();

      this.isInitialized = true;
      console.log('[Avatar3D] Ultra-realistic 3D human anatomy avatar initialized successfully.');
    }

    createProceduralTextures() {
      // High-resolution procedural skin micro-grain & pore normal texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Base skin neutral tone
      ctx.fillStyle = '#8080ff'; // Flat tangent space normal base
      ctx.fillRect(0, 0, 512, 512);

      // Fine cellular pore noise
      const imgData = ctx.getImageData(0, 0, 512, 512);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        // High-frequency skin roughness and micro-crease stippling
        const noise = (Math.random() - 0.5) * 22;
        data[i] = Math.min(255, Math.max(0, 128 + noise));     // Red (X normal)
        data[i + 1] = Math.min(255, Math.max(0, 128 + noise)); // Green (Y normal)
        data[i + 2] = 255;                                     // Blue (Z normal)
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      this.skinNormalTexture = new THREE.CanvasTexture(canvas);
      this.skinNormalTexture.wrapS = THREE.RepeatWrapping;
      this.skinNormalTexture.wrapT = THREE.RepeatWrapping;
      this.skinNormalTexture.repeat.set(16, 16);

      // Radial Soft Contact Shadow Texture for the floor
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const sCtx = shadowCanvas.getContext('2d');
      const gradient = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      gradient.addColorStop(0.35, 'rgba(3, 7, 18, 0.45)');
      gradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = gradient;
      sCtx.fillRect(0, 0, 256, 256);

      this.shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    }

    createMaterials() {
      // Natural athletic Caucasian-tanned skin tone with warm subcutaneous depth
      // MeshPhysicalMaterial provides clearcoat perspiration sheen and realistic specular roughness
      this.skinMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#d4a381'),       // Athletic natural skin tone
        roughness: 0.44,                         // Micro-roughness
        metalness: 0.04,
        clearcoat: 0.22,                         // Natural skin hydration/sheen
        clearcoatRoughness: 0.32,
        reflectivity: 0.55,
        normalMap: this.skinNormalTexture,
        normalScale: new THREE.Vector2(0.04, 0.04),
        side: THREE.FrontSide
      });

      // Joint & Transition Material (slightly warmer tint for knuckles, elbows, patellae)
      this.jointMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#c6926f'),
        roughness: 0.52,
        metalness: 0.02,
        clearcoat: 0.15,
        clearcoatRoughness: 0.45,
        normalMap: this.skinNormalTexture,
        normalScale: new THREE.Vector2(0.05, 0.05)
      });

      // Interactive Active Selection Material: Luminous Neon Cyan
      this.highlightMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#06b6d4'),       // Electric cyan
        emissive: new THREE.Color('#00f0ff'),
        emissiveIntensity: 0.75,
        roughness: 0.20,
        metalness: 0.1,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15
      });

      // Interactive Hover Material: Subtle Cyan Phosphor
      this.hoverMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#38bdf8'),
        emissive: new THREE.Color('#0284c7'),
        emissiveIntensity: 0.45,
        roughness: 0.28,
        metalness: 0.05,
        clearcoat: 0.5
      });
    }

    setupLighting() {
      // 1. Warm Studio Key Light (High frontal angle)
      const keyLight = new THREE.DirectionalLight('#fff8f0', 1.25);
      keyLight.position.set(2.8, 3.8, 3.2);
      this.scene.add(keyLight);

      // 2. Cool Fill Light (Softens opposite side shadows)
      const fillLight = new THREE.DirectionalLight('#93c5fd', 0.65);
      fillLight.position.set(-3.5, 1.8, 2.2);
      this.scene.add(fillLight);

      // 3. Azure Rim Light / Backlight (Crisp contour separation from dark background)
      const rimLight = new THREE.DirectionalLight('#38bdf8', 1.55);
      rimLight.position.set(0, 3.5, -3.5);
      this.scene.add(rimLight);

      // 4. Subtle Ground Bounce Light (Warmer upward fill from gym floor)
      const bounceLight = new THREE.DirectionalLight('#1e293b', 0.45);
      bounceLight.position.set(0, -3.0, 1.5);
      this.scene.add(bounceLight);

      // 5. Soft Ambient Light
      const ambientLight = new THREE.AmbientLight('#0f172a', 0.7);
      this.scene.add(ambientLight);
    }

    createGroundShadow() {
      const geo = new THREE.PlaneGeometry(1.6, 1.6);
      const mat = new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        depthWrite: false
      });
      const plane = new THREE.Mesh(geo, mat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.01;
      this.scene.add(plane);
    }

    // Helper: Register a sculpt mesh as an interactive muscle part
    registerMuscleMesh(mesh, muscleKey) {
      if (!this.muscleMeshes[muscleKey]) {
        this.muscleMeshes[muscleKey] = [];
      }
      mesh.userData = {
        muscleKey: muscleKey,
        data: ANATOMY_DATA[muscleKey] || { label: muscleKey }
      };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.muscleMeshes[muscleKey].push(mesh);
      this.allInteractiveMeshes.push(mesh);
      this.scene.add(mesh);
      return mesh;
    }

    // Helper: Add static non-interactive structural body mesh (head, joints, hands, feet)
    addBodyBaseMesh(mesh) {
      mesh.material = this.skinMaterial;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      return mesh;
    }

    // =========================================================================
    // ANATOMICALLY ACCURATE MALE PHYSIQUE SCULPTURE
    // Modeled with natural athletic proportions (1.82m tall, 12-15% body fat)
    // Curvilinear, organically contoured athletic muscle bellies matching anatomical reference
    // =========================================================================
    buildRealisticAnatomyModel() {
      // 1. HEAD & CRANIUM (Realistic athletic male skull & jawline)
      const craniumGeo = new THREE.SphereGeometry(0.125, 32, 26);
      craniumGeo.scale(0.86, 1.08, 0.96);
      const cranium = new THREE.Mesh(craniumGeo, this.skinMaterial);
      cranium.position.set(0, 1.76, 0.01);
      this.addBodyBaseMesh(cranium);

      // Athletic Jawline & Chin
      const jawGeo = new THREE.ConeGeometry(0.086, 0.11, 24);
      jawGeo.scale(0.82, 1.0, 0.75);
      const jaw = new THREE.Mesh(jawGeo, this.skinMaterial);
      jaw.rotation.x = Math.PI;
      jaw.position.set(0, 1.67, 0.04);
      this.addBodyBaseMesh(jaw);

      // Muscular Neck Core (Sternocleidomastoid wrap)
      const neckGeo = new THREE.CylinderGeometry(0.070, 0.084, 0.14, 24);
      const neck = new THREE.Mesh(neckGeo, this.skinMaterial);
      neck.position.set(0, 1.62, 0);
      this.addBodyBaseMesh(neck);

      // 2. TRAPEZIUS MUSCLES (Diamond-shaped neck & upper back wrap)
      // Upper Traps (Neck slope)
      const trapsUpperGeo = new THREE.SphereGeometry(0.14, 28, 22);
      trapsUpperGeo.scale(1.45, 0.72, 0.88);
      const trapsUpper = new THREE.Mesh(trapsUpperGeo, this.skinMaterial);
      trapsUpper.position.set(0, 1.57, -0.018);
      this.registerMuscleMesh(trapsUpper, 'traps');

      // Mid & Lower Trapezius (Diamond contour between scapulae)
      const trapsMidGeo = new THREE.SphereGeometry(0.125, 28, 22);
      trapsMidGeo.scale(1.15, 1.45, 0.42);
      const trapsMid = new THREE.Mesh(trapsMidGeo, this.skinMaterial);
      trapsMid.position.set(0, 1.43, -0.092);
      this.registerMuscleMesh(trapsMid, 'traps');

      // 3. PECTORALIS MAJOR (CHEST)
      // Natural, rounded, full athletic pectoral bellies with clavicular & sternal curvature
      const pecGeoLeft = new THREE.SphereGeometry(0.125, 32, 24);
      pecGeoLeft.scale(1.24, 0.88, 0.52);
      const pecLeft = new THREE.Mesh(pecGeoLeft, this.skinMaterial);
      pecLeft.position.set(-0.088, 1.41, 0.076);
      pecLeft.rotation.z = -0.08;
      pecLeft.rotation.y = 0.14;
      this.registerMuscleMesh(pecLeft, 'chest');

      const pecGeoRight = new THREE.SphereGeometry(0.125, 32, 24);
      pecGeoRight.scale(1.24, 0.88, 0.52);
      const pecRight = new THREE.Mesh(pecGeoRight, this.skinMaterial);
      pecRight.position.set(0.088, 1.41, 0.076);
      pecRight.rotation.z = 0.08;
      pecRight.rotation.y = -0.14;
      this.registerMuscleMesh(pecRight, 'chest');

      // Clavicles (Collar bones structural landmark)
      const clavicleGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.36, 16);
      clavicleGeo.rotateZ(Math.PI / 2);
      const clavicles = new THREE.Mesh(clavicleGeo, this.jointMaterial);
      clavicles.position.set(0, 1.505, 0.065);
      this.addBodyBaseMesh(clavicles);

      // 4. SHOULDERS (DELTOIDS - Rounded epaulette capping anterior, lateral & posterior heads)
      // Left Shoulder (Deltoid Cap)
      const deltGeoLeft = new THREE.SphereGeometry(0.098, 28, 24);
      deltGeoLeft.scale(0.88, 1.35, 1.05);
      const deltLeft = new THREE.Mesh(deltGeoLeft, this.skinMaterial);
      deltLeft.position.set(-0.245, 1.44, 0.005);
      deltLeft.rotation.z = -0.14;
      this.registerMuscleMesh(deltLeft, 'shoulders');

      // Right Shoulder (Deltoid Cap)
      const deltGeoRight = new THREE.SphereGeometry(0.098, 28, 24);
      deltGeoRight.scale(0.88, 1.35, 1.05);
      const deltRight = new THREE.Mesh(deltGeoRight, this.skinMaterial);
      deltRight.position.set(0.245, 1.44, 0.005);
      deltRight.rotation.z = 0.14;
      this.registerMuscleMesh(deltRight, 'shoulders');

      // 5. SIX-PACK ABDOMINALS (RECTUS ABDOMINIS)
      // Sculpted in 3 convex anatomical cushion tiers with Linea Alba & Tendinous Inscriptions
      const absTierPositions = [
        { y: 1.285, sx: 1.10, sy: 0.85, sz: 0.38, r: 0.046 }, // Upper Abs
        { y: 1.205, sx: 1.08, sy: 0.88, sz: 0.38, r: 0.046 }, // Mid Abs (Umbilical)
        { y: 1.120, sx: 1.05, sy: 0.92, sz: 0.36, r: 0.044 }  // Lower Abs (Suprapubic)
      ];

      absTierPositions.forEach(tier => {
        // Left Abdominal Pad (Smooth convex cushion)
        const padGeoL = new THREE.SphereGeometry(tier.r, 22, 18);
        padGeoL.scale(tier.sx, tier.sy, tier.sz);
        const padL = new THREE.Mesh(padGeoL, this.skinMaterial);
        padL.position.set(-0.042, tier.y, 0.082);
        this.registerMuscleMesh(padL, 'abs');

        // Right Abdominal Pad
        const padGeoR = new THREE.SphereGeometry(tier.r, 22, 18);
        padGeoR.scale(tier.sx, tier.sy, tier.sz);
        const padR = new THREE.Mesh(padGeoR, this.skinMaterial);
        padR.position.set(0.042, tier.y, 0.082);
        this.registerMuscleMesh(padR, 'abs');
      });

      // 6. EXTERNAL OBLIQUES (Flanks & V-Line Adonis Belt)
      // Left Oblique
      const obliqueGeoL = new THREE.SphereGeometry(0.062, 24, 20);
      obliqueGeoL.scale(0.82, 2.25, 0.88);
      const obliqueL = new THREE.Mesh(obliqueGeoL, this.skinMaterial);
      obliqueL.position.set(-0.128, 1.18, 0.042);
      obliqueL.rotation.z = -0.10;
      this.registerMuscleMesh(obliqueL, 'obliques');

      // Right Oblique
      const obliqueGeoR = new THREE.SphereGeometry(0.062, 24, 20);
      obliqueGeoR.scale(0.82, 2.25, 0.88);
      const obliqueR = new THREE.Mesh(obliqueGeoR, this.skinMaterial);
      obliqueR.position.set(0.128, 1.18, 0.042);
      obliqueR.rotation.z = 0.10;
      this.registerMuscleMesh(obliqueR, 'obliques');

      // 7. LATISSIMUS DORSI (LATS / V-TAPER BACK WINGS)
      // Smooth, fanned latissimus wings creating classic athletic V-taper
      const latGeoL = new THREE.SphereGeometry(0.092, 26, 22);
      latGeoL.scale(1.18, 1.95, 0.72);
      const latL = new THREE.Mesh(latGeoL, this.skinMaterial);
      latL.position.set(-0.165, 1.32, -0.052);
      latL.rotation.z = -0.18;
      latL.rotation.y = 0.28;
      this.registerMuscleMesh(latL, 'lats');

      const latGeoR = new THREE.SphereGeometry(0.092, 26, 22);
      latGeoR.scale(1.18, 1.95, 0.72);
      const latR = new THREE.Mesh(latGeoR, this.skinMaterial);
      latR.position.set(0.165, 1.32, -0.052);
      latR.rotation.z = 0.18;
      latR.rotation.y = -0.28;
      this.registerMuscleMesh(latR, 'lats');

      // 8. LOWER BACK (ERECTOR SPINAE & LUMBAR COLUMNS)
      const lbackGeoL = new THREE.CylinderGeometry(0.034, 0.040, 0.22, 18);
      const lbackL = new THREE.Mesh(lbackGeoL, this.skinMaterial);
      lbackL.position.set(-0.046, 1.17, -0.080);
      this.registerMuscleMesh(lbackL, 'lowerback');

      const lbackGeoR = new THREE.CylinderGeometry(0.034, 0.040, 0.22, 18);
      const lbackR = new THREE.Mesh(lbackGeoR, this.skinMaterial);
      lbackR.position.set(0.046, 1.17, -0.080);
      this.registerMuscleMesh(lbackR, 'lowerback');

      // Internal Torso Anatomical Core (Smooth organically contoured oval connector)
      const coreGeo = new THREE.SphereGeometry(0.162, 32, 24);
      coreGeo.scale(0.96, 1.55, 0.82);
      const core = new THREE.Mesh(coreGeo, this.skinMaterial);
      core.position.set(0, 1.28, 0.005);
      this.addBodyBaseMesh(core);

      // Pelvis / Waist Athletic Base
      const pelvisGeo = new THREE.CylinderGeometry(0.132, 0.144, 0.16, 24);
      const pelvis = new THREE.Mesh(pelvisGeo, this.skinMaterial);
      pelvis.position.set(0, 1.01, 0.01);
      this.addBodyBaseMesh(pelvis);

      // 9. BICEPS (ANTERIOR ARMS)
      // Athletic peaked bicep bellies
      const bicepGeoL = new THREE.SphereGeometry(0.058, 22, 18);
      bicepGeoL.scale(0.86, 1.75, 0.92);
      const bicepL = new THREE.Mesh(bicepGeoL, this.skinMaterial);
      bicepL.position.set(-0.255, 1.28, 0.024);
      bicepL.rotation.z = -0.12;
      this.registerMuscleMesh(bicepL, 'biceps');

      const bicepGeoR = new THREE.SphereGeometry(0.058, 22, 18);
      bicepGeoR.scale(0.86, 1.75, 0.92);
      const bicepR = new THREE.Mesh(bicepGeoR, this.skinMaterial);
      bicepR.position.set(0.255, 1.28, 0.024);
      bicepR.rotation.z = 0.12;
      this.registerMuscleMesh(bicepR, 'biceps');

      // 10. TRICEPS (POSTERIOR ARMS - HORSESHOE FORM)
      const tricepGeoL = new THREE.SphereGeometry(0.064, 22, 18);
      tricepGeoL.scale(0.90, 1.85, 1.02);
      const tricepL = new THREE.Mesh(tricepGeoL, this.skinMaterial);
      tricepL.position.set(-0.258, 1.28, -0.032);
      tricepL.rotation.z = -0.12;
      this.registerMuscleMesh(tricepL, 'triceps');

      const tricepGeoR = new THREE.SphereGeometry(0.064, 22, 18);
      tricepGeoR.scale(0.90, 1.85, 1.02);
      const tricepR = new THREE.Mesh(tricepGeoR, this.skinMaterial);
      tricepR.position.set(0.258, 1.28, -0.032);
      tricepR.rotation.z = 0.12;
      this.registerMuscleMesh(tricepR, 'triceps');

      // Elbows (Olecranon joint landmarks)
      const elbowGeo = new THREE.SphereGeometry(0.040, 16, 14);
      const elbowL = new THREE.Mesh(elbowGeo, this.jointMaterial);
      elbowL.position.set(-0.275, 1.155, -0.025);
      this.addBodyBaseMesh(elbowL);

      const elbowR = new THREE.Mesh(elbowGeo, this.jointMaterial);
      elbowR.position.set(0.275, 1.155, -0.025);
      this.addBodyBaseMesh(elbowR);

      // 11. FOREARMS (BRACHIORADIALIS & FLEXOR/EXTENSOR GROUPS)
      // Left Forearm with Brachioradialis muscular sweep
      const forearmGeoL = new THREE.CylinderGeometry(0.033, 0.052, 0.22, 20);
      const forearmL = new THREE.Mesh(forearmGeoL, this.skinMaterial);
      forearmL.position.set(-0.285, 1.025, 0.015);
      forearmL.rotation.z = -0.14;
      this.registerMuscleMesh(forearmL, 'forearms');

      const brachioGeoL = new THREE.SphereGeometry(0.042, 18, 16);
      brachioGeoL.scale(0.88, 1.45, 0.88);
      const brachioL = new THREE.Mesh(brachioGeoL, this.skinMaterial);
      brachioL.position.set(-0.292, 1.06, 0.022);
      brachioL.rotation.z = -0.14;
      this.registerMuscleMesh(brachioL, 'forearms');

      // Right Forearm with Brachioradialis sweep
      const forearmGeoR = new THREE.CylinderGeometry(0.033, 0.052, 0.22, 20);
      const forearmR = new THREE.Mesh(forearmGeoR, this.skinMaterial);
      forearmR.position.set(0.285, 1.025, 0.015);
      forearmR.rotation.z = 0.14;
      this.registerMuscleMesh(forearmR, 'forearms');

      const brachioGeoR = new THREE.SphereGeometry(0.042, 18, 16);
      brachioGeoR.scale(0.88, 1.45, 0.88);
      const brachioR = new THREE.Mesh(brachioGeoR, this.skinMaterial);
      brachioR.position.set(0.292, 1.06, 0.022);
      brachioR.rotation.z = 0.14;
      this.registerMuscleMesh(brachioR, 'forearms');

      // Wrists & Natural Sculpted Hands
      const handGeoL = new THREE.SphereGeometry(0.038, 18, 14);
      handGeoL.scale(0.85, 1.45, 0.55);
      const handL = new THREE.Mesh(handGeoL, this.jointMaterial);
      handL.position.set(-0.315, 0.865, 0.02);
      this.addBodyBaseMesh(handL);

      const handGeoR = new THREE.SphereGeometry(0.038, 18, 14);
      handGeoR.scale(0.85, 1.45, 0.55);
      const handR = new THREE.Mesh(handGeoR, this.jointMaterial);
      handR.position.set(0.315, 0.865, 0.02);
      this.addBodyBaseMesh(handR);

      // 12. GLUTES (GLUTEAL COMPLEX - GLUTEUS MAXIMUS & MEDIUS)
      const gluteGeoL = new THREE.SphereGeometry(0.118, 26, 22);
      gluteGeoL.scale(0.95, 1.15, 1.05);
      const gluteL = new THREE.Mesh(gluteGeoL, this.skinMaterial);
      gluteL.position.set(-0.088, 0.94, -0.082);
      this.registerMuscleMesh(gluteL, 'glutes');

      const gluteGeoR = new THREE.SphereGeometry(0.118, 26, 22);
      gluteGeoR.scale(0.95, 1.15, 1.05);
      const gluteR = new THREE.Mesh(gluteGeoR, this.skinMaterial);
      gluteR.position.set(0.088, 0.94, -0.082);
      this.registerMuscleMesh(gluteR, 'glutes');

      // 13. QUADRICEPS (FRONT THIGHS - VASTUS LATERALIS, MEDIALIS TEARDROP & RECTUS FEMORIS)
      // Left Quad Complex
      // Outer Vastus Lateralis (Quad Sweep)
      const latQuadGeoL = new THREE.SphereGeometry(0.080, 24, 20);
      latQuadGeoL.scale(0.92, 2.25, 0.88);
      const latQuadL = new THREE.Mesh(latQuadGeoL, this.skinMaterial);
      latQuadL.position.set(-0.135, 0.725, 0.015);
      latQuadL.rotation.z = 0.08;
      this.registerMuscleMesh(latQuadL, 'quads');

      // Central Rectus Femoris (Quad Front Peak)
      const rectusQuadGeoL = new THREE.SphereGeometry(0.076, 24, 20);
      rectusQuadGeoL.scale(0.88, 2.35, 0.92);
      const rectusQuadL = new THREE.Mesh(rectusQuadGeoL, this.skinMaterial);
      rectusQuadL.position.set(-0.108, 0.725, 0.042);
      this.registerMuscleMesh(rectusQuadL, 'quads');

      // Inner Vastus Medialis (Teardrop above inner knee)
      const teardropGeoL = new THREE.SphereGeometry(0.052, 20, 18);
      teardropGeoL.scale(1.05, 1.40, 0.88);
      const teardropL = new THREE.Mesh(teardropGeoL, this.skinMaterial);
      teardropL.position.set(-0.082, 0.575, 0.052);
      this.registerMuscleMesh(teardropL, 'quads');

      // Right Quad Complex
      // Outer Vastus Lateralis (Quad Sweep)
      const latQuadGeoR = new THREE.SphereGeometry(0.080, 24, 20);
      latQuadGeoR.scale(0.92, 2.25, 0.88);
      const latQuadR = new THREE.Mesh(latQuadGeoR, this.skinMaterial);
      latQuadR.position.set(0.135, 0.725, 0.015);
      latQuadR.rotation.z = -0.08;
      this.registerMuscleMesh(latQuadR, 'quads');

      // Central Rectus Femoris (Quad Front Peak)
      const rectusQuadGeoR = new THREE.SphereGeometry(0.076, 24, 20);
      rectusQuadGeoR.scale(0.88, 2.35, 0.92);
      const rectusQuadR = new THREE.Mesh(rectusQuadGeoR, this.skinMaterial);
      rectusQuadR.position.set(0.108, 0.725, 0.042);
      this.registerMuscleMesh(rectusQuadR, 'quads');

      // Inner Vastus Medialis (Teardrop above inner knee)
      const teardropGeoR = new THREE.SphereGeometry(0.052, 20, 18);
      teardropGeoR.scale(1.05, 1.40, 0.88);
      const teardropR = new THREE.Mesh(teardropGeoR, this.skinMaterial);
      teardropR.position.set(0.082, 0.575, 0.052);
      this.registerMuscleMesh(teardropR, 'quads');

      // 14. HAMSTRINGS (POSTERIOR THIGHS - BICEPS FEMORIS & SEMITENDINOSUS)
      // Left Hamstring
      const hamGeoL = new THREE.SphereGeometry(0.082, 24, 20);
      hamGeoL.scale(0.92, 2.15, 0.95);
      const hamL = new THREE.Mesh(hamGeoL, this.skinMaterial);
      hamL.position.set(-0.112, 0.725, -0.048);
      hamL.rotation.z = 0.06;
      this.registerMuscleMesh(hamL, 'hamstrings');

      // Right Hamstring
      const hamGeoR = new THREE.SphereGeometry(0.082, 24, 20);
      hamGeoR.scale(0.92, 2.15, 0.95);
      const hamR = new THREE.Mesh(hamGeoR, this.skinMaterial);
      hamR.position.set(0.112, 0.725, -0.048);
      hamR.rotation.z = -0.06;
      this.registerMuscleMesh(hamR, 'hamstrings');

      // Knees (Patella Shield Landmarks)
      const kneeGeo = new THREE.SphereGeometry(0.046, 20, 16);
      kneeGeo.scale(0.95, 1.15, 0.65);
      const kneeL = new THREE.Mesh(kneeGeo, this.jointMaterial);
      kneeL.position.set(-0.102, 0.510, 0.040);
      this.addBodyBaseMesh(kneeL);

      const kneeR = new THREE.Mesh(kneeGeo, this.jointMaterial);
      kneeR.position.set(0.102, 0.510, 0.040);
      this.addBodyBaseMesh(kneeR);

      // 15. CALVES & TIBIALIS (LOWER LEGS - GASTROCNEMIUS & SOLEUS)
      // Left Calf Complex
      // Outer Lateral Gastrocnemius
      const calfLatGeoL = new THREE.SphereGeometry(0.056, 22, 18);
      calfLatGeoL.scale(0.90, 1.85, 0.92);
      const calfLatL = new THREE.Mesh(calfLatGeoL, this.skinMaterial);
      calfLatL.position.set(-0.118, 0.365, -0.024);
      this.registerMuscleMesh(calfLatL, 'calves');

      // Inner Medial Gastrocnemius (Fuller & lower anatomical sweep)
      const calfMedGeoL = new THREE.SphereGeometry(0.062, 22, 18);
      calfMedGeoL.scale(0.92, 1.95, 0.95);
      const calfMedL = new THREE.Mesh(calfMedGeoL, this.skinMaterial);
      calfMedL.position.set(-0.092, 0.345, -0.022);
      this.registerMuscleMesh(calfMedL, 'calves');

      // Left Shin & Achilles Tendon (Tibialis Anterior ridge)
      const shinGeoL = new THREE.CylinderGeometry(0.034, 0.042, 0.35, 18);
      const shinL = new THREE.Mesh(shinGeoL, this.skinMaterial);
      shinL.position.set(-0.102, 0.285, 0.015);
      this.registerMuscleMesh(shinL, 'calves');

      // Right Calf Complex
      // Outer Lateral Gastrocnemius
      const calfLatGeoR = new THREE.SphereGeometry(0.056, 22, 18);
      calfLatGeoR.scale(0.90, 1.85, 0.92);
      const calfLatR = new THREE.Mesh(calfLatGeoR, this.skinMaterial);
      calfLatR.position.set(0.118, 0.365, -0.024);
      this.registerMuscleMesh(calfLatR, 'calves');

      // Inner Medial Gastrocnemius
      const calfMedGeoR = new THREE.SphereGeometry(0.062, 22, 18);
      calfMedGeoR.scale(0.92, 1.95, 0.95);
      const calfMedR = new THREE.Mesh(calfMedGeoR, this.skinMaterial);
      calfMedR.position.set(0.092, 0.345, -0.022);
      this.registerMuscleMesh(calfMedR, 'calves');

      // Right Shin & Achilles Tendon
      const shinGeoR = new THREE.CylinderGeometry(0.034, 0.042, 0.35, 18);
      const shinR = new THREE.Mesh(shinGeoR, this.skinMaterial);
      shinR.position.set(0.102, 0.285, 0.015);
      this.registerMuscleMesh(shinR, 'calves');

      // Ankles & Sculpted Feet
      const footGeoL = new THREE.SphereGeometry(0.055, 18, 14);
      footGeoL.scale(0.85, 0.62, 1.75);
      const footL = new THREE.Mesh(footGeoL, this.jointMaterial);
      footL.position.set(-0.102, 0.045, 0.045);
      this.addBodyBaseMesh(footL);

      const footGeoR = new THREE.SphereGeometry(0.055, 18, 14);
      footGeoR.scale(0.85, 0.62, 1.75);
      const footR = new THREE.Mesh(footGeoR, this.jointMaterial);
      footR.position.set(0.102, 0.045, 0.045);
      this.addBodyBaseMesh(footR);
    }

    // =========================================================================
    // INTERACTION, RAYCASTING & CAMERA ORBIT CONTROLS
    // =========================================================================
    setupInteractionListeners() {
      const canvas = this.renderer.domElement;

      // Mouse Down / Touch Start
      const onPointerDown = (clientX, clientY) => {
        this.isDragging = true;
        this.previousPointerPos = { x: clientX, y: clientY };
        this.isAnimatingView = false;
        canvas.style.cursor = 'grabbing';
      };

      // Mouse Move / Touch Move (Orbit Rotation)
      const onPointerMove = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        if (this.isDragging) {
          const deltaX = clientX - this.previousPointerPos.x;
          const deltaY = clientY - this.previousPointerPos.y;

          this.spherical.theta -= deltaX * 0.0085;
          this.spherical.phi = Math.max(
            this.minPhi,
            Math.min(this.maxPhi, this.spherical.phi - deltaY * 0.0085)
          );

          this.targetSpherical.theta = this.spherical.theta;
          this.targetSpherical.phi = this.spherical.phi;

          this.previousPointerPos = { x: clientX, y: clientY };
        } else {
          // Raycast for hover state when not dragging
          this.handleHover();
        }
      };

      // Mouse Up / Touch End
      const onPointerUp = () => {
        this.isDragging = false;
        canvas.style.cursor = this.hoveredMuscleKey ? 'pointer' : 'grab';
      };

      // Desktop Listeners
      canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
      window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
      window.addEventListener('mouseup', onPointerUp);

      // Desktop Click -> Muscle Selection
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.handleClick();
      });

      // Mouse Wheel Zoom
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY * 0.0022;
        this.spherical.radius = Math.max(
          this.minRadius,
          Math.min(this.maxRadius, this.spherical.radius + zoomDelta)
        );
        this.targetSpherical.radius = this.spherical.radius;
        this.isAnimatingView = false;
      }, { passive: false });

      // Mobile Touch Listeners (Supports 1-finger orbit & 2-finger pinch zoom)
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2) {
          this.isDragging = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          this.touchDistance = Math.hypot(dx, dy);
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && this.isDragging) {
          onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const diff = (this.touchDistance - dist) * 0.006;
          this.spherical.radius = Math.max(
            this.minRadius,
            Math.min(this.maxRadius, this.spherical.radius + diff)
          );
          this.targetSpherical.radius = this.spherical.radius;
          this.touchDistance = dist;
        }
      }, { passive: true });

      canvas.addEventListener('touchend', (e) => {
        onPointerUp();
        // If single tap, trigger click detection
        if (e.changedTouches.length === 1) {
          const rect = canvas.getBoundingClientRect();
          this.mouse.x = ((e.changedTouches[0].clientX - rect.left) / rect.width) * 2 - 1;
          this.mouse.y = -((e.changedTouches[0].clientY - rect.top) / rect.height) * 2 + 1;
          this.handleClick();
        }
      }, { passive: true });

      // Resize Listener
      window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight || 450;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    updateCameraPosition() {
      const { radius, theta, phi } = this.spherical;
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi) + this.cameraLookAt.y;
      const z = radius * Math.sin(phi) * Math.cos(theta);

      this.camera.position.set(x, y, z);
      this.camera.lookAt(this.cameraLookAt);
    }

    // =========================================================================
    // RAYCASTING & MUSCLE HIGHLIGHTING
    // =========================================================================
    handleHover() {
      if (this.isDragging || !this.camera) return;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.allInteractiveMeshes, false);

      const canvas = this.renderer.domElement;

      if (intersects.length > 0) {
        const hitMuscleKey = intersects[0].object.userData.muscleKey;
        if (this.hoveredMuscleKey !== hitMuscleKey) {
          this.hoveredMuscleKey = hitMuscleKey;
          canvas.style.cursor = 'pointer';
          this.refreshMuscleMaterials();

          // Show floating hover title
          const info = ANATOMY_DATA[hitMuscleKey];
          if (info && window.set3DAvatarTooltip) {
            window.set3DAvatarTooltip(`Inspect: ${info.label}`);
          }
        }
      } else {
        if (this.hoveredMuscleKey !== null) {
          this.hoveredMuscleKey = null;
          canvas.style.cursor = 'grab';
          this.refreshMuscleMaterials();
          if (window.set3DAvatarTooltip) {
            window.set3DAvatarTooltip(
              this.selectedMuscleKey && ANATOMY_DATA[this.selectedMuscleKey]
                ? `Active: ${ANATOMY_DATA[this.selectedMuscleKey].label}`
                : ''
            );
          }
        }
      }
    }

    handleClick() {
      if (!this.camera) return;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.allInteractiveMeshes, false);

      if (intersects.length > 0) {
        const muscleKey = intersects[0].object.userData.muscleKey;
        if (this.selectedMuscleKey === muscleKey) {
          this.clearSelection();
        } else {
          this.selectMuscle(muscleKey, true);
        }
      }
    }

    selectMuscle(muscleKey, triggerExternalFilter = true) {
      if (!ANATOMY_DATA[muscleKey]) return;

      this.selectedMuscleKey = muscleKey;
      this.refreshMuscleMaterials();

      // Show Anatomical Info HUD Card
      this.renderAnatomicalCard(muscleKey);

      // Forward to 2D SVG avatar & exercise library filters
      if (triggerExternalFilter && typeof window.selectMuscle === 'function') {
        window.selectMuscle(muscleKey);
      }
    }

    clearSelection(triggerExternalFilter = true) {
      this.selectedMuscleKey = null;
      this.refreshMuscleMaterials();
      this.hideAnatomicalCard();

      if (triggerExternalFilter && typeof window.clearMuscleFilter === 'function') {
        window.clearMuscleFilter();
      }
    }

    refreshMuscleMaterials() {
      Object.keys(this.muscleMeshes).forEach(key => {
        const meshes = this.muscleMeshes[key];
        let targetMat = this.skinMaterial;

        if (key === this.selectedMuscleKey) {
          targetMat = this.highlightMaterial;
        } else if (key === this.hoveredMuscleKey) {
          targetMat = this.hoverMaterial;
        }

        meshes.forEach(m => {
          m.material = targetMat;
        });
      });
    }

    // =========================================================================
    // ANATOMICAL HUD CARD (Scientific details, origin/insertion & function)
    // =========================================================================
    renderAnatomicalCard(muscleKey) {
      const data = ANATOMY_DATA[muscleKey];
      if (!data) return;

      const card3d = document.getElementById('avatar-3d-hud-card');
      const card2d = document.getElementById('avatar-2d-hud-card');
      if (!card3d && !card2d) return;

      const html = `
        <div class="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <h4 class="text-xs font-bold text-white uppercase tracking-wider font-heading">${data.label}</h4>
            </div>
            <p class="text-[10px] text-cyan-300 font-serif italic">${data.latinName}</p>
          </div>
          <button type="button" onclick="window.clearMuscleFilter ? window.clearMuscleFilter() : window.avatar3D.clearSelection()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition" title="Clear selection">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </div>
        <div class="space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800/80 pt-1.5">
          <div>
            <span class="font-bold text-cyan-400 text-[10px] uppercase tracking-wide block">Primary Biomechanical Function:</span>
            <p class="leading-tight text-slate-200 mt-0.5">${data.function}</p>
          </div>
          <div>
            <span class="font-bold text-slate-400 text-[10px] uppercase tracking-wide block">Anatomical Location:</span>
            <p class="leading-tight text-slate-300 mt-0.5">${data.location}</p>
          </div>
        </div>
      `;

      if (card3d) {
        card3d.innerHTML = html;
        card3d.classList.remove('hidden');
      }
      if (card2d) {
        card2d.innerHTML = html;
        card2d.classList.remove('hidden');
      }
      if (window.lucide) window.lucide.createIcons();
    }

    hideAnatomicalCard() {
      const card3d = document.getElementById('avatar-3d-hud-card');
      const card2d = document.getElementById('avatar-2d-hud-card');
      if (card3d) card3d.classList.add('hidden');
      if (card2d) card2d.classList.add('hidden');
    }

    // =========================================================================
    // CAMERA VIEW PRESETS WITH SMOOTH EASING
    // =========================================================================
    setView(viewName) {
      this.isAnimatingView = true;
      this.autoRotate = false;
      const btnRotate = document.getElementById('btn-3d-autorotate');
      if (btnRotate) btnRotate.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');

      switch (viewName) {
        case 'front':
          this.targetSpherical = { radius: 3.1, theta: 0.0, phi: Math.PI / 2 };
          break;
        case 'back':
          this.targetSpherical = { radius: 3.1, theta: Math.PI, phi: Math.PI / 2 };
          break;
        case 'left':
          this.targetSpherical = { radius: 3.1, theta: -Math.PI / 2, phi: Math.PI / 2 };
          break;
        case 'right':
          this.targetSpherical = { radius: 3.1, theta: Math.PI / 2, phi: Math.PI / 2 };
          break;
        case 'reset':
        default:
          this.targetSpherical = { radius: 3.2, theta: 0.15, phi: 1.45 };
          break;
      }
    }

    toggleAutoRotate() {
      this.autoRotate = !this.autoRotate;
      const btn = document.getElementById('btn-3d-autorotate');
      if (btn) {
        if (this.autoRotate) {
          btn.classList.add('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        } else {
          btn.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        }
      }
    }

    // =========================================================================
    // MAIN RENDER & ANIMATION LOOP
    // =========================================================================
    animate() {
      this.animationFrameId = requestAnimationFrame(this.animate);

      // Auto-rotation turntable mode
      if (this.autoRotate && !this.isDragging) {
        this.spherical.theta += this.autoRotateSpeed;
        this.targetSpherical.theta = this.spherical.theta;
      }

      // Smooth camera interpolation towards target
      if (this.isAnimatingView || !this.isDragging) {
        this.spherical.theta += (this.targetSpherical.theta - this.spherical.theta) * 0.085;
        this.spherical.phi += (this.targetSpherical.phi - this.spherical.phi) * 0.085;
        this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * 0.085;
      }

      this.updateCameraPosition();
      this.renderer.render(this.scene, this.camera);
    }

    dispose() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.remove();
      }
    }
  }

  // Expose global instance
  window.RealisticAnatomyAvatar3D = RealisticAnatomyAvatar3D;
  window.ANATOMY_DATA = ANATOMY_DATA;
  window.avatar3D = new RealisticAnatomyAvatar3D();

  // Helper function for external SVG / UI sync
  window.set3DAvatarTooltip = function (text) {
    const tooltip = document.getElementById('svg-muscle-tooltip');
    if (tooltip) tooltip.textContent = text;
  };
})();

