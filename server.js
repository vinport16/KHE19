var fs = require('fs');
var express = require('express');
var sio = require('socket.io');
var app = express();
var http = require('http').createServer(app);
var io = sio(http);
var port = process.env.PORT || 3030; //runs on heroku or localhost:3030
console.log("running on port", port);

//Server Specific Values: 
//var map = readMap("maps/40x40map.txt");
var map = csv2map("maps/islands_150.csv");
//var map = json2map("maps/map2_0test.json");
var gameType = "";
var flags = [];
var spawnAreas = [];
var colors = [];


http.listen(port);

var SERVER_NAME = 'UNSET SERVER NAME';
var SERVER_DESCRIPTION = "NO DESCRIPTION";

fs.readFile("config.txt", "utf-8", function(err, data) {
  if (err) {
    console.log(err);
    console.log("!!!\nPlease Create a config.txt file with the following format:");
    console.log("line 1: SERVER NAME");
    console.log("line 2: SERVER DESCRIPTION");
    console.log("--------");
  }else{
    content = data.split("\n");
    SERVER_NAME = content[0];
    SERVER_DESCRIPTION = content[1];
  }
});

// this allows cross origin JSON requests (to get status message)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// serve files from sprites and map editor directories
app.use('/sprites', express.static('sprites'));
app.use('/map_editor', express.static('map_editor'));

app.get('/socket.io/socket.io.js', function(req, res){
  res.sendFile(__dirname + '/node_modules/socket.io/socket.io.js');
});

app.get('/client/script.js', function(req, res){
  res.sendFile(__dirname + '/client/script.js');
});

app.get('/three.js', function(req, res){
  res.sendFile(__dirname + '/node_modules/three/three.js');
});

app.get('/three.module.js', function(req, res){
    res.sendFile(__dirname + '/client/three.module.js');
  });

app.get('/pointerlock.js', function(req, res){
    res.sendFile(__dirname + '/pointerlock.js');
});

app.get('/client/blockball.js', function(req, res){
    res.sendFile(__dirname + '/client/blockball.js');
});

app.get('/bg.jpg', function(req,res){
    res.sendFile(__dirname + '/client/hdri.jpg');
});

app.get("/", function(req, res){
  res.sendFile(__dirname + '/client/index.html');
});

app.get("/status.json", function(req, res){
  let status = {
    name: SERVER_NAME,
    description: SERVER_DESCRIPTION,
    players: players.length,
    maxPlayers: 999,
  };
  res.send(JSON.stringify(status));
});

function json2map(file_name){
  var fs = require('fs');
  var contents = fs.readFileSync(file_name).toString();
  const mapFileContents = JSON.parse(contents);
  //console.log(mapFileContents);
  gameType = mapFileContents.mapInfo.gameType;
  flags = mapFileContents.specialObjects.flags;
  spawnAreas = mapFileContents.specialObjects.spawnAreas;

  var jsonColors = mapFileContents.colors;
  var colorValues = [];

  //Push nothing for air (0)
  colorValues.push([]);

  for(var c in jsonColors){
    colorValues.push(jsonColors[c]);
  }
  colors = colorValues;

  var map = [];

  var currentZ = 0;
  var jsonMap = mapFileContents.map;
  
  for(var z in jsonMap){
    map.push([]);
    for(var y in jsonMap[z]){
      for(var x in jsonMap[z][y]){
        map[currentZ].push(jsonMap[z][y][x])
      }
      ;
    }
    currentZ++;
  }

  console.log("Map Loaded:",map[0][0].length, "by", map[0].length, "by", map.length);

  if(map.length < 3){
    console.err("The map is too short to spawn the player. Please add a map with at least 3 levels.");
  }
  
  return map;

}

function csv2map(file_name) {
  var fs = require('fs');
  var contents = fs.readFileSync(file_name).toString();

  var map = [];
  map.push([]);
  var d2 = 0;
  var d1 = 0;

  var file = contents.split('\n');

  // Iterate through lines of map file
  file.forEach(function(line) {
    if(line[0] == 'n') {
      map.push([]);
      d1++;
    }else{
      var line_chars = line.split(',');
      map[d1].push(line_chars);
    }
  });
  map.forEach(function(layer, i) {
    layer.forEach(function(line, j) {
      line.forEach(function(char, k) {
        map[i][j][k] = map[i][j][k] == '' ? 0 : parseInt(map[i][j][k]);
      })
    })
  })
  console.log("Map Loaded:",map[0][0].length, "by", map[0].length, "by", map.length);
  return map;
}

