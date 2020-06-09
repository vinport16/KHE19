var square_width = 10;
var view_position = {x:-20, y:-2};
var view_height = 0;

//var block_type = 0;
var brush_type = 0;
var gameType_type = 0;
var selectedGameType = "";
var numberOfTeams = 0;
var selectedColor = "white";
var selectednonBlockObject = "F";
var inColorMode = true;

var previousSelected;

let spawnAreas = [];

let flags = [];
var currentFlagTeam = 1;

let snowballPiles = [];

let nonBlockObjectTypes = [
  "F", //Flag
  "S" //Snowball Pile
]

let emptyColor = ["white", 0.0]

let oldColors = [
  emptyColor,
  ["#059900", 0.1],//green
  ["#e60000", 0.1],//red
  ["#573a00", 0.05],//brown
  ["#1957b3", 0.25],//blue
  ["#d69d00", 0.05],//yellow
  ["#6b6b6b", 0.05],//grey
  ["#ff33ad", 0.2],//pink
  ["#1957b3", 0.25]//blue
]

let colors = [
  emptyColor
]

let brush = [
  "point",
  "three",
  "five",
  "seven",
  "rectangle"
]

let three_brush = [
  [1,1,1],
  [1,1,1],
  [1,1,1]
];

let five_brush = [
  [0,1,1,1,0],
  [1,1,1,1,1],
  [1,1,1,1,1],
  [1,1,1,1,1],
  [0,1,1,1,0]
];

let seven_brush = [
  [0,0,1,1,1,0,0],
  [0,1,1,1,1,1,0],
  [1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1],
  [0,1,1,1,1,1,0],
  [0,0,1,1,1,0,0]
];

let gameType = [
  "Free For All",
  "Capture The Flag",
  "Teams",
  "King of the Hill"
]

var map = blankMap(1, 0, 0);
var previous_map;
alert("Welcome to the BlockBall Map Editor. Create a new map in the upper left corner or import a map below to get started. ");

function blankMap(zz,xx,yy){
  let map = [];
  for(let z = 0; z < zz; z++){
    map.push([]);
    for(let x = 0; x < xx; x++){
      map[z].push([]);
      for(let y = 0; y < yy; y++){
        map[z][x][y] = 0;
      }
    }
  }
  return map;
}

map.exists = function(z,x,y){
  if(map[z] && map[z][x] && typeof map[z][x][y] != "undefined"){
    return true;
  }
  return false;
}

function writeTile(position, value){
  if(map.exists(view_height, position.x, position.y)){
    map[view_height][position.x][position.y] = value;
  }
  if(value < 0){
    storeObjectPosition(position, value);
  }
}

function cloneMap(map){
  let clone = [];
  for(let z = 0; z < map.length; z++){
    clone.push([]);
    for(let x = 0; x < map[z].length; x++){
      clone[z].push([]);
      for(let y = 0; y < map[z][x].length; y++){
        clone[z][x][y] = map[z][x][y];
      }
    }
  }
  // transfer the exists function
  clone.exists = map.exists;
  return clone;
}

function saveState(){
  previous_map = cloneMap(map);
}

saveState();

function drawTile(position, color){ //color should be string
  let vp = subtract(position, view_position);
  drawRectangle(multiply(vp,square_width), {x:square_width, y:square_width}, color);
}

function drawEmptySpace(position){
  let vp = subtract(position, view_position);
  var topLeft = multiply(vp, square_width);
  var bottomRight = {x: topLeft.x + square_width, y: topLeft.y + square_width};
  drawLine(topLeft, bottomRight, "red");
}

function drawNonBlockObject(position, text){
  let vp = subtract(position, view_position);
  var topLeft = multiply(vp, square_width);
  var textPos = {x: topLeft.x, y: topLeft.y + square_width - (square_width/10)};
  drawText(textPos, square_width, text);
}

