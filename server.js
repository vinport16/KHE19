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


io.on("connection", function(socket){
  

  socket.on("map", function(){
    socket.emit("map",map);
    console.log("Sent Map");
  });
});



function readMap(file_name) {
  var fs = require('fs');
  var contents = fs.readFileSync(file_name).toString();
  console.log(contents);

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
        map[i][j][k] = map[i][j][k] == '1' ? 1 : 0
      })
    })
  })

  return map;
}
