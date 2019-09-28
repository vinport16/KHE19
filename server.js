var express = require('express');
var sio = require('socket.io');
var app = express();
var http = require('http').createServer(app);
var io = sio(http);
var port = process.env.PORT || 3030; //runs on heroku or localhost:3030

var map = readMap("maps/20x20map.txt");
http.listen(port);

console.log("running on port "+port);


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
    res.sendFile(__dirname + '/node_modules/three/three.module.js');
  });

app.get('/pointerlock.js', function(req, res){
    res.sendFile(__dirname + '/pointerLock.js');
});

app.get('/client/stolenExample.js', function(req, res){
    res.sendFile(__dirname + '/client/stolenExample.js');
});

app.get("/", function(req, res){
  res.sendFile(__dirname + '/client/index.html');
});

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
          if(map[i][j][k] == ' '){
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

  return map;
}

var players = [];
var nextId = 0;

var pSpeed = 20;
var pGrav = 10;
var pLife = 800;

io.on("connection", function(socket){
  var player = {};
  player.id = nextId++;
  player.socket = socket;
  player.position = {x:0,y:0,z:0};

  console.log("player "+player.id+" logged in");

  for(i in players){
      players[i].socket.emit("new player", {id:player.id, position:player.position});
      console.log("sent player",player.id,"to",players[i].id);
  }

  players.push(player);

  socket.on("map", function(){
    socket.emit("map",map);
    console.log("Sent Map to ",player.id);
    for(i in players){
      player.socket.emit("new player", {id:players[i].id, position:players[i].position});
      console.log("sent player",players[i].id,"to",player.id);
  }
  });

  socket.on("player position", function(position){
    player.position = position;
    for(i in players){
      if(players[i].id != player.id){
        players[i].socket.emit("player", {id:player.id, position:player.position});
      }
    }
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
    console.log("player "+player.id+" left");
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
    p.velocity.x = angle.dx * pSpeed;
    p.velocity.y = angle.dy * pSpeed;
    p.velocity.z = angle.dz * pSpeed;

    p.position.x += angle.dx * 10;
    p.position.y += angle.dy * 10;
    p.position.z += angle.dz * 10;

    if(p.position.x != NaN && p.position.y != NaN && p.position.z != NaN){
      moveProjectile(p);
    }

  });

});

function projCollision(p,map){
  mapPos = {};
  mapPos.x = Math.floor((p.position.x+10)/20);
  mapPos.y = Math.floor((p.position.y+10)/20);
  mapPos.z = Math.floor((p.position.z+10)/20);

  if(mapPos.x >= 0 && mapPos.y >= 0 && mapPos.z >= 0){
    if(map.length > mapPos.y && map[0].length > mapPos.z && map[0][0].length > mapPos.x){
      if(map[mapPos.y][mapPos.z][mapPos.x] != 0){
        return 1;
      }
    }
  }
  for(i in players){
    var player = players[i].position;
    var dz = player.z - p.position.z;
    var dx = player.x - p.position.x;

    var bottom = player.y - (35/2);
    var top = player.y + (35/2);
    if(Math.sqrt(dz*dz + dx*dx) < 7.5 && p.position.y < top && p.position.y > bottom && p.owner.id != players[i].id){
      console.log("PLAYER",players[i].id,"WAS HIT");
      players[i].socket.emit("hit");
    }
  }
  return false;
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

wait = 8; //in ms

async function moveProjectile(p){
  var hit = false;
  while(!hit && p.count < pLife){
    await sleep(10);

    p.velocity.y -= pGrav * wait/1000;

    p.position.x += p.velocity.x * pSpeed * wait/1000;
    p.position.y += p.velocity.y * pSpeed * wait/1000;
    p.position.z += p.velocity.z * pSpeed * wait/1000;

    announcePosition(p);

    if(projCollision(p,map)){
      hit = true;
    }

    p.count++;
  }
  announceBurst(p);
}
