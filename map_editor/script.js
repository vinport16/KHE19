var square_width = 10;
var view_position = {x:-20, y:-2};
var view_height = 0;

var block_type = 1;

let color = [
  "white",
  "green",
  "red",
  "brown",
  "yellow",
  "gray",
  "pink",
  "blue"
]


let map = [
 [
  [1,1,1,0,1,1],
  [0,1,0,0,0,0],
  [0,1,0,0,1,0],
  [0,0,0,0,0,0],
  [1,0,1,1,0,1],
  [1,0,0,0,1,0]
  ],[
  [1,1,1,1,1,1],
  [1,1,0,0,0,1],
  [1,1,0,0,1,1],
  [1,0,0,0,0,1],
  [1,0,1,1,0,1],
  [1,1,1,1,1,1]
  ],[
  [1,1,1,1,1,1],
  [1,0,0,0,0,1],
  [1,0,0,0,0,1],
  [1,0,0,0,0,1],
  [1,0,0,0,0,1],
  [1,1,1,1,1,1]
  ]
];

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

function drawTile(position, color){ //color should be string
  let vp = subtract(position, view_position);
  drawRectangle(multiply(vp,square_width), {x:square_width, y:square_width}, color);
}

function drawMap(){
  for(let i = 0; i < map[view_height].length; i++){
    for(let j = 0; j < map[view_height][i].length; j++){
      drawTile({x:i, y:j},color[map[view_height][i][j]]);
      
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

drawMap();


// INPUT TIME

// canvas input

var startSelection = null;

canvas.addEventListener("mousedown", function(event){

  let position = {x:event.clientX, y:event.clientY};
  position = floor(multiply(position, 1/square_width));
  position = add(position, view_position);

  startSelection = position;

  clearCanvas();
  drawMap();
  //drawTile(position, "red");
});

canvas.addEventListener("mousemove", function(event){

  let position = {x:event.clientX, y:event.clientY};
  position = floor(multiply(position, 1/square_width));
  position = add(position, view_position);

  if(startSelection){
    clearCanvas();
    drawMap();
    drawRange(position, startSelection);
  }

});

canvas.addEventListener("mouseup", function(event){

  let position = {x:event.clientX, y:event.clientY};
  position = floor(multiply(position, 1/square_width));
  position = add(position, view_position);
  
  writeRange(position, startSelection);

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
  clearCanvas();
  drawMap();
});

// menu input

var file = document.getElementById("file"); //TODO
var import_file = document.getElementById("import"); //TODO
var export_file = document.getElementById("export");

var button_small = document.getElementById("size-small");
var button_big = document.getElementById("size-big");

var insert_layer = document.getElementById("new-layer"); //TODO
var delete_layer = document.getElementById("delete-layer"); //TODO
var duplicate_layer = document.getElementById("duplicate-layer"); //TODO

var color_select = document.getElementById("color");

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export_file.onclick = function(){
  output = "";
  for(let z = 0; z < map.length; z++){
    for(let x = 0; x < map[z].length; x++){
      for(let y = 0; y < map[z][x].length; y++){
        output += map[z][x][y];
        if(y+1 < map[z][x].length){
          output += ",";
        }
      }
      output += '\r';
    }
    if(z+1 < map.length){
      output += "n,"+'\r';
    }
  }
  download("map.csv", output);
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













