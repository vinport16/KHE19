var camera, scene, renderer;
var cubes = [];

init();
animate();

function init() {

    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0x212223));

    for (var i = 0; i < 10; i++) {
        var cubeGeometry = new THREE.CubeGeometry(1, 1.5, 1);
        var cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x1ec876 });
        var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(i*1.2, 0, 0.5);
        cube.castShadow = true;
        scene.add(cube);
        
        cubes.push(cube);
    }

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000); // CHANGED
    camera.position.x = 0; // CHANGED
    camera.position.y = 0; // CHANGED
    camera.position.z = 100; // CHANGED
//    camera.lookAt(cubes[5].position);
//    scene.add(camera); // not required

    var terrainGeo = new THREE.PlaneGeometry(50, 50);
    var terrainMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0a0 });
    var terrain = new THREE.Mesh(terrainGeo, terrainMaterial);
    terrain.position.z = - 10; // CHANGED
    terrain.receiveShadow = true;
    scene.add(terrain);

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
    scene.add( new THREE.DirectionalLightHelper(light, 1) );
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = false;
    document.body.appendChild(renderer.domElement);

	// controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );

}

function animate() {
    requestAnimationFrame(animate);
    for (var i = 0; i < cubes.length; i++) {
        cubes[i].rotation.x += 0.01 * i;
        cubes[i].rotation.y += 0.02 * i;
    }

    renderer.render(scene, camera);
}