var fs = require('fs');
var express = require('express');
var sio = require('socket.io');
var app = express();
var http = require('http').createServer(app);
var io = sio(http);

var port; //runs on heroku or localhost:3030

//Server Specific Values: 
var MAPFILE = "";
MAPFILE = process.argv[3];
var SERVER_NAME = 'UNSET SERVER NAME';
var SERVER_DESCRIPTION = "NO DESCRIPTION";
var ALLOWGAMERESTARTS = true;


var mapFileContents;
var map;
var colors;
var gameType;
var flags;
var numberOfTeams;
var spawnAreas;
var validSpawnLocations;
var teamScores;

function allGameTypes(){
  this.FFA = "Free For All";
  this.CTF = "Capture The Flag";
  this.TEAMS = "Teams";
  this.KOTH = "King of the Hill";
}

var gameTypes = new allGameTypes();
fs.appendFileSync('pids.txt', process.pid + "\n");

var configFile = process.argv[2];
if(configFile == undefined){
  //console.error()
  console.error("Please specify a config file to use in the form: npm start config.txt");
  process.exit(1);
}

fs.readFile(configFile, "utf-8", function(err, data) {
  if (err) {
    console.log(err);
    console.log("!!!\nPlease Create a config.txt file with the following format:");
    console.log("line 0: PORT NUMBER");
    console.log("line 1: SERVER NAME");
    console.log("line 2: SERVER DESCRIPTION");
    console.log("line 3: MAP FILE");
    console.log("line 4: true/false FOR GAME RESTARTS")
    console.log("--------");
  }else{
    content = data.split("\n");
    port = content[0];
    SERVER_NAME = content[1];
    SERVER_DESCRIPTION = content[2];
    MAPFILE = content[3];
    if(content[4] == "true"){
      ALLOWGAMERESTARTS = true;
    }else{
      ALLOWGAMERESTARTS = false;
    }
  }

  mapFileContents = json2contents(MAPFILE);
  map = json2map(mapFileContents.map);
  colors = mapFileContents.colors;
  gameType = mapFileContents.mapInfo.gameType;
  flags = json2Flags(mapFileContents.specialObjects.flags);
  numberOfTeams = mapFileContents.mapInfo.numberOfTeams;
  spawnAreas = json2spawn(mapFileContents.specialObjects.spawnAreas, numberOfTeams);
  validSpawnLocations = setUpValidSpawnLocations(numberOfTeams);
  teamScores = new Array(numberOfTeams).fill(0);

  console.log("running on port", port);

  http.listen(port);
  console.log(gameType);

  events[gameType]["game start"]();

});


// this allows cross origin JSON requests (to get status message)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// serve files from these directories
app.use('/sprites', express.static('sprites'));
app.use('/map_editor', express.static('map_editor'));
app.use('/server_list', express.static('server_list'));

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

