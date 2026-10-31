/**
 * Ultra-Realistic 3D Human Male Muscular Anatomy Model
 * Developed with Three.js (r128) & GLTFLoader
 *
 * Features:
 * - Real 3D Anatomical Human Male Model (177 segmented muscular meshes from Z-Anatomy / BodyParts3D)
 * - Dual-Viewport 3D Rendering: FRONT VIEW & BACK VIEW rendered side-by-side in real-time WebGL
 * - Dual-Camera interactive Raycasting (Left viewport raycasts Anterior, Right viewport raycasts Posterior)
 * - Physically Based Materials (MeshPhysicalMaterial) with authentic muscle tone, tendon fascia, and hydration sheen
 * - 3-Point Studio Lighting rig with anterior/posterior key lights, cool fill, and cyan rim definition
 * - 360° Synchronized Turntable Orbit drag, pinch-to-zoom, and view preset animations
 * - Floating Anatomical HUD Card displaying Scientific Latin Name, Biomechanical Function, and Location
 * - Two-Way Synchronized filtering across all 3 Exercise Databases (Plan 64, Free-Exercise-DB 876, ExerciseDB 1,324)
 */

(function () {
  'use strict';

  // Complete Anatomical Muscle Dictionary with Medical & Biomechanical Data
  const ANATOMY_DATA = {
    chest: {
      key: 'chest',
      label: 'Chest (Pectorals)',
      latinName: 'M. Pectoralis Major & Minor',
      function: 'Horizontal adduction, internal rotation, and forward flexion of the humerus (pushing movements, bench press, dips, cable flyes).',
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
      latinName: 'M. Deltoideus (Anterior, Lateral & Posterior Heads)',
      function: 'Arm abduction (lateral head), anterior flexion (front head), horizontal abduction/extension (rear head), and shoulder joint stabilization.',
      location: 'Caps the glenohumeral joint, originating from the clavicle and scapular spine, inserting into the deltoid tuberosity of the humerus.'
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
      this.modelRoot = null;
      this.isLoaded = false;

      // Dual-View Cameras
      this.cameraFront = null;
      this.cameraBack = null;
      this.viewMode = 'dual'; // 'dual' | 'single'

      // Interaction State
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.isDragging = false;
      this.previousPointerPos = { x: 0, y: 0 };
      this.autoRotate = false;
      this.autoRotateSpeed = 0.006;
      this.animationFrameId = null;

      // Camera Distance / Zoom
      this.defaultDistance = 8.6;
      this.currentDistance = 8.6;
      this.targetDistance = 8.6;
      this.minDistance = 4.2;
      this.maxDistance = 14.0;

      // Rotation angles (applied to modelRoot)
      this.modelRotationY = 0;
      this.modelRotationX = 0;
      this.targetRotationY = 0;
      this.targetRotationX = 0;
      this.isAnimatingView = false;

      // Meshes Registry
      this.muscleMeshes = {};       // muscleKey -> Array of Mesh
      this.allMeshes = [];          // Array of all Mesh objects for raycasting
      this.meshMap = {};            // meshName -> muscleKey
      this.selectedMuscleKey = null;
      this.hoveredMuscleKey = null;

      // Materials
      this.muscleMaterial = null;
      this.tendonMaterial = null;
      this.highlightMaterial = null;
      this.hoverMaterial = null;
      this.originalMaterials = new Map();
    }

    init(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`[Avatar3D] Container element #${containerId} not found.`);
        return;
      }

      this.setupRenderer();
      this.setupScene();
      this.setupCameras();
      this.setupLighting();
      this.setupMaterials();
      this.setupInteractionListeners();
      this.loadModel();

      window.addEventListener('resize', () => this.onResize());
      this.animate();
    }

    setupRenderer() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const width = this.container.clientWidth || 768;
      const height = this.container.clientHeight || 480;
      this.renderer.setSize(width, height);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.domElement);
    }

    setupScene() {
      this.scene = new THREE.Scene();
      this.modelRoot = new THREE.Group();
      this.modelRoot.position.set(0, 0, 0);
      this.scene.add(this.modelRoot);
    }

    setupCameras() {
      const width = this.container.clientWidth || 768;
      const height = this.container.clientHeight || 480;
      const aspectHalf = (width / 2) / height;

      // Front Camera (Anterior view from +Z)
      this.cameraFront = new THREE.PerspectiveCamera(40, aspectHalf, 0.1, 50);
      this.cameraFront.position.set(0, 0, this.currentDistance);
      this.cameraFront.lookAt(0, 0, 0);

      // Back Camera (Posterior view from -Z)
      this.cameraBack = new THREE.PerspectiveCamera(40, aspectHalf, 0.1, 50);
      this.cameraBack.position.set(0, 0, -this.currentDistance);
      this.cameraBack.lookAt(0, 0, 0);
    }

    setupLighting() {
      // 1. Anterior Key Light (Front Warm)
      const keyLightFront = new THREE.DirectionalLight('#fff8f0', 1.35);
      keyLightFront.position.set(2.5, 4.0, 5.5);
      keyLightFront.castShadow = true;
      this.scene.add(keyLightFront);

      // 2. Posterior Key Light (Back Warm)
      const keyLightBack = new THREE.DirectionalLight('#fff8f0', 1.35);
      keyLightBack.position.set(-2.5, 4.0, -5.5);
      keyLightBack.castShadow = true;
      this.scene.add(keyLightBack);

      // 3. Cool Lateral Fill Light (Left flank)
      const fillLightLeft = new THREE.DirectionalLight('#93c5fd', 0.65);
      fillLightLeft.position.set(-4.0, 1.5, 3.0);
      this.scene.add(fillLightLeft);

      // 4. Cool Lateral Fill Light (Right flank)
      const fillLightRight = new THREE.DirectionalLight('#93c5fd', 0.65);
      fillLightRight.position.set(4.0, 1.5, -3.0);
      this.scene.add(fillLightRight);

      // 5. Overhead Anatomical Rim Light (Azure)
      const topLight = new THREE.DirectionalLight('#38bdf8', 1.1);
      topLight.position.set(0, 6.5, 0);
      this.scene.add(topLight);

      // 6. Ambient Shadow Fill
      const ambientLight = new THREE.AmbientLight('#1e293b', 0.85);
      this.scene.add(ambientLight);

      // 7. Ground Contact Shadow
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const sCtx = shadowCanvas.getContext('2d');
      const grad = sCtx.createRadialGradient(128, 128, 15, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.4, 'rgba(5, 10, 25, 0.45)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);

      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadowGeo = new THREE.PlaneGeometry(3.6, 2.4);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false
      });
      const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -3.32; // Just below the feet
      this.scene.add(shadowPlane);
    }

    setupMaterials() {
      // Authentic anatomical muscular red-bronze tissue with clearcoat hydration
      this.muscleMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#9e3636'),
        roughness: 0.46,
        metalness: 0.02,
        clearcoat: 0.26,
        clearcoatRoughness: 0.35,
        reflectivity: 0.55,
        side: THREE.DoubleSide
      });

      // Fascia / Tendon / Aponeurosis pearl-gold tissue
      this.tendonMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#d9ceba'),
        roughness: 0.40,
        metalness: 0.04,
        clearcoat: 0.35,
        clearcoatRoughness: 0.30,
        side: THREE.DoubleSide
      });

      // Luminous Electric Cyan Active Selection Material
      this.highlightMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#06b6d4'),
        emissive: new THREE.Color('#00f0ff'),
        emissiveIntensity: 0.85,
        roughness: 0.15,
        metalness: 0.08,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15,
        side: THREE.DoubleSide
      });

      // Subtle Cyan Phosphor Hover Material
      this.hoverMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#38bdf8'),
        emissive: new THREE.Color('#0284c7'),
        emissiveIntensity: 0.50,
        roughness: 0.25,
        metalness: 0.05,
        clearcoat: 0.60,
        side: THREE.DoubleSide
      });
    }

    classifyMuscle(nodeName) {
      const n = (nodeName || '').toLowerCase();
      if (n.includes('pectoralis') || n.includes('subclavius')) return 'chest';
      if (n.includes('rectus-abdominis') || n.includes('linea-alba') || n.includes('pyramidalis')) return 'abs';
      if (n.includes('oblique') || n.includes('transversus-abdominis') || n.includes('serratus-anterior')) return 'obliques';
      if (n.includes('deltoid') || n.includes('supraspinatus') || n.includes('infraspinatus') || n.includes('teres-minor') || n.includes('teres-major') || n.includes('subscapularis')) return 'shoulders';
      if (n.includes('biceps-brachii') || n.includes('brachialis') || n.includes('coracobrachialis')) return 'biceps';
      if (n.includes('triceps-brachii') || n.includes('anconeus')) return 'triceps';
      if (n.includes('brachioradialis') || n.includes('pronator') || n.includes('flexor-carpi') || n.includes('palmaris') || n.includes('flexor-digitorum') || n.includes('flexor-pollicis') || n.includes('supinator') || n.includes('extensor-carpi') || n.includes('extensor-digitorum') || n.includes('extensor-digiti') || n.includes('abductor-pollicis') || n.includes('extensor-pollicis') || n.includes('extensor-indicis') || n.includes('lumbricals-hand') || n.includes('interossei-hand') || n.includes('opponens-pollicis') || n.includes('palmar-interossei') || n.includes('hand')) return 'forearms';
      if (n.includes('trapezius') || n.includes('levator-scapulae') || n.includes('rhomboid') || n.includes('splenius') || n.includes('sternocleidomastoid') || n.includes('platysma') || n.includes('scalenus')) return 'traps';
      if (n.includes('latissimus-dorsi')) return 'lats';
      if (n.includes('iliocostalis') || n.includes('longissimus') || n.includes('spinalis') || n.includes('semispinalis') || n.includes('multifidus') || n.includes('rotatores') || n.includes('interspinales') || n.includes('intertransversarii') || n.includes('quadratus-lumborum') || n.includes('serratus-posterior') || n.includes('levatores-costarum')) return 'lowerback';
      if (n.includes('gluteus') || n.includes('tensor-fasciae-latae') || n.includes('piriformis') || n.includes('gemellus') || n.includes('obturator') || n.includes('quadratus-femoris') || n.includes('iliacus') || n.includes('psoas')) return 'glutes';
      if (n.includes('rectus-femoris') || n.includes('vastus-lateralis') || n.includes('vastus-medialis') || n.includes('vastus-intermedius') || n.includes('sartorius') || n.includes('pectineus') || n.includes('adductor') || n.includes('gracilis')) return 'quads';
      if (n.includes('biceps-femoris') || n.includes('semitendinosus') || n.includes('semimembranosus')) return 'hamstrings';
      if (n.includes('gastrocnemius') || n.includes('soleus') || n.includes('plantaris') || n.includes('calcaneal-tendon') || n.includes('tibialis') || n.includes('fibularis') || n.includes('extensor-hallucis') || n.includes('extensor-digitorum-longus') || n.includes('flexor-hallucis') || n.includes('popliteus') || n.includes('abductor-hallucis') || n.includes('quadratus-plantae') || n.includes('plantar-interossei') || n.includes('foot')) return 'calves';
      return 'head_base';
    }

    loadModel() {
      const loadingEl = document.getElementById('avatar-3d-loading');
      if (loadingEl) loadingEl.style.display = 'flex';

      if (!THREE.GLTFLoader) {
        console.error('[Avatar3D] THREE.GLTFLoader not found. Please ensure GLTFLoader.js is loaded.');
        if (loadingEl) loadingEl.innerHTML = '<span class="text-xs text-red-400">Error: 3D Loader not found</span>';
        return;
      }

      const loader = new THREE.GLTFLoader();
      const modelUrl = 'models/muscles.glb';

      loader.load(
        modelUrl,
        (gltf) => {
          const root = gltf.scene;
          this.processLoadedModel(root);
          if (loadingEl) {
            loadingEl.style.opacity = '0';
            setTimeout(() => { loadingEl.style.display = 'none'; }, 300);
          }
          this.isLoaded = true;
          console.log('[Avatar3D] Authentic 3D human anatomy model loaded successfully with 177 meshes.');
        },
        (xhr) => {
          if (xhr.lengthComputable && loadingEl) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            const textEl = document.getElementById('avatar-3d-loading-text');
            if (textEl) textEl.textContent = `Loading 3D Anatomy (${percent}%)...`;
          }
        },
        (error) => {
          console.error('[Avatar3D] Failed to load 3D anatomy model:', error);
          if (loadingEl) {
            loadingEl.innerHTML = '<span class="text-xs text-amber-400">Could not load 3D model. Please check network.</span>';
          }
        }
      );
    }

    processLoadedModel(model) {
      // Traverse all meshes in the authentic GLB model
      model.traverse((child) => {
        if (child.isMesh) {
          const nodeName = child.name || '';
          const muscleKey = this.classifyMuscle(nodeName);

          child.castShadow = true;
          child.receiveShadow = true;

          // Determine material: aponeurosis/tendons get tendonMaterial, muscle bodies get muscleMaterial
          const isTendon = nodeName.includes('aponeurosis') || nodeName.includes('tendon') || nodeName.includes('linea-alba');
          const baseMat = isTendon ? this.tendonMaterial.clone() : this.muscleMaterial.clone();
          child.material = baseMat;
          this.originalMaterials.set(child, baseMat);

          child.userData = {
            nodeName: nodeName,
            muscleKey: muscleKey,
            data: ANATOMY_DATA[muscleKey] || null
          };

          this.allMeshes.push(child);

          if (muscleKey && muscleKey !== 'head_base') {
            if (!this.muscleMeshes[muscleKey]) {
              this.muscleMeshes[muscleKey] = [];
            }
            this.muscleMeshes[muscleKey].push(child);
          }
        }
      });

      // Compute bounding box and center model at (0, 0, 0)
      const bbox = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      model.position.sub(center);

      this.modelRoot.add(model);
    }

    setupInteractionListeners() {
      const canvas = this.renderer.domElement;

      // Pointer Down (Drag start)
      canvas.addEventListener('pointerdown', (e) => {
        this.isDragging = true;
        this.previousPointerPos = { x: e.clientX, y: e.clientY };
        this.isAnimatingView = false;
        canvas.style.cursor = 'grabbing';
      });

      // Pointer Move (Hover raycasting & 360° orbit drag)
      window.addEventListener('pointermove', (e) => {
        const rect = canvas.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
          if (this.hoveredMuscleKey) {
            this.hoveredMuscleKey = null;
            this.refreshMeshMaterials();
            this.updateTooltip(null);
          }
          return;
        }

        if (this.isDragging) {
          const deltaX = e.clientX - this.previousPointerPos.x;
          const deltaY = e.clientY - this.previousPointerPos.y;
          this.previousPointerPos = { x: e.clientX, y: e.clientY };

          // Rotate the 3D model in sync for both Front and Back views
          this.modelRotationY += deltaX * 0.008;
          this.targetRotationY = this.modelRotationY;

          // Vertical tilt with clamped bounds
          this.modelRotationX = Math.max(-0.35, Math.min(0.35, this.modelRotationX + deltaY * 0.004));
          this.targetRotationX = this.modelRotationX;

          this.modelRoot.rotation.y = this.modelRotationY;
          this.modelRoot.rotation.x = this.modelRotationX;
        } else {
          this.handleHoverRaycast(e.clientX, e.clientY, rect);
        }
      });

      // Pointer Up (Drag end)
      window.addEventListener('pointerup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          canvas.style.cursor = 'default';
        }
      });

      // Click (Select muscle)
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        this.handleClickRaycast(e.clientX, e.clientY, rect);
      });

      // Scroll Zoom
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY * 0.004;
        this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance + zoomDelta));
      }, { passive: false });
    }

    handleHoverRaycast(clientX, clientY, rect) {
      if (!this.isLoaded || this.allMeshes.length === 0) return;

      const width = rect.width;
      const height = rect.height;
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;

      let activeCamera = this.cameraFront;
      let normX = 0;
      let normY = -(relY / height) * 2 + 1;

      if (this.viewMode === 'dual') {
        const halfWidth = width / 2;
        if (relX < halfWidth) {
          // Left Viewport: Front Camera
          normX = (relX / halfWidth) * 2 - 1;
          activeCamera = this.cameraFront;
        } else {
          // Right Viewport: Back Camera
          normX = ((relX - halfWidth) / halfWidth) * 2 - 1;
          activeCamera = this.cameraBack;
        }
      } else {
        normX = (relX / width) * 2 - 1;
        activeCamera = this.cameraFront;
      }

      this.mouse.set(normX, normY);
      this.raycaster.setFromCamera(this.mouse, activeCamera);

      const intersects = this.raycaster.intersectObjects(this.allMeshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const muscleKey = hit.userData.muscleKey;

        if (muscleKey && muscleKey !== 'head_base') {
          this.renderer.domElement.style.cursor = 'pointer';
          if (this.hoveredMuscleKey !== muscleKey) {
            this.hoveredMuscleKey = muscleKey;
            this.refreshMeshMaterials();
            this.updateTooltip(hit);
          }
          return;
        }
      }

      if (this.hoveredMuscleKey) {
        this.hoveredMuscleKey = null;
        this.renderer.domElement.style.cursor = 'default';
        this.refreshMeshMaterials();
        this.updateTooltip(null);
      }
    }

    handleClickRaycast(clientX, clientY, rect) {
      if (!this.isLoaded || this.allMeshes.length === 0) return;

      const width = rect.width;
      const height = rect.height;
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;

      let activeCamera = this.cameraFront;
      let normX = 0;
      let normY = -(relY / height) * 2 + 1;

      if (this.viewMode === 'dual') {
        const halfWidth = width / 2;
        if (relX < halfWidth) {
          normX = (relX / halfWidth) * 2 - 1;
          activeCamera = this.cameraFront;
        } else {
          normX = ((relX - halfWidth) / halfWidth) * 2 - 1;
          activeCamera = this.cameraBack;
        }
      } else {
        normX = (relX / width) * 2 - 1;
        activeCamera = this.cameraFront;
      }

      this.mouse.set(normX, normY);
      this.raycaster.setFromCamera(this.mouse, activeCamera);

      const intersects = this.raycaster.intersectObjects(this.allMeshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const muscleKey = hit.userData.muscleKey;

        if (muscleKey && muscleKey !== 'head_base') {
          if (this.selectedMuscleKey === muscleKey) {
            this.clearSelection(true);
          } else {
            this.selectMuscle(muscleKey, true, hit.userData.nodeName);
          }
        }
      }
    }

    updateTooltip(hitMesh) {
      const tooltip = document.getElementById('avatar-3d-tooltip');
      if (!tooltip) return;

      if (!hitMesh) {
        if (this.selectedMuscleKey && ANATOMY_DATA[this.selectedMuscleKey]) {
          tooltip.textContent = `Active: ${ANATOMY_DATA[this.selectedMuscleKey].label}`;
        } else {
          tooltip.textContent = 'Drag to rotate 360° • Click any muscle to inspect';
        }
        return;
      }

      const muscleKey = hitMesh.userData.muscleKey;
      const data = ANATOMY_DATA[muscleKey];
      const nodeName = (hitMesh.userData.nodeName || '').replace(/-/g, ' ');

      if (data) {
        tooltip.textContent = `${data.label} (${nodeName}) • Click to select`;
      }
    }

    selectMuscle(muscleKey, triggerExternalFilter = true, specificNodeName = '') {
      if (!ANATOMY_DATA[muscleKey]) return;

      this.selectedMuscleKey = muscleKey;
      this.refreshMeshMaterials();
      this.renderAnatomicalCard(muscleKey, specificNodeName);

      const tooltip = document.getElementById('avatar-3d-tooltip');
      if (tooltip) tooltip.textContent = `Active: ${ANATOMY_DATA[muscleKey].label}`;

      if (triggerExternalFilter && typeof window.selectMuscle === 'function') {
        window.selectMuscle(muscleKey);
      }
    }

    clearSelection(triggerExternalFilter = true) {
      this.selectedMuscleKey = null;
      this.refreshMeshMaterials();
      this.hideAnatomicalCard();

      const tooltip = document.getElementById('avatar-3d-tooltip');
      if (tooltip) tooltip.textContent = 'Drag to rotate 360° • Click any muscle to inspect';

      if (triggerExternalFilter && typeof window.clearMuscleFilter === 'function') {
        window.clearMuscleFilter();
      }
    }

    refreshMeshMaterials() {
      // Loop all registered muscle groups
      Object.keys(this.muscleMeshes).forEach((key) => {
        const meshes = this.muscleMeshes[key];
        const isSelected = (key === this.selectedMuscleKey);
        const isHovered = (key === this.hoveredMuscleKey);

        meshes.forEach((mesh) => {
          if (isSelected) {
            mesh.material = this.highlightMaterial;
          } else if (isHovered) {
            mesh.material = this.hoverMaterial;
          } else {
            mesh.material = this.originalMaterials.get(mesh) || this.muscleMaterial;
          }
        });
      });
    }

    renderAnatomicalCard(muscleKey, specificNodeName = '') {
      const data = ANATOMY_DATA[muscleKey];
      if (!data) return;

      const card = document.getElementById('avatar-3d-hud-card');
      if (!card) return;

      const subNameFormatted = specificNodeName ? specificNodeName.replace(/-/g, ' ') : '';

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <div>
              <h4 class="text-xs font-black text-white uppercase tracking-wider font-heading">${data.label}</h4>
              <p class="text-[10px] text-cyan-300 font-serif italic">${data.latinName}${subNameFormatted ? ' • <span class="capitalize text-slate-300 font-sans font-medium">' + subNameFormatted + '</span>' : ''}</p>
            </div>
          </div>
          <button type="button" onclick="window.clearMuscleFilter ? window.clearMuscleFilter() : window.avatar3D.clearSelection()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition" title="Clear selection">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </div>
        <div class="space-y-1.5 text-[11px] text-slate-300 border-t border-slate-800/80 pt-2">
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

      card.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    hideAnatomicalCard() {
      const card = document.getElementById('avatar-3d-hud-card');
      if (card) card.classList.add('hidden');
    }

    setView(viewName) {
      this.isAnimatingView = true;
      this.autoRotate = false;
      const btnRotate = document.getElementById('btn-3d-autorotate');
      if (btnRotate) btnRotate.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');

      switch (viewName) {
        case 'front':
          this.targetRotationY = 0;
          this.targetRotationX = 0;
          this.targetDistance = this.defaultDistance;
          break;
        case 'back':
          this.targetRotationY = Math.PI;
          this.targetRotationX = 0;
          this.targetDistance = this.defaultDistance;
          break;
        case 'left':
          this.targetRotationY = Math.PI / 2;
          this.targetRotationX = 0;
          break;
        case 'right':
          this.targetRotationY = -Math.PI / 2;
          this.targetRotationX = 0;
          break;
        case 'reset':
          this.targetRotationY = 0;
          this.targetRotationX = 0;
          this.targetDistance = this.defaultDistance;
          this.clearSelection(true);
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

    toggleViewMode() {
      this.viewMode = (this.viewMode === 'dual') ? 'single' : 'dual';
      const btn = document.getElementById('btn-3d-viewmode');
      const divider = document.getElementById('avatar-3d-center-divider');
      const labelBack = document.getElementById('avatar-label-back');

      if (btn) {
        btn.textContent = (this.viewMode === 'dual') ? 'Dual Front+Back' : 'Single 360° View';
      }
      if (divider) {
        divider.style.display = (this.viewMode === 'dual') ? 'block' : 'none';
      }
      if (labelBack) {
        labelBack.style.display = (this.viewMode === 'dual') ? 'flex' : 'none';
      }
      this.onResize();
    }

    onResize() {
      if (!this.container || !this.renderer) return;

      const width = this.container.clientWidth || 768;
      const height = this.container.clientHeight || 480;

      this.renderer.setSize(width, height);

      const aspect = (this.viewMode === 'dual') ? (width / 2) / height : width / height;

      if (this.cameraFront) {
        this.cameraFront.aspect = aspect;
        this.cameraFront.updateProjectionMatrix();
      }
      if (this.cameraBack) {
        this.cameraBack.aspect = aspect;
        this.cameraBack.updateProjectionMatrix();
      }
    }

    animate() {
      this.animationFrameId = requestAnimationFrame(() => this.animate());

      // Auto-rotation turntable
      if (this.autoRotate) {
        this.modelRotationY += this.autoRotateSpeed;
        this.targetRotationY = this.modelRotationY;
      }

      // Smooth camera zoom damping
      this.currentDistance += (this.targetDistance - this.currentDistance) * 0.1;
      if (this.cameraFront) {
        this.cameraFront.position.z = this.currentDistance;
      }
      if (this.cameraBack) {
        this.cameraBack.position.z = -this.currentDistance;
      }

      // Smooth model rotation easing
      if (this.isAnimatingView || !this.isDragging) {
        this.modelRotationY += (this.targetRotationY - this.modelRotationY) * 0.085;
        this.modelRotationX += (this.targetRotationX - this.modelRotationX) * 0.085;
      }

      if (this.modelRoot) {
        this.modelRoot.rotation.y = this.modelRotationY;
        this.modelRoot.rotation.x = this.modelRotationX;
      }

      this.render();
    }

    render() {
      if (!this.renderer || !this.scene) return;

      const width = this.container.clientWidth || 768;
      const height = this.container.clientHeight || 480;

      if (this.viewMode === 'dual') {
        const halfWidth = Math.floor(width / 2);

        this.renderer.setScissorTest(true);

        // 1. LEFT VIEWPORT: FRONT CAMERA (Anterior 0°)
        this.renderer.setViewport(0, 0, halfWidth, height);
        this.renderer.setScissor(0, 0, halfWidth, height);
        this.renderer.render(this.scene, this.cameraFront);

        // 2. RIGHT VIEWPORT: BACK CAMERA (Posterior 180°)
        this.renderer.setViewport(halfWidth, 0, halfWidth, height);
        this.renderer.setScissor(halfWidth, 0, halfWidth, height);
        this.renderer.render(this.scene, this.cameraBack);

        this.renderer.setScissorTest(false);
      } else {
        // SINGLE FULL CANVAS VIEW
        this.renderer.setViewport(0, 0, width, height);
        this.renderer.setScissor(0, 0, width, height);
        this.renderer.render(this.scene, this.cameraFront);
      }
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

  // Expose global instances
  window.RealisticAnatomyAvatar3D = RealisticAnatomyAvatar3D;
  window.ANATOMY_DATA = ANATOMY_DATA;
  window.avatar3D = new RealisticAnatomyAvatar3D();

})();
