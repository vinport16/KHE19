function ff(file_name) {
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

		//console.log(d1 + ": " + map.toString());
	});
	map.forEach(function(layer, i) {
		layer.forEach(function(line, j) {
			line.forEach(function(char, k) {
				map[i][j][k] = map[i][j][k] == ' ' ? 0 : 3;
			})
		})
	})

	return map;
}

var m = ff('../maps/20x20map.txt');
m.toString();
