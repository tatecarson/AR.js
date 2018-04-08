//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////

// init renderer
var renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setClearColor(new THREE.Color("lightgrey"), 0);
renderer.setSize(640, 480);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0px";
renderer.domElement.style.left = "0px";
document.body.appendChild(renderer.domElement);

// array of functions for the rendering loop
var onRenderFcts = [];

// init scene and camera
var scene = new THREE.Scene();

//////////////////////////////////////////////////////////////////////////////////
//		Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////

// Create a camera
var camera = new THREE.Camera();
scene.add(camera);

////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

var arToolkitSource = new THREEx.ArToolkitSource({
  // to read from the webcam
  sourceType: "webcam"

  // // to read from an image
  // sourceType : 'image',
  // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

  // to read from a video
  // sourceType : 'video',
  // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
});

arToolkitSource.init(function onReady() {
  onResize();
});

// handle resize
window.addEventListener("resize", function() {
  onResize();
});

function onResize() {
  arToolkitSource.onResize();
  arToolkitSource.copySizeTo(renderer.domElement);
  if (arToolkitContext.arController !== null) {
    arToolkitSource.copySizeTo(arToolkitContext.arController.canvas);
  }
}
////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////

// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
  cameraParametersUrl:
    THREEx.ArToolkitContext.baseURL + "../../data/data/camera_para.dat",
  detectionMode: "mono"
});
// initialize it
arToolkitContext.init(function onCompleted() {
  // copy projection matrix to camera
  camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
});

// update artoolkit on every frame
onRenderFcts.push(function() {
  if (arToolkitSource.ready === false) return;

  arToolkitContext.update(arToolkitSource.domElement);

  // update scene.visible if the marker is seen
  scene.visible = camera.visible;
  //   if (camera.visible) console.log("is this doing it??");
});
// if (camera.visible) console.log("is this doing it??");
////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

// init controls for camera
var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
  type: "pattern",
  patternUrl: THREEx.ArToolkitContext.baseURL + "../../data/data/patt.hiro",
  // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
  // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
  changeMatrixMode: "cameraTransformMatrix"
});
// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
scene.visible = false;

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

// add a torus knot
var geometry = new THREE.CubeGeometry(1, 1, 1);
var material = new THREE.MeshNormalMaterial({
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide
});
var mesh = new THREE.Mesh(geometry, material);
mesh.position.y = geometry.parameters.height / 2;
scene.add(mesh);

var geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
var material = new THREE.MeshNormalMaterial();
var mesh = new THREE.Mesh(geometry, material);
mesh.position.y = 0.5;
scene.add(mesh);

onRenderFcts.push(function(delta) {
  mesh.rotation.x += Math.PI * delta;
});

//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// render the scene
onRenderFcts.push(function() {
  renderer.render(scene, camera);
});

var distortion = new Tone.Distortion(0.4).toMaster();

var synth = new Tone.Synth().connect(distortion);

var loop = new Tone.Loop(function(time) {
  synth.triggerAttackRelease("C2", "8n", time);
}, "4n");
loop.start();
Tone.Transport.start();

// run the rendering loop
var lastTimeMsec = null;
requestAnimationFrame(function animate(nowMsec) {
  // keep looping
  requestAnimationFrame(animate);
  // measure time
  lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
  var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
  lastTimeMsec = nowMsec;
  // call each update function
  onRenderFcts.forEach(function(onRenderFct) {
    onRenderFct(deltaMsec / 1000, nowMsec / 1000);
  });

  if (camera.visible) {
    console.log("is this doing it??");
    distortion.value = 1;
  } else {
    distortion.value = 0;
  }
});
StartAudioContext(Tone.context, "#start");