function drawMap(){
  clearCanvas();
  for(let i = 0; i < map[view_height].length; i++){
    for(let j = 0; j < map[view_height][i].length; j++){
      // show preview two levels deep
      if(map[view_height][i][j] == 0 && view_height > 0){
        if(view_height > 2 && map[view_height-1][i][j] <= 0 && map[view_height-2][i][j] <= 0){
          drawEmptySpace({x: i, y: j});
        }else if(map[view_height-1][i][j] <= 0 && view_height > 1){
          if(map[view_height-2][i][j] > 0){
            drawTile({x:i, y:j}, colors[map[view_height-2][i][j]][0]);
            drawTile({x:i, y:j}, "rgba(255,255,255,0.5)");
          }
          if(view_height == 2 && map[view_height-2][i][j] <= 0){
            drawEmptySpace({x: i, y: j});
          }
        }else{
          if(map[view_height - 1][i][j] > 0){
            drawTile({x:i, y:j}, colors[map[view_height-1][i][j]][0]);
          }
          if(view_height == 1 && map[view_height-1][i][j] <= 0){
            drawEmptySpace({x: i, y: j});
          }
        }
        drawTile({x:i, y:j}, "rgba(255,255,255,0.5)");
      }else{
          if(map[view_height][i][j] > 0){
            drawTile({x:i, y:j},colors[map[view_height][i][j]][0]);
          }else if(map[view_height][i][j] < 0){
            var correctIndex = (map[view_height][i][j] * (-1)) - 1;
            drawNonBlockObject({x:i, y:j}, nonBlockObjectTypes[correctIndex]);
          }
          if(view_height == 0 && map[view_height][i][j] == 0){
            drawEmptySpace({x: i, y: j});
          }
      }
    }
  }
}

function drawRange(start, end){
  
  let startx = Math.min(start.x, end.x);
  let starty = Math.min(start.y, end.y);
  
  let endx = Math.max(start.x, end.x);
  let endy = Math.max(start.y, end.y);

  if(map.exists(view_height, startx, starty)){
    if(!inColorMode){
      drawNonBlockObject({x:startx, y:starty}, selectednonBlockObject);
    }
  }

  for(let x = startx; x <= endx; x++){
    for(let y = starty; y <= endy; y++){
      if(map.exists(view_height, x, y)){
        if(inColorMode){
          drawTile({x:x, y:y}, selectedColor);
        }
        // }else{
        //   drawNonBlockObject({x:x, y:y}, selectednonBlockObject);
        // }
        
      }
    }
  }
}

function writeRange(start, end){
  
  let startx = Math.min(start.x, end.x);
  let starty = Math.min(start.y, end.y);
  
  let endx = Math.max(start.x, end.x);
  let endy = Math.max(start.y, end.y);

  if(!inColorMode){
    writeTile({x:startx, y:starty}, findNonBlockValue(selectednonBlockObject));
  }

  for(let x = startx; x <= endx; x++){
    for(let y = starty; y <= endy; y++){
      if(inColorMode){
        writeTile({x:x, y:y}, findColorValue(selectedColor));
      }
    }
  }
}

function writeArray(position, array, block){
  let startx = -Math.floor(array.length/2);
  let starty = -Math.floor(array[0].length/2);

  let endx = array.length + startx;
  let endy = array[0].length + starty;

  for(let x = startx; x < endx; x++){
    for(let y = starty; y < endy; y++){
      if(array[x - startx][y - starty] == 1){
        writeTile({x:position.x + x, y:position.y + y}, block);
      }
    }
  }
}

function writeWithBrush(position, brush, colorIndex){
  if(inColorMode){
    if(brush[brush_type] == "point"){
      writeTile(position, colorIndex);
    }else if(brush[brush_type] == "three"){
      writeArray(position, three_brush, colorIndex);
    }else if(brush[brush_type] == "five"){
      writeArray(position, five_brush, colorIndex);
    }else if(brush[brush_type] == "seven"){
      writeArray(position, seven_brush, colorIndex);
    }
  }else{
      writeTile(position, colorIndex);
  }
  
}

drawMap();


// INPUT TIME

// canvas input

var startSelection = null;

canvas.addEventListener("mousedown", function(event){

  let position = {x:event.clientX, y:event.clientY};
  position = floor(multiply(position, 1/square_width));
  position = add(position, view_position);

  saveState();

  startSelection = position;

  if(inColorMode){
    writeWithBrush(position, brush, findColorValue(selectedColor));
  }else{
    writeWithBrush(position, brush, findNonBlockValue(selectednonBlockObject));
  }
  

  drawMap();
  //drawTile(position, "red");
});

