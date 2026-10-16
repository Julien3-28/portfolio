(function () {
  // Progressive enhancement only: skip on reduced motion or when there isn't
  // enough side margin beyond the content column to fly in without ever
  // crossing text.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof THREE === 'undefined') return;

  var CONTENT_WIDTH = 1168; // .wrap max-width (1120) + horizontal padding (24*2)
  var MIN_GUTTER = 170;

  function gutterWidth() {
    return Math.floor((window.innerWidth - CONTENT_WIDTH) / 2);
  }

  if (gutterWidth() < MIN_GUTTER) return; // not enough desktop real estate: skip entirely

  function buildBody(bodyMat, edgeMat) {
    function addEdges(mesh) {
      var edges = new THREE.EdgesGeometry(mesh.geometry, 24);
      mesh.add(new THREE.LineSegments(edges, edgeMat));
    }

    var plane = new THREE.Group();

    var fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 3.2, 10), bodyMat);
    fuselage.rotation.z = Math.PI / 2;
    addEdges(fuselage);
    plane.add(fuselage);

    var nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 10), bodyMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 1.9;
    addEdges(nose);
    plane.add(nose);

    var tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 10), bodyMat);
    tailCone.rotation.z = Math.PI / 2;
    tailCone.position.x = -1.85;
    addEdges(tailCone);
    plane.add(tailCone);

    var wing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 3.4), bodyMat);
    wing.position.set(-0.05, -0.08, 0);
    wing.rotation.y = 0.32;
    addEdges(wing);
    plane.add(wing);

    var stab = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 1.3), bodyMat);
    stab.position.set(-1.7, 0.02, 0);
    stab.rotation.y = 0.22;
    addEdges(stab);
    plane.add(stab);

    var fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.05), bodyMat);
    fin.position.set(-1.65, 0.42, 0);
    addEdges(fin);
    plane.add(fin);

    [-1.1, 1.1].forEach(function (side) {
      var engine = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.55, 8), bodyMat);
      engine.rotation.z = Math.PI / 2;
      engine.position.set(0.05, -0.3, side);
      addEdges(engine);
      plane.add(engine);
    });

    return plane;
  }

  // side: 'left' | 'right'. phase: offsets the idle motion so both instances
  // don't move in lockstep. yaw: base heading, mirrored per side so the two
  // aircraft read as facing opposite ways.
  function createFlyingPlane(side, phase) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style[side] = '0';
    canvas.style.height = '100vh';
    canvas.style.width = gutterWidth() + 'px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2';
    document.body.appendChild(canvas);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8dc, 1.15));
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.05 });
    var edgeMat = new THREE.LineBasicMaterial({ color: 0x1d1d1f, transparent: true, opacity: 0.55 });

    var plane = buildBody(bodyMat, edgeMat);
    var yaw = side === 'left' ? -0.85 : 0.85; // mirrored heading per side
    plane.rotation.y = yaw;
    plane.rotation.x = -0.06;
    scene.add(plane);

    var box = new THREE.Box3().setFromObject(plane);
    var size = box.getSize(new THREE.Vector3());
    var boundingSpan = Math.max(size.x, size.y) * 1.9; // safety margin

    function fitCamera() {
      var w = gutterWidth();
      var h = window.innerHeight;
      var aspect = w / h;
      camera.aspect = aspect;
      var vFov = (camera.fov * Math.PI) / 180;
      var distance = boundingSpan / (2 * Math.tan(vFov / 2) * Math.max(aspect, 0.001));
      camera.position.z = Math.min(Math.max(distance, 8), 70);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, true);
      canvas.style.width = w + 'px';
    }
    fitCamera();

    var targetProgress = 0;
    var progress = 0;

    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      targetProgress = max > 0 ? window.scrollY / max : 0;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var resizeTimer;
    function onResize() {
      var w = gutterWidth();
      if (w < MIN_GUTTER) {
        canvas.style.display = 'none';
      } else {
        canvas.style.display = 'block';
        fitCamera();
      }
    }
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(onResize, 120);
    });

    var clock = new THREE.Clock();

    function tick() {
      progress += (targetProgress - progress) * 0.07;
      var t = clock.getElapsedTime() + phase;

      var vFov = (camera.fov * Math.PI) / 180;
      var visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
      var travel = visibleHeight * 0.72;
      plane.position.y = travel / 2 - progress * travel + Math.sin(t * 0.5) * 0.12;
      plane.position.x = Math.sin(t * 0.35) * 0.18;

      plane.rotation.z = -0.12 + Math.sin(progress * Math.PI * 2) * 0.1 + Math.sin(t * 0.4) * 0.03;
      plane.rotation.x = -0.06 + Math.sin(t * 0.6) * 0.03;

      renderer.render(scene, camera);
    }

    return tick;
  }

  var tickRight = createFlyingPlane('right', 0);

  function animate() {
    requestAnimationFrame(animate);
    tickRight();
  }
  animate();
})();
