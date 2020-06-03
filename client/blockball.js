import { PointerLockControls } from '../pointerlock.js';
var camera, scene, renderer, controls;
var myMap;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var terminalVelocityY = -500;
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();
var sprint = false;
var startTime = Date.now();
var player_radius = 7.5;
var flags = [];
var playerJustFell = false;
var loadStatus = 1;
var playerClass = "scout";
var reloadTime = 100;

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 150*20 );
    camera.position.y = 200;
    scene = new THREE.Scene();
    //scene.background = new THREE.Color( 0x44ff00 );
    scene.background = new THREE.MeshLambertMaterial({ color: 0x663333 });
    scene.fog = new THREE.Fog( 0x99ff88, 100*20, 150*20 );
    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );

    add_crosshair(camera);

    controls = new PointerLockControls( camera );
    var blocker = document.getElementById( 'blocker' );
    var instructions = document.getElementById( 'instructions' );
    var leaderboard = document.getElementById( 'leaderboard' );
    var startButton = document.getElementById('startButton' );

    startButton.addEventListener( 'click', function () {
        var username = document.getElementById('userName').value;
        socket.emit("setUser", {name:username});
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
    socket.emit("respawn");
    scene.add( controls.getObject() );
    var onClick = function ( event ) {
        if(loadStatus > 0.999 && controls.isLocked){
            var vector = new THREE.Vector3( 0, 0, - 1 );
            vector.applyQuaternion( camera.quaternion );
            socket.emit("launch", {dx:vector.x, dy:vector.y, dz:vector.z});
            loadStatus = 0;
        }
    }
    var onKeyDown = function ( event ) {
        switch ( event.keyCode ) {
            case 16: // shift
                camera.fov = 10;
                controls.speedFactor = 0.0004;
                camera.updateProjectionMatrix();
                break;
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
            case 69: // e
                // shoot
                if(!playerJustFell){
                  onClick(event);
                }
                break;
            case 88: //x, change class
                if(playerClass == "scout"){
                  socket.emit("change class", "sniper");
                }else if(playerClass == "sniper"){
                  socket.emit("change class", "heavy");
                }else if(playerClass == "heavy"){
                  socket.emit("change class", "scout");
                }
                break;
        }
    };
    var onKeyUp = function ( event ) {
        switch ( event.keyCode ) {
            case 16: // shift
                camera.fov = 75;
                controls.speedFactor = 0.002;
                camera.updateProjectionMatrix();
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

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );
    document.addEventListener( 'click', onClick, false);


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

function isColliding(position){
    var collidingWith = [];
    var checkspots = [];
    var mapPos = {};
    mapPos.x = ((position.x+10)/20);
    mapPos.y = ((position.y-5)/20);
    mapPos.z = ((position.z+10)/20);
    mapPos.ox = false;
    mapPos.oz = false;

    let radius = (7.5)/20;

    if(mapPos.x % 1 > 1-radius){
        mapPos.ox = mapPos.x+1;
    }else if(mapPos.x % 1 < radius){
        mapPos.ox = mapPos.x-1;
    }

    if(mapPos.z % 1 > 1-radius){
        mapPos.oz = mapPos.z+1;
    }else if(mapPos.z % 1 < radius){
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
        if(getFromMap(checkspots[i]) > 0){
            collision = true;
            collidingWith.push(checkspots[i]);
            return true;
        }
    }
    return false;
}

function nextPosition(position, move){

    if(Math.abs(move.x) + Math.abs(move.z) < 0.001){
        let next = position.clone();
        next.y += move.y;
        return next;
    }

    let slightlyHigher = position.clone();
    slightlyHigher.y += Math.sign(move.y)/10;

    if(isColliding(position) || isColliding(slightlyHigher)){
        let next = position.clone();
        next.y += move.y;
        return next;
    }

    let stepsize = move.length() / (1 + Math.floor(move.length() / (20/2)));
    stepsize = stepsize - 0.01;
    if(stepsize < 0.01){stepsize = 0.01;}

    let fauxPosition = position.clone();
    for(let step = stepsize; step < move.length(); step += stepsize){
        fauxPosition.add(move.clone().normalize().multiplyScalar(stepsize));
        
        var collision = isColliding(fauxPosition);
        if(collision){
            let tinystep = stepsize;
            let direction = -1;
            for(let i = 0; i < 7; i++){
                tinystep = tinystep/2;
                fauxPosition.add(move.clone().normalize().multiplyScalar(tinystep * direction));
                if(isColliding(fauxPosition)){
                    direction = -1;
                }else{
                    direction = 1;
                }
            }
            if(isColliding(fauxPosition)){
                fauxPosition.add(move.clone().normalize().multiplyScalar(tinystep * direction));
            }
            break;
        }
    }

    if(collision){
        // determine if you can go more in the x or z direction
    
        let xtester = fauxPosition.clone();
        xtester.x += Math.sign(move.x)/10;
        let ztester = fauxPosition.clone();
        ztester.z += Math.sign(move.z)/10;

        let newMove = move.clone().sub(fauxPosition.clone().sub(position));

        if(!isColliding(xtester)){
          newMove.z = 0;
          return nextPosition(fauxPosition.clone(), newMove);
        }else if(!isColliding(ztester)){
          newMove.x = 0;
          return nextPosition(fauxPosition.clone(), newMove);
        }

    }
    return fauxPosition;

}

function animate() {
    requestAnimationFrame( animate );
    if(controls.getObject().position.y <= 15) {
      if(!playerJustFell){
        playerJustFell = true;
        velocity.y = 0;
        // controls.getObject().position.y = 1000;
        // controls.getObject().position.z = -500;
        socket.emit("playerFell")
      }
    }

    if ( controls.isLocked === true ) {

        var originalPosition = new THREE.Vector3();
        originalPosition.x = controls.getObject().position.x;
        originalPosition.y = controls.getObject().position.y;
        originalPosition.z = controls.getObject().position.z;

        
        let slightlyLower = controls.getObject().position.clone();
        slightlyLower.y -= 35/2; //half height
        var onObject = isColliding(slightlyLower);

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
        
        let newPosition = controls.getObject().position;
        let move = newPosition.sub(originalPosition);

        let newPos = nextPosition(originalPosition, move);
        controls.getObject().position.x = newPos.x;
        controls.getObject().position.y = newPos.y;
        controls.getObject().position.z = newPos.z;

        if(isColliding(originalPosition)){
            controls.getObject().position.x = originalPosition.x;
            //controls.getObject().position.y = originalPosition.y; // THIS STOPS JUMPING THROUGH CEILINGS
            controls.getObject().position.z = originalPosition.z;
        }

        // update reload status and bar
        loadStatus += (time-prevTime)/reloadTime;
        loadStatus = Math.min(loadStatus, 1);
        document.getElementById( 'status-bar' ).style.width = (loadStatus * 100) + "%";

        // if ( controls.getObject().position.y < 10 ) {
        //     velocity.y = 0;
        //     respawn();
        //     canJump = true;
        // }
        prevTime = time;

    }
    renderer.render( scene, camera );
}

var mAP = [[[]]];

socket.on("map", function(map, colors){
    mAP = map; 

    var floorGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 100, 100 );
    var position = floorGeometry.attributes.position;
    // objects
    var boxGeometry = new THREE.BoxGeometry( 20, 20, 20 );
    //boxGeometry = boxGeometry.toNonIndexed(); // ensure each face has unique vertices
    //position = boxGeometry.attributes.position;

    var allBoxes = new THREE.Geometry();

    map.forEach(function(layer, i) {
        layer.forEach(function(line, j) {
            line.forEach(function(char, k) {
                if(map[i][j][k] > 0){
                  var boxMaterial;
                    var colorInfo = colors[map[i][j][k]];
                    //colorInfo in the format: ["#FFFFFF", 0.2]
                    var material = new THREE.MeshLambertMaterial({color: colorInfo[0]});
                    //Mix up the given color by adding a random number to the lightness. 
                    //The random number is within the givene color lightness +- range. 
                    material.color.offsetHSL(0,0, Math.random() * colorInfo[1] * 2 - colorInfo[1] )
                    boxMaterial = material;

                    var box = new THREE.BoxGeometry( 20, 20, 20 );
                    
                    var p = {};
                    p.x = k*20;
                    p.y = i*20;
                    p.z = j*20;

                    // move box
                    box.translate(p.x,p.y,p.z);

                    var sides = makeSides(map,i,j,k,p);
                    var vbox = new THREE.Geometry();

                    for(var s in sides){
                        vbox.merge(sides[s]);
                    }

                    vbox.computeFaceNormals();
                    vbox.computeVertexNormals();
                    for(var s in vbox.faces){
                        vbox.faces[s].color = boxMaterial.color;
                        
                    }
                    allBoxes.merge(vbox);
                }
            });
        });
    });
    let mat = new THREE.MeshLambertMaterial({ vertexColors: THREE.FaceColors });
    var m = new THREE.Mesh(allBoxes, mat);
    // only render front side of shapes
    //m.material.side = THREE.DoubleSide; //uncomment to render both sides
    scene.add(m);
});


function noBlockAt(x){
    return x == undefined || x == 0 || x < 0;
}

/**
    im sorry that this function is dumb but I don't care
    it works
**/
function makeSides(map,i,j,k,p){
    let sides = [];
    if(map[i+1] == undefined || noBlockAt(map[i+1][j][k])){
        // +y
        var square = new THREE.Geometry();
        square.vertices.push(new THREE.Vector3(p.x+10, p.y+10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y+10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y+10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y+10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y+10, p.z+10));

        square.faces.push(new THREE.Face3(0, 1, 2));
        square.faces.push(new THREE.Face3(0, 2, 3));

        sides.push(square);
    }
    if(map[i-1] == undefined || noBlockAt(map[i-1][j][k])){
        // -y
        var square = new THREE.Geometry();
        square.vertices.push(new THREE.Vector3(p.x+10, p.y-10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y-10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y-10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y-10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y-10, p.z+10));

        square.faces.push(new THREE.Face3(0, 2, 1));
        square.faces.push(new THREE.Face3(0, 3, 2));

        sides.push(square);
    }
    if(map[i][j+1] == undefined || noBlockAt(map[i][j+1][k])){
        // +z
        var square = new THREE.Geometry();
        square.vertices.push(new THREE.Vector3(p.x+10, p.y+10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y-10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y-10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y+10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y+10, p.z+10));

        square.faces.push(new THREE.Face3(0, 2, 1));
        square.faces.push(new THREE.Face3(0, 3, 2));

        sides.push(square);
    }
    if(map[i][j-1] == undefined || noBlockAt(map[i][j-1][k])){
        // -z
        var square = new THREE.Geometry();
        square.vertices.push(new THREE.Vector3(p.x+10, p.y-10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y+10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y+10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y-10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y-10, p.z-10));

        square.faces.push(new THREE.Face3(0, 2, 1));
        square.faces.push(new THREE.Face3(0, 3, 2));

        sides.push(square);
    }
    if(map[i][j][k+1] == undefined || noBlockAt(map[i][j][k+1])){
        // +x
        var square = new THREE.Geometry();
        square.vertices.push(new THREE.Vector3(p.x+10, p.y+10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y+10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y-10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y-10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x+10, p.y+10, p.z+10));

        square.faces.push(new THREE.Face3(0, 2, 1));
        square.faces.push(new THREE.Face3(0, 3, 2));

        sides.push(square);
    }
    if(map[i][j][k-1] == undefined || noBlockAt(map[i][j][k-1])){
        // -x
        var square = new THREE.Geometry();
        square.vertices.push(new THREE.Vector3(p.x-10, p.y-10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y-10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y+10, p.z-10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y+10, p.z+10));
        square.vertices.push(new THREE.Vector3(p.x-10, p.y-10, p.z+10));

        square.faces.push(new THREE.Face3(0, 2, 1));
        square.faces.push(new THREE.Face3(0, 3, 2));

        sides.push(square);
    }
    return sides;
}

var players = {};
var projectiles = {};

function drawPlayer(player){
    var cylinderGeometry = new THREE.CylinderBufferGeometry( 7.5, 7.5, 35, 10);
    cylinderGeometry = cylinderGeometry.toNonIndexed(); // ensure each face has unique vertices

    var material = new THREE.MeshLambertMaterial({ color: player.color });
    
    // to give the player a star texture, use newMaterial:
    //const loader = new THREE.TextureLoader();
    //let newMaterial = new THREE.MeshBasicMaterial({color: player.color, map: loader.load('/sprites/Star.png')});

    var model = new THREE.Mesh( cylinderGeometry, material );
    model.position.x = player.position.x;
    model.position.y = player.position.y;
    model.position.z = player.position.z;
    model.name = "MODEL FOR: " + player.id;

    player.userName = player.name;

    updatePlayerNameTag(player);

    player.model = model;
    players[player.id] = player;
    scene.add(model);
}


//Move this to a draw player function and call it from update player when player properties change
socket.on("new player", function(player){
    drawPlayer(player);
});

function updatePlayerColor(player){
    player.model.material.color.set(player.color);
}

function updatePlayerNameTag(player){
    if(player.usernameLabel){
        removeEntity(player.usernameLabel);
    }
    player.usernameLabel = makeTextSprite(player.userName);
    player.usernameLabel.position.set(player.position.x, player.position.y + 15, player.position.z);
    player.usernameLabel.name = "USERNAME FOR: " + player.id;
    scene.add( player.usernameLabel );
}

socket.on("updatePlayer", function(player){
    var p = players[player.id];
    p.name = player.name;
    p.userName = player.name;
    p.color = player.color;
    updatePlayerColor(p);
    updatePlayerNameTag(p);
});

function flash(player, color){
    player.flash = true;
    let flash = function(){
        if(player.flash){
            let original_color = player.color;
            player.color = color;
            updatePlayerColor(player);
            setTimeout(function(){
                player.color = original_color;
                updatePlayerColor(player);
                setTimeout(flash, 100);
            }, 100);
        }
    }
    flash();
}

socket.on("flash player", function(player_id, color){
    flash(players[player_id], color);
});

socket.on("stop flash", function(player_id){
    players[player_id].flash = false;
});

socket.on("set class", function(newClass){
    playerClass = newClass.name;
    reloadTime = newClass.reloadTime;
});

function removeEntity(object) {
    var selectedObject = scene.getObjectByName(object.name);
    scene.remove( selectedObject );
}

function makeTextSprite( message )
{
    var canvas = document.createElement('canvas');
    canvas.width = 256; // width and height must be powers of 2
    canvas.height = 256;
    var context = canvas.getContext('2d');
    var fontsz = 32;
    context.font = "Bold " + fontsz + "px " + "Ariel";
    
    // get size data (height depends only on font size)
    var metrics = context.measureText( message );
    var textWidth = metrics.width;
    
    // background color
    context.fillStyle   = "rgba(" + 255 + "," + 200 + ","
                                  + 100 + "," + 0.4 + ")";
    // border color
    context.strokeStyle = "rgba(" + 0 + "," + 0 + ","
                                  + 0 + "," + 0 + ")";
    roundRect(context, canvas.width/2 - textWidth/2, 0, textWidth, fontsz * 1.4, 6);
    // 1.4 is extra height factor for text below baseline: g,j,p,q.
    
    // text color
    context.fillStyle = "rgba(0, 0, 0, 1.0)";
    context.textAlign = "center";
    context.fillText( message, canvas.width/2, fontsz);
    
    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas) 
    texture.needsUpdate = true;
    var spriteMaterial = new THREE.SpriteMaterial( 
        { map: texture} );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set(30,25,1.0);
    sprite.center = new THREE.Vector2(0.5,0.5);

    return sprite;  
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) 
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();   
}

