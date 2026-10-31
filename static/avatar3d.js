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
    // =========================================================================
    buildRealisticAnatomyModel() {
      // 1. HEAD & CRANIUM (Realistic athletic male skull & jawline)
      const craniumGeo = new THREE.SphereGeometry(0.125, 28, 22);
      craniumGeo.scale(0.85, 1.08, 0.95);
      const cranium = new THREE.Mesh(craniumGeo, this.skinMaterial);
      cranium.position.set(0, 1.76, 0.01);
      this.addBodyBaseMesh(cranium);

      // Athletic Jawline & Chin
      const jawGeo = new THREE.ConeGeometry(0.088, 0.11, 20);
      jawGeo.scale(0.82, 1.0, 0.75);
      const jaw = new THREE.Mesh(jawGeo, this.skinMaterial);
      jaw.rotation.x = Math.PI;
      jaw.position.set(0, 1.67, 0.04);
      this.addBodyBaseMesh(jaw);

      // Muscular Neck Core
      const neckGeo = new THREE.CylinderGeometry(0.068, 0.082, 0.14, 20);
      const neck = new THREE.Mesh(neckGeo, this.skinMaterial);
      neck.position.set(0, 1.62, 0);
      this.addBodyBaseMesh(neck);

      // 2. TRAPEZIUS MUSCLES (Diamond-shaped neck & upper back wrap)
      // Upper Traps (Neck slope)
      const trapsUpperGeo = new THREE.ConeGeometry(0.155, 0.16, 16);
      trapsUpperGeo.scale(1.4, 0.85, 0.85);
      const trapsUpper = new THREE.Mesh(trapsUpperGeo, this.skinMaterial);
      trapsUpper.position.set(0, 1.58, -0.015);
      this.registerMuscleMesh(trapsUpper, 'traps');

      // Mid & Lower Trapezius (Spans between scapulae)
      const trapsMidGeo = new THREE.BoxGeometry(0.19, 0.22, 0.05);
      const trapsMid = new THREE.Mesh(trapsMidGeo, this.skinMaterial);
      trapsMid.position.set(0, 1.43, -0.095);
      this.registerMuscleMesh(trapsMid, 'traps');

      // 3. PECTORALIS MAJOR (CHEST)
      // Sculpted left and right sternal/clavicular pectoral slabs with sternal cleft
      const pecGeoLeft = new THREE.BoxGeometry(0.15, 0.14, 0.075);
      pecGeoLeft.scale(1.0, 0.95, 1.0);
      const pecLeft = new THREE.Mesh(pecGeoLeft, this.skinMaterial);
      pecLeft.position.set(-0.085, 1.41, 0.088);
      pecLeft.rotation.z = -0.07;
      pecLeft.rotation.y = 0.12;
      this.registerMuscleMesh(pecLeft, 'chest');

      const pecGeoRight = new THREE.BoxGeometry(0.15, 0.14, 0.075);
      pecGeoRight.scale(1.0, 0.95, 1.0);
      const pecRight = new THREE.Mesh(pecGeoRight, this.skinMaterial);
      pecRight.position.set(0.085, 1.41, 0.088);
      pecRight.rotation.z = 0.07;
      pecRight.rotation.y = -0.12;
      this.registerMuscleMesh(pecRight, 'chest');

      // Clavicles (Collar bones structural highlight)
      const clavicleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.36, 12);
      clavicleGeo.rotateZ(Math.PI / 2);
      const clavicles = new THREE.Mesh(clavicleGeo, this.jointMaterial);
      clavicles.position.set(0, 1.505, 0.065);
      this.addBodyBaseMesh(clavicles);

      // 4. SHOULDERS (DELTOIDS - Anterior, Lateral & Posterior)
      // Left Shoulder (Deltoid Cap)
      const deltGeoLeft = new THREE.SphereGeometry(0.095, 20, 18);
      deltGeoLeft.scale(0.85, 1.35, 1.05);
      const deltLeft = new THREE.Mesh(deltGeoLeft, this.skinMaterial);
      deltLeft.position.set(-0.245, 1.44, 0.005);
      deltLeft.rotation.z = -0.15;
      this.registerMuscleMesh(deltLeft, 'shoulders');

      // Right Shoulder (Deltoid Cap)
      const deltGeoRight = new THREE.SphereGeometry(0.095, 20, 18);
      deltGeoRight.scale(0.85, 1.35, 1.05);
      const deltRight = new THREE.Mesh(deltGeoRight, this.skinMaterial);
      deltRight.position.set(0.245, 1.44, 0.005);
      deltRight.rotation.z = 0.15;
      this.registerMuscleMesh(deltRight, 'shoulders');

      // 5. SIX-PACK ABDOMINALS (RECTUS ABDOMINIS)
      // Sculpted in 3 anatomical tiers with Linea Alba and Tendinous Inscriptions
      const absTierPositions = [
        { y: 1.285, w: 0.065, h: 0.062, d: 0.05 }, // Upper Abs
        { y: 1.205, w: 0.062, h: 0.065, d: 0.05 }, // Mid Abs (Umbilical)
        { y: 1.120, w: 0.058, h: 0.070, d: 0.048 } // Lower Abs (Suprapubic)
      ];

      absTierPositions.forEach(tier => {
        // Left Abdominal Pad
        const padGeoL = new THREE.BoxGeometry(tier.w, tier.h, tier.d);
        const padL = new THREE.Mesh(padGeoL, this.skinMaterial);
        padL.position.set(-0.042, tier.y, 0.082);
        this.registerMuscleMesh(padL, 'abs');

        // Right Abdominal Pad
        const padGeoR = new THREE.BoxGeometry(tier.w, tier.h, tier.d);
        const padR = new THREE.Mesh(padGeoR, this.skinMaterial);
        padR.position.set(0.042, tier.y, 0.082);
        this.registerMuscleMesh(padR, 'abs');
      });

      // 6. EXTERNAL OBLIQUES (Flanks & V-Line Adonis Belt)
      // Left Oblique
      const obliqueGeoL = new THREE.BoxGeometry(0.065, 0.22, 0.085);
      const obliqueL = new THREE.Mesh(obliqueGeoL, this.skinMaterial);
      obliqueL.position.set(-0.125, 1.18, 0.045);
      obliqueL.rotation.z = -0.10;
      this.registerMuscleMesh(obliqueL, 'obliques');

      // Right Oblique
      const obliqueGeoR = new THREE.BoxGeometry(0.065, 0.22, 0.085);
      const obliqueR = new THREE.Mesh(obliqueGeoR, this.skinMaterial);
      obliqueR.position.set(0.125, 1.18, 0.045);
      obliqueR.rotation.z = 0.10;
      this.registerMuscleMesh(obliqueR, 'obliques');

      // 7. LATISSIMUS DORSI (LATS / V-TAPER BACK WINGS)
      // Left Latissimus Wing
      const latGeoL = new THREE.BoxGeometry(0.09, 0.24, 0.095);
      latGeoL.scale(1.0, 1.0, 0.85);
      const latL = new THREE.Mesh(latGeoL, this.skinMaterial);
      latL.position.set(-0.165, 1.32, -0.055);
      latL.rotation.z = -0.18;
      latL.rotation.y = 0.25;
      this.registerMuscleMesh(latL, 'lats');

      // Right Latissimus Wing
      const latGeoR = new THREE.BoxGeometry(0.09, 0.24, 0.095);
      latGeoR.scale(1.0, 1.0, 0.85);
      const latR = new THREE.Mesh(latGeoR, this.skinMaterial);
      latR.position.set(0.165, 1.32, -0.055);
      latR.rotation.z = 0.18;
      latR.rotation.y = -0.25;
      this.registerMuscleMesh(latR, 'lats');

      // 8. LOWER BACK (ERECTOR SPINAE & LUMBAR COLUMNS)
      const lbackGeoL = new THREE.CylinderGeometry(0.038, 0.042, 0.20, 14);
      const lbackL = new THREE.Mesh(lbackGeoL, this.skinMaterial);
      lbackL.position.set(-0.048, 1.17, -0.082);
      this.registerMuscleMesh(lbackL, 'lowerback');

      const lbackGeoR = new THREE.CylinderGeometry(0.038, 0.042, 0.20, 14);
      const lbackR = new THREE.Mesh(lbackGeoR, this.skinMaterial);
      lbackR.position.set(0.048, 1.17, -0.082);
      this.registerMuscleMesh(lbackR, 'lowerback');

      // Internal Torso Anatomical Core (Connects all muscles naturally)
      const coreGeo = new THREE.CylinderGeometry(0.155, 0.130, 0.46, 20);
      const core = new THREE.Mesh(coreGeo, this.skinMaterial);
      core.position.set(0, 1.28, 0.005);
      this.addBodyBaseMesh(core);

      // Pelvis / Waist Base
      const pelvisGeo = new THREE.CylinderGeometry(0.138, 0.145, 0.16, 20);
      const pelvis = new THREE.Mesh(pelvisGeo, this.skinMaterial);
      pelvis.position.set(0, 1.01, 0.01);
      this.addBodyBaseMesh(pelvis);

      // 9. BICEPS (ANTERIOR ARMS)
      // Left Bicep (Sculpted peak & bicep belly)
      const bicepGeoL = new THREE.SphereGeometry(0.058, 18, 16);
      bicepGeoL.scale(0.88, 1.75, 0.95);
      const bicepL = new THREE.Mesh(bicepGeoL, this.skinMaterial);
      bicepL.position.set(-0.255, 1.28, 0.025);
      bicepL.rotation.z = -0.12;
      this.registerMuscleMesh(bicepL, 'biceps');

      // Right Bicep
      const bicepGeoR = new THREE.SphereGeometry(0.058, 18, 16);
      bicepGeoR.scale(0.88, 1.75, 0.95);
      const bicepR = new THREE.Mesh(bicepGeoR, this.skinMaterial);
      bicepR.position.set(0.255, 1.28, 0.025);
      bicepR.rotation.z = 0.12;
      this.registerMuscleMesh(bicepR, 'biceps');

      // 10. TRICEPS (POSTERIOR ARMS - HORSESHOE FORM)
      // Left Tricep
      const tricepGeoL = new THREE.SphereGeometry(0.062, 18, 16);
      tricepGeoL.scale(0.92, 1.85, 1.05);
      const tricepL = new THREE.Mesh(tricepGeoL, this.skinMaterial);
      tricepL.position.set(-0.258, 1.28, -0.032);
      tricepL.rotation.z = -0.12;
      this.registerMuscleMesh(tricepL, 'triceps');

      // Right Tricep
      const tricepGeoR = new THREE.SphereGeometry(0.062, 18, 16);
      tricepGeoR.scale(0.92, 1.85, 1.05);
      const tricepR = new THREE.Mesh(tricepGeoR, this.skinMaterial);
      tricepR.position.set(0.258, 1.28, -0.032);
      tricepR.rotation.z = 0.12;
      this.registerMuscleMesh(tricepR, 'triceps');

      // Elbows (Olecranon joint landmarks)
      const elbowGeo = new THREE.SphereGeometry(0.042, 14, 12);
      const elbowL = new THREE.Mesh(elbowGeo, this.jointMaterial);
      elbowL.position.set(-0.275, 1.155, -0.025);
      this.addBodyBaseMesh(elbowL);

      const elbowR = new THREE.Mesh(elbowGeo, this.jointMaterial);
      elbowR.position.set(0.275, 1.155, -0.025);
      this.addBodyBaseMesh(elbowR);

      // 11. FOREARMS (BRACHIORADIALIS & FLEXOR/EXTENSOR GROUPS)
      // Left Forearm
      const forearmGeoL = new THREE.CylinderGeometry(0.034, 0.052, 0.22, 16);
      const forearmL = new THREE.Mesh(forearmGeoL, this.skinMaterial);
      forearmL.position.set(-0.285, 1.025, 0.015);
      forearmL.rotation.z = -0.14;
      this.registerMuscleMesh(forearmL, 'forearms');

      // Right Forearm
      const forearmGeoR = new THREE.CylinderGeometry(0.034, 0.052, 0.22, 16);
      const forearmR = new THREE.Mesh(forearmGeoR, this.skinMaterial);
      forearmR.position.set(0.285, 1.025, 0.015);
      forearmR.rotation.z = 0.14;
      this.registerMuscleMesh(forearmR, 'forearms');

      // Wrists & Hands
      const handGeo = new THREE.BoxGeometry(0.045, 0.11, 0.032);
      const handL = new THREE.Mesh(handGeo, this.jointMaterial);
      handL.position.set(-0.315, 0.865, 0.02);
      this.addBodyBaseMesh(handL);

      const handR = new THREE.Mesh(handGeo, this.jointMaterial);
      handR.position.set(0.315, 0.865, 0.02);
      this.addBodyBaseMesh(handR);

      // 12. GLUTES (GLUTEAL COMPLEX - GLUTEUS MAXIMUS & MEDIUS)
      // Left Glute Cheek
      const gluteGeoL = new THREE.SphereGeometry(0.118, 22, 18);
      gluteGeoL.scale(0.95, 1.15, 1.05);
      const gluteL = new THREE.Mesh(gluteGeoL, this.skinMaterial);
      gluteL.position.set(-0.088, 0.94, -0.082);
      this.registerMuscleMesh(gluteL, 'glutes');

      // Right Glute Cheek
      const gluteGeoR = new THREE.SphereGeometry(0.118, 22, 18);
      gluteGeoR.scale(0.95, 1.15, 1.05);
      const gluteR = new THREE.Mesh(gluteGeoR, this.skinMaterial);
      gluteR.position.set(0.088, 0.94, -0.082);
      this.registerMuscleMesh(gluteR, 'glutes');

      // 13. QUADRICEPS (FRONT THIGHS - VASTUS LATERALIS, MEDIALIS & RECTUS FEMORIS)
      // Left Quad Group
      const quadGeoL = new THREE.CylinderGeometry(0.078, 0.108, 0.38, 20);
      const quadL = new THREE.Mesh(quadGeoL, this.skinMaterial);
      quadL.position.set(-0.112, 0.725, 0.032);
      quadL.rotation.z = 0.06;
      this.registerMuscleMesh(quadL, 'quads');

      // Left Vastus Medialis (Teardrop just above knee)
      const teardropGeoL = new THREE.SphereGeometry(0.052, 16, 14);
      teardropGeoL.scale(0.9, 1.35, 0.85);
      const teardropL = new THREE.Mesh(teardropGeoL, this.skinMaterial);
      teardropL.position.set(-0.085, 0.575, 0.055);
      this.registerMuscleMesh(teardropL, 'quads');

      // Right Quad Group
      const quadGeoR = new THREE.CylinderGeometry(0.078, 0.108, 0.38, 20);
      const quadR = new THREE.Mesh(quadGeoR, this.skinMaterial);
      quadR.position.set(0.112, 0.725, 0.032);
      quadR.rotation.z = -0.06;
      this.registerMuscleMesh(quadR, 'quads');

      // Right Vastus Medialis
      const teardropGeoR = new THREE.SphereGeometry(0.052, 16, 14);
      teardropGeoR.scale(0.9, 1.35, 0.85);
      const teardropR = new THREE.Mesh(teardropGeoR, this.skinMaterial);
      teardropR.position.set(0.085, 0.575, 0.055);
      this.registerMuscleMesh(teardropR, 'quads');

      // 14. HAMSTRINGS (POSTERIOR THIGHS)
      // Left Hamstring
      const hamGeoL = new THREE.CylinderGeometry(0.068, 0.092, 0.34, 18);
      const hamL = new THREE.Mesh(hamGeoL, this.skinMaterial);
      hamL.position.set(-0.112, 0.725, -0.048);
      hamL.rotation.z = 0.06;
      this.registerMuscleMesh(hamL, 'hamstrings');

      // Right Hamstring
      const hamGeoR = new THREE.CylinderGeometry(0.068, 0.092, 0.34, 18);
      const hamR = new THREE.Mesh(hamGeoR, this.skinMaterial);
      hamR.position.set(0.112, 0.725, -0.048);
      hamR.rotation.z = -0.06;
      this.registerMuscleMesh(hamR, 'hamstrings');

      // Knees (Patella & Tendon Anatomy)
      const kneeGeo = new THREE.SphereGeometry(0.052, 16, 14);
      const kneeL = new THREE.Mesh(kneeGeo, this.jointMaterial);
      kneeL.position.set(-0.102, 0.510, 0.038);
      this.addBodyBaseMesh(kneeL);

      const kneeR = new THREE.Mesh(kneeGeo, this.jointMaterial);
      kneeR.position.set(0.102, 0.510, 0.038);
      this.addBodyBaseMesh(kneeR);

      // 15. CALVES & TIBIALIS (LOWER LEGS - GASTROCNEMIUS & SOLEUS)
      // Left Calf (Dual-bellied diamond sweep)
      const calfGeoL = new THREE.SphereGeometry(0.075, 18, 16);
      calfGeoL.scale(0.90, 1.75, 1.15);
      const calfL = new THREE.Mesh(calfGeoL, this.skinMaterial);
      calfL.position.set(-0.105, 0.355, -0.022);
      this.registerMuscleMesh(calfL, 'calves');

      // Left Shin (Tibialis Anterior ridge)
      const shinGeoL = new THREE.CylinderGeometry(0.036, 0.044, 0.35, 14);
      const shinL = new THREE.Mesh(shinGeoL, this.skinMaterial);
      shinL.position.set(-0.102, 0.285, 0.015);
      this.registerMuscleMesh(shinL, 'calves');

      // Right Calf
      const calfGeoR = new THREE.SphereGeometry(0.075, 18, 16);
      calfGeoR.scale(0.90, 1.75, 1.15);
      const calfR = new THREE.Mesh(calfGeoR, this.skinMaterial);
      calfR.position.set(0.105, 0.355, -0.022);
      this.registerMuscleMesh(calfR, 'calves');

      // Right Shin
      const shinGeoR = new THREE.CylinderGeometry(0.036, 0.044, 0.35, 14);
      const shinR = new THREE.Mesh(shinGeoR, this.skinMaterial);
      shinR.position.set(0.102, 0.285, 0.015);
      this.registerMuscleMesh(shinR, 'calves');

      // Ankles & Athletic Feet
      const ankleGeo = new THREE.BoxGeometry(0.062, 0.082, 0.17);
      const footL = new THREE.Mesh(ankleGeo, this.jointMaterial);
      footL.position.set(-0.102, 0.045, 0.045);
      this.addBodyBaseMesh(footL);

      const footR = new THREE.Mesh(ankleGeo, this.jointMaterial);
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

      const card = document.getElementById('avatar-3d-hud-card');
      if (!card) return;

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <h4 class="text-xs font-bold text-white uppercase tracking-wider font-heading">${data.label}</h4>
            </div>
            <p class="text-[10px] text-cyan-300 font-serif italic">${data.latinName}</p>
          </div>
          <button type="button" onclick="window.avatar3D.clearSelection()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </div>
        <div class="space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800/80 pt-1.5">
          <div>
            <span class="font-bold text-slate-400 text-[10px] uppercase tracking-wide block">Primary Function:</span>
            <p class="leading-tight text-slate-200">${data.function}</p>
          </div>
          <div>
            <span class="font-bold text-slate-400 text-[10px] uppercase tracking-wide block">Anatomical Location:</span>
            <p class="leading-tight text-slate-300">${data.location}</p>
          </div>
        </div>
      `;
      card.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    hideAnatomicalCard() {
      const card = document.getElementById('avatar-3d-hud-card');
      if (card) card.classList.add('hidden');
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
  window.avatar3D = new RealisticAnatomyAvatar3D();

  // Helper function for external SVG / UI sync
  window.set3DAvatarTooltip = function (text) {
    const tooltip = document.getElementById('svg-muscle-tooltip');
    if (tooltip) tooltip.textContent = text;
  };
})();
