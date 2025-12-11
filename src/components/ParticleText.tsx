'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

interface ParticleTextProps {
  text?: string;
  particleCount?: number;
  particleSize?: number;
  textSize?: number;
  interactionArea?: number;
}

const ParticleText: React.FC<ParticleTextProps> = ({
  text = 'LEARNAID\nINTELLIGENT LEARNING',
  particleCount = 1500,
  particleSize = 1.2,
  textSize = 12,
  interactionArea = 180,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -200, y: 200 });
  const buttonRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let animationFrameId: number;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let particles: THREE.Points;
    let geometryCopy: THREE.BufferGeometry;
    let raycaster: THREE.Raycaster;
    let planeArea: THREE.Mesh;
    let currentEase = 0.08;

    const colorChange = new THREE.Color();
    const mouse = new THREE.Vector2(-200, 200);

    // Vertex Shader
    const vertexShader = `
      attribute float size;
      attribute vec3 customColor;
      varying vec3 vColor;

      void main() {
        vColor = customColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    // Fragment Shader
    const fragmentShader = `
      uniform vec3 color;
      uniform sampler2D pointTexture;
      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(color * vColor, 1.0);
        gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
      }
    `;

    // Create particle texture
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(canvas);
    };

    const visibleHeightAtZDepth = (depth: number, camera: THREE.PerspectiveCamera) => {
      const cameraOffset = camera.position.z;
      if (depth < cameraOffset) depth -= cameraOffset;
      else depth += cameraOffset;
      const vFOV = (camera.fov * Math.PI) / 180;
      return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
    };

    const visibleWidthAtZDepth = (depth: number, camera: THREE.PerspectiveCamera) => {
      const height = visibleHeightAtZDepth(depth, camera);
      return height * camera.aspect;
    };

    const distance = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    };

    // Initialize Three.js scene
    const init = async () => {
      scene = new THREE.Scene();

      // Camera
      camera = new THREE.PerspectiveCamera(
        65,
        containerRef.current!.clientWidth / containerRef.current!.clientHeight,
        1,
        10000
      );
      camera.position.set(0, 0, 100);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      containerRef.current!.appendChild(renderer.domElement);

      // Raycaster
      raycaster = new THREE.Raycaster();

      // Plane for mouse interaction
      const geometry = new THREE.PlaneGeometry(
        visibleWidthAtZDepth(100, camera),
        visibleHeightAtZDepth(100, camera)
      );
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true });
      planeArea = new THREE.Mesh(geometry, material);
      planeArea.visible = false;
      scene.add(planeArea);

      // Load font and create particles
      const loader = new FontLoader();
      
      // Using helvetiker font JSON (built-in with three.js examples)
      const fontData = await fetch('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json').then(res => res.json());
      const font = loader.parse(fontData);

      createTextParticles(font);

      // Event listeners
      const handleMouseDown = (event: MouseEvent) => {
        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        buttonRef.current = true;
        currentEase = 0.02;
      };

      const handleMouseUp = () => {
        buttonRef.current = false;
        currentEase = 0.08;
      };

      const handleMouseMove = (event: MouseEvent) => {
        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      };

      const handleResize = () => {
        camera.aspect = containerRef.current!.clientWidth / containerRef.current!.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
      };

      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('resize', handleResize);

      // Animation loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        renderParticles();
        renderer.render(scene, camera);
      };
      animate();

      // Cleanup
      return () => {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        containerRef.current?.removeChild(renderer.domElement);
      };
    };

    const createTextParticles = (font: any) => {
      const thePoints: THREE.Vector3[] = [];
      const colors: number[] = [];
      const sizes: number[] = [];

      // Replace \n with actual newline for proper text rendering
      const processedText = text.replace(/\\n/g, '\n');
      const shapes = font.generateShapes(processedText, textSize);
      const geometry = new THREE.ShapeGeometry(shapes);
      geometry.computeBoundingBox();

      const xMid = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
      const yMid = (geometry.boundingBox!.max.y - geometry.boundingBox!.min.y) / 2.5;

      geometry.center();

      const holeShapes: any[] = [];
      for (let q = 0; q < shapes.length; q++) {
        const shape = shapes[q];
        if (shape.holes && shape.holes.length > 0) {
          for (let j = 0; j < shape.holes.length; j++) {
            holeShapes.push(shape.holes[j]);
          }
        }
      }
      shapes.push(...holeShapes);

      for (let x = 0; x < shapes.length; x++) {
        const shape = shapes[x];
        const amountPoints = Math.floor(shape.type === 'Path' ? particleCount / 2.5 : particleCount / 1.8);
        const points = shape.getSpacedPoints(amountPoints);

        points.forEach((element: any) => {
          const a = new THREE.Vector3(element.x, element.y, 0);
          thePoints.push(a);
          colorChange.setHSL(0.6, 1, 1);
          colors.push(colorChange.r, colorChange.g, colorChange.b);
          sizes.push(1);
        });
      }

      const geoParticles = new THREE.BufferGeometry().setFromPoints(thePoints);
      geoParticles.translate(xMid, yMid, 0);
      geoParticles.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
      geoParticles.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

      const particleTexture = createParticleTexture();

      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          pointTexture: { value: particleTexture },
        },
        vertexShader,
        fragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
      });

      particles = new THREE.Points(geoParticles, material);
      scene.add(particles);

      geometryCopy = new THREE.BufferGeometry();
      geometryCopy.copy(particles.geometry);
    };

    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const renderParticles = () => {
      const currentTime = performance.now();
      
      // Throttle to target FPS
      if (currentTime - lastFrameTime < frameInterval) {
        return;
      }
      lastFrameTime = currentTime;

      const time = ((0.001 * currentTime) % 12) / 12;
      const zigzagTime = (1 + Math.sin(time * 2 * Math.PI)) / 6;

      mouse.x = mouseRef.current.x;
      mouse.y = mouseRef.current.y;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planeArea);

      if (intersects.length > 0) {
        const pos = particles.geometry.attributes.position;
        const copy = geometryCopy.attributes.position;
        const colors = particles.geometry.attributes.customColor;
        const size = particles.geometry.attributes.size;

        const mx = intersects[0].point.x;
        const my = intersects[0].point.y;
        const mz = intersects[0].point.z;

        // Update all particles for smooth animation
        for (let i = 0, l = pos.count; i < l; i++) {
          const initX = copy.getX(i);
          const initY = copy.getY(i);
          const initZ = copy.getZ(i);

          let px = pos.getX(i);
          let py = pos.getY(i);
          let pz = pos.getZ(i);

          colorChange.setHSL(0.55, 0.9, 0.8);
          colors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);

          size.array[i] = particleSize;

          let dx = mx - px;
          let dy = my - py;
          const dz = mz - pz;

          const mouseDistance = distance(mx, my, px, py);
          const d = dx * dx + dy * dy;
          const f = -interactionArea / d;

          if (buttonRef.current) {
            const t = Math.atan2(dy, dx);
            px -= f * Math.cos(t) * 0.8;
            py -= f * Math.sin(t) * 0.8;

            colorChange.setHSL(0.5 + zigzagTime, 1.0, 0.6);
            colors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
            
            size.array[i] = particleSize * 1.4;
          } else {
            if (mouseDistance < interactionArea) {
              const t = Math.atan2(dy, dx);
              
              if (i % 3 === 0) {
                px -= 0.04 * Math.cos(t);
                py -= 0.04 * Math.sin(t);
                colorChange.setHSL(0.6, 1.0, 0.6);
                colors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
                size.array[i] = particleSize * 0.8;
              } else {
                px += f * Math.cos(t) * 0.5;
                py += f * Math.sin(t) * 0.5;
                size.array[i] = particleSize * 1.3;
              }
              
              // Enhanced glow effect on hover
              if (mouseDistance < interactionArea * 0.5) {
                colorChange.setHSL(0.5, 1.0, 0.7);
                colors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
              }
            }
          }

          px += (initX - px) * currentEase;
          py += (initY - py) * currentEase;
          pz += (initZ - pz) * currentEase;

          pos.setXYZ(i, px, py, pz);
        }
        
        pos.needsUpdate = true;
        colors.needsUpdate = true;
        size.needsUpdate = true;
      }
    };

    init();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer && containerRef.current) {
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [text, particleCount, particleSize, textSize, interactionArea]);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

export default ParticleText;
