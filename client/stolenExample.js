var socket = io();
socket.emit("map");

import { PointerLockControls } from '../pointerlock.js';
var camera, scene, renderer, controls;
var myMap;
var objects = [];
var raycaster;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();
init();
animate();
function init() {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.y = 10;
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    scene.fog = new THREE.Fog( 0xffffff, 0, 750 );
    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );
    controls = new PointerLockControls( camera );
    var blocker = document.getElementById( 'blocker' );
    var instructions = document.getElementById( 'instructions' );
    instructions.addEventListener( 'click', function () {
        controls.lock();
    }, false );
    controls.addEventListener( 'lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    } );
    controls.addEventListener( 'unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    } );
    scene.add( controls.getObject() );
    var onKeyDown = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;
        }
    };
    var onKeyUp = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );
    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
    // floor
    var floorGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 100, 100 );
    floorGeometry.rotateX( - Math.PI / 2 );
    // vertex displacement
    var position = floorGeometry.attributes.position;
    for ( var i = 0, l = position.count; i < l; i ++ ) {
        vertex.fromAttribute( position, i );
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;
        position.setXYZ( i, vertex.x, vertex.y, vertex.z );
    }
    floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
    position = floorGeometry.attributes.position;

    var floorMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );
    var floor = new THREE.Mesh( floorGeometry, floorMaterial );
    scene.add( floor );


    var light = new THREE.DirectionalLight(0xffffff, 1);
        light.castShadow = true;
        light.shadowCameraVisible = true;
        light.shadow.camera.near = 100;
        light.shadow.camera.far = 200;
        light.shadow.camera.left = -20; // CHANGED
        light.shadow.camera.right = 20; // CHANGED
        light.shadow.camera.top = 20; // CHANGED
        light.shadow.camera.bottom = -20; // CHANGED

        light.position.set(-60, 200, 100); // CHANGED
        scene.add(light);
        scene.add(new THREE.DirectionalLightHelper(light, 0.2));
    //
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    //
    window.addEventListener( 'resize', onWindowResize, false );
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function get_spaces(x,y,z) {
  return [[x + 1, y, z + 1], [x + 1, y, z], [x + 1, y, z - 1], [x, y, z - 1], [x - 1, y, z - 1],
          [x - 1, y, z], [x - 1, y, z + 1], [x, y, z + 1]]
}
function horizontalCollision() {
  var rays = [
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(-1, 0, 0)
  ];

  var caster = new THREE.Raycaster();
  var collisions, i;
  // Maximum distance from the origin before we consider collision
  var max_dist = 8;
  // For each ray
  for (i = 0; i < rays.length; i += 1) {
    caster.set(controls.getObject().position, rays[i]);
    caster.ray.origin.y -= 20;
    // Test if we intersect with any obstacle mesh
    collisions = caster.intersectObjects(objects);

    if(collisions.length > 0 && collisions[0].distance <= max_dist) {
      return true;
    }
  }

  return false;
}
function animate() {
    requestAnimationFrame( animate );

    if ( controls.isLocked === true ) {
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 24;
        var intersections = raycaster.intersectObjects( objects );
        var onObject = intersections.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions
        if ( moveForward || moveBackward ) velocity.z -= direction.z * 800.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 800.0 * delta;
        if ( onObject === true ) {
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        }
        controls.moveRight( - velocity.x * delta );
        controls.moveForward( - velocity.z * delta );
        controls.getObject().position.y += ( velocity.y * delta ); // new behavior
        if ( controls.getObject().position.y < 10 ) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }

        var collision = horizontalCollision();
        console.log(collision)
        if(collision) {
          velocity.x = 0;
          velocity.z = 0;
        }
        prevTime = time;
    }
    renderer.render( scene, camera );
}


socket.on("map", function(map){
    var floorGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 100, 100 );
    var position = floorGeometry.attributes.position;
    // objects
    var boxGeometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
    boxGeometry = boxGeometry.toNonIndexed(); // ensure each face has unique vertices
    position = boxGeometry.attributes.position;

    var boxMaterial = new THREE.MeshLambertMaterial({ color: 0xf0ff00 });
    boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    myMap = map;

    map.forEach(function(layer, i) {
        layer.forEach(function(line, j) {
            line.forEach(function(char, k) {
                if(map[i][j][k] == 1){
                    var box = new THREE.Mesh( boxGeometry, boxMaterial );
                    box.position.x = k*20;
                    box.position.y = i*20;
                    box.position.z = j*20;
                    scene.add(box);
                    objects.push(box);
                }

            });
        });
    });

});
