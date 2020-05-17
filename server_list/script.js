var list = document.getElementById("servers");

servers = [
  "http://108.244.228.25:3030/",
  "http://localhost:3030/",
];

for(let idx = 0; idx < servers.length; idx++){
  let server = document.createElement("div");
  server.class = "server";

  let text = document.createTextNode(servers[idx] + ": pending...");
  server.appendChild(text);

  list.appendChild(server);

  var xmlhttp = new XMLHttpRequest();
  var url = servers[idx] + "status.json";

  xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          let status = JSON.parse(this.responseText);
          update(server, status);
      }
  };
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function update(server, status){
  console.log(server, status);
}