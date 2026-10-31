import * as THREE from '../node_modules/three/build/three.module.js';

const cameraTarget = new THREE.Vector3(0, 10, 0);

function createTelescopicStage(parent, name, height, bottomRadius, topRadius, color) {
  const stage = new THREE.Group();
  stage.name = name;
  parent.add(stage);

  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.16,
    roughness: 0.4,
    side: THREE.DoubleSide
  });
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius, bottomRadius, height, 32, 1, true),
    material
  );
  shell.position.y = height / 2;
  shell.castShadow = true;
  shell.receiveShadow = true;
  stage.add(shell);

  const innerShell = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius * 0.94, bottomRadius * 0.94, height * 0.98, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: '#91aebe', metalness: 0.2, roughness: 0.5, side: THREE.BackSide })
  );
  innerShell.position.y = height / 2;
  stage.add(innerShell);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(topRadius * 0.99, 0.035, 8, 32),
    new THREE.MeshStandardMaterial({ color: '#8bbdd8', metalness: 0.3, roughness: 0.35 })
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = height;
  lip.castShadow = true;
  stage.add(lip);

  return stage;
}

function createBladeGeometry() {
  const stations = [
    [0.35, 0.52, 28],
    [0.75, 0.82, 24],
    [1.8, 0.74, 17],
    [3.2, 0.56, 10],
    [4.6, 0.34, 4],
    [5.8, 0.14, 1],
    [6.15, 0.025, 0]
  ];
  const profileSteps = 20;
  const profile = [];
  for (let step = 0; step <= profileSteps; step += 1) {
    profile.push({ chordPosition: 0.5 * (1 - Math.cos((Math.PI * step) / profileSteps)), side: 1 });
  }
  for (let step = profileSteps - 1; step > 0; step -= 1) {
    profile.push({ chordPosition: 0.5 * (1 - Math.cos((Math.PI * step) / profileSteps)), side: -1 });
  }

  const positions = [];
  const indices = [];
  stations.forEach(([span, chord, twistDegrees], stationIndex) => {
    const twist = THREE.MathUtils.degToRad(twistDegrees);
    profile.forEach(({ chordPosition, side }) => {
      const x = chord * (0.25 - chordPosition) + 0.06 * (span / 6.15) ** 2;
      const normalized = chordPosition;
      const thickness = 5 * 0.15 * chord * (
        0.2969 * Math.sqrt(normalized)
        - 0.126 * normalized
        - 0.3516 * normalized ** 2
        + 0.2843 * normalized ** 3
        - 0.1015 * normalized ** 4
      ) * side;
      positions.push(
        x * Math.cos(twist) + thickness * Math.sin(twist),
        span,
        -x * Math.sin(twist) + thickness * Math.cos(twist)
      );
    });

    if (stationIndex > 0) {
      const previousStart = (stationIndex - 1) * profile.length;
      const currentStart = stationIndex * profile.length;
      for (let point = 0; point < profile.length; point += 1) {
        const next = (point + 1) % profile.length;
        const a = previousStart + point;
        const b = previousStart + next;
        const c = currentStart + next;
        const d = currentStart + point;
        indices.push(a, b, d, b, c, d);
      }
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTurbineModel(parent) {
  const turbine = new THREE.Group();
  parent.add(turbine);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.72, 0.35, 32),
    new THREE.MeshStandardMaterial({ color: '#bdced8', metalness: 0.35, roughness: 0.48 })
  );
  base.position.y = 0.18;
  base.castShadow = true;
  base.receiveShadow = true;
  turbine.add(base);

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.58, 6.6, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: '#d3e2eb', metalness: 0.04, roughness: 0.5, side: THREE.DoubleSide })
  );
  tower.position.y = 3.35;
  tower.castShadow = true;
  tower.receiveShadow = true;
  turbine.add(tower);

  const towerStripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.49, 0.5, 0.08, 32),
    new THREE.MeshStandardMaterial({ color: '#4b9bc5', metalness: 0.18, roughness: 0.4 })
  );
  towerStripe.position.y = 0.8;
  turbine.add(towerStripe);

  const layer1 = createTelescopicStage(turbine, 'Teleskopik ana katman', 3.2, 0.36, 0.285, '#e1edf4');
  layer1.position.y = 4.95;
  const layer2 = createTelescopicStage(layer1, 'Teleskopik orta katman', 2.75, 0.255, 0.19, '#cbdde8');
  layer2.position.y = 1.35;
  const layer3 = createTelescopicStage(layer2, 'Teleskopik üst katman', 2.4, 0.165, 0.12, '#b2ccda');
  layer3.position.y = 1.1;

  const yawAssembly = new THREE.Group();
  yawAssembly.position.y = 2.4;
  layer3.add(yawAssembly);

  const nacelle = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.82, 2.35),
    new THREE.MeshStandardMaterial({ color: '#dce8ef', metalness: 0.18, roughness: 0.42 })
  );
  nacelle.position.set(0, 0.1, -0.42);
  nacelle.castShadow = true;
  nacelle.receiveShadow = true;
  yawAssembly.add(nacelle);

  const nacelleRoof = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.12, 1.82),
    new THREE.MeshStandardMaterial({ color: '#dcecf6', metalness: 0.2, roughness: 0.4 })
  );
  nacelleRoof.position.set(0, 0.56, -0.48);
  nacelleRoof.castShadow = true;
  yawAssembly.add(nacelleRoof);

  const rotor = new THREE.Group();
  rotor.position.set(0, 0.1, 0.86);
  yawAssembly.add(rotor);

  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 32, 24),
    new THREE.MeshStandardMaterial({ color: '#d8eaf5', metalness: 0.52, roughness: 0.28 })
  );
  hub.scale.set(1, 1, 1.2);
  hub.castShadow = true;
  rotor.add(hub);

  const hubCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.36, 0.32, 32),
    new THREE.MeshStandardMaterial({ color: '#8ac8eb', metalness: 0.42, roughness: 0.25 })
  );
  hubCap.rotation.x = Math.PI / 2;
  hubCap.position.z = 0.51;
  hubCap.castShadow = true;
  rotor.add(hubCap);

  const bladeGeometry = createBladeGeometry();
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: '#cad9e2',
    metalness: 0.04,
    roughness: 0.48,
    side: THREE.DoubleSide
  });
  const bladePitches = [];
  const bladeMounts = [];
  for (let index = 0; index < 3; index += 1) {
    const bladeMount = new THREE.Group();
    bladeMount.rotation.z = (index * Math.PI * 2) / 3;
    bladeMounts.push(bladeMount);
    const pitchPivot = new THREE.Group();
    bladeMount.add(pitchPivot);
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.castShadow = true;
    blade.receiveShadow = true;
    pitchPivot.add(blade);
    bladePitches.push(pitchPivot);
    rotor.add(bladeMount);
  }

  return {
    turbine,
    setState({ yawDegrees, pitchAngle = 0, rotorRpm = 12, telescopeLevels = { 1: 1, 2: 1, 3: 1 }, bladeGatherFactor = 0 }) {
      yawAssembly.rotation.y = THREE.MathUtils.degToRad(yawDegrees);
      bladePitches.forEach((blade) => {
        blade.rotation.y = THREE.MathUtils.degToRad(pitchAngle);
      });
      bladeMounts.forEach((mount, index) => {
        mount.rotation.z = (index * Math.PI * 2 / 3) * (1 - bladeGatherFactor);
      });
      layer1.position.y = 4.95 + 1.2 * telescopeLevels[1];
      layer2.position.y = 1.35 + 1.05 * telescopeLevels[2];
      layer3.position.y = 1.1 + 0.95 * telescopeLevels[3];
      return rotorRpm;
    },
    rotor
  };
}

