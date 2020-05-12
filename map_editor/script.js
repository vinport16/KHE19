var square_width = 10;
var view_position = {x:-20, y:-2};
var view_height = 0;

var block_type = 0;
var brush_type = 0;

let color = [
  "white",
  "green",
  "red",
  "brown",
  "blue",
  "yellow",
  "gray",
  "pink",
  "blue"
]

let brush = [
  "point",
  "three",
  "seven",
  "rectangle"
]

let three_brush = [
  [1,1,1],
  [1,1,1],
  [1,1,1]
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

var map = blankMap(5, 40, 40);
var previous_map;

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

function drawMap(){
  for(let i = 0; i < map[view_height].length; i++){
    for(let j = 0; j < map[view_height][i].length; j++){
      // show preview two levels deep
      if(map[view_height][i][j] == 0 && view_height > 0){
        if(map[view_height-1][i][j] == 0 && view_height > 1){
          drawTile({x:i, y:j}, color[map[view_height-2][i][j]]);
          drawTile({x:i, y:j}, "rgba(255,255,255,0.5)");
        }else{
          drawTile({x:i, y:j}, color[map[view_height-1][i][j]]);
        }
        drawTile({x:i, y:j}, "rgba(255,255,255,0.5)");
      }else{
        drawTile({x:i, y:j},color[map[view_height][i][j]]);
      }
    }
  }
}

function drawRange(start, end){
  
  let startx = Math.min(start.x, end.x);
  let starty = Math.min(start.y, end.y);
  
  let endx = Math.max(start.x, end.x);
  let endy = Math.max(start.y, end.y);

  for(let x = startx; x <= endx; x++){
    for(let y = starty; y <= endy; y++){
      if(map.exists(view_height, x, y)){
        drawTile({x:x, y:y}, color[block_type]);
      }
    }
  }
}

function writeRange(start, end){
  
  let startx = Math.min(start.x, end.x);
  let starty = Math.min(start.y, end.y);
  
  let endx = Math.max(start.x, end.x);
  let endy = Math.max(start.y, end.y);

  for(let x = startx; x <= endx; x++){
    for(let y = starty; y <= endy; y++){
      writeTile({x:x, y:y}, block_type);
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

function writeWithBrush(position, brush, block_type){
  if(brush[brush_type] == "point"){
    writeTile(position, block_type);
  }else if(brush[brush_type] == "three"){
    writeArray(position, three_brush, block_type);
  }else if(brush[brush_type] == "seven"){
    writeArray(position, seven_brush, block_type);
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

  writeWithBrush(position, brush, block_type);

  clearCanvas();
  drawMap();
  //drawTile(position, "red");
});

canvas.addEventListener("mousemove", function(event){

  let position = {x:event.clientX, y:event.clientY};
  position = floor(multiply(position, 1/square_width));
  position = add(position, view_position);

  if(startSelection){
    
    writeWithBrush(position, brush, block_type)

    clearCanvas();
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

  clearCanvas();
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
  clearCanvas();
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
    clearCanvas();
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
var new_map = document.getElementById("new");

var file = document.getElementById("file"); //TODO
var import_file = document.getElementById("import"); //TODO
var export_file = document.getElementById("export");

var button_small = document.getElementById("size-small");
var button_big = document.getElementById("size-big");

var insert_layer = document.getElementById("new-layer"); //TODO
var delete_layer = document.getElementById("delete-layer"); //TODO
var duplicate_layer = document.getElementById("duplicate-layer"); //TODO

var brush_select = document.getElementById("brush");
var color_select = document.getElementById("color");

function updateLayer(){
  current_layer.innerHTML = "layer: "+(view_height+1)+"/"+map.length;
}
updateLayer();

new_map.onclick = function(){
  if(confirm("this will delete your current map")){
    saveState();
    let e = map.exists;
    map = blankMap(5, xsize.value, ysize.value);
    map.exists = e;
    view_height = 0;
    updateLayer();
    drawMap();
  }
};

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

import_file.onclick = function(){
  let reader = new FileReader();
  reader.onload = function(event) {
    let contents = event.target.result;
    let e = map.exists;
    map = [];
    map.exists = e;

    map.push([]);
    let d2 = 0;
    let d1 = 0;

    let file = contents.split('\r');

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
    console.log("Map Loaded");
  };
  reader.readAsText(file.files[0]);
}

export_file.onclick = function(){
  output = "";
  for(let z = 0; z < map.length; z++){
    for(let x = 0; x < map[z].length; x++){
      for(let y = 0; y < map[z][x].length; y++){
        if(map[z][x][y] != 0){
          output += map[z][x][y];
        }
        if(y+1 < map[z][x].length){
          output += ",";
        }
      }
      if(x+1 < map[z].length){
        output += "\r";
      }
    }
    if(z+1 < map.length){
      output += "n,"+'\r';
    }
  }
  download("map.csv", output);
};

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
  clearCanvas();
  drawMap();
};

button_big.onclick = function(){
  if(square_width < 100){
    square_width += 5;
  }
  clearCanvas();
  drawMap();
};

for(var i = 0; i < color.length; i++){
  var opt = color[i];
  if(i == 0){
    opt = "empty";
  }
  var el = document.createElement("option");
  el.textContent = opt;
  el.value = i;
  color_select.appendChild(el);
}

color_select.addEventListener("change", function(){
  block_type = color_select.value;
});

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












