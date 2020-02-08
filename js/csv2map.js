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

  return map;
}

var m = csv2map('../maps/50x50map.csv');
//m.toString();
