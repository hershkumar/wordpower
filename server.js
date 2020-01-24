var express = require('express');
var app = express();
var http = require('http').createServer(app);
var sqlite3 = require('sqlite-sync');
var io = require('socket.io')(http);
var path = require('path');

app.use(express.static(path.join(__dirname, '/public')));

// initialize sqlite3 database
console.log('Initializing rankings database...');
sqlite3.connect('db/rankings.db');
//sqlite3.run("CREATE TABLE players(name TEXT, elo INTEGER)");
// sqlite3.run("INSERT INTO players (name, elo) VALUES('Dhruv',1000)");
// sqlite3.run("INSERT INTO players (name, elo) VALUES('Patrick',1000)");
// sqlite3.run("INSERT INTO players (name, elo) VALUES('Emmy',1000)");
// sqlite3.run("INSERT INTO players (name, elo) VALUES('Nate',1000)");
// sqlite3.run("INSERT INTO players (name, elo) VALUES('Shawn',1000)");
// sqlite3.run("INSERT INTO players (name, elo) VALUES('Hersh',1000)");

// make mock game database

//sqlite3.run("CREATE TABLE games(time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, winner TEXT, loser TEXT, winner_score INT, loser_score INT, longword TEXT)");
//sqlite3.run("INSERT INTO games (winner, loser, winner_score, loser_score, longword) VALUES('Dhruv','Nate', 10000, 5000,'yeet')");
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

// when a client connects to the server
io.sockets.on('connection',function(socket){

	socket.on('checkRankings', function(){
		//send the user the data
		io.emit('sendDB', getTable());
	});	

	socket.on('submitNewGame',function(msg){
		if (msg[0] != "" && msg[1] != ""){
			var name1 = msg[0];
			var name2 = msg[1];
			updateElos(name1,name2);
		}
		io.emit('sendDB', getTable());
	});
});



function getPlayerElo(name){
	var player = sqlite3.run("SELECT * FROM players elo WHERE name = $playerName",{
		$playerName: name
	});
	var elo = player[0].elo;
	return elo
}

function getTable(){
	let sql = `SELECT * from players ORDER BY elo DESC`;
	data = sqlite3.run(sql);
	names = [];
	elos = [];
	for (i = 0; i< data.length; i++){
		names.push(data[i].name);
		elos.push(data[i].elo);
	}
  return {'names': names, 'elos': elos};
}

function updateElos(name1, name2){
	var e1 = getPlayerElo(name1);
	var e2 = getPlayerElo(name2);

	var deltaElo = 0;
	// do cost calculation here
	deltaElo = parseInt(30 + (e2-e1)/30);
	//update value for both players
	var p1NewElo = e1 + deltaElo;
	var p2NewElo = e2 - deltaElo;
	if (p1NewElo <= 0){
		p1NewElo = 0;
	}
	if (p2NewElo <= 0){
		p2NewElo = 0;
	}
	sqlite3.run("UPDATE players SET elo = $newElo WHERE name = $playerName",{
		$newElo:p1NewElo,
		$playerName: name1
	});
	sqlite3.run("UPDATE players SET elo = $newElo WHERE name = $playerName",{
		$newElo:p2NewElo,
		$playerName: name2
	});
}