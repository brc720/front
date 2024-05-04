import * as THREE from 'three';
import { OrbitControls } from '@three-ts/orbit-controls';

export function craeteThree(base64text: string) {
  // 伪代码中的u8, u16等类型在JavaScript中都会被视为Number类型
  class Header {
    x;
    y;
    z;
    enableColorLimit;
    cubeLen;
    colorLen;
    constructor(x: number, y: number, z: number, enableColorLimit: boolean, cubeLen: number, colorLen: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.enableColorLimit = enableColorLimit; // bool
      this.cubeLen = cubeLen; // u16
      this.colorLen = colorLen; // u16
    }
  }
  class VoxelModel {
    header;
    colorIdx
    colorPalette
    bit


    constructor(header: any) {
      this.header = header;
      this.colorIdx = [];
      this.colorPalette = [];
      this.bit = [];

      if (this.header.enableColorLimit) {
        // 初始化colorIdx和colorPalette的大小和值为示例代码中的默认值
        this.colorIdx = new Array((header.cubeLen + 1) / 2 * 2); // 这里可能需要根据实际情况进行取整处理
        this.colorPalette = new Array(16); // 填充Read_Rgb函数返回的颜色字符串
      } else {
        this.colorIdx = new Array(header.cubeLen);
        this.colorPalette = new Array(header.colorLen); // 填充Read_Rgb函数返回的颜色字符串
      }

      // 初始化bit数组；可以使用布尔值数组或者使用更高效的位操作存储voxel状态
      this.bit = new Array(header.x * header.y * header.z).fill(false);
    }
  }
  const binaryData = atob(base64text);
  // 创建一个空的Buffer对象
  let buffer = new ArrayBuffer(binaryData.length);
  // 创建一个视图对象，并将二进制数据复制到其中
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binaryData.length; ++i) {
    view[i] = binaryData.charCodeAt(i);
  }
  // 将Buffer对象转换为十六进制字符串
  const hexString = Array.from(new Uint8Array(view))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  function change16(hexString: string) {
    const x = parseInt('0x' + hexString.slice(0, 2), 16)
    const y = parseInt('0x' + hexString.slice(2, 4).toString(), 16)
    const z = parseInt('0x' + hexString.slice(4, 6).toString(), 16)
    const enableColorLimit = Boolean(parseInt('0x' + hexString.slice(6, 8).toString()));
    const cubeLen = parseInt('0x' + hexString.slice(10, 12).toString() + hexString.slice(8, 10).toString(), 16);
    const colorLen = parseInt('0x' + hexString.slice(14, 16).toString() + hexString.slice(12, 14).toString(), 16);
    let bitmanarrData = new VoxelModel(new Header(x, y, z, enableColorLimit, cubeLen, colorLen));
    for (let i = 0; i < bitmanarrData.colorIdx.length; i++) {
      if (i % 2 == 0) {
        bitmanarrData.colorIdx[i] = parseInt('0x' + hexString.slice(16 + i + 1, 17 + i + 1), 16);
      } else {
        bitmanarrData.colorIdx[i] = parseInt('0x' + hexString.slice(16 + i - 1, 17 + i - 1), 16);
      }
    }
    let colorIdx = bitmanarrData.colorIdx.length - 1;
    if (bitmanarrData.colorIdx.length % 2 == 0) {
      colorIdx = bitmanarrData.colorIdx.length;
    }
    for (let i = 0; i < bitmanarrData.colorPalette.length; i++) {
      bitmanarrData.colorPalette[i] = parseInt('0x' +
        hexString.slice(22 + colorIdx + i * 8, 24 + colorIdx + i * 8) +
        hexString.slice(20 + colorIdx + i * 8, 22 + colorIdx + i * 8) +
        hexString.slice(18 + colorIdx + i * 8, 20 + colorIdx + i * 8) +
        hexString.slice(16 + colorIdx + i * 8, 18 + colorIdx + i * 8), 16);
    }
    for (let i = 0; i < bitmanarrData.bit.length; i++) {
      let index = i % 8
      let num = Math.floor(i / 8)
      let decodedString1 = parseInt('0x' + hexString.slice(24 + colorIdx + (bitmanarrData.colorPalette.length - 1) * 8 + num * 2, 26 + colorIdx + (bitmanarrData.colorPalette.length - 1) * 8 + num * 2), 16).toString(2).padStart(8, '0');
      bitmanarrData.bit[i] = decodedString1.slice(8 - index - 1, 8 - index);
    }
    return bitmanarrData;
  }
  let bitmanarrData = change16(hexString)


  function rgbToHex(r: number, g: number, b: number) {
    r = Math.floor((255 * r + 0.5)); // Round the value of red channel
    g = Math.floor((255 * g + 0.5)); // Round the value of green channel
    b = Math.floor((255 * b + 0.5)); // Round the value of blue channel
    var hexR = (r < 16 ? "0" : "") + r.toString(16); // Convert red channel to hexadecimal and add leading zero if necessary
    var hexG = (g < 16 ? "0" : "") + g.toString(16); // Convert green channel to hexadecimal and add leading zero if necessary
    var hexB = (b < 16 ? "0" : "") + b.toString(16); // Convert blue channel to hexadecimal and add leading zero if necessary
    return "#" + hexR + hexG + hexB; // Return the converted color in hexadecimal format with a hash symbol at the beginning
  }
  const scene = new THREE.Scene();
  //  // 添加平行光源
  const light = new THREE.DirectionalLight(0xffffff, 5);
  light.position.set(-1, -1, 1).normalize();
  scene.add(light);
  const camera = new THREE.PerspectiveCamera(105, 600 / 600, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(480, 438);
  renderer.setPixelRatio(2);

  const dom = document.getElementById('canvas-container')
  dom ? dom.innerHTML = "" : '';
  dom?.appendChild(renderer.domElement);
  renderer.domElement.style.margin = '10px auto 0';

  // renderer.setClearColor(0xffffff); // 设置背景颜色为绿色
  // renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // 设置曝光度
  // renderer.toneMappingExposure = 5 // 适当调整曝光度
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  //添加光源 这里添加了两个光源
  //AmbientLight：环境光源，均匀照亮所有物体，防止有些光源照射不到呈现不出来
  //PointLight：点光源，类似灯泡发出的光，可以投射阴影，使模型更加立体
  const ambientLight = new THREE.AmbientLight(0xffffff, 3),
    pointLight = new THREE.PointLight(0xffffff, 3)

  //设置点光源所在位置
  pointLight.position.set(20, 25, 30)
  //每创建一个object都需要将其添加到三维场景中 将环境光源和点光源添加到场景中
  scene.add(ambientLight)
  scene.add(pointLight)
  let cubeindex = 0;
  for (let i = 0; i < bitmanarrData.bit.length; i++) {
    if (bitmanarrData.bit[i] != '0') {
      const r = (bitmanarrData.colorPalette[bitmanarrData.colorIdx[cubeindex]] / 256 / 256) / 255;
      const g = (bitmanarrData.colorPalette[bitmanarrData.colorIdx[cubeindex]] / 256 % 256) / 255;
      const b = (bitmanarrData.colorPalette[bitmanarrData.colorIdx[cubeindex]] % 256) / 255;
      const material = new THREE.MeshPhongMaterial({ color: rgbToHex(r, g, b), shininess: 500, });
      material.flatShading = false; // 开启平面着色效果
      cubeindex++;
      const cube = new THREE.Mesh(geometry, material);
      cube.castShadow = true; // 开启阴影投射
      cube.receiveShadow = true; // 接收其他对象的阴影
      cube.position.x = Math.floor(i / bitmanarrData.header.y / bitmanarrData.header.z) * 1 - bitmanarrData.header.x * 1 / 2
      cube.position.z = bitmanarrData.header.y - Math.floor(i / bitmanarrData.header.z % bitmanarrData.header.y) * 1 - bitmanarrData.header.y * 1 / 2
      cube.position.y = Math.floor(i % bitmanarrData.header.z) * 1 - bitmanarrData.header.z * 1 / 2
      // cube加入场景
      scene.add(cube);
    }
  }
  camera.position.z = -5;
  camera.position.y = 0;
  camera.position.x = 20;
  //设置相机位置
  renderer.render(scene, camera);
  const controls = new OrbitControls(camera, renderer.domElement)
  //控制缩放大小
  controls.minDistance = 15;
  controls.maxDistance = 40;
  controls.addEventListener('change', render);
  render()
  function render() {
    renderer.render(scene, camera);
  }
  var newCtx = renderer.domElement.toDataURL();
  console.log('toDataURL:', newCtx);

  // createCanvas(bitmanarrData);
  return newCtx
}