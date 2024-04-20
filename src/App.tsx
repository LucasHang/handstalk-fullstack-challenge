import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import "./App.css";

function getDimensions(): [width: number, height: number] {
  return [window.innerWidth * 0.6, window.innerHeight * 0.6];
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [w, h] = getDimensions();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);

    containerRef.current?.appendChild(renderer.domElement);

    const loader = new GLTFLoader();

    loader.load(
      "../src/assets/RobotExpressive.glb",
      (gltf) => {
        gltf.scene.position.set(0, -2, 0);
        scene.add(gltf.scene);
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );

    const handleResize = () => {
      const [width, height] = getDimensions();

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    // Add this inside the useEffect hook after initializing the camera
    window.addEventListener("resize", handleResize);

    // Add this function inside the useEffect hook
    const renderScene = () => {
      renderer.render(scene, camera);

      requestAnimationFrame(renderScene);
    };
    // Call the renderScene function to start the animation loop
    renderScene();

    // Add this inside the useEffect hook
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.remove();
    };
  }, []);

  return (
    <main className="container">
      <h2>Full Stack Generation - Desafio técnico</h2>
      <div ref={containerRef}></div>
    </main>
  );
}

export default App;