canvas.addEventListener("mousemove", function(event){

  let position = {x:event.clientX, y:event.clientY};
  position = floor(multiply(position, 1/square_width));
  position = add(position, view_position);

  if(startSelection){
    
    if(inColorMode){
      writeWithBrush(position, brush, findColorValue(selectedColor))
    }
    

    drawMap();
    if(brush[brush_type] == "rectangle"){
      drawRange(position, startSelection);
    }
  }

});

canvas.addEventListener("mouseup", function(event){

  let position = {x:event.clientX, y:event.clientY};
  position = floor(multiply(position, 1/square_width));
  position = add(position, view_position);
  
  if(brush[brush_type] == "rectangle"){
    writeRange(position, startSelection);
  }

  drawMap();


  startSelection = null;

});

document.addEventListener("keypress", function(event){
  if(event.key == "w"){
    view_position.y -= 10;
  }else if(event.key == "s"){
    view_position.y += 10;
  }else if(event.key == "a"){
    view_position.x -= 10;
  }else if(event.key == "d"){
    view_position.x += 10;
  }else if(event.key == "q"){
    if(view_height > 0){
      view_height -= 1;
    }
  }else if(event.key == "e"){
    if(view_height < map.length-1){
      view_height += 1;
    }
  }
  updateLayer();
  drawMap();
});

// UNDO
var cmd_is_down = false;

document.addEventListener("keydown", function(event){
  if(event.metaKey){
    cmd_is_down = true;
  }
  if(event.key == "z" && cmd_is_down){
    map = previous_map;
    drawMap();
  }
});

document.addEventListener("keyup", function(event){
  if(event.key == "Meta"){
    cmd_is_down = false;
  }
});

// menu input
var current_layer = document.getElementById("current-layer");

var xsize = document.getElementById("xsize");
var ysize = document.getElementById("ysize");
var gameType_select = document.getElementById("gameType");
var new_map = document.getElementById("new");

var file = document.getElementById("file"); 
var import_file = document.getElementById("import"); 

var button_small = document.getElementById("size-small");
var button_big = document.getElementById("size-big");

var insert_layer = document.getElementById("new-layer"); 
var delete_layer = document.getElementById("delete-layer"); 
var duplicate_layer = document.getElementById("duplicate-layer"); 

var nonBlockObjectSelect = document.getElementById("nonBlockObjectSelect");


var brush_select = document.getElementById("brush");

var jsonImport = document.getElementById("jsonImport");
var jsonExport = document.getElementById("jsonExport");
var addColor = document.getElementById("addNewColor");
var colorSelect = document.getElementById("colorSelect");

function updateLayer(){
  current_layer.innerHTML = "layer: "+(view_height+1)+"/"+map.length;
}
updateLayer();

new_map.onclick = function(){
  if(confirm("This will delete your current map")){
    saveState();
    let e = map.exists;
    map = blankMap(5, xsize.value, ysize.value);
    map.exists = e;
    view_height = 0;
    updateLayer();

    //Set the number of teams for this map
    selectedGameType = gameType[gameType_type];
    if(selectedGameType == "Capture The Flag" || selectedGameType == "Teams"){
      var teamNum = parseInt(prompt("The game type you selected involves teams. How many teams can play on this map?", "2"), 10);
      if(teamNum != null && !isNaN(teamNum)){
        numberOfTeams = teamNum;
      }else{
        numberOfTeams = 2;
      }
    }else{
      numberOfTeams = 1;
    }
    //Update the html to match the number of teams for this map.
    refreshPageForTeamNum();
    drawMap();
  }
};

