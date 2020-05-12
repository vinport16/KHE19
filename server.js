var express = require('express');
var sio = require('socket.io');
var app = express();
var http = require('http').createServer(app);
var io = sio(http);
var port = process.env.PORT || 3030; //runs on heroku or localhost:3030
console.log("running on port", port);

//var map = readMap("maps/20x20map.txt");
var map = csv2map("maps/test_map.csv");
http.listen(port);

//console.log("running on port "+port);


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

function csv2map(file_name) {
  var fs = require('fs');
  var contents = fs.readFileSync(file_name).toString();

  var map = [];
  map.push([]);
  var d2 = 0;
  var d1 = 0;

  var file = contents.split('\r\n');

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
  console.log("Map Loaded");
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
wait = 20; // ms = 0.05 second = 50/sec

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
            players[i].socket.emit("updatePlayer", {id:player.id, name: player.name, color:player.color});
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

  socket.on("playerFell", function(){
      player.deaths.push([player.id]);
      updateLeaderboard();
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
    p.velocity.x = angle.dx * pSpeed;
    p.velocity.y = angle.dy * pSpeed + 1;
    p.velocity.z = angle.dz * pSpeed;

    p.position.x += angle.dx * 10;
    p.position.y += angle.dy * 10;
    p.position.z += angle.dz * 10;

    if(p.position.x != NaN && p.position.y != NaN && p.position.z != NaN){
      projectiles.push(p);
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
      //console.log("PLAYER",players[i].name,"WAS HIT BY",p.owner.name);
      players[i].deaths.push(p.owner.id);
      p.owner.kills.push(players[i].id);
      players[i].socket.emit("hit");
      updateLeaderboard();
      return 1;
    }
  }
  return false;
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
