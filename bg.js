import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function initBackground(containerId = 'canvas-container') {
    // --- Configuration ---
    const CONFIG = {
        bloomStrength: 1.5,
        bloomRadius: 0.4,
        bloomThreshold: 0,
        particleCount: 1500,
        particleSize: 0.05,
        primaryColor: 0xffffff, // White/Blueish
        secondaryColor: 0x4444ff  // Slight blue tint for depth
    };

    // --- Scene Setup ---
    const container = document.getElementById(containerId);
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002); // Fog for depth

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    container.appendChild(renderer.domElement);

    // --- Post Processing (Bloom) ---
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = CONFIG.bloomThreshold;
    bloomPass.strength = CONFIG.bloomStrength;
    bloomPass.radius = CONFIG.bloomRadius;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // --- Objects ---

    // 1. Central Abstract Shape (Icosahedron with wireframe)
    const geometry = new THREE.IcosahedronGeometry(1.5, 1);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const centeredObject = new THREE.Mesh(geometry, material);
    scene.add(centeredObject);

    // Inner glowing core
    const coreGeo = new THREE.IcosahedronGeometry(1, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x8888ff, wireframe: true, transparent: true, opacity: 0.1 });
    const coreObject = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreObject);


    // 2. Particles (Starfield)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = CONFIG.particleCount;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        // Spread particles in a wide area
        posArray[i] = (Math.random() - 0.5) * 20;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: CONFIG.particleSize,
        color: CONFIG.primaryColor,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.001;
        mouseY = (event.clientY - windowHalfY) * 0.001;
    });

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // Rotate central object
        centeredObject.rotation.y += 0.005;
        centeredObject.rotation.x += 0.002;

        // Pulse effect
        const scale = 1 + Math.sin(elapsedTime * 2) * 0.1;
        centeredObject.scale.set(scale, scale, scale);

        coreObject.rotation.y -= 0.01;
        coreObject.rotation.x -= 0.005;

        // Rotate particles slowly
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        // Mouse interaction (smooth camera movement)
        targetX = mouseX * 2;
        targetY = mouseY * 2;

        camera.rotation.y += 0.05 * (targetX - camera.rotation.y);
        camera.rotation.x += 0.05 * (targetY - camera.rotation.x);

        // Use composer for bloom effect
        composer.render();
    }

    animate();

    // --- Resize Handler ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
}