app.get('/client/messaging.js', function(req, res){
    res.sendFile(__dirname + '/client/messaging.js');
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

function json2contents(file_name){
  var fs = require('fs');
  var contents = fs.readFileSync(file_name).toString();
  const mapFileContents = JSON.parse(contents);
  return mapFileContents;
}

function json2Flags(flags){
  for(var i = 0; i < flags.length; i++){
    flags[i].id = i;
    flags[i].name = "FLAG" + flags[i].id;

    var tempFlagY = flags[i].position.y;
    var tempFlagZ = flags[i].position.z;

    flags[i].position.y = tempFlagZ;
    flags[i].position.z = tempFlagY;

    flags[i].originalPosition = {};
    flags[i].originalPosition.x = flags[i].position.x;
    flags[i].originalPosition.y = flags[i].position.y;
    flags[i].originalPosition.z = flags[i].position.z;

    flags[i].show = true;

  }

  return flags;
}

function json2spawn(inputSpawn, numberOfTeams){
  if(inputSpawn.length == 0){
    return ["All Locations Valid"];
  }else{
    var spawnAreas = [];
    for(var i = 0; i < numberOfTeams; i++){
      spawnAreas.push(new Array());
    }
    inputSpawn.forEach(area => {
      spawnAreas[area.team].push(area.value);
    });

    //console.log(spawnAreas);
    return spawnAreas;
  }
  
}

function cloneArray(inputArr){
  return JSON.parse(JSON.stringify(inputArr));
}

//Each team starts off as the whole map as valid. 
function setUpValidSpawnLocations(teamNum){
  var spawnLoc = [];
  var mapCoordinates = [];
  for(var z = 1; z < map.length - 2; z++){
    for(var y = 1; y < map[0].length - 1; y++){
      for(var x = 1; x < map[0][0].length - 1; x++){
        mapCoordinates.push([z, y, x]);
      }
    }
  }

  for(var i = 0; i < teamNum; i++){
    spawnLoc[i] = cloneArray(mapCoordinates);
  }

  return spawnLoc;
}

function json2map(inputMap){
  var map = [];
  map = inputMap;
  
  console.log("Map Loaded:",map[0][0].length, "by", map[0].length, "by", map.length);

  //check to make sure its a valid map
  if(map.length < 3){
    console.err("The map is too short to spawn the player. Please add a map with at least 3 levels.");
  }
  
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

var classes = [
  "scout",
  "sniper",
  "heavy"
];

var reloadTime = {
  scout: 100,
  sniper: 1000,
  heavy: 900
};


io.on("connection", function(socket){
  var player = {};
  player.id = nextId++;
  player.name = "player " + player.id;
  player.socket = socket;
  player.kills = [];
  player.deaths = [];
  player.position = {x:0,y:0,z:1000};
  player.class = "scout";
  player.respawning = false;
  player.team = randomTeam(player);
  player.color = randomPlayerColor(player.team);
  player.hasFlag = false;


  respawn(player);
  console.log("player "+player.id+" logged in");
  setClass(player, player.class);
  players.push(player);

  events[gameType]["new player"](player);

  socket.on("setUser", function(user){
    if(player.name != user.name){
        console.log(player.name + " changed their name to " + user.name);
        player.name = user.name;
        events[gameType]["update leaderboard"]();
    }

    //player.color = user.color; //no longer allow player to set their own color
    for(i in players){
        if(players[i].id != player.id){
            players[i].socket.emit("updatePlayer", {id:player.id, name: player.name, color:player.color, position: player.position});
        }
    }
  });

  socket.on("map", function(){
    socket.emit("map", map, colors);
    for(var f in flags){
      if(flags[f].show){
        socket.emit("create flag", flags[f]);
      }
    }
    socket.emit("c")
    for(i in players){
      if(players[i].id != player.id){
        player.socket.emit("new player", {id:players[i].id, position:players[i].position, name:players[i].name, color: players[i].color});
        if(players[i].hasFlag){
          player.socket.emit("flash player", players[i].id, "yellow");
        }
        players[i].socket.emit("new player", {id:player.id, position:player.position, name:player.name, color: player.color});
      }
    }
  });

  socket.on("respawn", function() {
    respawn(player);
  })

  socket.on("playerFell", function(){
      player.deaths.push([player.id]);
      events[gameType]["update leaderboard"]();
      events[gameType]["player fell"](player);
      respawn(player);
  });

  socket.on("respawned", function(){
      player.respawning = false;
  });

  socket.on("player position", function(position){
    if(!player.respawning){
      player.position = position;
      if(flags.length > 0){
        let flag = flagCollisionCheck(player);
        if(flag){
          events[gameType]["flag touch"](player, flag);
        }
        if(player.hasFlag){
          if(flagReturned(player)){
            events[gameType]["flag return"](player);
          }
        }
      }
    }
  });

  socket.on("change class", function(newClass){
    if(classes.includes(newClass)){
      setClass(player, newClass);
    }
  });

  socket.on("disconnect",function(){
    if(player.hasFlag){
      resetFlagPosition(player.hasFlag);
      playerDropFlag(player);
    }
    for(i in players){
      if(players[i].id == player.id){
        players.splice(i,1);
      }
      if(i < players.length){
        players[i].socket.emit("player left", player.id);
      }
    }
    events[gameType]["player left"](player);
    console.log(player.name + " left");
    tellEveryone(player.name + " left");
    events[gameType]["update leaderboard"]();
  });

  socket.on("launch", function(angle){
    var p = getNewProjectile(player.class);
    p.id = nextId++;
    p.owner = player;
    p.count = 0;

    p.position = {};
    p.position.x = player.position.x;
    p.position.y = player.position.y + 14;
    p.position.z = player.position.z;

    p.velocity = {};
    p.velocity.x = angle.dx * p.speed;
    p.velocity.y = angle.dy * p.speed + 1;
    p.velocity.z = angle.dz * p.speed;

    p.position.x += angle.dx * 10;
    p.position.y += angle.dy * 10;
    p.position.z += angle.dz * 10;

    if(p.position.x != NaN && p.position.y != NaN && p.position.z != NaN){
      projectiles.push(p);
      moveProjectile(p);
    }

  });

  socket.on("message", function(message){
    for(i in players){
      players[i].socket.emit("message", {from:player.name, text:message});
    }
  });

});

function randomPlayerColor(teamNum){
  if(gameType == gameTypes.FFA || spawnAreas[0] == ["All Locations Valid"]){
    return "hsl(" +(Math.random()*360)+ ", 50%, 50%)";
  }else if(gameType == gameTypes.CTF){
    return spawnAreas[teamNum][0];
  }else{
    return "hsl(" +(Math.random()*360)+ ", 50%, 50%)";
  }
}

function randomTeam(player){
  var team = Math.floor(Math.random() * numberOfTeams);
  player.socket.emit("message", {from:"server", text:"Your team is "+team});
  return team;
}

function setClass(player, newClass){
  player.class = newClass;
  player.socket.emit("set class", {name:player.class, reloadTime:reloadTime[player.class]});
  player.socket.emit("message", {from:"server", text:"Your class is now "+newClass});
}

function tellEveryone(messageText){
  for(i in players){
    players[i].socket.emit("message", {from:"server", text:messageText});
  }
}

function announceHit(hitPlayer, oPlayer){
  hitPlayer.socket.emit("message", {from: "server", text: oPlayer.name + " hit you!"});
  oPlayer.socket.emit("message", {from: "server", text: "you hit " + hitPlayer.name + "!"});
}

function flagReturned(player){
  if(player.hasFlag){
    var smallPlayerPos = {x: Math.floor((player.position.x / 20.0) + 0.5), y: Math.floor(player.position.y / 20.0)-1, z: Math.floor((player.position.z/20.0) + 0.5)};
    //If player is out of the map range, then can't be valid
    if(map[smallPlayerPos.y] != undefined){
      if(map[smallPlayerPos.y][smallPlayerPos.z] != undefined){
        if(map[smallPlayerPos.y][smallPlayerPos.z][smallPlayerPos.x] != undefined){
          var mapColorValue = map[smallPlayerPos.y][smallPlayerPos.z][smallPlayerPos.x];
          if(mapColorValue > 0){
            var mapColor = colors[mapColorValue][0];
            if(spawnAreas[player.team].includes(mapColor)){
              //Player back in spawn area
              return true;
            }
          }
        }
      }
    }
    
  }
  return false;
}

function flagCollisionCheck(player){
  if(!player.hasFlag){
    for(var i in flags){
      if(flags[i].show){
        var smallPlayerPos = {x: player.position.x / 20.0, y: player.position.y / 20.0, z: player.position.z/20.0};
        //check for collision:
        if(smallPlayerPos.x > flags[i].position.x-0.5 && smallPlayerPos.x < flags[i].position.x-0.5 + 1){
          if(smallPlayerPos.y > flags[i].position.y - 1 && smallPlayerPos.y < flags[i].position.y + 1){
            if(smallPlayerPos.z > flags[i].position.z-0.5 && smallPlayerPos.z < flags[i].position.z-0.5 + 1){
              //there is a collision. 
              return flags[i];
            }
          }
        }
      }
    }
  }
  return false;
}

function resetFlagPosition(flag){
  flag.position.x = flag.originalPosition.x;
  flag.position.y = flag.originalPosition.y;
  flag.position.z = flag.originalPosition.z;
}

function moveFlagToPlayer(flag, player){
  flag.position.x = Math.floor(player.position.x/20 +0.5);
  flag.position.y = Math.floor(player.position.y/20 +0.5);
  flag.position.z = Math.floor(player.position.z/20 +0.5);
}

function playerDropFlag(player){
  player.hasFlag.show = true;
  for(var j in players){
    players[j].socket.emit("create flag", player.hasFlag);
    if(players[j].id != player.id){
      players[j].socket.emit("stop flash", player.id);
    }
  }
  tellEveryone(player.name + " dropped " + player.hasFlag.name);
  player.hasFlag = false;
  player.totalFlagTime += new Date() - player.flagPickUpTime;
  player.flagPickUpTime = 0;
}

function projCollisionWithMap(p, map){
  mapPos = {};
  mapPos.x = Math.floor((p.position.x+10)/20);
  mapPos.y = Math.floor((p.position.y+10)/20);
  mapPos.z = Math.floor((p.position.z+10)/20);

  if(mapPos.x >= 0 && mapPos.y >= 0 && mapPos.z >= 0){
    if(map.length > mapPos.y && map[0].length > mapPos.z && map[0][0].length > mapPos.x){
      if(map[mapPos.y][mapPos.z][mapPos.x] > 0){
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
      
      events[gameType]["player hit"](players[i], p);

      return true;
    }
  }
  return false;
}

function respawn(p){
  p.respawning = true;
  //validSpawnLocations is an array with one index for each team. 
  //The teams start off with the whole map as valid.
  //As this method finds and checks random spots, invalid spots are removed. 
  //Eventually only valid spots remain for each team. 
  //A spot is valid if it has two empty blocks above it and the colors matches one of p's team's spawn color. 
  
  //But first, reset the flag if the player has one. 
  //If the player is shot, the flag is dropped in the projCollision method so this won't apply
  //this is only used if the player falls off the edge.
  if(p.hasFlag){
    resetFlagPosition(p.hasFlag);
    playerDropFlag(p);
  }


  var x, y , z = 0;
  var validLocation = false;
  while(!validLocation){
    var teamSpawnMap = validSpawnLocations[p.team];

    if(teamSpawnMap.length == 0){
      console.err("No valid spawn areas for team: " + p.team);
    }

    var randomLocation = Math.floor(Math.random()*teamSpawnMap.length)
    x = teamSpawnMap[randomLocation][2];
    y = teamSpawnMap[randomLocation][1];
    z = teamSpawnMap[randomLocation][0];

    
    if(map[z][y][x] != null){
      if(map[z][y][x] > 0 && map[z+1][y][x] == 0 && map[z+2][y][x] == 0){
        if(spawnAreas[p.team].includes(colors[map[z][y][x]][0]) || spawnAreas[0] == ["All Locations Valid"]){
          validLocation = true;
          // console.log("valid length:");
          // console.log(teamSpawnMap.length);
        }
      }
    }
    if(!validLocation){
      teamSpawnMap.splice(randomLocation, 1);
    }
  }
  //console.log("found new point");

  p.socket.emit("updateRespawnLocation", {x:x, y:y, z:z});
  p.position = {x:1000, y:1000, z:1000};
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

function normalize(v){
  let magnitude = Math.sqrt((v.x * v.x) + (v.y * v.y) + (v.z * v.z));
  return {x: v.x/magnitude, y: v.y/magnitude, z: v.z/magnitude};
}

function randomAngle(){
  let v = {};
  v.x = Math.random() - 0.5;
  v.y = Math.random() - 0.5;
  v.z = Math.random() - 0.5;
  return normalize(v);
}

function fracture(p){
  let num_fractures = 4;
  let fracture_speed = 10;
  for(let i = 0; i < num_fractures; i++){
    let newp = {};
    newp.id = nextId++;
    newp.owner = p.owner;
    newp.count = 0;

    newp.position = {};
    newp.position.x = p.position.x;
    newp.position.y = p.position.y;
    newp.position.z = p.position.z;

    newp.velocity = randomAngle();
    newp.velocity.x *= fracture_speed;
    newp.velocity.y *= fracture_speed;
    newp.velocity.z *= fracture_speed;

    newp.fracture = p.fracture - 1;
    projectiles.push(newp);
    moveProjectile(newp);
  }
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

function getNewProjectile(type){
  if(type == "scout"){
    return new scoutProjectile();
  }else if(type == "sniper"){
    return new sniperProjectile();
  }else if(type == "heavy"){
    return new heavyProjectile();
  }
}

function scoutProjectile(){
  this.fracture = 0;
  this.speed = 40;
  this.grav = 5;
  this.lifeSpan = 800;
}

function sniperProjectile(){
  this.fracture = 0;
  this.speed = 100;
  this.grav = 5;
  this.lifeSpan = 800;
}

function heavyProjectile(){
  this.fracture = 3;
  this.speed = 30;
  this.grav = 6;
  this.lifeSpan = 800;
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
      if(p.fracture > 0){
        fracture(p);
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

function restartGame(){
  projectiles = [];
  teamScores = new Array(numberOfTeams).fill(0);

  resetFlags();
  resetPlayers();
  events[gameType]["update leaderboard"]();
  
}

function resetFlags(){
  for(var i in flags){
    resetFlagPosition(flags[i]);
  }
}

function resetPlayers(){
  for(var i in players){
    players[i].kills = [];
    players[i].deaths = [];
    players[i].position = {x:0,y:0,z:1000};
    players[i].class = "scout";
    players[i].team = randomTeam(player);
    players[i].respawning = false;
    players[i].hasFlag = false;
    players[i].totalFlagTime = 0;
    players[i].flagPickUpTime = 0;

    setClass(player, player.class);

    respawn(player);
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


// !!--!!--!!--!!--!!--!!--!!--!!--!!--!! EVENTS !!--!!--!!--!!--!!--!!--!!--!!--!!--!!

/* types of event:
      game start ()
      new player (player)
      player left (player)
      player hit (player, projectile)
      player fell (player)
      flag pickup (player, flag)
      flag return (player)

*/
var events = {};


//  ---------------------------------------------  Free For All ---------------
events[gameTypes.FFA] = {};
events[gameTypes.FFA]["game start"] = function(){
  // nothing
}
events[gameTypes.FFA]["new player"] = function(player){
  // nothing
}
events[gameTypes.FFA]["player left"] = function(player){
  // nothing
}
events[gameTypes.FFA]["player hit"] = function(player, p){
  announceHit(player, p.owner);
  player.deaths.push(p.owner.id);
  p.owner.kills.push(player.id);
  
  respawn(player);

  if(ALLOWGAMERESTARTS && p.owner.kills.length >= 20){
    for(var i in players){
      players[i].socket.emit("restart screen");
      if(players[i].id != p.owner.id){
        players[i].socket.emit("message", {from:"server", text: "Game Over. " + player.name + " won! Press Play to start a new game."});
      }else{
        players[i].socket.emit("message", {from:"server", text:"You win! Press Play to start a new game."});
      }
    }
    restartGame();
  }
  events[gameType]["update leaderboard"]();
}
events[gameTypes.FFA]["player fell"] = function(player){
  // nothing
}
events[gameTypes.FFA]["flag touch"] = function(player, flag){
  // nothing
}
events[gameTypes.FFA]["flag return"] = function(player){
  // nothing
}

events[gameTypes.FFA]["update leaderboard"] = function(){
  var leaderboard =  gameType + "<br> Leaderboard:<br>";
  var board = players.map(function(p){
    return {name:p.name,kills:p.kills,deaths:p.deaths};
  });
  board = board.sort(function(a,b){
    return (b.kills.length * b.kills.length / b.deaths.length) - (a.kills.length * a.kills.length / a.deaths.length);
  });

  //Add players to leaderboard string
  for(var i = 0; i < board.length; i++) {
    leaderboard += board[i].name + ": " + board[i].kills.length + " K, " + board[i].deaths.length + " D" + "<br>"
  }
  for(i in players){
    players[i].socket.emit("leaderboard",leaderboard);
  }
}


//  ---------------------------------------------  Capture The Flag ---------------
events[gameTypes.CTF] = {};
events[gameTypes.CTF]["game start"] = function(){
  // nothing
}
events[gameTypes.CTF]["new player"] = function(player){
  // nothing
}
events[gameTypes.CTF]["player left"] = function(player){
  // nothing
}

events[gameTypes.CTF]["player hit"] = function(player, p){
  announceHit(player, p.owner);
  player.deaths.push(p.owner.id);
  p.owner.kills.push(player.id);
  
  //Drop the flag where the player is standing: 
  if(player.hasFlag){
    let flag = player.hasFlag;
    player.hasFlag = false;
    moveFlagToPlayer(flag, player);
    player.hasFlag = flag;
    playerDropFlag(player);
  }

  respawn(player);
}

events[gameTypes.CTF]["player fell"] = function(player){
  // nothing
}

events[gameTypes.CTF]["flag touch"] = function(player, flag){
  if(flag.team != player.team){
    player.hasFlag = flag;
    flag.show = false;
    player.flagPickUpTime = new Date();
    events[gameType]["update leaderboard"]();
    for(var p in players){
      players[p].socket.emit("remove flag", flag);
      if(players[p].id != player.id){
        players[p].socket.emit("flash player", player.id, "yellow");
      }
    }
    tellEveryone(player.name + " has " + player.hasFlag.name + "!");
  }
}

events[gameTypes.CTF]["flag return"] = function(player){
  tellEveryone(player.name + " has returned with " + player.hasFlag.name + "!");
  resetFlagPosition(player.hasFlag);
  playerDropFlag(player);

  //Update score: 
  teamScores[player.team]++;
  events[gameType]["update leaderboard"]();

  //restart if necessary
  if(ALLOWGAMERESTARTS && teamScores[player.team] >= 5){
    for(var i in players){
      players[i].socket.emit("restart screen");
      if(players[i].team != player.team){
        players[i].socket.emit("message", {from:"server", text: "Game Over. Team " + player.team + " won! Press Play to start a new game."});
      }else{
        players[i].socket.emit("message", {from:"server", text:"You win! Press Play to start a new game."});
      }
    }
    restartGame();
  }
}

events[gameTypes.CTF]["update leaderboard"] = function(){
  var leaderboard =  gameType + "<br> Leaderboard:<br>";
  for(var i = 0; i < teamScores.length; i++) {
    if(teamScores[i] == 1){
      leaderboard += "Team " + i + ": " + teamScores[i] + " point " + "<br>"
    }else{
      leaderboard += "Team " + i + ": " + teamScores[i] + " points " + "<br>"
    }
  }

  for(i in players){
    players[i].socket.emit("leaderboard",leaderboard);
  }
}



//  ---------------------------------------------  TEAMS ---------------

events[gameTypes.TEAMS] = {};
events[gameTypes.TEAMS]["game start"] = function(){
  // nothing
}
events[gameTypes.TEAMS]["new player"] = function(player){
  // nothing
}
events[gameTypes.TEAMS]["player left"] = function(player){
  // nothing
}

events[gameTypes.TEAMS]["player hit"] = function(player, p){
  announceHit(player, p.owner);
  teamScores[player.team]++;
  respawn(player);
  events[gameType]["update leaderboard"]();
}


events[gameTypes.TEAMS]["player fell"] = function(player){
  // nothing
}
events[gameTypes.TEAMS]["flag touch"] = function(player, flag){
  // nothing
}
events[gameTypes.TEAMS]["flag return"] = function(player){
  // nothing
}

events[gameTypes.TEAMS]["update leaderboard"] = function(){
  var leaderboard =  gameType + "<br> Leaderboard:<br>";
  for(var i = 0; i < teamScores.length; i++) {
    if(teamScores[i] == 1){
      leaderboard += "Team " + i + ": " + teamScores[i] + " point " + "<br>"
    }else{
      leaderboard += "Team " + i + ": " + teamScores[i] + " points " + "<br>"
    }
  }

  for(i in players){
    players[i].socket.emit("leaderboard",leaderboard);
  }
}


//  ---------------------------------------------  King of the Hill ---------------

events[gameTypes.KOTH] = {};
events[gameTypes.KOTH]["game start"] = function(){
  // nothing
}

events[gameTypes.KOTH]["new player"] = function(player){
  player.totalFlagTime = 0;
  player.flagPickUpTime = 0;
}

events[gameTypes.KOTH]["player left"] = function(player){
  // nothing
}

events[gameTypes.KOTH]["player hit"] = function(player, p){
  announceHit(player, p.owner);
  if(player.hasFlag){
    let flag = player.hasFlag;
    player.hasFlag = false;
    moveFlagToPlayer(flag, player);
    respawn(player);
    player.hasFlag = flag;
    playerDropFlag(player);
  }else{
    respawn(player);
  }
  events[gameType]["update leaderboard"]();
}

events[gameTypes.KOTH]["player fell"] = function(player){
  // nothing
}

events[gameTypes.KOTH]["flag touch"] = function(player, flag){
  // pick up any flag
  player.hasFlag = flag;
  flag.show = false;
  player.flagPickUpTime = new Date();
  events[gameType]["update leaderboard"]();
  for(var p in players){
    players[p].socket.emit("remove flag", flag);
    if(players[p].id != player.id){
      players[p].socket.emit("flash player", player.id, "yellow");
    }
  }
  tellEveryone(player.name + " has " + player.hasFlag.name + "!");
}

events[gameTypes.KOTH]["flag return"] = function(player){
  // nothing
}

events[gameTypes.KOTH]["update leaderboard"] = function(){
  var leaderboard =  gameType + "<br> Leaderboard:<br>";
  var board = players.map(function(p){
    return {name:p.name, totalFlagTime:p.totalFlagTime, flagPickUpTime:p.flagPickUpTime, hasFlag:p.hasFlag};
  });
  board = board.sort(function(a,b){
    return (b.totalFlagTime) - (a.totalFlagTime);
  });

  var gameOver = false;
  //Add players to leaderboard string
  for(var i = 0; i < board.length; i++) {
    if(board[i].hasFlag){
      var currentTime = (new Date() - board[i].flagPickUpTime) + board[i].totalFlagTime;
      if(currentTime >= 300000){
        gameOver = true;
      }
      leaderboard += "<span style=\"color: green;\">" + board[i].name + ": " + currentTime/1000.0 + " seconds </span> " + "<br>";
    }else{
      leaderboard += board[i].name + ": " + board[i].totalFlagTime/1000.0 + " seconds " + "<br>";
      if(board[i].totalFlagTime >= 300000){
        gameOver = true;
      }
    }
  }

  for(i in players){
    players[i].socket.emit("leaderboard",leaderboard);
  }

  if(ALLOWGAMERESTARTS && gameOver){
    for(var i in players){
      players[i].socket.emit("restart screen");
      if(players[i].id != player.id){
        players[i].socket.emit("message", {from:"server", text: "Game Over. " + player.name + " won! Press Play to start a new game."});
      }else{
        players[i].socket.emit("message", {from:"server", text:"You win! Press Play to start a new game."});
      }
    }
    restartGame();
  }
}






