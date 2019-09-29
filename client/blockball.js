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
var terminalVelocityY = -200;
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();
var sprint = false;
var startTime = Date.now();

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.y = 200;
    scene = new THREE.Scene();
    //scene.background = new THREE.Color( 0x44ff00 );
    scene.background = new THREE.MeshLambertMaterial({ color: 0x663333 });
    scene.fog = new THREE.Fog( 0x99ff88, 0, 1000 );
    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );

    add_crosshair(camera);

    controls = new PointerLockControls( camera );
    var blocker = document.getElementById( 'blocker' );
    var instructions = document.getElementById( 'instructions' );
    var leaderboard = document.getElementById( 'leaderboard' );
    var startButton = document.getElementById('startButton');
    startButton.addEventListener( 'click', function () {
        var username = document.getElementById('userName').value;
        socket.emit("setName", username);
        controls.lock();
    }, false );
    controls.addEventListener( 'lock', function () {
        instructions.style.display = 'none';
        leaderboard.style.display = '';
        blocker.style.display = 'none';
    } );
    controls.addEventListener( 'unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
        leaderboard.style.display = '';
    } );
    controls.getObject().position.x = 200;
    controls.getObject().position.y = 120;
    controls.getObject().position.z = 200;
    scene.add( controls.getObject() );
    var onKeyDown = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                var elapsedTime = ((Date.now() - startTime)/ 1000).toFixed(3);
                if(elapsedTime < 0.5){
                    sprint = true;
                }
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
                if ( canJump === true ) velocity.y += 180;
                canJump = false;
                break;
        }
    };
    var onKeyUp = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                startTime = Date.now();
                sprint = false;
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
    var onClick = function ( event ) {
        var vector = new THREE.Vector3( 0, 0, - 1 );
        vector.applyQuaternion( camera.quaternion );

        socket.emit("launch", {dx:vector.x, dy:vector.y, dz:vector.z});

    }
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );
    document.addEventListener( 'click', onClick, false);
    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );



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
    renderer.setClearColor (0xffaadd, 1);
    document.body.appendChild( renderer.domElement );
    //
    window.addEventListener( 'resize', onWindowResize, false );
}
function add_crosshair(camera) {
  var material = new THREE.LineBasicMaterial({ color: 0xAAFFAA });
  // crosshair size
  var x = 0.1, y = 0.1;

  var geometry = new THREE.Geometry();

  // crosshair
  geometry.vertices.push(new THREE.Vector3(0, y, 0));
  geometry.vertices.push(new THREE.Vector3(0, -y, 0));
  geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  geometry.vertices.push(new THREE.Vector3(x, 0, 0));
  geometry.vertices.push(new THREE.Vector3(-x, 0, 0));

  var crosshair = new THREE.Line( geometry, material );

  // place it in the center
  var crosshairPercentX = 50;
  var crosshairPercentY = 50;
  var crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
  var crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;

  crosshair.position.x = crosshairPositionX * camera.aspect;
  crosshair.position.y = crosshairPositionY;

  crosshair.position.z = -5;

  camera.add( crosshair );
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function getFromMap(mapPos){
    if(mapPos.x >= 0 && mapPos.y >= 0 && mapPos.z >= 0){
        if(mAP.length > mapPos.y && mAP[0].length > mapPos.z && mAP[0][0].length > mapPos.x){
            return mAP[mapPos.y][mapPos.z][mapPos.x];
        }
    }
    return 0;
}

function isColliding(){
    var collidingWith = [];
    var checkspots = [];
    var p = controls.getObject();
    var mapPos = {};
    mapPos.x = ((p.position.x+10)/20);
    mapPos.y = ((p.position.y-5)/20);
    mapPos.z = ((p.position.z+10)/20);
    mapPos.ox = false;
    mapPos.oz = false;

    if(mapPos.x % 1 > 0.675){
        mapPos.ox = mapPos.x+1;
    }else if(mapPos.x < 0.325){
        mapPos.ox = mapPos.x-1;
    }

    if(mapPos.z % 1 > 0.675){
        mapPos.oz = mapPos.z+1;
    }else if(mapPos.z < 0.325){
        mapPos.oz = mapPos.z-1;
    }

    checkspots.push({x:Math.floor(mapPos.x),y:Math.floor(mapPos.y),z:Math.floor(mapPos.z)});
    if(mapPos.ox){checkspots.push({x:Math.floor(mapPos.ox),y:Math.floor(mapPos.y),z:Math.floor(mapPos.z)});}
    if(mapPos.oz){checkspots.push({x:Math.floor(mapPos.x),y:Math.floor(mapPos.y),z:Math.floor(mapPos.oz)});}
    if(mapPos.ox && mapPos.oz){checkspots.push({x:Math.floor(mapPos.ox),y:Math.floor(mapPos.y),z:Math.floor(mapPos.oz)});}

    checkspots.push({x:Math.floor(mapPos.x),y:Math.floor(mapPos.y)+1,z:Math.floor(mapPos.z)});
    if(mapPos.ox){checkspots.push({x:Math.floor(mapPos.ox),y:Math.floor(mapPos.y)+1,z:Math.floor(mapPos.z)});}
    if(mapPos.oz){checkspots.push({x:Math.floor(mapPos.x),y:Math.floor(mapPos.y)+1,z:Math.floor(mapPos.oz)});}
    if(mapPos.ox && mapPos.oz){checkspots.push({x:Math.floor(mapPos.ox),y:Math.floor(mapPos.y)+1,z:Math.floor(mapPos.oz)});}

    var collision = false;

    for(var i in checkspots){
        if(getFromMap(checkspots[i]) != 0){
            collision = true;
            collidingWith.push(checkspots[i])
            //console.log("colliding");
            return true;
        }
    }
    return false;
}

function animate() {
    requestAnimationFrame( animate );
    
    if(controls.getObject().position.y <= 15) {
        velocity.y = 0;
        respawn();
    }

    if ( controls.isLocked === true ) {

        var op = {};
        op.x = controls.getObject().position.x;
        op.y = controls.getObject().position.y;
        op.z = controls.getObject().position.z;

        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 24;
        var intersections = raycaster.intersectObjects( objects );
        var onObject = intersections.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 50.0 * delta; // 100.0 = mass
        if(velocity.y < terminalVelocityY) {
            velocity.y = terminalVelocityY;
          }
        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions
        if(sprint && (moveForward || moveBackward)){
            velocity.z -= direction.z * 1600.0 * delta;
        }
        else if ( moveForward || moveBackward ){velocity.z -= direction.z * 800.0 * delta;}
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 800.0 * delta;
        if ( onObject === true ) {
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        }
        controls.moveRight( - velocity.x * delta );
        controls.moveForward( - velocity.z * delta );
        controls.getObject().position.y += ( velocity.y * delta ); // new behavior

        if(isColliding()){
            controls.getObject().position.x = op.x;
            //controls.getObject().position.y = op.y;
            controls.getObject().position.z = op.z;
        }

        // if ( controls.getObject().position.y < 10 ) {
        //     velocity.y = 0;
        //     respawn();
        //     canJump = true;
        // }
        prevTime = time;

    }
    socket.emit("player position",{x:controls.getObject().position.x, y:controls.getObject().position.y-14, z:controls.getObject().position.z});
    renderer.render( scene, camera );
}

var mAP = [[[]]];

socket.on("map", function(map){
    mAP = map;

    var floorGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 100, 100 );
    var position = floorGeometry.attributes.position;
    // objects
    var boxGeometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
    boxGeometry = boxGeometry.toNonIndexed(); // ensure each face has unique vertices
    position = boxGeometry.attributes.position;

    map.forEach(function(layer, i) {
        layer.forEach(function(line, j) {
            line.forEach(function(char, k) {
                if(map[i][j][k] != 0){
                    if(map[i][j][k] == 1){ //grass
                        var grassMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
                        grassMaterial.color.setHSL( 0.3333, 1, Math.random() * 0.1 + 0.25 );
                        var boxMaterial = grassMaterial;
                    }else if(map[i][j][k] == 2){//brick
                        var brickMaterial = new THREE.MeshLambertMaterial({ color: 0xcb4154 });
                        brickMaterial.color.setHSL( 0, 1, Math.random() * 0.1 + 0.4 );
                        var boxMaterial = brickMaterial;
                    }else if(map[i][j][k] == 3){//dirt
                        var dirtMaterial = new THREE.MeshLambertMaterial({ color: 0x663333 });
                        dirtMaterial.color.setHSL( 0.111111, 1, Math.random() * 0.05 + 0.15 );
                        var boxMaterial = dirtMaterial;
                    }else{//sky/wall
                        var skyMaterial = new THREE.MeshLambertMaterial({ color: 0x0000FF });
                        skyMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.3 ); // looks nice
                        var boxMaterial = skyMaterial;
                    }
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

var players = {};
var projectiles = {};

socket.on("new player", function(player){
    var cylinderGeometry = new THREE.CylinderBufferGeometry( 7.5, 7.5, 35, 32);
    cylinderGeometry = cylinderGeometry.toNonIndexed(); // ensure each face has unique vertices

    var material = new THREE.MeshLambertMaterial({ color: 0xf0ff00 });
    material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    var model = new THREE.Mesh( cylinderGeometry, material );
    model.position.x = player.position.x;
    model.position.y = player.position.y;
    model.position.z = player.position.z;

    player.username = document.getElementById('userName').value

    player.model = model;
    players[player.id] = player;
    scene.add(model);
    //console.log("added player "+player.id);
})

socket.on("setName", function(userName){
    var p = players[player.id];
    p.userName = userName;
});

socket.on("player", function(player){
    var p = players[player.id];
    p.model.position.x = player.position.x;
    p.model.position.y = player.position.y;
    p.model.position.z = player.position.z;
});

socket.on("player left", function(id){
    scene.remove(players[id].model);
    delete players[id];
    //console.log("player",id,"left");
});


socket.on("projectile", function(p){
    if(projectiles[p.id] == null){
        var geometry = new THREE.SphereBufferGeometry( 2, 32, 32 );
        var material = new THREE.MeshLambertMaterial( {color: 0xaaaaaa} );
        var sphere = new THREE.Mesh( geometry, material );

        sphere.position.x = p.x;
        sphere.position.y = p.y;
        sphere.position.z = p.z;

        p.object = sphere;
        scene.add( sphere );
        projectiles[p.id] = p;

    }else{
        var o = projectiles[p.id].object;
        o.position.x = p.x
        o.position.y = p.y;
        o.position.z = p.z;
    }
});

function respawn(){
    do{
        controls.getObject().position.x = Math.random()*mAP[0][0].length*20;
        controls.getObject().position.z = Math.random()*mAP[0].length*20;
        controls.getObject().position.y = Math.random()*(mAP.length-4)*20 +200;
    }while(!isColliding())
}

socket.on("hit", function(){
    respawn();
});

socket.on("projectile burst", function(p){
    projectiles[p.id].object.material = new THREE.MeshLambertMaterial( {color: 0xFF5511} );
    setTimeout(function(){
        scene.remove(projectiles[p.id].object);
    }, 1500);

});

socket.on("leaderboard", function(board) {
    //List of objs with .name, .kills, .deaths
    var leaderboard = "Leaderboard:<br>";
    for(var i = 0; i < board.length; i++) {
        leaderboard += board[i].name + ", " + board[i].kills.length + " K, " + board[i].deaths.length + " D" + "<br>"
    }
    document.getElementById('leaderboard').innerHTML = leaderboard;
})

socket.emit("map");
