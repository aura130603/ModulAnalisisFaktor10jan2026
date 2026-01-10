import * as d3 from "d3";
// import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import {
//   CSS2DRenderer,
//   CSS2DObject,
// } from "three/examples/jsm/renderers/CSS2DRenderer.js";
// import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
// import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import * as echarts from "echarts";
import "echarts-gl";

// Helper function for improved scaling
const createImprovedScaling = (
  data: any[],
  xKey: string = "x",
  yKey: string = "y",
  zKey: string = "z"
) => {
  // Fixed grid size for consistency (tidak tergantung data)
  const FIXED_GRID_SIZE = 20;
  const CHART_AREA = 16; // Area chart dalam grid (80% dari grid)

  // Extract unique values for categorical data
  const xValues = Array.from(new Set(data.map((d) => d[xKey])));
  const zValues = Array.from(new Set(data.map((d) => d[zKey])));

  // Check if X and Z are categorical (strings) or numeric
  const xIsCategorical = typeof xValues[0] === "string";
  const zIsCategorical = typeof zValues[0] === "string";

  // Y is always numeric
  const yExtent = d3.extent(data, (d) => d[yKey]) as [number, number];
  const yMax = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));

  let xScale, zScale;

  if (xIsCategorical) {
    // Categorical X scale
    xScale = d3
      .scaleBand()
      .domain(xValues)
      .range([-CHART_AREA / 2, CHART_AREA / 2])
      .padding(0.2);
  } else {
    // Numeric X scale
    const xExtent = d3.extent(data, (d) => d[xKey]) as [number, number];
    xScale = d3
      .scaleLinear()
      .domain(xExtent)
      .range([-CHART_AREA / 2, CHART_AREA / 2]);
  }

  if (zIsCategorical) {
    // Categorical Z scale
    zScale = d3
      .scaleBand()
      .domain(zValues)
      .range([-CHART_AREA / 2, CHART_AREA / 2])
      .padding(0.2);
  } else {
    // Numeric Z scale
    const zExtent = d3.extent(data, (d) => d[zKey]) as [number, number];
    zScale = d3
      .scaleLinear()
      .domain(zExtent)
      .range([-CHART_AREA / 2, CHART_AREA / 2]);
  }

  // Y scale - always from 0 to max height of 8 units
  const yScale = d3.scaleLinear().domain([0, yMax]).range([0, 8]);

  return {
    xScale,
    yScale,
    zScale,
    gridSize: FIXED_GRID_SIZE,
    chartArea: CHART_AREA,
    xIsCategorical,
    zIsCategorical,
    xValues,
    zValues,
  };
};

// export const create3DBarChart2 = (
//   data: { x: any; y: number; z: any }[], // x dan z bisa string atau number
//   width: number,
//   height: number
// ) => {
//   console.log("create 3d bar chart with data", data);

//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(25, 25, 25);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//   scene.background = null;

//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(15, 20, 15);
//   scene.add(pointLight);

//   // Use improved scaling
//   const {
//     xScale,
//     yScale,
//     zScale,
//     gridSize,
//     xIsCategorical,
//     zIsCategorical,
//     xValues,
//     zValues,
//   } = createImprovedScaling(data, "x", "y", "z");

//   // Fixed size grid helper
//   const gridHelper = new THREE.GridHelper(gridSize, 20);
//   scene.add(gridHelper);

//   const createAxisLine = (
//     start: THREE.Vector3,
//     end: THREE.Vector3,
//     color: number
//   ) => {
//     const material = new THREE.LineDashedMaterial({
//       color: color,
//       dashSize: 1,
//       gapSize: 0.5,
//     });

//     const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
//     const line = new THREE.Line(geometry, material);
//     line.computeLineDistances();

//     return line;
//   };

//   const axisLength = gridSize / 2;

//   // Garis Sumbu X (Merah)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(-axisLength, 0, 0),
//       new THREE.Vector3(axisLength, 0, 0),
//       0xff0000
//     )
//   );

//   // Garis Sumbu Y (Hijau)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, 0, 0),
//       new THREE.Vector3(0, 12, 0),
//       0x00ff00
//     )
//   );

