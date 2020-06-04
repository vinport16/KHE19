var list = document.getElementById("servers");

// LIST ALL KNOWN SERVER ADDRESSES IN THIS ARRAY
servers = [
  "http://68.9.117.73:3030/",
  "http://68.9.117.73:3031/",
  "http://68.9.117.73:3032/",
  "http://68.9.117.73:3033/",
  "http://68.9.117.73:3034/",
  "http://68.9.117.73:3035/",
  "http://localhost:3030/",
];

for(let idx = 0; idx < servers.length; idx++){
  let server = document.createElement("div");
  server.classList.add("server");
  server.id = "server" + idx;

  let text = document.createTextNode(servers[idx]);
  server.appendChild(text);

  server.appendChild(createPendingElement());

  list.appendChild(server);

  var xmlhttp = new XMLHttpRequest();
  var url = servers[idx] + "status.json";

  xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          let status = JSON.parse(this.responseText);
          update(server, servers[idx], status);
      }else if(this.readyState == 4 && this.status == 0){
          offline(server, servers[idx]);
      }
  };
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function update(server, address, status){

  removePendingElement(server);

  server.appendChild(document.createElement("br"));

  let link = document.createElement("a");
  link.href = address;
  link.text = status.name;
  server.appendChild(link);

  let info = document.createElement("div");
  info.classList.add("info");
  addText(info, status.description);
  info.appendChild(document.createElement("br"));
  addText(info, status.players + "/" + status.maxPlayers + " players");
  server.appendChild(info);
}

function offline(server, address, status){

  removePendingElement(server);

  let info = document.createElement("div");
  info.classList.add("info");
  addText(info, "Server Offline");
  server.appendChild(info);
}

function createPendingElement(){
  let div = document.createElement("div");
  div.id = "pending";

  let text = document.createTextNode("pending...");
  div.appendChild(text);
  return div;
}

function removePendingElement(node){
  document.querySelector('#'+node.id+' #pending').remove();
}

function addText(node, string){
  let text = document.createTextNode(string);
  node.appendChild(text);
}