import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeCoreViewProps {
  glowColor?: string;
  isListening?: boolean;
  isSpeaking?: boolean;
  handX?: number; // normalized -1 to 1 from hand tracking
  handY?: number; // normalized -1 to 1 from hand tracking
}

export const ThreeCoreView: React.FC<ThreeCoreViewProps> = ({
  glowColor = '#00f3ff',
  isListening = false,
  isSpeaking = false,
  handX = 0,
  handY = 0,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const wireMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const innerMatRef = useRef<THREE.MeshPhongMaterial | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 3.8;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const pointLight = new THREE.PointLight(new THREE.Color(glowColor), 3.0, 15);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    const ambientLight = new THREE.AmbientLight(0x0a192f, 1.2);
    scene.add(ambientLight);

    // Core Group
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);
    coreGroupRef.current = coreGroup;

    // Outer Wireframe Icosahedron
    const wireMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(glowColor),
      wireframe: true,
      emissive: new THREE.Color(glowColor),
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.8,
    });
    wireMatRef.current = wireMat;
    const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 3), wireMat);
    coreGroup.add(coreMesh);

    // Inner Glowing Core
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x0055ff,
      emissive: 0x002277,
      specular: 0xffffff,
      shininess: 90,
      transparent: true,
      opacity: 0.8,
    });
    innerMatRef.current = innerMat;
    const innerMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 2), innerMat);
    coreGroup.add(innerMesh);

    // Gimbal Torus Rings
    const ringMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(glowColor),
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x002255,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.02, 16, 120), ringMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.015, 16, 120), ringMat);
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.012, 16, 120), ringMat);
    coreGroup.add(ring1);
    coreGroup.add(ring2);
    coreGroup.add(ring3);

    // Particle Cloud / Constellation
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.0 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color(glowColor),
      size: 0.035,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particles);

    // Manual Drag Rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      coreGroup.rotation.y += deltaX * 0.005;
      coreGroup.rotation.x += deltaY * 0.005;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW && newH) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth idle rotation
      coreMesh.rotation.y = elapsed * 0.25;
      coreMesh.rotation.x = elapsed * 0.15;
      innerMesh.rotation.y = -elapsed * 0.5;
      innerMesh.rotation.z = elapsed * 0.3;

      ring1.rotation.x = elapsed * 0.35;
      ring1.rotation.y = elapsed * 0.25;
      ring2.rotation.z = elapsed * 0.45;
      ring3.rotation.y = -elapsed * 0.3;

      particles.rotation.y = elapsed * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update color dynamically
  useEffect(() => {
    const col = new THREE.Color(glowColor);
    if (pointLightRef.current) {
      pointLightRef.current.color = col;
    }
    if (wireMatRef.current) {
      wireMatRef.current.color = col;
      wireMatRef.current.emissive = col;
    }
  }, [glowColor]);

  // Hand tracking orientation influence
  useEffect(() => {
    if (coreGroupRef.current && (handX !== 0 || handY !== 0)) {
      coreGroupRef.current.rotation.y = THREE.MathUtils.lerp(coreGroupRef.current.rotation.y, handX * 1.8, 0.1);
      coreGroupRef.current.rotation.x = THREE.MathUtils.lerp(coreGroupRef.current.rotation.x, -handY * 1.8, 0.1);
    }
  }, [handX, handY]);

  // Speaking / Listening scale pulses
  useEffect(() => {
    if (!innerMatRef.current || !pointLightRef.current) return;
    if (isSpeaking) {
      pointLightRef.current.intensity = 4.5;
      innerMatRef.current.opacity = 0.95;
    } else if (isListening) {
      pointLightRef.current.intensity = 3.2;
      innerMatRef.current.opacity = 0.85;
    } else {
      pointLightRef.current.intensity = 2.4;
      innerMatRef.current.opacity = 0.7;
    }
  }, [isSpeaking, isListening]);

  return (
    <div
      ref={mountRef}
      id="three-hologram-viewport"
      className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
    />
  );
};