//   // Garis Sumbu Z (Biru)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, 0, -axisLength),
//       new THREE.Vector3(0, 0, axisLength),
//       0x0000ff
//     )
//   );

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Fungsi untuk menambahkan teks label
//   const addLabel = (text: string, position: THREE.Vector3) => {
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const textGeometry = new TextGeometry(text, {
//           font: font,
//           size: 0.5,
//           depth: 0.05,
//         });
//         textGeometry.computeBoundingBox();
//         textGeometry.center();

//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);

//         textMesh.position.set(position.x, position.y, position.z);
//         scene.add(textMesh);
//       }
//     );
//   };

//   // Render bars
//   data.forEach((d) => {
//     const barHeight = yScale(d.y);
//     const barWidth = xIsCategorical ? (xScale as any).bandwidth() * 0.8 : 1.2;
//     const barDepth = zIsCategorical ? (zScale as any).bandwidth() * 0.8 : 1.2;

//     const geometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x007bff,
//       metalness: 0.3,
//       roughness: 0.7,
//     });
//     const bar = new THREE.Mesh(geometry, material);

//     const xPos = xIsCategorical
//       ? (xScale as any)(d.x) + (xScale as any).bandwidth() / 2
//       : xScale(d.x);
//     const zPos = zIsCategorical
//       ? (zScale as any)(d.z) + (zScale as any).bandwidth() / 2
//       : zScale(d.z);

//     bar.position.set(xPos, barHeight / 2, zPos);
//     scene.add(bar);

//     // Add value label above bar
//     addLabel(d.y.toString(), new THREE.Vector3(xPos, barHeight + 1, zPos));
//   });

//   // Add axis labels
//   addLabel("X", new THREE.Vector3(axisLength + 2, 0, 0));
//   addLabel("Y", new THREE.Vector3(0, 14, 0));
//   addLabel("Z", new THREE.Vector3(0, 0, axisLength + 2));

//   // Add axis tick labels for categorical data
//   if (xIsCategorical) {
//     xValues.forEach((value: any) => {
//       const pos = (xScale as any)(value) + (xScale as any).bandwidth() / 2;
//       addLabel(value.toString(), new THREE.Vector3(pos, -1, axisLength + 1));
//     });
//   }

//   if (zIsCategorical) {
//     zValues.forEach((value: any) => {
//       const pos = (zScale as any)(value) + (zScale as any).bandwidth() / 2;
//       addLabel(value.toString(), new THREE.Vector3(axisLength + 1, -1, pos));
//     });
//   }

//   let animationId: number;
//   const animate = () => {
//     animationId = requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   // Add cleanup function to container
//   (container as any).cleanup = () => {
//     // Cancel animation
//     if (animationId) {
//       cancelAnimationFrame(animationId);
//     }

//     // Dispose controls
//     controls.dispose();

//     // Dispose renderer and WebGL context
//     renderer.dispose();
//     renderer.forceContextLoss();

//     // Clear scene
//     while (scene.children.length > 0) {
//       const object = scene.children[0];
//       if (object.type === "Mesh") {
//         const mesh = object as THREE.Mesh;
//         if (mesh.geometry) mesh.geometry.dispose();
//         if (mesh.material) {
//           if (Array.isArray(mesh.material)) {
//             mesh.material.forEach((material) => material.dispose());
//           } else {
//             mesh.material.dispose();
//           }
//         }
//       }
//       scene.remove(object);
//     }

//     // Remove canvas from container
//     if (container.children.length > 0) {
//       container.removeChild(container.children[0]);
//     }
//   };

//   return container;
// };

// export const create3DScatterPlot = (
//   data: { x: any; y: number; z: any }[], // x dan z bisa string atau number
//   width: number,
//   height: number
// ) => {
//   console.log("create 3d scatter plot with data", data);
//   // Fungsi untuk menambahkan teks label
//   const addLabel = (text: string, position: THREE.Vector3) => {
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const textGeometry = new TextGeometry(text, {
//           font: font,
//           size: 0.5,
//           depth: 0.05,
//         });
//         textGeometry.computeBoundingBox();
//         textGeometry.center();

//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);

//         textMesh.position.set(position.x, position.y, position.z);
//         scene.add(textMesh);
//       }
//     );
//   };

//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(25, 25, 25);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//   scene.background = null;
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(15, 20, 15);
//   scene.add(pointLight);

//   // Use improved scaling
//   const {
//     xScale,
//     yScale,
//     zScale,
//     gridSize,
//     xIsCategorical,
//     zIsCategorical,
//     xValues,
//     zValues,
//   } = createImprovedScaling(data, "x", "y", "z");

//   // Fixed size grid helper
//   const gridHelper = new THREE.GridHelper(gridSize, 20);
//   scene.add(gridHelper);

//   const createAxisLine = (
//     start: THREE.Vector3,
//     end: THREE.Vector3,
//     color: number
//   ) => {
//     const material = new THREE.LineDashedMaterial({
//       color: color,
//       dashSize: 1,
//       gapSize: 0.5,
//     });

//     const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
//     const line = new THREE.Line(geometry, material);
//     line.computeLineDistances();

//     return line;
//   };

//   const axisLength = gridSize / 2;

//   //Garis Sumbu X (Merah)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(-axisLength, 0, 0),
//       new THREE.Vector3(axisLength, 0, 0),
//       0xff0000
//     )
//   );

//   // Garis Sumbu Y (Hijau)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, 0, 0),
//       new THREE.Vector3(0, 12, 0),
//       0x00ff00
//     )
//   );

//   // Garis Sumbu Z (Biru)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, 0, -axisLength),
//       new THREE.Vector3(0, 0, axisLength),
//       0x0000ff
//     )
//   );

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Menambahkan titik-titik (scatter) pada plot 3D
//   data.forEach((d) => {
//     const geometry = new THREE.SphereGeometry(0.5, 8, 8);
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x007bff,
//       metalness: 0.3,
//       roughness: 0.7,
//     });
//     const point = new THREE.Mesh(geometry, material);

//     const xPos = xIsCategorical
//       ? (xScale as any)(d.x) + (xScale as any).bandwidth() / 2
//       : xScale(d.x);
//     const zPos = zIsCategorical
//       ? (zScale as any)(d.z) + (zScale as any).bandwidth() / 2
//       : zScale(d.z);

//     // Posisi titik berdasarkan data dan skala
//     point.position.set(xPos, yScale(d.y), zPos);
//     scene.add(point);

//     addLabel(` ${d.y}`, new THREE.Vector3(xPos, yScale(d.y) + 1, zPos));
//   });

//   // Add axis labels
//   addLabel("X", new THREE.Vector3(axisLength + 2, 0, 0));
//   addLabel("Y", new THREE.Vector3(0, 14, 0));
//   addLabel("Z", new THREE.Vector3(0, 0, axisLength + 2));

//   // Add axis tick labels for categorical data
//   if (xIsCategorical) {
//     xValues.forEach((value: any) => {
//       const pos = (xScale as any)(value) + (xScale as any).bandwidth() / 2;
//       addLabel(value.toString(), new THREE.Vector3(pos, -1, axisLength + 1));
//     });
//   }

//   if (zIsCategorical) {
//     zValues.forEach((value: any) => {
//       const pos = (zScale as any)(value) + (zScale as any).bandwidth() / 2;
//       addLabel(value.toString(), new THREE.Vector3(axisLength + 1, -1, pos));
//     });
//   }

//   let animationId: number;
//   const animate = () => {
//     animationId = requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   // Add cleanup function to container
//   (container as any).cleanup = () => {
//     // Cancel animation
//     if (animationId) {
//       cancelAnimationFrame(animationId);
//     }

//     // Dispose controls
//     controls.dispose();

//     // Dispose renderer and WebGL context
//     renderer.dispose();
//     renderer.forceContextLoss();

//     // Clear scene
//     while (scene.children.length > 0) {
//       const object = scene.children[0];
//       if (object.type === "Mesh") {
//         const mesh = object as THREE.Mesh;
//         if (mesh.geometry) mesh.geometry.dispose();
//         if (mesh.material) {
//           if (Array.isArray(mesh.material)) {
//             mesh.material.forEach((material) => material.dispose());
//           } else {
//             mesh.material.dispose();
//           }
//         }
//       }
//       scene.remove(object);
//     }

//     // Remove canvas from container
//     if (container.children.length > 0) {
//       container.removeChild(container.children[0]);
//     }
//   };

//   return container;
// };

// export const createGrouped3DScatterPlot = (
//   data: { x: number; y: number; z: number; category: string }[],
//   width: number,
//   height: number
// ) => {
//   console.log("create 3d grouped scatter with data", data);

//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();
//   // scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(20, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//   scene.background = null;
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Dapatkan kategori unik
//   const uniqueCategories = Array.from(new Set(data.map((d) => d.category)));

//   // Skema warna kategori
//   const colorScale = d3
//     .scaleOrdinal(d3.schemeCategory10)
//     .domain(uniqueCategories);

//   // Menentukan rentang data
//   const xExtent = d3.extent(data, (d) => d.x)!;
//   const yExtent = d3.extent(data, (d) => d.y)!;
//   const zExtent = d3.extent(data, (d) => d.z)!;

//   const xMax = Math.max(Math.abs(xExtent[0]!), Math.abs(xExtent[1]!));
//   const yMax = Math.max(Math.abs(yExtent[0]!), Math.abs(yExtent[1]!));
//   const zMax = Math.max(Math.abs(zExtent[0]!), Math.abs(zExtent[1]!));

//   const gridSizeX = 2 * xMax;
//   const gridSizeZ = 2 * zMax;
//   const gridSize = Math.max(gridSizeX, gridSizeZ);

//   // Membuat GridHelper
//   const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
//   scene.add(gridHelper);

//   const createAxisLine = (
//     start: THREE.Vector3,
//     end: THREE.Vector3,
//     color: number
//   ) => {
//     const material = new THREE.LineDashedMaterial({
//       color: color,
//       dashSize: 1,
//       gapSize: 0.5,
//     });

//     const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
//     const line = new THREE.Line(geometry, material);
//     line.computeLineDistances();

//     return line;
//   };

//   // Garis sumbu
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(-gridSize, 0, 0),
//       new THREE.Vector3(gridSize, 0, 0),
//       0xff0000
//     )
//   );
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, -gridSize, 0),
//       new THREE.Vector3(0, gridSize, 0),
//       0x00ff00
//     )
//   );
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, 0, -gridSize),
//       new THREE.Vector3(0, 0, gridSize),
//       0x0000ff
//     )
//   );

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala data
//   const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);
//   const yScale = d3.scaleLinear().domain([-yMax, yMax]).range([-yMax, yMax]);
//   const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

//   // Fungsi menambahkan label teks
//   const addLabel = (text: string, position: THREE.Vector3) => {
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const textGeometry = new TextGeometry(text, {
//           font: font,
//           size: 0.5,
//           depth: 0.05,
//         });
//         textGeometry.computeBoundingBox();
//         textGeometry.center();

//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);
//         textMesh.position.set(position.x, position.y, position.z);
//         scene.add(textMesh);
//       }
//     );
//   };

//   // Menambahkan titik berdasarkan kategori
//   // Hitung jumlah titik di setiap posisi (x, z)
//   const pointMap = new Map<string, number>();
//   data.forEach((d) => {
//     const key = `${d.x},${d.y},${d.z}`;
//     pointMap.set(key, (pointMap.get(key) || 0) + 1);
//   });

//   // Skala ukuran titik berdasarkan jumlah titik di satu koordinat (x, z)
//   const sizeScale = d3.scaleLinear().domain([1, 5]).range([0.5, 0.2]);

//   const groupedData = d3.group(data, (d) => `${d.x},${d.y},${d.z}`);

//   groupedData.forEach((group, key) => {
//     const numPoints = group.length;
//     const baseSize = sizeScale(Math.min(numPoints, 5));

//     group.forEach((d, index) => {
//       const size = baseSize;
//       const color = new THREE.Color(colorScale(d.category) as string);
//       const geometry = new THREE.SphereGeometry(size, 8, 8);
//       const material = new THREE.MeshStandardMaterial({
//         color: color,
//         // transparent: true,
//         // opacity: 0.8,
//         metalness: 0.3,
//         roughness: 0.7,
//       });

//       const point = new THREE.Mesh(geometry, material);

//       // Offset posisi
//       const xOffset = (index - (numPoints - 1) / 2) * (size * 0.8);
//       const zOffset = (index % 2 === 0 ? 1 : -1) * (size * 0.8);

//       const xPos = xScale(d.x)! + xOffset;
//       const yPos = yScale(d.y);
//       const zPos = zScale(d.z)! + zOffset;

//       point.position.set(xPos, yPos, zPos);
//       scene.add(point);
//     });
//   });

//   // Menambahkan label untuk sumbu
//   addLabel("X", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
//   addLabel("Y", new THREE.Vector3(0, gridSize / 2 + 3, 0));
//   addLabel("Z", new THREE.Vector3(0, 0, gridSize / 2 + 3));

//   let animationId: number;
//   const animate = () => {
//     animationId = requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   // Add cleanup function to container
//   (container as any).cleanup = () => {
//     // Cancel animation
//     if (animationId) {
//       cancelAnimationFrame(animationId);
//     }

//     // Dispose controls
//     controls.dispose();

//     // Dispose renderer and WebGL context
//     renderer.dispose();
//     renderer.forceContextLoss();

//     // Clear scene
//     while (scene.children.length > 0) {
//       const object = scene.children[0];
//       if (object.type === "Mesh") {
//         const mesh = object as THREE.Mesh;
//         if (mesh.geometry) mesh.geometry.dispose();
//         if (mesh.material) {
//           if (Array.isArray(mesh.material)) {
//             mesh.material.forEach((material) => material.dispose());
//           } else {
//             mesh.material.dispose();
//           }
//         }
//       }
//       scene.remove(object);
//     }

//     // Remove canvas from container
//     if (container.children.length > 0) {
//       container.removeChild(container.children[0]);
//     }
//   };

//   return container;
// };

// export const createClustered3DBarChart = (
//   data: { x: number; z: number; y: number; category: string }[],
//   width: number,
//   height: number
// ) => {
//   console.log("create clustered 3d bar chart with data", data);
//   // Fungsi untuk menambahkan teks label
//   const addLabel = (text: string, position: THREE.Vector3) => {
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const textGeometry = new TextGeometry(text, {
//           font: font,
//           size: 1,
//           depth: 0.1,
//         });
//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);
//         textMesh.position.set(position.x, position.y, position.z);
//         scene.add(textMesh);
//       }
//     );
//   };

//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();
//   // scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(20, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//   scene.background = null;
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Menentukan rentang koordinat
//   const xExtent = d3.extent(data, (d) => d.x) as [number, number];
//   const yExtent = d3.extent(data, (d) => d.y) as [number, number];
//   const zExtent = d3.extent(data, (d) => d.z) as [number, number];

//   const xMax = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
//   const yMax = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
//   const zMax = Math.max(Math.abs(zExtent[0]), Math.abs(zExtent[1]));

//   const gridSize = Math.max(2 * xMax, 2 * zMax);

//   // Membuat GridHelper
//   const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
//   scene.add(gridHelper);

//   const createAxisLine = (
//     start: THREE.Vector3,
//     end: THREE.Vector3,
//     color: number
//   ) => {
//     const material = new THREE.LineDashedMaterial({
//       color: color,
//       dashSize: 1,
//       gapSize: 0.5,
//     });

//     const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
//     const line = new THREE.Line(geometry, material);
//     line.computeLineDistances();

//     return line;
//   };

//   //Garis Sumbu X (Merah)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(-gridSize, 0, 0),
//       new THREE.Vector3(gridSize, 0, 0),
//       0xff0000
//     )
//   );

//   // Garis Sumbu Y (Hijau)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, -gridSize, 0),
//       new THREE.Vector3(0, gridSize, 0),
//       0x00ff00
//     )
//   );

//   // Garis Sumbu Z (Biru)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, 0, -gridSize),
//       new THREE.Vector3(0, 0, gridSize),
//       0x0000ff
//     )
//   );

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala koordinat
//   const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);
//   const yScale = d3.scaleLinear().domain([0, yMax]).range([0, yMax]);
//   const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

//   // Kelompokkan berdasarkan koordinat (x, z)
//   const groupedData = d3.group(data, (d) => `${d.x},${d.z}`);

//   const colors = d3.scaleOrdinal(d3.schemeCategory10);

//   groupedData.forEach((group, key) => {
//     const numBars = group.length;

//     const barSpacing = 0.005; // Jarak antar batang dalam cluster
//     const maxBarWidth = 0.95 - barSpacing * (numBars - 1);
//     const barWidth = Math.min(0.95, maxBarWidth / numBars);

//     group.forEach((d, index) => {
//       const geometry = new THREE.BoxGeometry(barWidth, yScale(d.y), 0.95);
//       const material = new THREE.MeshStandardMaterial({
//         color: colors(d.category),
//         metalness: 0.3,
//         roughness: 0.7,
//       });
//       const bar = new THREE.Mesh(geometry, material);

//       // Hitung posisi X agar sejajar dalam satu garis horizontal
//       const xOffset = (index - (numBars - 1) / 2) * (barWidth + barSpacing);
//       const xPos = xScale(d.x) + xOffset;
//       const yPos = yScale(d.y) / 2;
//       const zPos = zScale(d.z);

//       bar.position.set(xPos, yPos, zPos);
//       scene.add(bar);
//     });
//   });

//   // Menambahkan label untuk sumbu
//   addLabel("X", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
//   addLabel("Y", new THREE.Vector3(0, gridSize / 2 + 3, 0));
//   addLabel("Z", new THREE.Vector3(0, 0, gridSize / 2 + 3));

//   let animationId: number;
//   const animate = () => {
//     animationId = requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   // Add cleanup function to container
//   (container as any).cleanup = () => {
//     // Cancel animation
//     if (animationId) {
//       cancelAnimationFrame(animationId);
//     }

//     // Dispose controls
//     controls.dispose();

//     // Dispose renderer and WebGL context
//     renderer.dispose();
//     renderer.forceContextLoss();

//     // Clear scene
//     while (scene.children.length > 0) {
//       const object = scene.children[0];
//       if (object.type === "Mesh") {
//         const mesh = object as THREE.Mesh;
//         if (mesh.geometry) mesh.geometry.dispose();
//         if (mesh.material) {
//           if (Array.isArray(mesh.material)) {
//             mesh.material.forEach((material) => material.dispose());
//           } else {
//             mesh.material.dispose();
//           }
//         }
//       }
//       scene.remove(object);
//     }

//     // Remove canvas from container
//     if (container.children.length > 0) {
//       container.removeChild(container.children[0]);
//     }
//   };

//   return container;
// };

// export const createStacked3DBarChart = (
//   data: { x: number; z: number; y: number; category: string }[],
//   width: number,
//   height: number
// ) => {
//   console.log("create stacked 3d bar chart with data", data);
//   // Fungsi untuk menambahkan teks label
//   const addLabel = (text: string, position: THREE.Vector3) => {
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const textGeometry = new TextGeometry(text, {
//           font: font,
//           size: 0.5,
//           depth: 0.05,
//         });
//         textGeometry.computeBoundingBox();
//         textGeometry.center();
//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);

//         textMesh.position.set(position.x, position.y, position.z);
//         scene.add(textMesh);
//       }
//     );
//   };

//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();
//   // scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(20, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//   scene.background = null;
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Menentukan rentang koordinat
//   const xExtent = d3.extent(data, (d) => d.x) as [number, number];
//   const yExtent = d3.extent(data, (d) => d.y) as [number, number];
//   const zExtent = d3.extent(data, (d) => d.z) as [number, number];

//   const xMax = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
//   const yMax = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
//   const zMax = Math.max(Math.abs(zExtent[0]), Math.abs(zExtent[1]));

//   const gridSize = Math.max(2 * xMax, 2 * zMax);

//   // Membuat GridHelper
//   const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
//   scene.add(gridHelper);

//   const createAxisLine = (
//     start: THREE.Vector3,
//     end: THREE.Vector3,
//     color: number
//   ) => {
//     const material = new THREE.LineDashedMaterial({
//       color: color,
//       dashSize: 1,
//       gapSize: 0.5,
//     });

//     const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
//     const line = new THREE.Line(geometry, material);
//     line.computeLineDistances();

//     return line;
//   };

//   //Garis Sumbu X (Merah)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(-gridSize, 0, 0),
//       new THREE.Vector3(gridSize, 0, 0),
//       0xff0000
//     )
//   );

//   // Garis Sumbu Y (Hijau)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, -gridSize, 0),
//       new THREE.Vector3(0, gridSize, 0),
//       0x00ff00
//     )
//   );

//   // Garis Sumbu Z (Biru)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, 0, -gridSize),
//       new THREE.Vector3(0, 0, gridSize),
//       0x0000ff
//     )
//   );

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala koordinat
//   const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);
//   const yScale = d3.scaleLinear().domain([0, yMax]).range([0, yMax]);
//   const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

//   // Kelompokkan berdasarkan koordinat (x, z)
//   const groupedData = d3.group(data, (d) => `${d.x},${d.z}`);

//   const colors = d3.scaleOrdinal(d3.schemeCategory10);

//   groupedData.forEach((group, key) => {
//     let accumulatedHeight = 0;
//     let totalHeight = d3.sum(group, (d) => yScale(d.y));

//     group.forEach((d, index) => {
//       const barWidth = 1;
//       const barHeight = yScale(d.y);

//       const geometry = new THREE.BoxGeometry(barWidth, barHeight, barWidth);
//       const material = new THREE.MeshStandardMaterial({
//         color: colors(d.category),
//         metalness: 0.3,
//         roughness: 0.7,
//       });
//       const bar = new THREE.Mesh(geometry, material);

//       const xPos = xScale(d.x);
//       const yPos = accumulatedHeight + barHeight / 2;
//       const zPos = zScale(d.z);

//       bar.position.set(xPos, yPos, zPos);
//       scene.add(bar);

//       accumulatedHeight += barHeight;
//     });

//     // Tambahkan label total tinggi di atas batang terakhir
//     addLabel(
//       totalHeight.toFixed(1),
//       new THREE.Vector3(
//         xScale(group[0].x),
//         totalHeight + 0.5,
//         zScale(group[0].z)
//       )
//     );
//   });

//   // Menambahkan label untuk sumbu
//   addLabel("X", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
//   addLabel("Y", new THREE.Vector3(0, gridSize / 2 + 3, 0));
//   addLabel("Z", new THREE.Vector3(0, 0, gridSize / 2 + 3));

//   let animationId: number;
//   const animate = () => {
//     animationId = requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   // Add cleanup function to container
//   (container as any).cleanup = () => {
//     // Cancel animation
//     if (animationId) {
//       cancelAnimationFrame(animationId);
//     }

//     // Dispose controls
//     controls.dispose();

//     // Dispose renderer and WebGL context
//     renderer.dispose();
//     renderer.forceContextLoss();

//     // Clear scene
//     while (scene.children.length > 0) {
//       const object = scene.children[0];
//       if (object.type === "Mesh") {
//         const mesh = object as THREE.Mesh;
//         if (mesh.geometry) mesh.geometry.dispose();
//         if (mesh.material) {
//           if (Array.isArray(mesh.material)) {
//             mesh.material.forEach((material) => material.dispose());
//           } else {
//             mesh.material.dispose();
//           }
//         }
//       }
//       scene.remove(object);
//     }

//     // Remove canvas from container
//     if (container.children.length > 0) {
//       container.removeChild(container.children[0]);
//     }
//   };

//   return container;
// };

// Test data examples for improved 3D charts
export const getTest3DData = () => {
  // Test data with string categories
  const stringCategoriesData = [
    { x: "Jan", y: 25, z: "North" },
    { x: "Jan", y: 30, z: "South" },
    { x: "Feb", y: 35, z: "North" },
    { x: "Feb", y: 28, z: "South" },
    { x: "Mar", y: 40, z: "North" },
    { x: "Mar", y: 32, z: "South" },
    { x: "Apr", y: 45, z: "North" },
    { x: "Apr", y: 38, z: "South" },
  ];

  // Test data with numeric coordinates
  const numericData = [
    { x: 1, y: 25, z: 1 },
    { x: 2, y: 30, z: 1 },
    { x: 3, y: 35, z: 1 },
    { x: 1, y: 28, z: 2 },
    { x: 2, y: 32, z: 2 },
    { x: 3, y: 38, z: 2 },
  ];

  // Mixed data - strings for X, numbers for Z
  const mixedData = [
    { x: "Product A", y: 100, z: 2023 },
    { x: "Product B", y: 150, z: 2023 },
    { x: "Product C", y: 120, z: 2023 },
    { x: "Product A", y: 110, z: 2024 },
    { x: "Product B", y: 160, z: 2024 },
    { x: "Product C", y: 140, z: 2024 },
  ];

  return {
    stringCategoriesData,
    numericData,
    mixedData,
  };
};

// --- ECharts 3D Bar Chart ---
/**
 * Membuat 3D Bar Chart menggunakan Apache ECharts (echarts + echarts-gl)
 * @param data Array<{ x: string|number, y: number, z: string|number }>
 * @param width Lebar chart (px)
 * @param height Tinggi chart (px)
 * @param useAxis Boolean untuk menampilkan/menyembunyikan axis
 * @param titleOptions Konfigurasi judul chart
 * @param axisLabels Label untuk sumbu x, y, dan z
 * @param axisScaleOptions Konfigurasi skala sumbu
 * @param chartColors Array warna untuk chart
 * @returns HTMLDivElement yang sudah terisi chart
 */
export function createECharts3DBarChart(
  data: Array<{ x: string | number; y: string | number; z: string | number }>,
  width: number = 600,
  height: number = 400,
  useAxis: boolean = true,
  titleOptions?: any,
  axisLabels?: { x?: string; y?: string; z?: string },
  axisScaleOptions?: any,
  chartColors?: string[]
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.width = width + "px";
  container.style.height = height + "px";

  const xIsString = data.some((d) => typeof d.x === "string");
  const yIsString = data.some((d) => typeof d.y === "string");
  const zIsString = data.some((d) => typeof d.z === "string");

  const xCategories = xIsString
    ? Array.from(new Set(data.map((d) => d.x)))
    : undefined;
  const yCategories = yIsString
    ? Array.from(new Set(data.map((d) => d.y)))
    : undefined;
  const zCategories = zIsString
    ? Array.from(new Set(data.map((d) => d.z)))
    : undefined;

  const toIndex = (value: string | number, categories?: (string | number)[]) =>
    categories ? categories.indexOf(value) : value;

  const seriesData = data
    .map((d) => {
      const x = toIndex(d.x, xCategories);
      const y = toIndex(d.y, yCategories);
      const z = toIndex(d.z, zCategories);
      if ([x, y, z].some((v) => v === -1)) return null;
      return [x, y, z, d.x, d.y, d.z];
    })
    .filter((d): d is [number, number, number, any, any, any] => d !== null);

  if (seriesData.length === 0) {
    container.innerHTML = `<div style="color:red;padding:1em">No valid data for 3D Bar Chart</div>`;
    return container;
  }

  const option = {
    title: {
      text: titleOptions?.title || "",
      subtext: titleOptions?.subtitle || "",
      left: "center",
      top: 10,
      textStyle: {
        color: titleOptions?.titleColor || "#333",
        fontSize: titleOptions?.titleFontSize || 18,
      },
      subtextStyle: {
        color: titleOptions?.subtitleColor || "#666",
        fontSize: titleOptions?.subtitleFontSize || 14,
      },
    },
    tooltip: {
      formatter: (params: any) => {
        const [xIdx, yIdx, zIdx, xRaw, yRaw, zRaw] = params.value;
        return `X: ${xRaw}<br/>Y: ${yRaw}<br/>Z: ${zRaw}`;
      },
    },
    visualMap: {
      min: Math.min(...seriesData.map((d) => d[2])),
      max: Math.max(...seriesData.map((d) => d[2])),
      inRange: { color: chartColors || ["#87aa66", "#eba438", "#d94d4c"] },
    },

    xAxis3D: {
      type: xIsString ? "category" : "value",
      data: xCategories,
      name: axisLabels?.x || "X",
      nameGap: 20,
      show: useAxis,
    },
    yAxis3D: {
      type: yIsString ? "category" : "value",
      data: yCategories,
      name: axisLabels?.y || "Y",
      nameGap: 20,
      show: useAxis,
    },
    zAxis3D: {
      type: zIsString ? "category" : "value",
      data: zCategories,
      name: axisLabels?.z || "Z",
      nameGap: 20,
      show: useAxis,
    },
    grid3D: {
      boxWidth: 100,
      boxDepth: 80,
      viewControl: { projection: "perspective" },
      light: {
        main: { intensity: 1.2, shadow: true },
        ambient: { intensity: 0.3 },
      },
    },
    series: [
      {
        type: "bar3D",
        data: seriesData,
        shading: "color",
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16 },
          itemStyle: { opacity: 1 },
        },
      },
    ],
  };

  const chart = echarts.init(container);
  chart.setOption(option);

  (container as any).cleanup = () => chart.dispose();
  return container;
}

// --- ECharts 3D Scatter Plot ---
/**
 * Membuat 3D Scatter Plot menggunakan Apache ECharts (echarts + echarts-gl)
 * @param data Array<{ x: string|number, y: string|number, z: number }>
 * @param width Lebar chart (px)
 * @param height Tinggi chart (px)
 * @param useAxis Boolean untuk menampilkan/menyembunyikan axis
 * @param titleOptions Konfigurasi judul chart
 * @param axisLabels Label untuk sumbu x, y, dan z
 * @param axisScaleOptions Konfigurasi skala sumbu
 * @param chartColors Array warna untuk chart
 * @returns HTMLDivElement yang sudah terisi chart
 */
export function createECharts3DScatterPlot(
  data: Array<{ x: string | number; y: string | number; z: number | string }>,
  width: number = 600,
  height: number = 400,
  useAxis: boolean = true,
  titleOptions?: {
    title?: string;
    subtitle?: string;
    titleColor?: string;
    subtitleColor?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
  },
  axisLabels?: { x?: string; y?: string; z?: string },
  axisScaleOptions?: any,
  chartColors?: string[]
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.width = width + "px";
  container.style.height = height + "px";

  const xIsString = data.some((d) => typeof d.x === "string");
  const yIsString = data.some((d) => typeof d.y === "string");
  const zIsString = data.some((d) => typeof d.z === "string");

  const xCategories = xIsString
    ? Array.from(new Set(data.map((d) => d.x)))
    : undefined;
  const yCategories = yIsString
    ? Array.from(new Set(data.map((d) => d.y)))
    : undefined;
  const zCategories = zIsString
    ? Array.from(new Set(data.map((d) => d.z)))
    : undefined;

  const seriesData = data
    .map((d) => {
      let zValue: number;

      if (typeof d.z === "number") {
        zValue = d.z;
      } else if (zIsString && zCategories) {
        const idx = zCategories.indexOf(d.z);
        if (idx === -1) return null;
        zValue = idx;
      } else {
        const parsed = parseFloat(d.z as string);
        if (isNaN(parsed)) return null;
        zValue = parsed;
      }

      const xIdx = xIsString && xCategories ? xCategories.indexOf(d.x) : d.x;
      const yIdx = yIsString && yCategories ? yCategories.indexOf(d.y) : d.y;

      if ((xIsString && xIdx === -1) || (yIsString && yIdx === -1)) {
        return null;
      }

      return [xIdx, yIdx, zValue, d.x, d.y, d.z]; // 3 terakhir untuk tooltip
    })
    .filter(
      (
        item
      ): item is [number | string, number | string, number, any, any, any] =>
        item !== null
    );

  if (seriesData.length === 0) {
    container.innerHTML =
      '<div style="color:red;padding:1em">No valid data for 3D Scatter Plot (X/Y/Z must be string or number)</div>';
    return container;
  }

  const colorRange = chartColors || ["#87aa66", "#eba438", "#d94d4c"];
  const visualMapMax = Math.max(...seriesData.map((d) => d[2]));

  const option = {
    title: {
      text: titleOptions?.title || "",
      subtext: titleOptions?.subtitle || "",
      left: "center",
      top: 10,
      textStyle: {
        color: titleOptions?.titleColor || "#333",
        fontSize: titleOptions?.titleFontSize || 18,
        fontWeight: "bold",
      },
      subtextStyle: {
        color: titleOptions?.subtitleColor || "#666",
        fontSize: titleOptions?.subtitleFontSize || 14,
      },
    },
    tooltip: {
      formatter: (params: any) => {
        const [xIdx, yIdx, z, xRaw, yRaw, zRaw] = params.value;
        return `X: ${xRaw ?? xIdx}<br/>Y: ${yRaw ?? yIdx}<br/>Z: ${zRaw ?? z}`;
      },
    },
    visualMap: {
      max: visualMapMax,
      inRange: { color: colorRange },
    },
    xAxis3D: {
      type: xIsString ? "category" : "value",
      data: xCategories,
      name: axisLabels?.x || "X",
      nameGap: 20,
      show: useAxis,
    },
    yAxis3D: {
      type: yIsString ? "category" : "value",
      data: yCategories,
      name: axisLabels?.y || "Y",
      nameGap: 20,
      show: useAxis,
    },
    zAxis3D: {
      type: zIsString ? "category" : "value",
      data: zCategories,
      name: axisLabels?.z || "Z",
      nameGap: 20,
      show: useAxis,
    },
    grid3D: {
      boxWidth: 100,
      boxDepth: 80,
      viewControl: {
        projection: "perspective",
      },
      light: {
        main: { intensity: 1.2, shadow: true },
        ambient: { intensity: 0.3 },
      },
    },
    series: [
      {
        type: "scatter3D",
        data: seriesData,
        symbolSize: 8,
        itemStyle: { opacity: 0.8 },
        emphasis: {
          itemStyle: {
            opacity: 1,
            symbolSize: 12,
          },
        },
      },
    ],
  };

  const chart = echarts.init(container);
  chart.setOption(option);

  (container as any).cleanup = () => chart.dispose();
  return container;
}

// --- ECharts 3D Bar Chart dengan Z sebagai posisi ---
/**
 * Membuat 3D Bar Chart dengan Z sebagai posisi (bukan tinggi bar)
 * @param data Array<{ x: string|number, y: string|number, z: number }>
 * @param width Lebar chart (px)
 * @param height Tinggi chart (px)
 * @param useAxis Boolean untuk menampilkan/menyembunyikan axis
 * @param titleOptions Konfigurasi judul chart
 * @param axisLabels Label untuk sumbu x, y, dan z
 * @param axisScaleOptions Konfigurasi skala sumbu
 * @param chartColors Array warna untuk chart
 * @returns HTMLDivElement yang sudah terisi chart
 */
export function createECharts3DBarChartWithZPosition(
  data: Array<{ x: string | number; y: string | number; z: number }>,
  width: number = 600,
  height: number = 400,
  useAxis: boolean = true,
  titleOptions?: {
    title?: string;
    subtitle?: string;
    titleColor?: string;
    subtitleColor?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
  },
  axisLabels?: { x?: string; y?: string; z?: string },
  axisScaleOptions?: any,
  chartColors?: string[]
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.width = width + "px";
  container.style.height = height + "px";

  // Buat daftar kategori unik
  const xCategories = Array.from(new Set(data.map((d) => d.x)));
  const yCategories = Array.from(new Set(data.map((d) => d.y)));

  // Konversi ke [xIndex, yIndex, z] - Z sebagai posisi
  const seriesData = data.map((d) => {
    // Handle Z sebagai string atau number
    let zValue: number;
    if (typeof d.z === "number") {
      zValue = d.z;
    } else if (typeof d.z === "string") {
      const parsed = parseFloat(d.z);
      if (isNaN(parsed)) {
        console.warn(`Invalid Z value: "${d.z}". Using 0 as default.`);
        zValue = 0;
      } else {
        zValue = parsed;
      }
    } else {
      console.warn(`Invalid Z value: ${d.z}. Using 0 as default.`);
      zValue = 0;
    }

    return [
      typeof d.x === "number" ? d.x : xCategories.indexOf(d.x),
      typeof d.y === "number" ? d.y : yCategories.indexOf(d.y),
      zValue, // Z sebagai posisi Z yang tegak lurus ke atas
    ];
  });

  const colorRange = chartColors || ["#87aa66", "#eba438", "#d94d4c"];

  const option = {
    title: {
      text: titleOptions?.title || "",
      subtext: titleOptions?.subtitle || "",
      left: "center",
      top: 10,
      textStyle: {
        color: titleOptions?.titleColor || "#333",
        fontSize: titleOptions?.titleFontSize || 18,
        fontWeight: "bold",
      },
      subtextStyle: {
        color: titleOptions?.subtitleColor || "#666",
        fontSize: titleOptions?.subtitleFontSize || 14,
      },
    },
    tooltip: {
      formatter: (params: any) => {
        const [xIdx, yIdx, z] = params.value;
        const xLabel =
          typeof xIdx === "number" && xIdx < xCategories.length
            ? xCategories[xIdx]
            : xIdx;
        const yLabel =
          typeof yIdx === "number" && yIdx < yCategories.length
            ? yCategories[yIdx]
            : yIdx;
        return `X: ${xLabel}<br/>Y: ${yLabel}<br/>Z: ${z}`;
      },
    },
    visualMap: {
      max: Math.max(
        ...seriesData.map((d) =>
          typeof d[2] === "number" ? (d[2] as number) : 0
        )
      ),
      inRange: { color: colorRange },
    },
    xAxis3D: {
      type: "category",
      data: xCategories,
      name: axisLabels?.x || "X",
      nameGap: 20,
      min: axisScaleOptions?.x?.min,
      max: axisScaleOptions?.x?.max,
      show: useAxis,
    },
    yAxis3D: {
      type: "category",
      data: yCategories,
      name: axisLabels?.y || "Y",
      nameGap: 20,
      min: axisScaleOptions?.y?.min,
      max: axisScaleOptions?.y?.max,
      show: useAxis,
    },
    zAxis3D: {
      type: "value",
      name: axisLabels?.z || "Z",
      nameGap: 20,
      min: axisScaleOptions?.z?.min ? Number(axisScaleOptions.z.min) : 0,
      max: axisScaleOptions?.z?.max
        ? Number(axisScaleOptions.z.max)
        : undefined,
      show: useAxis,
    },
    grid3D: {
      boxWidth: 100,
      boxDepth: 80,
      viewControl: {
        projection: "perspective",
      },
      light: {
        main: { intensity: 1.2, shadow: true },
        ambient: { intensity: 0.3 },
      },
    },
    series: [
      {
        type: "bar3D",
        data: seriesData,
        shading: "color",
        label: {
          show: false,
          fontSize: 12,
          borderWidth: 1,
        },
        emphasis: {
          label: { fontSize: 16, color: "#900" },
          itemStyle: { color: "#f00" },
        },
      },
    ],
  };

  const chart = echarts.init(container);
  chart.setOption(option);

  (container as any).cleanup = () => chart.dispose();
  return container;
}

export function createEChartsStacked3DBarChart(
  data: Array<{
    x: string | number;
    y: string | number;
    z: string | number;
    group: string | number;
  }>,
  width: number = 600,
  height: number = 400,
  useAxis: boolean = true,
  titleOptions?: any,
  axisLabels?: { x?: string; y?: string; z?: string },
  axisScaleOptions?: any,
  chartColors?: string[],
  maxVisualHeight: number = 20
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.width = width + "px";
  container.style.height = height + "px";

  const xCategories = Array.from(new Set(data.map((d) => d.x)));
  const yCategories = Array.from(new Set(data.map((d) => d.y)));
  const groupCategories = Array.from(new Set(data.map((d) => d.group)));

  const maxZOriginal = Math.max(...data.map((d) => Number(d.z) || 0));
  const scaleZ = maxZOriginal > 0 ? maxVisualHeight / maxZOriginal : 1;

  // Calculate base heights for stacking
  const baseHeights = new Map<string, number>();

  // First pass: calculate base heights for each coordinate
  for (let xi = 0; xi < xCategories.length; xi++) {
    for (let yi = 0; yi < yCategories.length; yi++) {
      const xVal = xCategories[xi];
      const yVal = yCategories[yi];
      const key = `${xVal}|${yVal}`;

      let baseHeight = 0;
      for (let i = 0; i < groupCategories.length; i++) {
        const prevGroup = groupCategories[i];
        const prevGroupData = data.filter((d) => d.group === prevGroup);
        const found = prevGroupData.find((d) => d.x === xVal && d.y === yVal);
        if (found) {
          baseHeight += Number(found.z) || 0;
        }
      }
      baseHeights.set(key, baseHeight * scaleZ);
    }
  }

  const series = groupCategories.map((group, idx) => {
    const groupData = data.filter((d) => d.group === group);
    const seriesData: any[] = [];

    // Create data for each x,y coordinate
    for (let xi = 0; xi < xCategories.length; xi++) {
      for (let yi = 0; yi < yCategories.length; yi++) {
        const xVal = xCategories[xi];
        const yVal = yCategories[yi];
        const key = `${xVal}|${yVal}`;

        // Find data for this group at this x,y coordinate
        const found = groupData.find((d) => d.x === xVal && d.y === yVal);

        // Add data point (0 if no data found for this group)
        const rawZ = found ? Number(found.z) || 0 : 0;
        const zScaled = rawZ * scaleZ;
        const baseHeight = baseHeights.get(key) || 0;

        // Data format: [xValue, yValue, zValue, baseHeight]
        // Always add data point for consistent stacking, but with conditional styling
        seriesData.push({
          value: [xVal, yVal, zScaled, baseHeight],
          itemStyle: {
            opacity: rawZ > 0 ? 0.8 : 0, // Transparan jika nilai 0
          },
        });
      }
    }

    return {
      name: group,
      type: "bar3D",
      stack: "stack", // Add stack property for stacking
      shading: "lambert",
      label: { show: false },
      data: seriesData,
      emphasis: {
        label: {
          show: false,
        },
      },
      itemStyle: {
        color: chartColors ? chartColors[idx % chartColors.length] : undefined,
        // opacity akan diatur per data point, bukan di level series
      },
    };
  });

  const option = {
    title: titleOptions
      ? {
          text: titleOptions.title || "Stacked 3D Bar Chart",
          subtext: titleOptions.subtitle || "Sample Data",
          left: "center",
          textStyle: {
            fontSize: titleOptions.titleFontSize || 16,
            color: titleOptions.titleColor || "#333",
          },
          subtextStyle: {
            fontSize: titleOptions.subtitleFontSize || 12,
            color: titleOptions.subtitleColor || "#666",
          },
        }
      : undefined,
    tooltip: {
      show: true,
      formatter: (params: any) => {
        const [xVal, yVal, zValue, baseHeight] = params.value;
        const zRaw = (zValue / scaleZ).toFixed(2);

        return `Group: ${params.seriesName}<br/>
                   X: ${xVal}<br/>
                   Y: ${yVal}<br/>
                   Z: ${zRaw}`;
      },
    },
    legend: {
      top: "top",
      right: "right",
      orient: "vertical",
      data: groupCategories,
    },
    xAxis3D: {
      type: "value",
      name: axisLabels?.x || "X",
      nameGap: 20,
      show: useAxis,
      min: Math.min(...xCategories.map((v) => Number(v))),
      max: Math.max(...xCategories.map((v) => Number(v))),
    },
    yAxis3D: {
      type: "value",
      name: axisLabels?.y || "Y",
      nameGap: 20,
      show: useAxis,
      min: Math.min(...yCategories.map((v) => Number(v))),
      max: Math.max(...yCategories.map((v) => Number(v))),
    },
    zAxis3D: {
      type: "value",
      name: axisLabels?.z || "Z",
      nameGap: 20,
      show: useAxis,
    },
    grid3D: {
      viewControl: {
        // autoRotate: true
      },
      light: {
        main: {
          shadow: true,
          quality: "ultra",
          intensity: 1.5,
        },
      },
    },
    series,
  };

  try {
    const chart = echarts.init(container);
    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(container);

    (container as any).cleanup = () => {
      resizeObserver.disconnect();
      chart.dispose();
    };

    return container;
  } catch (error: any) {
    console.error("❌ Error creating ECharts Stacked 3D Bar Chart:", error);

    const fallback = document.createElement("div");
    fallback.style.width = `${width}px`;
    fallback.style.height = `${height}px`;
    fallback.style.display = "flex";
    fallback.style.alignItems = "center";
    fallback.style.justifyContent = "center";
    fallback.style.backgroundColor = "#f0f0f0";
    fallback.style.border = "1px solid #ccc";
    fallback.innerHTML = `
      <div style="text-align: center; color: #666;">
        <div>Error creating 3D chart</div>
        <div style="font-size: 12px; margin-top: 5px;">${error.message}</div>
      </div>
    `;

    return fallback;
  }
}

// ... existing code ...

export function createEChartsGrouped3DScatterPlot(
  data: Array<{
    x: number;
    y: number;
    z: number;
    group: string;
  }>,
  width: number = 600,
  height: number = 400,
  useAxis: boolean = true,
  titleOptions?: {
    title?: string;
    subtitle?: string;
    titleColor?: string;
    subtitleColor?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
  },
  axisLabels?: { x?: string; y?: string; z?: string },
  axisScaleOptions?: any,
  chartColors?: string[]
): HTMLDivElement {
  console.log("🎯 createEChartsGrouped3DScatterPlot called with:", {
    dataLength: data.length,
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    axisScaleOptions,
    chartColors,
    data: data.slice(0, 5), // Log first 5 data points
  });

  // Create container
  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;

  // Get unique groups
  const groups = Array.from(new Set(data.map((d) => d.group)));
  console.log("📊 Unique groups found:", groups);

  // Default colors for groups
  const defaultColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  const colors =
    chartColors && chartColors.length > 0 ? chartColors : defaultColors;

  // Prepare series data for each group
  const series = groups.map((group, index) => {
    const groupData = data
      .filter((d) => d.group === group)
      .map((d) => [d.x, d.y, d.z]);

    return {
      name: group,
      type: "scatter3D",
      data: groupData,
      symbolSize: 8,
      itemStyle: {
        color: colors[index % colors.length],
        opacity: 0.8,
      },
      emphasis: {
        itemStyle: {
          opacity: 1,
        },
      },
    };
  });

  console.log("📈 Series prepared:", series.length, "series");

  // Calculate axis ranges if not provided
  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);
  const zValues = data.map((d) => d.z);

  const xRange = {
    min: axisScaleOptions?.x?.min
      ? parseFloat(axisScaleOptions.x.min)
      : Math.min(...xValues),
    max: axisScaleOptions?.x?.max
      ? parseFloat(axisScaleOptions.x.max)
      : Math.max(...xValues),
  };
  const yRange = {
    min: axisScaleOptions?.y?.min
      ? parseFloat(axisScaleOptions.y.min)
      : Math.min(...yValues),
    max: axisScaleOptions?.y?.max
      ? parseFloat(axisScaleOptions.y.max)
      : Math.max(...yValues),
  };
  const zRange = {
    min: axisScaleOptions?.z?.min
      ? parseFloat(axisScaleOptions.z.min)
      : Math.min(...zValues),
    max: axisScaleOptions?.z?.max
      ? parseFloat(axisScaleOptions.z.max)
      : Math.max(...zValues),
  };

  // Create chart options
  const option = {
    title: titleOptions
      ? {
          text: titleOptions.title || "Grouped 3D Scatter Plot",
          subtext: titleOptions.subtitle || "ECharts 3D Scatter Plot",
          left: "center",
          textStyle: {
            fontSize: titleOptions.titleFontSize || 16,
            color: titleOptions.titleColor || "#333",
          },
          subtextStyle: {
            fontSize: titleOptions.subtitleFontSize || 12,
            color: titleOptions.subtitleColor || "#666",
          },
        }
      : undefined,
    tooltip: {
      show: true,
      formatter: (params: any) => {
        return `Group: ${params.seriesName}<br/>
                X: ${params.data[0]}<br/>
                Y: ${params.data[1]}<br/>
                Z: ${params.data[2]}`;
      },
    },
    legend: {
      top: "top",
      right: "right",
      orient: "vertical",
      data: groups,
    },

    grid3D: {
      boxWidth: 100,
      boxHeight: 100,
      boxDepth: 100,
      viewControl: {
        projection: "perspective",
        autoRotate: false,
        distance: 200,
        alpha: 20,
        beta: 40,
      },
      light: {
        main: {
          intensity: 1.2,
          shadow: true,
        },
        ambient: {
          intensity: 0.3,
        },
      },
    },

    xAxis3D: useAxis
      ? {
          name: axisLabels?.x || "X Axis",
          type: "value",
          min: xRange.min,
          max: xRange.max,
          nameTextStyle: {
            fontSize: 12,
            color: "#333",
          },
        }
      : undefined,

    yAxis3D: useAxis
      ? {
          name: axisLabels?.y || "Y Axis",
          type: "value",
          min: yRange.min,
          max: yRange.max,
          nameTextStyle: {
            fontSize: 12,
            color: "#333",
          },
        }
      : undefined,

    zAxis3D: useAxis
      ? {
          name: axisLabels?.z || "Z Axis",
          type: "value",
          min: zRange.min,
          max: zRange.max,
          nameTextStyle: {
            fontSize: 12,
            color: "#333",
          },
        }
      : undefined,

    series: series,
  };

  console.log("🎨 Chart option created:", option);

  try {
    // Initialize chart
    const chart = echarts.init(container);
    chart.setOption(option);

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      chart.resize();
    });
    resizeObserver.observe(container);

    // Store cleanup function
    (container as any).cleanup = () => {
      resizeObserver.disconnect();
      chart.dispose();
    };

    console.log("✅ ECharts Grouped 3D Scatter Plot created successfully");
    return container;
  } catch (error: any) {
    console.error("❌ Error creating ECharts Grouped 3D Scatter Plot:", error);

    // Create fallback element
    const fallback = document.createElement("div");
    fallback.style.width = `${width}px`;
    fallback.style.height = `${height}px`;
    fallback.style.display = "flex";
    fallback.style.alignItems = "center";
    fallback.style.justifyContent = "center";
    fallback.style.backgroundColor = "#f0f0f0";
    fallback.style.border = "1px solid #ccc";
    fallback.innerHTML = `
      <div style="text-align: center; color: #666;">
        <div>Error creating 3D chart</div>
        <div style="font-size: 12px; margin-top: 5px;">${error.message}</div>
      </div>
    `;

    return fallback;
  }
}

// ... existing code ...

export function createEChartsClustered3DBarChart(
  data: Array<{
    x: string | number;
    y: string | number;
    z: number;
    group: string;
  }>,
  width: number = 600,
  height: number = 400,
  useAxis: boolean = true,
  titleOptions?: {
    title?: string;
    subtitle?: string;
    titleColor?: string;
    subtitleColor?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
  },
  axisLabels?: { x?: string; y?: string; z?: string },
  chartColors?: string[]
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;

  // Deteksi apakah X/Y numerik atau kategori
  const isXNumeric = data.every((d) => typeof d.x === "number");
  const isYNumeric = data.every((d) => typeof d.y === "number");

  const xCategories = isXNumeric
    ? []
    : Array.from(new Set(data.map((d) => String(d.x))));
  const yCategories = isYNumeric
    ? []
    : Array.from(new Set(data.map((d) => String(d.y))));
  const groups = Array.from(new Set(data.map((d) => d.group)));

  // Default colors
  const defaultColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];
  const colors = chartColors?.length ? chartColors : defaultColors;

  const offset = 0.15; // jarak antar-group kecil

  // Series per group
  const series = groups.map((group, idx) => {
    const groupData = data
      .filter((d) => d.group === group)
      .map((d) => {
        const xVal = isXNumeric
          ? (d.x as number) + idx * offset // numerik: geser nilai asli sedikit
          : xCategories.indexOf(String(d.x)) + idx * offset; // kategori: offset index
        const yVal = isYNumeric
          ? (d.y as number) + idx * offset
          : yCategories.indexOf(String(d.y)) + idx * offset;

        return [xVal, yVal, d.z];
      });

    return {
      name: group,
      type: "bar3D",
      data: groupData,
      shading: "lambert",
      barSize: isXNumeric || isYNumeric ? 6 : 8, // numerik -> kecilkan batang
      itemStyle: { color: colors[idx % colors.length], opacity: 0.9 },
    };
  });

  const option = {
    title: titleOptions
      ? {
          text: titleOptions.title || "Clustered 3D Bar Chart",
          subtext: titleOptions.subtitle || "",
          left: "center",
          textStyle: {
            fontSize: titleOptions.titleFontSize || 16,
            color: titleOptions.titleColor || "#333",
          },
          subtextStyle: {
            fontSize: titleOptions.subtitleFontSize || 12,
            color: titleOptions.subtitleColor || "#666",
          },
        }
      : undefined,
    tooltip: {
      show: true,
      formatter: (params: any) => {
        const [xVal, yVal, zVal] = params.value;
        const xLabel = isXNumeric
          ? xVal.toFixed(2)
          : xCategories[Math.floor(xVal)];
        const yLabel = isYNumeric
          ? yVal.toFixed(2)
          : yCategories[Math.floor(yVal)];
        return `Group: ${params.seriesName}<br/>
                X: ${xLabel}<br/>
                Y: ${yLabel}<br/>
                Z: ${zVal}`;
      },
    },
    legend: {
      top: "top",
      right: "right",
      orient: "vertical",
      data: groups,
    },
    grid3D: {
      boxWidth: 100,
      boxHeight: 100,
      boxDepth: 100,
      viewControl: {
        projection: "perspective",
        distance: 200,
        alpha: 20,
        beta: 40,
      },
      light: {
        main: { intensity: 1.2, shadow: true },
        ambient: { intensity: 0.3 },
      },
    },
    xAxis3D: {
      type: isXNumeric ? "value" : "category",
      name: axisLabels?.x || "X Axis",
      data: isXNumeric ? undefined : xCategories,
      show: useAxis,
    },
    yAxis3D: {
      type: isYNumeric ? "value" : "category",
      name: axisLabels?.y || "Y Axis",
      data: isYNumeric ? undefined : yCategories,
      show: useAxis,
    },
    zAxis3D: {
      type: "value",
      name: axisLabels?.z || "Z Axis",
      show: useAxis,
    },
    series,
  };

  const chart = echarts.init(container);
  chart.setOption(option);

  // Resize observer
  const resizeObserver = new ResizeObserver(() => chart.resize());
  resizeObserver.observe(container);
  (container as any).cleanup = () => {
    resizeObserver.disconnect();
    chart.dispose();
  };

  return container;
}

/**
 * Creates a simplified 2D representation for 3D charts when used in small preview sizes
 * This function provides better visual representation for chart selection previews
 */
export function createSimplified2DRepresentation(
  chartType: string,
  width: number,
  height: number,
  useAxis: boolean = false
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.width = width + "px";
  container.style.height = height + "px";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.backgroundColor = "white";
  container.style.borderRadius = "4px";
  container.style.overflow = "hidden";

  // Create SVG for 2D representation
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "white");

  const margin = { top: 5, right: 5, bottom: 5, left: 5 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create chart group
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Different representations based on chart type
  if (chartType.includes("Bar")) {
    if (chartType.includes("Clustered")) {
      // Create simplified clustered bar chart representation
      const categories = ["A", "B", "C"];
      const groups = ["X", "Y"];
      const data = [
        { category: "A", group: "X", value: 30 },
        { category: "A", group: "Y", value: 20 },
        { category: "B", group: "X", value: 45 },
        { category: "B", group: "Y", value: 35 },
        { category: "C", group: "X", value: 60 },
        { category: "C", group: "Y", value: 50 },
      ];

      const xScale = d3
        .scaleBand()
        .domain(categories)
        .range([0, chartWidth])
        .padding(0.2);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) || 100])
        .range([chartHeight, 0]);

      const groupScale = d3
        .scaleBand()
        .domain(groups)
        .range([0, xScale.bandwidth()])
        .padding(0.1);

      // Create clustered bars
      g.selectAll(".category")
        .data(categories)
        .enter()
        .append("g")
        .attr("class", "category")
        .attr("transform", (d) => `translate(${xScale(d)}, 0)`)
        .selectAll("rect")
        .data((d) =>
          groups.map((group) => ({
            category: d,
            group,
            value:
              data.find((item) => item.category === d && item.group === group)
                ?.value || 0,
          }))
        )
        .enter()
        .append("rect")
        .attr("x", (d) => groupScale(d.group) || 0)
        .attr("y", (d) => yScale(d.value))
        .attr("width", groupScale.bandwidth())
        .attr("height", (d) => chartHeight - yScale(d.value))
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
        .attr("opacity", 0.8);
    } else if (chartType.includes("Stacked")) {
      // Create simplified stacked bar chart representation
      const categories = ["A", "B", "C"];
      const groups = ["X", "Y", "Z"];
      const data = [
        { category: "A", group: "X", value: 20 },
        { category: "A", group: "Y", value: 15 },
        { category: "A", group: "Z", value: 10 },
        { category: "B", group: "X", value: 25 },
        { category: "B", group: "Y", value: 20 },
        { category: "B", group: "Z", value: 15 },
        { category: "C", group: "X", value: 30 },
        { category: "C", group: "Y", value: 25 },
        { category: "C", group: "Z", value: 20 },
      ];

      const xScale = d3
        .scaleBand()
        .domain(categories)
        .range([0, chartWidth])
        .padding(0.2);

      const yScale = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(
            categories.map((cat) =>
              data
                .filter((d) => d.category === cat)
                .reduce((sum, d) => sum + d.value, 0)
            )
          ) || 100,
        ])
        .range([chartHeight, 0]);

      // Create stacked bars
      categories.forEach((category, catIndex) => {
        let yOffset = 0;
        groups.forEach((group, groupIndex) => {
          const value =
            data.find((d) => d.category === category && d.group === group)
              ?.value || 0;
          if (value > 0) {
            g.append("rect")
              .attr("x", xScale(category) || 0)
              .attr("y", yScale(yOffset + value))
              .attr("width", xScale.bandwidth())
              .attr("height", chartHeight - yScale(value))
              .attr("fill", d3.schemeCategory10[groupIndex % 10])
              .attr("opacity", 0.8);
            yOffset += value;
          }
        });
      });
    } else {
      // Create simplified regular bar chart representation
      const data = [30, 60, 45, 80, 35];
      const barWidth = (chartWidth / data.length) * 0.8;
      const barSpacing = (chartWidth / data.length) * 0.2;

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data) || 100])
        .range([chartHeight, 0]);

      g.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * (barWidth + barSpacing))
        .attr("y", (d) => yScale(d))
        .attr("width", barWidth)
        .attr("height", (d) => chartHeight - yScale(d))
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
        .attr("opacity", 0.8);
    }

    // Add 3D effect with gradient for all bar types
    g.selectAll("rect").each(function () {
      const rect = d3.select(this);
      const fill = rect.attr("fill");

      // Create gradient for 3D effect
      const gradient = svg
        .append("defs")
        .append("linearGradient")
        .attr("id", `grad-${Math.random().toString(36).substr(2, 9)}`);

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color(fill)?.brighter(0.3)?.toString() || fill);

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(fill)?.darker(0.3)?.toString() || fill);

      rect.attr("fill", `url(#${gradient.attr("id")})`);
    });
  } else if (chartType.includes("Scatter")) {
    if (chartType.includes("Grouped")) {
      // Create simplified grouped scatter plot representation
      const groups = ["A", "B", "C"];
      const data = [
        { x: 20, y: 30, group: "A" },
        { x: 40, y: 60, group: "A" },
        { x: 60, y: 40, group: "B" },
        { x: 80, y: 70, group: "B" },
        { x: 30, y: 50, group: "C" },
        { x: 70, y: 20, group: "C" },
        { x: 25, y: 45, group: "A" },
        { x: 55, y: 35, group: "B" },
        { x: 65, y: 55, group: "C" },
      ];

      const xScale = d3.scaleLinear().domain([0, 100]).range([0, chartWidth]);
      const yScale = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);

      // Create scatter points with different colors for each group
      g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 3)
        .attr("fill", (d) => {
          const groupIndex = groups.indexOf(d.group);
          return d3.schemeCategory10[groupIndex % 10];
        })
        .attr("opacity", 0.7);

      // Add legend-like indicators
      groups.forEach((group, index) => {
        const legendX = chartWidth - 20;
        const legendY = 10 + index * 8;

        g.append("circle")
          .attr("cx", legendX)
          .attr("cy", legendY)
          .attr("r", 2)
          .attr("fill", d3.schemeCategory10[index % 10])
          .attr("opacity", 0.8);
      });
    } else {
      // Create simplified regular scatter plot representation
      const data = [
        { x: 20, y: 30 },
        { x: 40, y: 60 },
        { x: 60, y: 40 },
        { x: 80, y: 70 },
        { x: 30, y: 50 },
        { x: 70, y: 20 },
        { x: 25, y: 45 },
        { x: 55, y: 35 },
        { x: 65, y: 55 },
      ];

      const xScale = d3.scaleLinear().domain([0, 100]).range([0, chartWidth]);
      const yScale = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);

      g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 3)
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
        .attr("opacity", 0.7);
    }
  } else if (chartType.includes("Line")) {
    // Create simplified line chart representation
    const data = [30, 60, 45, 80, 35, 70, 50];

    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data) || 100])
      .range([chartHeight, 0]);

    const line = d3
      .line<number>()
      .x((d, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#1f77b4")
      .attr("stroke-width", 2)
      .attr("d", line);
  } else {
    // Default representation - simple geometric shapes
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;
    const size = Math.min(chartWidth, chartHeight) * 0.3;

    // Create a 3D-like cube representation
    const cube = g
      .append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`);

    // Front face
    cube
      .append("rect")
      .attr("x", -size / 2)
      .attr("y", -size / 2)
      .attr("width", size)
      .attr("height", size)
      .attr("fill", "#1f77b4")
      .attr("opacity", 0.8);

    // Top face (for 3D effect)
    cube
      .append("polygon")
      .attr(
        "points",
        `${-size / 2},${-size / 2} ${size / 2},${-size / 2} ${
          size / 2 + size * 0.3
        },${-size / 2 - size * 0.3} ${-size / 2 + size * 0.3},${
          -size / 2 - size * 0.3
        }`
      )
      .attr("fill", "#1f77b4")
      .attr("opacity", 0.6);

    // Right face (for 3D effect)
    cube
      .append("polygon")
      .attr(
        "points",
        `${size / 2},${-size / 2} ${size / 2},${size / 2} ${
          size / 2 + size * 0.3
        },${size / 2 - size * 0.3} ${size / 2 + size * 0.3},${
          -size / 2 - size * 0.3
        }`
      )
      .attr("fill", "#1f77b4")
      .attr("opacity", 0.4);
  }

  // Add subtle grid lines for better visual context
  if (useAxis && width > 60 && height > 60) {
    const gridSize = 20;

    // Vertical grid lines
    for (let i = 0; i <= chartWidth; i += gridSize) {
      g.append("line")
        .attr("x1", i)
        .attr("y1", 0)
        .attr("x2", i)
        .attr("y2", chartHeight)
        .attr("stroke", "#f0f0f0")
        .attr("stroke-width", 0.5);
    }

    // Horizontal grid lines
    for (let i = 0; i <= chartHeight; i += gridSize) {
      g.append("line")
        .attr("x1", 0)
        .attr("y1", i)
        .attr("x2", chartWidth)
        .attr("y2", i)
        .attr("stroke", "#f0f0f0")
        .attr("stroke-width", 0.5);
    }
  }

  return container;
}
