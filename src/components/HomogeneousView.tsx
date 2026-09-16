import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { evaluateHomogeneousCurve, projectHomogeneous, toHomogeneousControlPoints } from "../math/homogeneous";
import { validParameterRange } from "../math/basis";
import type { SplineDefinition } from "../math/types";
import { indexColor } from "../visual";
import { ContributionBar } from "./ContributionBar";

type Props = {
  definition: SplineDefinition;
  t: number;
  contributions: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

type SceneState = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  dynamic: THREE.Group;
};

function disposeObject(object: THREE.Object3D) {
  if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
    object.geometry?.dispose();
    const material = object.material;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else material?.dispose();
  }
}

export function HomogeneousView({ definition, t, contributions, selectedIndex, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(() => undefined);
  const sceneRef = useRef<SceneState | undefined>(undefined);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    camera.position.set(3.3, 3.2, 3.3);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, .8);
    controls.enableDamping = true;
    const dynamic = new THREE.Group();
    scene.add(dynamic);
    scene.add(new THREE.AxesHelper(1.4));
    const grid = new THREE.GridHelper(4, 10, 0x94a3b8, 0xdbe2ea);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = 1;
    scene.add(grid);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: .055, side: THREE.DoubleSide }));
    plane.position.z = 1;
    scene.add(plane);
    sceneRef.current = { scene, camera, renderer, controls, dynamic };
    resetRef.current = () => { camera.position.set(3.3, 3.2, 3.3); camera.up.set(0, 1, 0); controls.target.set(0, 0, .8); controls.update(); };

    const resize = () => {
      const width = host.clientWidth;
      const height = Math.max(360, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let frame = 0;
    const animate = () => { controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate); };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.traverse(disposeObject);
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    state.dynamic.traverse(disposeObject);
    state.dynamic.clear();
    const addLine = (points: THREE.Vector3[], color: number, opacity = 1, alwaysOnTop = false) => {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, depthTest: !alwaysOnTop }),
      );
      if (alwaysOnTop) line.renderOrder = 100;
      state.dynamic.add(line);
    };
    const homogeneous = toHomogeneousControlPoints(definition);
    addLine(homogeneous.map((point) => new THREE.Vector3(point.x, point.y, point.z)), 0x64748b, .75);
    homogeneous.forEach((point, i) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(indexColor(i)) }));
      mesh.position.set(point.x, point.y, point.z);
      state.dynamic.add(mesh);
    });
    const [lower, upper] = validParameterRange(definition.knots, definition.controlPoints.length, definition.degree);
    const hCurve = Array.from({ length: 181 }, (_, i) => {
      const point = evaluateHomogeneousCurve(definition, lower + (upper - lower) * i / 180);
      return new THREE.Vector3(point.x, point.y, point.z);
    });
    addLine(hCurve, 0x111827);
    addLine(hCurve.map((point) => new THREE.Vector3(point.x / point.z, point.y / point.z, 1)), 0xdc2626);
    const current = evaluateHomogeneousCurve(definition, t);
    const projected = projectHomogeneous(current);
    addLine([new THREE.Vector3(0, 0, 0), new THREE.Vector3(projected.x * 1.18, projected.y * 1.18, 1.18)], 0x7c3aed, 1, true);
    const markerGeometry = new THREE.SphereGeometry(.065, 18, 14);
    const hMarker = new THREE.Mesh(markerGeometry, new THREE.MeshBasicMaterial({ color: 0x111827, depthTest: false }));
    hMarker.renderOrder = 101;
    hMarker.position.set(current.x, current.y, current.z);
    state.dynamic.add(hMarker);
    const pMarker = new THREE.Mesh(markerGeometry.clone(), new THREE.MeshBasicMaterial({ color: 0xdc2626, depthTest: false }));
    pMarker.renderOrder = 101;
    pMarker.position.set(projected.x, projected.y, 1);
    state.dynamic.add(pMarker);
  }, [definition, t]);

  return <section className="main-canvas homogeneous-canvas">
    <div className="canvas-heading"><div><span className="eyebrow">PROJECTIVE GEOMETRY</span><h2>Homogeneous coordinates</h2></div><button className="secondary" onClick={() => resetRef.current()}>Reset camera</button></div>
    <div ref={hostRef} className="three-host" aria-label="Interactive homogeneous-coordinate 3D view" />
    <div className="legend"><span><i className="legend-h" /> Homogeneous B-spline</span><span><i className="legend-p" /> Projected NURBS on z = 1</span><span><i className="legend-r" /> Projection ray</span></div>
    <ContributionBar contributions={contributions} kind="R" selectedIndex={selectedIndex} onSelect={onSelect} />
  </section>;
}
