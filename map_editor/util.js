// drawing functions

function clearCanvas(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function clearListeners(){
  var clone = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(clone, canvas);
  canvas = clone;
  ctx = canvas.getContext("2d");

  drawEverything();
}

function drawCircle(position, r, fill){
  ctx.beginPath();
  ctx.arc(position.x, position.y, r, 0, 2 * Math.PI, false);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawRectangle(tl, br, fill){
  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.rect(tl.x, tl.y, br.x, br.y);
  ctx.fill();
}

function drawLine(v1, v2, stroke){
  ctx.beginPath();
  ctx.moveTo(v1.x,v1.y);
  ctx.lineTo(v2.x,v2.y);
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawText(tl, size, text){
  ctx.font = size + "px Arial";
  ctx.fillText(text, tl.x, tl.y);
}

// Vectors

var zeroVector = {x:0,y:0};

function getVector(e){
  return {x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop};
}

function subtract(v1, v2){
  return {x: v1.x-v2.x, y: v1.y-v2.y};
}

function add(v1, v2){
  return {x: v1.x+v2.x, y: v1.y+v2.y};
}

function divide(v1,n){ //divide a vector by a number
  return {x: v1.x/n, y: v1.y/n};
}

function multiply(v1,n){ //multiply a vector by a number
  return {x: v1.x*n, y: v1.y*n};
}

function distance(v1, v2){
  return Math.sqrt( (v1.x-v2.x)*(v1.x-v2.x) + (v1.y-v2.y)*(v1.y-v2.y) );
}

function magnitude(v){
  return distance(zeroVector, v);
}

function unitVector(v){
  return divide(v, distance(zeroVector,v));
}

function dotProduct(v1, v2){
  return (v1.x*v2.x) + (v1.y*v2.y);
}

function component(v1, v2){
  return multiply(unitVector(v1), dotProduct(v2, v1));
}

function floor(v){
  return {x:Math.floor(v.x), y:Math.floor(v.y)};
}

function rotateVector(vec, ang){
    ang = -ang * (Math.PI/180);
    var cos = Math.cos(ang);
    var sin = Math.sin(ang);
    return {x: Math.round(10000*(vec.x * cos - vec.y * sin))/10000, y: Math.round(10000*(vec.x * sin + vec.y * cos))/10000};
}

// math

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

// setup

var canvas = document.getElementById("canvas");

canvas.width =  document.body.clientWidth;
canvas.height = document.body.clientHeight;

var ctx = canvas.getContext("2d");







// ok




