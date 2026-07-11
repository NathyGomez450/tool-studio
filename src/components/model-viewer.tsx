import * as React from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Loader2 } from 'lucide-react';

/** Visualizador 3D interativo (girar/zoom) para arquivos .obj. */
export function ModelViewer({ url }: { url: string }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !url) return;

    let disposed = false;
    let frame = 0;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1115);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-4, -2, -3);
    scene.add(fill);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    function fitToObject(object: THREE.Object3D) {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center); // centraliza na origem
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const dist = maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360));
      camera.position.set(0, 0, dist * 1.8);
      camera.near = dist / 100;
      camera.far = dist * 100;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
    }

    const loader = new OBJLoader();
    loader.load(
      url,
      (obj) => {
        if (disposed) return;
        // material padrão caso o .obj não traga um
        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: 0x9aa4b2, metalness: 0.1, roughness: 0.8 });
          }
        });
        scene.add(obj);
        fitToObject(obj);
        setLoading(false);
      },
      undefined,
      () => {
        if (disposed) return;
        setError('Não foi possível carregar o modelo .obj.');
        setLoading(false);
      },
    );

    function animate() {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    };
  }, [url]);

  return (
    <div className="relative w-full h-[360px] rounded-md overflow-hidden bg-[#0f1115]">
      <div ref={containerRef} className="w-full h-full" />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-tertiary">
          <Loader2 size={16} className="animate-spin" /> Carregando modelo…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[var(--red-400)] px-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