function updatePlayer(player){
    var p = players[player.id];
    p.model.position.x = player.position.x;
    p.model.position.y = player.position.y;
    p.model.position.z = player.position.z;
   
    p.usernameLabel.position.x = player.position.x;
    p.usernameLabel.position.y = player.position.y + 15;
    p.usernameLabel.position.z = player.position.z;
}

socket.on("player left", function(id){
    scene.remove(players[id].model);
    scene.remove(players[id].usernameLabel);
    delete players[id];
});

function createProjectile(p){
    var geometry = new THREE.SphereBufferGeometry( 2, 5, 5 );
    var material = new THREE.MeshLambertMaterial( {color: 0xaaaaaa} );
    var sphere = new THREE.Mesh( geometry, material );

    sphere.position.x = p.x;
    sphere.position.y = p.y;
    sphere.position.z = p.z;

    p.object = sphere;
    scene.add( sphere );
    projectiles[p.id] = p;
}

function updateProjectile(p){
    if(projectiles[p.id] == null){
        createProjectile(p);
    }else{
        var o = projectiles[p.id].object;
        o.position.x = p.x
        o.position.y = p.y;
        o.position.z = p.z;
    }
}


socket.on("objects",function(things){
    let p = things.players;
    for(var i in p){
        if(players[p[i].id] != null){
            updatePlayer(p[i]);
        }
    }

    p = things.projectiles;
    for(var i in p){
        updateProjectile(p[i]);
    }
});