function readMap(file_name) {
  var fs = require('fs');
  var contents = fs.readFileSync(file_name).toString();

  var map = [];
  map.push([]);
  var d2 = 0;
  var d1 = 0;

  var file = contents.split('\n');

  // Iterate through lines of map file
  file.forEach(function(line) {
    if(line == '') {
      map.push([]);
      d1++;
    }
    var line_chars = line.split('');
    map[d1].push(line_chars);

  });
  map.forEach(function(layer, i) {
    layer.forEach(function(line, j) {
      line.forEach(function(char, k) {
          if(map[i][j][k] == ' ' || map[i][j][k] == '.'){
            map[i][j][k] = 0;
          }else if(map[i][j][k] == '1'){
              map[i][j][k] = 1;
          }else if(map[i][j][k] == '2'){
            map[i][j][k] = 2;
        }else if(map[i][j][k] == '3'){
            map[i][j][k] = 3;
        }else if(map[i][j][k] == '4'){
            map[i][j][k] = 4;
        }
      })
    })
  })
  console.log("Map Loaded");
  return map;
}

// STEP SPEED
var wait = 20; // ms = 0.05 second = 50/sec

var players = [];
var nextId = 0;

var projectiles = [];
var pSpeed = 40;
var pGrav = 5;
var pLife = 800;

io.on("connection", function(socket){
  var player = {};
  player.id = nextId++;
  player.name = player.id;
  player.socket = socket;
  player.kills = [];
  player.deaths = [];
  player.position = {x:0,y:0,z:0};
  player.usernameLabel;
  player.color = "red";

  //console.log("player "+player.id+" logged in");

  players.push(player);

  socket.on("setUser", function(user){
    player.name = user.name;
    player.color = user.color;
    for(i in players){
        if(players[i].id != player.id){
            players[i].socket.emit("updatePlayer", {id:player.id, name: player.name, color:player.color, position: player.position});
        }
    }
  });

  socket.on("map", function(){
    socket.emit("map",map);
    //console.log("Sent Map to ",player.id);
    for(i in players){
      if(players[i].id != player.id){
        player.socket.emit("new player", {id:players[i].id, position:players[i].position, name:players[i].name, color: players[i].color});
        //console.log("sent player",players[i].id,"to",player.id);
        players[i].socket.emit("new player", {id:player.id, position:player.position, name:player.name, color: player.color});
        //console.log("sent player",player.id,"to",players[i].id);
      }
    }
  });

  socket.on("respawn", function() {
    respawn(player);
  })

  socket.on("playerFell", function(){
      player.deaths.push([player.id]);
      updateLeaderboard();
      respawn(player);
  });

  socket.on("player position", function(position){
    player.position = position;
  });

  socket.on("disconnect",function(){
    for(i in players){
      if(players[i].id == player.id){
        players.splice(i,1);
      }
      if(i < players.length){
        players[i].socket.emit("player left", player.id);
      }
    }
    //console.log("player "+player.id+" left");
  });

  socket.on("launch", function(angle){
    var p = {};
    p.id = nextId++;
    p.owner = player;
    p.count = 0;

    p.position = {};
    p.position.x = player.position.x;
    p.position.y = player.position.y + 14;
    p.position.z = player.position.z;

    p.velocity = {};
    if(angle.speed != undefined){
      p.velocity.x = angle.dx * angle.speed;
      p.velocity.y = angle.dy * angle.speed + 1;
      p.velocity.z = angle.dz * angle.speed;
    }else{
      p.velocity.x = angle.dx * pSpeed;
      p.velocity.y = angle.dy * pSpeed + 1;
      p.velocity.z = angle.dz * pSpeed;
    }
    

    p.position.x += angle.dx * 10;
    p.position.y += angle.dy * 10;
    p.position.z += angle.dz * 10;

    if(p.position.x != NaN && p.position.y != NaN && p.position.z != NaN){
      projectiles.push(p);
      moveProjectile(p);
    }

  });

});

function projCollisionWithMap(p, map){
  mapPos = {};
  mapPos.x = Math.floor((p.position.x+10)/20);
  mapPos.y = Math.floor((p.position.y+10)/20);
  mapPos.z = Math.floor((p.position.z+10)/20);

  if(mapPos.x >= 0 && mapPos.y >= 0 && mapPos.z >= 0){
    if(map.length > mapPos.y && map[0].length > mapPos.z && map[0][0].length > mapPos.x){
      if(map[mapPos.y][mapPos.z][mapPos.x] != 0){
        return true;
      }
    }
  }

  return false;
}

