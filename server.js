var express = require('express');
var app = express();
var http = require('http').createServer(app);
var sqlite3 = require('sqlite-sync');
var io = require('socket.io')(http);

// initialize sqlite3 database
console.log('Initializing rankings database...');
//var db = new sqlite3.Database('./db/rankings.db');
sqlite3.connect('db/rankings.db');
console.log('...done.');


app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.use(express.static('public'));

const port = 3000;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

http.listen(port,'0.0.0.0', function(){
    console.log('listening on *:', port);
});

let sql = `SELECT * from players ORDER BY elo DESC`;


function table(names, elos) {
	var openstr = "<table><tr><th>Name</th><th>Elo</th></tr>";
	var closestr = "</table>";
	var opentr = "<tr>";
	var closetr = "</tr>";
	var opendcell = "<td>";
	var closedcell = "</td>";

	for(i = 0; i < names.length; i++){
		openstr += opentr;
		openstr += opendcell + names[i] + closedcell;
		openstr += opendcell + elos[i] + closedcell;
		openstr += closetr;
	}
	openstr += closestr;
	return openstr;
}

// when a client connects to the server
io.sockets.on('connection',function(socket){

	socket.on('checkRankings', function(){
		//send the user the data
		data = sqlite3.run(sql);
		names = [];
		elos = [];
		for (i = 0; i< data.length; i++){
			names.push(data[i].name);
			elos.push(data[i].elo);
		}
		var htmlstr = table(names, elos);
		io.emit('sendDB', htmlstr);
		//console.log("sent data");
	});	
});


