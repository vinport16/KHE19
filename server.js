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


var players = [];
var nextPlayerId = 0;

io.on("connection", function(socket){
  player = {};
  player.id = nextPlayerId++;
  player.socket = socket;
  player.position = {x:0,y:0,z:0};

  console.log("player "+player.id+" logged in");

  for(sendto in players){
      players[sendto].socket.emit("new player", {id:player.id, position:player.position});
      player.socket.emit("new player", {id:players[sendto].id, position:players[sendto].position});
  }

  players.push(player);

  socket.on("map", function(){
    socket.emit("map",map);
    console.log("Sent Map");
  });

  socket.on("player position", function(position){
    player.position = position;
    for(sendto in players){
      if(players[sendto].id != player.id){
        players[sendto].socket.emit("player", {id:player.id, position:player.position});
      }
    }
  });

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