function projCollision(p,map){
  if(projCollisionWithMap(p,map)){
    return true;
  }
  
  for(i in players){
    var player = players[i].position;
    var dz = player.z - p.position.z;
    var dx = player.x - p.position.x;

    var bottom = player.y - (35/2);
    var top = player.y + (35/2);
    if(Math.sqrt(dz*dz + dx*dx) < 7.5 && p.position.y < top && p.position.y > bottom && p.owner.id != players[i].id){
      //console.log("PLAYER",players[i].name,"WAS HIT BY",p.owner.name);
      players[i].deaths.push(p.owner.id);
      p.owner.kills.push(players[i].id);
      respawn(players[i]);
      updateLeaderboard();
      return true;
    }
  }
  return false;
}

function respawn(p){
  var x, y , z = 0;
  do {
    x = parseInt(Math.random()*(map[0][0].length - 4) + 2,10);
    y = parseInt(Math.random()*(map[0].length - 4) + 2,10);
    z = parseInt(Math.random()*(map.length - 3),10);
  }
  while(map[z][y][x] == 0 || map[z+1][y][x] != 0 || map[z+2][y][x] != 0);
  p.socket.emit("updateRespawnLocation", {x:x, y:y, z:z});
}

function updateLeaderboard(){
  var board = players.map(function(p){
    return {name:p.name,kills:p.kills,deaths:p.deaths};
  });
  board = board.sort(function(a,b){
    return (b.kills.length * b.kills.length / b.deaths.length) - (a.kills.length * a.kills.length / a.deaths.length);
  });
  for(i in players){
    players[i].socket.emit("leaderboard",board);
  }
}

function announcePosition(p){
  for(i in players){
    players[i].socket.emit("projectile",{id:p.id, x:p.position.x, y:p.position.y, z:p.position.z});
  }
}

function announceBurst(p){
  for(i in players){
    players[i].socket.emit("projectile burst",{id:p.id, x:p.position.x, y:p.position.y, z:p.position.z});
  }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function moveProjectileToHitLocation(p){
    // start moving the projectile backwards, out of the block
    let direction = -1;
    let fraction = 0.5;
    for(let i = 0; i < 5; i++){

      //move
      p.position.x += p.velocity.x * pSpeed/4 * wait/1000 * fraction * direction;
      p.position.y += p.velocity.y * pSpeed/4 * wait/1000 * fraction * direction;
      p.position.z += p.velocity.z * pSpeed/4 * wait/1000 * fraction * direction;

      if(projCollisionWithMap(p,map)){
        direction = -1;
      }else{
        direction = 1;
      }
      fraction = fraction/2;
    }
}

// calculate projectile collisions with higher precision than step speed
async function moveProjectile(p){
  var hit = false;
  while(!hit && p.count < pLife){
    await sleep(wait/4);

    p.velocity.y -= pGrav * wait/1000;

    p.position.x += p.velocity.x * pSpeed/4 * wait/1000;
    p.position.y += p.velocity.y * pSpeed/4 * wait/1000;
    p.position.z += p.velocity.z * pSpeed/4 * wait/1000;

    if(projCollision(p,map)){
      hit = true;
      if(projCollisionWithMap(p,map)){
        moveProjectileToHitLocation(p);
      }else{
        // hit was with player, do not find exact hit location
      }
    }

    p.count++;
  }

  announceBurst(p);

  // remove projectile from list
  for(var i in projectiles){
    if(projectiles[i].id == p.id){
      projectiles.splice(i,1);
    }
  }

}


async function reportEverything(){
  while(true){
    await sleep(wait);
    // make structure that holds all object position data
    let things = {};

    // players have ids and positions
    things.players = [];
    for(var i in players){
      let player = players[i];
      things.players.push({id:player.id, position:player.position});
    }

    // projectiles have ids and positions
    things.projectiles = [];
    for(var i in projectiles){
      let p = projectiles[i];
      things.projectiles.push({id:p.id, x:p.position.x, y:p.position.y, z:p.position.z});
    }

    // send every player all of the objects
    for(var i in players){
      player = players[i];
      player.socket.emit("objects",things);
    }

  }
}

reportEverything();
