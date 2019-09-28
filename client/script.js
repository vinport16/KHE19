var scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0x212223));

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var geometry = new THREE.BoxGeometry(1, 2, 1);
var material = new THREE.MeshLambertMaterial({ color: 0xf0ff00 });
var cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;

scene.add(cube);

geometry = new THREE.BoxGeometry(5, 1, 10);
material = new THREE.MeshLambertMaterial({ color: 0x00ffff });
cube = new THREE.Mesh(geometry, material);
cube.position.set(0, -5, 0);
cube.castShadow = true;

scene.add(cube);

geometry = new THREE.BoxGeometry(1, 7, 5);
material = new THREE.MeshLambertMaterial({ color: 0xf0ff00 });
cube = new THREE.Mesh(geometry, material);
cube.position.set(2, 0, 0);
cube.recieveShadow = true;

cube.castShadow = true;

scene.add(cube);

//lines
material = new THREE.LineBasicMaterial({ color: 0xffffff });

geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3(-1, 0, 0));
geometry.vertices.push(new THREE.Vector3(0, 1, 0));
geometry.vertices.push(new THREE.Vector3(1, 0, 0));

var line = new THREE.Line(geometry, material);

scene.add(line);


var light = new THREE.DirectionalLight(0xffffff, 1);
light.castShadow = true;
light.shadowCameraVisible = true;
light.shadowCameraNear = 100;
light.shadowCameraFar = 200;
light.shadowCameraLeft = -20; // CHANGED
light.shadowCameraRight = 20; // CHANGED
light.shadowCameraTop = 20; // CHANGED
light.shadowCameraBottom = -20; // CHANGED

light.position.set(-60, 20, 100); // CHANGED
scene.add(light);
scene.add(new THREE.DirectionalLightHelper(light, 0.2));




camera.position.z = 15;
camera.position.y = 3;
camera.position.x = -5;
camera.rotation.x = -0.2;
camera.rotation.y = -0.1;


THREE.PointerLockControls = function (camera, domElement) {

this.domElement = domElement || document.body;
this.isLocked = false;

//
// internals
//

var scope = this;

var changeEvent = { type: 'change' };
var lockEvent = { type: 'lock' };
var unlockEvent = { type: 'unlock' };

var euler = new THREE.Euler(0, 0, 0, 'YXZ');

var PI_2 = Math.PI / 2;

var vec = new Vector3();

function onMouseMove(event) {
    if (scope.isLocked === false) return;
    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    euler.setFromQuaternion(camera.quaternion);

    euler.y -= movementX * 0.002;
    euler.x -= movementY * 0.002;

    euler.x = Math.max(- PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
    scope.dispatchEvent(changeEvent);
}

function onPointerlockChange() {
    if (document.pointerLockElement === scope.domElement) {
        scope.dispatchEvent(lockEvent);
        scope.isLocked = true;
    } else {
        scope.dispatchEvent(unlockEvent);
        scope.isLocked = false;
    }
}

function onPointerlockError() {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
}

this.connect = function () {
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('pointerlockchange', onPointerlockChange, false);
    document.addEventListener('pointerlockerror', onPointerlockError, false);
};

this.disconnect = function () {
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('pointerlockchange', onPointerlockChange, false);
    document.removeEventListener('pointerlockerror', onPointerlockError, false);
};

this.dispose = function () {
    this.disconnect();
};

this.getObject = function () { // retaining this method for backward compatibility
    return camera;
};

this.getDirection = function () {
    var direction = new THREE.Vector3(0, 0, - 1);
    return function (v) {
        return v.copy(direction).applyQuaternion(camera.quaternion);
    };
}();

this.moveForward = function (distance) {
    // move forward parallel to the xz-plane
    // assumes camera.up is y-up
    vec.setFromMatrixColumn(camera.matrix, 0);
    vec.crossVectors(camera.up, vec);
    camera.position.addScaledVector(vec, distance);
};

this.moveRight = function (distance) {
    vec.setFromMatrixColumn(camera.matrix, 0);
    camera.position.addScaledVector(vec, distance);
};

this.lock = function () {
    this.domElement.requestPointerLock();

};

this.unlock = function () {
    document.exitPointerLock();

};

this.connect();

};

THREE.PointerLockControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.PointerLockControls.prototype.constructor = THREE.PointerLockControls;

var animate = function () {
requestAnimationFrame(animate);

cube.rotation.x += 0.00;
cube.rotation.y += 0.00;

renderer.render(scene, camera);
};

animate();