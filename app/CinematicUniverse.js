'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function mulberry32(seed) {
  return function rand() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height);
  ocean.addColorStop(0, '#174f83');
  ocean.addColorStop(0.45, '#0d355c');
  ocean.addColorStop(1, '#07192d');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rand = mulberry32(73291);
  for (let island = 0; island < 34; island += 1) {
    const cx = rand() * canvas.width;
    const cy = 100 + rand() * (canvas.height - 200);
    const rx = 30 + rand() * 180;
    const ry = 18 + rand() * 120;
    ctx.beginPath();
    for (let p = 0; p <= 48; p += 1) {
      const a = (p / 48) * Math.PI * 2;
      const wobble = 0.7 + rand() * 0.55;
      const x = cx + Math.cos(a) * rx * wobble;
      const y = cy + Math.sin(a) * ry * wobble;
      if (p === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const land = ctx.createRadialGradient(cx - rx * 0.2, cy - ry * 0.25, 4, cx, cy, Math.max(rx, ry));
    land.addColorStop(0, '#8a9a65');
    land.addColorStop(0.45, '#547242');
    land.addColorStop(1, '#253d2d');
    ctx.fillStyle = land;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const rand = mulberry32(1099);
  for (let i = 0; i < 360; i += 1) {
    const x = rand() * canvas.width;
    const y = rand() * canvas.height;
    const r = 8 + rand() * 50;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.05 + rand() * 0.2})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function CinematicUniverse() {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const targetDistanceRef = useRef(7.4);
  const draggingRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [entered, setEntered] = useState(false);
  const [distance, setDistance] = useState('ORBIT');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010205);

    const camera = new THREE.PerspectiveCamera(46, mount.clientWidth / mount.clientHeight, 0.1, 3000);
    camera.position.set(0, 0, 7.4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(9000 * 3);
    const rand = mulberry32(44);
    for (let i = 0; i < 9000; i += 1) {
      const radius = 90 + rand() * 1100;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xdde9ff, size: 0.42, sizeAttenuation: true }));
    scene.add(stars);

    const world = new THREE.Group();
    scene.add(world);

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 128, 128),
      new THREE.MeshStandardMaterial({ map: makeEarthTexture(), roughness: 0.82, metalness: 0.03 })
    );
    planet.rotation.z = -0.13;
    world.add(planet);

    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.725, 96, 96),
      new THREE.MeshPhongMaterial({ map: makeCloudTexture(), transparent: true, opacity: 0.55, depthWrite: false })
    );
    clouds.rotation.z = -0.13;
    world.add(clouds);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.79, 96, 96),
      new THREE.MeshBasicMaterial({ color: 0x5ab7ff, transparent: true, opacity: 0.1, side: THREE.BackSide, blending: THREE.AdditiveBlending })
    );
    world.add(atmosphere);

    const sun = new THREE.DirectionalLight(0xffffff, 5.6);
    sun.position.set(-5, 2.8, 6);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x7fb4ff, 0x020307, 0.52));

    const rim = new THREE.PointLight(0x4a8cff, 22, 30);
    rim.position.set(5, -2, -2);
    scene.add(rim);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const onWheel = (event) => {
      event.preventDefault();
      targetDistanceRef.current = THREE.MathUtils.clamp(targetDistanceRef.current + event.deltaY * 0.004, 2.15, 14);
    };
    const onPointerDown = (event) => {
      draggingRef.current = true;
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    const onPointerMove = (event) => {
      if (!draggingRef.current) return;
      const dx = event.clientX - pointerRef.current.x;
      const dy = event.clientY - pointerRef.current.y;
      world.rotation.y += dx * 0.004;
      world.rotation.x = THREE.MathUtils.clamp(world.rotation.x + dy * 0.002, -0.55, 0.55);
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = () => { draggingRef.current = false; };

    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      planet.rotation.y += dt * 0.035;
      clouds.rotation.y += dt * 0.047;
      stars.rotation.y += dt * 0.0007;
      camera.position.z += (targetDistanceRef.current - camera.position.z) * Math.min(1, dt * 2.2);
      const z = camera.position.z;
      if (z < 3) setDistance('APPROACH');
      else if (z < 5) setDistance('NEAR ORBIT');
      else setDistance('ORBIT');
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      starGeometry.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const enterWorld = () => {
    setEntered(true);
    targetDistanceRef.current = 2.35;
  };

  const returnOrbit = () => {
    setEntered(false);
    targetDistanceRef.current = 7.4;
  };

  return (
    <main className="cinematicRoot">
      <div ref={mountRef} className="universeCanvas" aria-label="Live Earth 3D universe observer" />
      <div className="cinematicVignette" />
      <header className="cinematicHeader">
        <div className="brandLockup">
          <span className="brandMark" />
          <div><strong>LIVE EARTH</strong><small>UNIVERSE 001</small></div>
        </div>
        <div className="observerState"><span /> OBSERVING LIVE</div>
      </header>

      <section className={`cinematicIntro ${entered ? 'entered' : ''}`}>
        <p className="cinematicKicker">A WORLD WITHOUT A SCRIPT</p>
        <h1>It keeps living<br />when you leave.</h1>
        <p className="cinematicCopy">Observe. Do not control. Every life, place and civilization is meant to continue beyond the camera.</p>
        <div className="cinematicActions">
          <button onClick={enterWorld} className="enterButton">ENTER WORLD</button>
          <button onClick={() => { targetDistanceRef.current = 4.6; setEntered(true); }} className="ghostButton">CLOSER ORBIT</button>
        </div>
      </section>

      <div className="cinematicBottom">
        <div><small>CAMERA</small><strong>{distance}</strong></div>
        <div className="cinematicHint">Drag to orbit · Scroll to travel</div>
        {entered && <button className="returnButton" onClick={returnOrbit}>RETURN TO SPACE</button>}
      </div>

      {entered && (
        <div className="approachMessage">
          <span>WORLD 001</span>
          <strong>Approaching the living world</strong>
          <small>Surface life rendering is the next active layer.</small>
        </div>
      )}
    </main>
  );
}