export function createTurbineScene(canvas, initialYawDegrees) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eaf6ff');
  scene.fog =   new THREE.Fog('#eaf6ff', 38, 78);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
  const defaultCamera = {
    theta: THREE.MathUtils.degToRad(initialYawDegrees) + 0.24,
    phi: 1.24,
    radius: 34
  };
  let theta = defaultCamera.theta;
  let phi = defaultCamera.phi;
  let radius = defaultCamera.radius;

  const ambient = new THREE.HemisphereLight('#ffffff', '#9eb6c5', 1.8);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight('#ffffff', 2.6);
  keyLight.position.set(-12, 24, 16);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -18;
  keyLight.shadow.camera.right = 18;
  keyLight.shadow.camera.top = 24;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.00015;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight('#c1e4ff', 0.9);
  fillLight.position.set(15, 10, -12);
  scene.add(fillLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: '#d7e8dc', roughness: 0.96 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  const turbineModel = createTurbineModel(scene);
  let rpm = 12;

  const cameraPosition = () => {
    const sinPhi = Math.sin(phi);
    camera.position.set(
      cameraTarget.x + radius * sinPhi * Math.sin(theta),
      cameraTarget.y + radius * Math.cos(phi),
      cameraTarget.z + radius * sinPhi * Math.cos(theta)
    );
    camera.lookAt(cameraTarget);
  };
  cameraPosition();

  const updateSize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(updateSize);
  resizeObserver.observe(canvas);
  updateSize();

  let pointerDown = false;
  let previousPointer = { x: 0, y: 0 };
  canvas.addEventListener('pointerdown', (event) => {
    pointerDown = true;
    previousPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-orbiting');
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!pointerDown) return;
    const deltaX = event.clientX - previousPointer.x;
    const deltaY = event.clientY - previousPointer.y;
    previousPointer = { x: event.clientX, y: event.clientY };
    theta -= deltaX * 0.006;
    phi = THREE.MathUtils.clamp(phi + deltaY * 0.005, 0.2, Math.PI - 0.2);
    cameraPosition();
  });
  const releasePointer = () => {
    pointerDown = false;
    canvas.classList.remove('is-orbiting');
  };
  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    radius = THREE.MathUtils.clamp(radius * (1 + event.deltaY * 0.001), 19, 58);
    cameraPosition();
  }, { passive: false });

  let lastFrameTime = 0;
  const renderFrame = (time) => {
    const deltaSeconds = lastFrameTime ? Math.min((time - lastFrameTime) / 1000, 0.05) : 0;
    lastFrameTime = time;
    turbineModel.rotor.rotation.z += (rpm * Math.PI * 2 * deltaSeconds) / 60;
    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  };
  requestAnimationFrame(renderFrame);

  return {
    setState({ yawDegrees, pitchAngle, rotorRpm, telescopeLevels }) {
      rpm = turbineModel.setState({ yawDegrees, pitchAngle, rotorRpm, telescopeLevels });
    },
    resetCamera() {
      theta = defaultCamera.theta;
      phi = defaultCamera.phi;
      radius = defaultCamera.radius;
      cameraPosition();
    }
  };
}