socket.on("updateRespawnLocation", function(position){
  controls.getObject().position.x = position.x * 20;
  controls.getObject().position.y = (position.z +2) * 20;
  controls.getObject().position.z = position.y * 20;
  playerJustFell = false;
  socket.emit("respawned", {});
})

socket.on("projectile burst", function(p){
    if(!projectiles[p.id]){
        createProjectile(p);
    }
    var o = projectiles[p.id].object;
    o.position.x = p.x
    o.position.y = p.y;
    o.position.z = p.z;

    o.material = new THREE.MeshLambertMaterial( {color: 0xFF5511} );
    setTimeout(function(){
        scene.remove(projectiles[p.id].object);
    }, 1500);

});

socket.on("create flag", function(f){
  if(!scene.getObjectByName(f.name)){
    let spriteMap = new THREE.TextureLoader().load( "/sprites/Star.png" );
    let spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap } );
    let sprite = new THREE.Sprite( spriteMaterial );

    sprite.position.x = f.position.x * 20;
    sprite.position.y = f.position.y * 20;
    sprite.position.z = f.position.z * 20;

    console.log(sprite.position);

    sprite.name = f.name;
    //sprite.id = f.id;
    sprite.scale.set(20,20,1);
    scene.add(sprite);
  }
});

socket.on("remove flag", function(f){
  removeEntity(f);
});

socket.on("leaderboard", function(board) {
    document.getElementById('leaderboard').innerHTML = board;
});

socket.on("restart screen", function(){
  controls.unlock();
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendDataToServer(){
    while("Vincent" > "Michael"){
        await sleep(20);
        socket.emit("player position",{x:controls.getObject().position.x, y:controls.getObject().position.y-14, z:controls.getObject().position.z});
    }
}

socket.emit("map");
sendDataToServer();