function flipMap(map){ // blockball uses zyx array order, editor uses zxy
  newMap = [];
  for(let z = 0; z < map.length; z++){
    newMap.push([]);
    for(let x = 0; x < map[z].length; x++){
      for(let y = 0; y < map[z][x].length; y++){
        if(newMap[z][y] == undefined){
          newMap[z].push([]);
        }
        newMap[z][y][x] = map[z][x][y];
      }
    }
  }

  return newMap;
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

jsonImport.onclick = function(){
  let reader = new FileReader();
  reader.onload = function(event){
    let contents = event.target.result;
    let e = map.exists;

    //console.log(contents);
    var jsonContents = JSON.parse(contents);

    //console.log(jsonContents);

    flags = jsonContents.specialObjects.flags;
    snowballPiles = jsonContents.specialObjects.snowballPiles;
    spawnAreas = jsonContents.specialObjects.spawnAreas;
    numberOfTeams = jsonContents.mapInfo.numberOfTeams;
    refreshPageForTeamNum();

    map = [];
    map = jsonContents.map;
   

    //remove all current colors on the page
    colors = [];
    var colorParent = document.getElementById("colorSelect");
    while (colorParent.firstChild){
      colorParent.removeChild(colorParent.firstChild);
    }

    //Add the new colors to the html page with the spawn colors labels
    colors = jsonContents.colors;
    for(var c in colors){
      var alreadyAdded = false;
      for(var i = 0; i < spawnAreas.length; i++){
        if(spawnAreas[i].value == colors[c][0]){
          var teamPlusOne = spawnAreas[i].team+1
          addColorDiv(colors[c], "T"+teamPlusOne);
          alreadyAdded = true;
        }
      }
      if(!alreadyAdded){
        addColorDiv(colors[c], "");
      }
    }

    document.getElementById("mapName").value = jsonContents.mapInfo.name;
    document.getElementById("creatorName").value = jsonContents.mapInfo.creator;
    selectedGameType = jsonContents.mapInfo.gameType;
    for(var i = 0; i < gameType.length; i++){
      if(jsonContents.mapInfo.gameType == gameType[i]){
        document.getElementById("gameType").selectedIndex = i;
      }
    }
    

    map = flipMap(map);
    map.exists = e;
    
    drawMap();

  }
  reader.readAsText(file.files[0]);
}

import_file.onclick = function(){
  let reader = new FileReader();
  reader.onload = function(event) {
    let contents = event.target.result;
    let e = map.exists;
    map = [];

    map.push([]);
    let d2 = 0;
    let d1 = 0;

    // NOT SURE WHICH LINE SEPARATOR IS CORRECT!!
    let file = contents.split('\n');
    if(file.length == 1){
      file = file[0].split('\r');
    }

    // Iterate through lines of map file
    file.forEach(function(line) {
      if(line[0] == 'n') {
        map.push([]);
        d1++;
      }else{
        let line_chars = line.split(',');
        map[d1].push(line_chars);
      }
    });
    map.forEach(function(layer, i) {
      layer.forEach(function(line, j) {
        line.forEach(function(char, k) {
          map[i][j][k] = map[i][j][k] == '' ? 0 : parseInt(map[i][j][k]);
        });
      });
    });

    map = flipMap(map);
    map.exists = e;

    console.log(map);

    colors = oldColors;
    
    drawMap();
  };
  reader.readAsText(file.files[0]);
}

jsonExport.onclick = function(){
  var tempFlags = [];
  var tempSnowballPiles = [];

  let flipped_map = flipMap(map);  
  //convert all string values to int values
  for(let z = 0; z < flipped_map.length; z++){
    for(let x = 0; x < flipped_map[z].length; x++){
      for(let y = 0; y < flipped_map[z][x].length; y++){
        flipped_map[z][x][y] = Number(flipped_map[z][x][y]);
        //Only add flags that are still in the map to the exported array. 
        //If a flag is replaced with a block, we don't want to save that flag
        if(flipped_map[z][x][y] < 0){
          if(flipped_map[z][x][y] == -1){
            for(var i = 0; i < flags.length; i++){
              if(x == flags[i].position.y && y == flags[i].position.x && z == flags[i].position.z){
                tempFlags.push(flags[i]);
              }
            }
          }else if(flipped_map[z][x][y] == -2){
            for(var i = 0; i < snowballPiles.length; i++){
              if(x == snowballPiles[i].position.y && y == snowballPiles[i].position.x && z == snowballPiles[i].position.z){
                tempSnowballPiles.push(snowballPiles[i]);
              }
            }
          }
        }
      }
    }
  }

  flags = tempFlags;
  snowballPiles = tempSnowballPiles;
  
  var tempMap = map;
  map = flipped_map;

  var json = {"mapInfo": {}, "specialObjects":{flags, spawnAreas, snowballPiles}, colors, map};
  
  map = tempMap;

  var mapName = document.getElementById("mapName").value;
  //TODO: Clean map name input and creater name input.
  if(mapName == ""){
    alert("Please enter a map name");
  }else{
    json.mapInfo.name = mapName;
    json.mapInfo.creator = document.getElementById("creatorName").value;
    json.mapInfo.dateMade = new Date().toISOString();
    json.mapInfo.gameType = selectedGameType;
    json.mapInfo.numberOfTeams = numberOfTeams;

    var jsonString = JSON.stringify(json);
    console.log(json);
    console.log(jsonString);

    download(mapName + ".json", jsonString);
  }
  
}

insert_layer.onclick = function(){
  saveState();
  map.splice(view_height+1, 0, []);
  
  for(let x = 0; x < map[view_height].length; x++){
    map[view_height+1].push([]);
    for(let y = 0; y < map[view_height][x].length; y++){
      map[view_height+1][x][y] = 0;
    }
  }

  updateLayer();
  drawMap();
};

delete_layer.onclick = function(){
  saveState();
  if(map.length > 0){
    map.splice(view_height, 1);
    view_height = clamp(view_height, 0, map.length-1);
  }
  updateLayer();
  drawMap();
};

duplicate_layer.onclick = function(){
  saveState();
  map.splice(view_height+1, 0, []);
  
  for(let x = 0; x < map[view_height].length; x++){
    map[view_height+1].push([]);
    for(let y = 0; y < map[view_height][x].length; y++){
      map[view_height+1][x][y] = map[view_height][x][y];
    }
  }

  updateLayer();
  drawMap();
};

button_small.onclick = function(){
  if(square_width > 5){
    square_width -= 5;
  }
  drawMap();
};

button_big.onclick = function(){
  if(square_width < 100){
    square_width += 5;
  }
  drawMap();
};

function refreshPageForTeamNum(){
  //Remove old checkboxes
  var spawnSelectParent = document.getElementById("teamSpawnSelect");
  while (spawnSelectParent.firstChild){
    spawnSelectParent.removeChild(spawnSelectParent.firstChild);
  }

  //Add new checkboxes for each team: 
  for(var i = 0; i < numberOfTeams; i++){
    var newSpawnCheckbox = document.createElement("input");
    newSpawnCheckbox.setAttribute("type", "checkbox");
    newSpawnCheckbox.setAttribute("value", i);
    var newId = "team"+i+"spawn";
    newSpawnCheckbox.setAttribute("id", newId);

    document.getElementById("teamSpawnSelect").appendChild(newSpawnCheckbox);

    //Add the label
    var newSpawnCheckboxLabel = document.createElement("label");
    newSpawnCheckboxLabel.setAttribute("for", newId);
    var idPlusOne = i + 1;
    if(numberOfTeams == 1){
      newSpawnCheckboxLabel.innerHTML = "Spawn Area";
    }else{
      newSpawnCheckboxLabel.innerHTML = "Team " + idPlusOne + " Spawn";
    }

    document.getElementById("teamSpawnSelect").appendChild(newSpawnCheckboxLabel);

    var newBreak = document.createElement("br");
    document.getElementById("teamSpawnSelect").appendChild(newBreak);
  }
}

//TODO: update this method to just check the value when comparing it to and adding it to the array.
function storeObjectPosition(position, value){
  if(value == -1){
    //console.log("Adding new flag");
    var flagObj = {};
    flagObj.team = currentFlagTeam - 1;
    flagObj.position = {x: position.x, y: position.y, z: view_height};
    //Check for flags in the same spot and replace them
    for(var i = 0; i < flags.length; i++){
      if(flagObj.position.x == flags[i].position.x && flagObj.position.y == flags[i].position.y && flagObj.position.z == flags[i].position.z){
        flags.splice(i,1);
      }
    }
    flags.push(flagObj);
  }else if(value == -2){
    //console.log("Adding new snowball Pile");
    var snowballPileObj = {};
    snowballPileObj.amount = parseInt(Math.random() * 10 + 1);
    snowballPileObj.position = {x: position.x, y: position.y, z: view_height};
    //Check for snowball Piles in the same spot and replace them
    for(var i = 0; i < snowballPiles.length; i++){
      if(snowballPileObj.position.x == snowballPiles[i].position.x && snowballPileObj.position.y == snowballPiles[i].position.y && snowballPileObj.position.z == snowballPiles[i].position.z){
        snowballPiles.splice(i,1);
      }
    }
    snowballPiles.push(snowballPileObj);
  }
  //add other types here. 
}

nonBlockObjectSelect.addEventListener("click", function(){
  if(event.target.id != "nonBlockObjectSelect"){
    inColorMode = false;
    selectednonBlockObject = event.target.id;
    
    if(previousSelected != null){
      document.getElementById(previousSelected).style.border = "";
    }
    document.getElementById(selectednonBlockObject).style.border = "1px solid red";
    previousSelected = selectednonBlockObject;

    if(selectedGameType == selectedGameType == "Capture The Flag"){
      currentFlagTeam = parseInt(prompt("What team is gaurding this flag?", currentFlagTeam+""));
    }else{
      currentFlagTeam = 2;
    }
  }
});

addColor.onclick = function(){
  var color = document.getElementById("newColor").value;
  var range = Number(document.getElementById("newColorRange").value);
  if(isNaN(range)){
    range = 0.05;
  }

  var isDuplicateColor = false;
  for(var i = 0; i < colors.length; i++){
    if(colors[i][0] == color){
      isDuplicateColor = true;
    }
  }

  if(!isDuplicateColor){
    //Add new color to the colors array
    colors.push([color, range]);
    
    var colorAdded = false;
    var checkboxes = document.getElementById("teamSpawnSelect").getElementsByTagName("input");
    for(var i = 0; i < checkboxes.length; i++){
      if(checkboxes[i].checked && !checkboxes[i].disabled && !colorAdded){
        var iPlusOne = i + 1;
        addColorDiv([color, range], "T" + iPlusOne);
        spawnAreas.push({"team": i, "value": color});
        checkboxes[i].checked = false;
        colorAdded = true;
      }
    }

    if(!colorAdded){
      addColorDiv([color, range], "");
    }
  }else{
    alert("Color already added.");
  }
  
}

colorSelect.addEventListener("click", function(){
  if(event.target.id != "colorSelect"){
    inColorMode = true;
    selectedColor = event.target.id;
    if(previousSelected != null){
      document.getElementById(previousSelected).style.border = "";
    }
    document.getElementById(selectedColor).style.border = "1px solid white";
    previousSelected = selectedColor;
  }
});

function addColorDiv(colorInfo, spawnTeamText){
  var color = colorInfo[0];
  var range = colorInfo[1];

  //Add color square to the html page
  var newColorDiv = document.createElement("div");
  newColorDiv.setAttribute("style", "height: 29px; width: 29px; display: inline-block; background-color:" + color);
  newColorDiv.setAttribute("id", color);
  if(spawnTeamText != ""){
    newColorDiv.innerHTML = spawnTeamText;
  }

  newColorDiv.setAttribute("class", "colorBox tooltip");

  document.getElementById("colorSelect").appendChild(newColorDiv);


  var newColorTooltip = document.createElement("span");
  
  newColorTooltip.innerHTML = color + ", " + range;
  if(colors.length % 5 == 1){
    newColorTooltip.setAttribute("class", "tooltipText tooltipRight");
  }else if(colors.length % 5 == 0){
    newColorTooltip.setAttribute("class", "tooltipText tooltipLeft");
  }else{
    newColorTooltip.setAttribute("class", "tooltipText tooltipCenter");
  }
  

  document.getElementById(color).appendChild(newColorTooltip);
  
}

for(var i = 0; i < brush.length; i++){
  var opt = brush[i];
  var el = document.createElement("option");
  el.textContent = opt;
  el.value = i;
  brush_select.appendChild(el);
}

brush_select.addEventListener("change", function(){
  brush_type = brush_select.value;
});

for(var i = 0; i < gameType.length; i++){
  var opt = gameType[i];
  var el = document.createElement("option");
  el.textContent = opt;
  el.value = i;
  gameType_select.appendChild(el);
}

gameType_select.addEventListener("change", function(){
  gameType_type = gameType_select.value;
})

function findColorValue(color){
  for(var i = 0; i < colors.length; i++){
    if(colors[i][0] == color){
      return i;
    }
  }
}

function findNonBlockValue(type){
  for(var i = 0; i < nonBlockObjectTypes.length; i++){
    if(nonBlockObjectTypes[i] == type){
      var value = i * (-1) - 1
      return value;
    }
  }
}