export function createTurbineFarmScene(canvas, turbineStates) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eaf6ff');
  scene.fog = new THREE.Fog('#eaf6ff', 38, 100);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 180);
  const target = new THREE.Vector3(0, 9.5, 0);
  const defaultCamera = { theta: 0.22, phi: 1.25, radius: 54 };
  let theta = defaultCamera.theta;
  let phi = defaultCamera.phi;
  let radius = defaultCamera.radius;

  scene.add(new THREE.HemisphereLight('#ffffff', '#9eb6c5', 1.8));
  const keyLight = new THREE.DirectionalLight('#ffffff', 2.6);
  keyLight.position.set(-12, 24, 16);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -30;
  keyLight.shadow.camera.right = 30;
  keyLight.shadow.camera.top = 24;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.00015;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight('#c1e4ff', 0.9);
  fillLight.position.set(15, 10, -12);
  scene.add(fillLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: '#d7e8dc', roughness: 0.96 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  const positions = [-11, 0, 11];
  const models = positions.map((posX, index) => {
    const initialTurbine = turbineStates[index] || turbineStates[0];
    const model = createTurbineModel(scene);
    model.turbine.position.x = posX;
    model.turbine.userData.turbineId = initialTurbine.id;
    model.turbine.traverse((object) => {
      object.userData.turbineId = initialTurbine.id;
    });

    const selectionRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.045, 8, 48),
      new THREE.MeshBasicMaterial({ color: '#3298e8', transparent: true, opacity: 0.9 })
    );
    selectionRing.rotation.x = Math.PI / 2;
    selectionRing.position.y = 0.08;
    selectionRing.visible = false;
    model.turbine.add(selectionRing);
    return { ...model, turbineState: initialTurbine, selectionRing, rpm: initialTurbine.rotorSpeed || 12 };
  });
  let simulationRunning = false;
  let simulationSpeed = 1;

  const updateCamera = () => {
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(target);
  };
  const updateSize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(updateSize);
  resizeObserver.observe(canvas);
  updateSize();

  let pointerDown = false;
  let pointerMoved = false;
  let previousPointer = { x: 0, y: 0 };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  canvas.addEventListener('pointerdown', (event) => {
    pointerDown = true;
    pointerMoved = false;
    previousPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-orbiting');
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!pointerDown) return;
    const deltaX = event.clientX - previousPointer.x;
    const deltaY = event.clientY - previousPointer.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) pointerMoved = true;
    previousPointer = { x: event.clientX, y: event.clientY };
    theta -= deltaX * 0.006;
    phi = THREE.MathUtils.clamp(phi + deltaY * 0.005, 0.2, Math.PI - 0.2);
    updateCamera();
  });
  canvas.addEventListener('pointerup', (event) => {
    if (pointerDown && !pointerMoved) {
      const bounds = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const selected = raycaster.intersectObjects(models.map(({ turbine }) => turbine), true)
        .find(({ object }) => object.userData.turbineId);
      if (selected) {
        const selectedId = selected.object.userData.turbineId;
        canvas.dispatchEvent(new CustomEvent('turbine-select', { detail: { turbineId: selectedId } }));
      }
    }
    pointerDown = false;
    canvas.classList.remove('is-orbiting');
  });
  canvas.addEventListener('pointercancel', () => {
    pointerDown = false;
    canvas.classList.remove('is-orbiting');
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    radius = THREE.MathUtils.clamp(radius * (1 + event.deltaY * 0.001), 30, 78);
    updateCamera();
  }, { passive: false });

  let lastFrameTime = 0;
  const renderFrame = (time) => {
    const deltaSeconds = lastFrameTime ? Math.min((time - lastFrameTime) / 1000, 0.05) : 0;
    lastFrameTime = time;
    models.forEach(({ rotor, turbineState, selectionRing, rpm }) => {
      if (simulationRunning) {
        rotor.rotation.z += (rpm * Math.PI * 2 * deltaSeconds * simulationSpeed) / 60;
      }
      selectionRing.visible = turbineState.id === selectedTurbineId;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  };
  let selectedTurbineId = turbineStates[0]?.id;
  updateCamera();
  requestAnimationFrame(renderFrame);

  return {
    setState(turbines, selectedId, isRunning = simulationRunning, speedMultiplier = simulationSpeed) {
      selectedTurbineId = selectedId;
      simulationRunning = isRunning;
      simulationSpeed = speedMultiplier;
      const selIdx = Math.max(0, turbines.findIndex((t) => t.id === selectedId));
      const maxStart = Math.max(0, turbines.length - models.length);
      const groupStart = Math.min(maxStart, Math.floor(selIdx / models.length) * models.length);

      models.forEach((model, slotIndex) => {
        const turbine = turbines[groupStart + slotIndex] || turbines[slotIndex] || turbines[0];
        if (!turbine) return;
        if (model.turbine.userData.turbineId !== turbine.id) {
          model.turbine.userData.turbineId = turbine.id;
          model.turbine.traverse((object) => {
            object.userData.turbineId = turbine.id;
          });
        }
        model.turbineState = turbine;
        model.rpm = turbine.rotorSpeed || 0;
        model.setState({
          yawDegrees: turbine.yaw,
          rotorRpm: model.rpm,
          bladeGatherFactor: turbine.bladeGatherFactor,
          telescopeLevels: {
            1: Math.min(turbine.telescopeStage ?? 3, 1),
            2: Math.min(Math.max((turbine.telescopeStage ?? 3) - 1, 0), 1),
            3: Math.min(Math.max((turbine.telescopeStage ?? 3) - 2, 0), 1)
          }
        });
      });
    },
    resetCamera() {
      theta = defaultCamera.theta;
      phi = defaultCamera.phi;
      radius = defaultCamera.radius;
      updateCamera();
    }
  };
}
