import { useEffect, useRef } from "react";
import * as THREE from "three";

import "./App.css";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current?.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    // Add this inside the useEffect hook after initializing the camera
    window.addEventListener("resize", handleResize);

    // Add this function inside the useEffect hook
    const renderScene = () => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
      requestAnimationFrame(renderScene);
    };
    // Call the renderScene function to start the animation loop
    renderScene();

    // Add this inside the useEffect hook
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <main className="container">
      <h1>Full Stack Generation - Desafio técnico</h1>
      <div ref={containerRef}></div>
    </main>
  );
}

export default App;
