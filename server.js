var express = require('express');
var app = express();
var http = require('http').createServer(app);
var sqlite3 = require('sqlite-sync');
var io = require('socket.io')(http);
var path = require('path');
var fs = require('fs');

app.use(express.static('public'));


const key = fs.readFileSync('pass.txt', 'utf-8').trim(); 
// initialize sqlite3 database
console.log('Initializing rankings database...');

// sqlite3.run("CREATE TABLE players(name TEXT, elo INTEGER, division INTEGER)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Dhruv',1000,1)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Patrick',1000,1)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Emmy',1000,2)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Nate',1000,2)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Shawn',1000,3)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Hersh',1000,3)");


// sqlite3.run("CREATE TABLE games(time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, winner TEXT, loser TEXT, winner_score INTEGER, loser_score INTEGER, longword TEXT, winner_new_elo INTEGER, loser_new_elo INTEGER)");
//sqlite3.run("INSERT INTO games (winner, loser, winner_score, loser_score, longword, winner_new_elo, loser_new_elo) VALUES('Dhruv','Nate', 10000, 10000,'yeet', 10030, 99970)");
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

app.get('/admin.html', function(req, res){
    res.sendFile(__dirname + '/restricted/admin.html');
});

http.listen(port,'0.0.0.0', function(){
    console.log('listening on *:', port);
});

// when a client connects to the server
io.sockets.on('connection',function(socket){
	
	socket.on('checkRankings', function(){
		sqlite3.connect('db/rankings.db');
		//send the user the data
		io.emit('sendDiv1', getTable(1));
		io.emit('sendDiv2', getTable(2));
		io.emit('sendDiv3', getTable(3));
		sqlite3.close();
	});	

	socket.on('submitNewGame',function(msg){
		sqlite3.connect('db/rankings.db');
		var name1 = msg[0].trim();
		var name2 = msg[1].trim();
		var score1 = msg[2].trim();
		var score2 = msg[3].trim();
		var longword = msg[4].trim();
		var password = msg[5].trim();
		//check password
		if (password == key){	
			//check whether the names are in the db
			var nameCheck1 = sqlite3.run("SELECT 1 FROM rankings WHERE name=$name",{
				$name: name1
			});
			var nameCheck2 = sqlite3.run("SELECT 1 FROM rankings WHERE name=$name",{
				$name: name2
			});

			var divWinner = getDiv(name1);
			var divLoser = getDiv(name2);
			if (nameCheck1 != null && nameCheck2 != null){
				if (divWinner == divLoser){
					var gameCheck = checkForGame(name1, name2, score1, score2, longword);
					if (gameCheck == false){
						updateElos(name1,name2);
						io.emit('sendDiv1', getTable(1));
						io.emit('sendDiv2', getTable(2));
						io.emit('sendDiv3', getTable(3));
						addGameToDb(name1, name2, score1, score2, longword, getPlayerElo(name1), getPlayerElo(name2));
					}
				}
			}
		}
		sqlite3.close();
	});



	///////////// ADMIN PANEL ////////////////

	// when the admin loads the page and tries to get the list of games played
	socket.on('checkGames', function(){
		sqlite3.connect('db/rankings.db');
		// TODO:  set msg equal to the list of games
		var msg = sqlite3.run("SELECT * FROM games ORDER BY time");
		io.emit('sendGames', msg);
		sqlite3.close();
	});
	// when the admin tries to edit a game
	socket.on('editGame', function(msg){
		sqlite3.connect('db/rankings.db');
		
		// Can either DELETE or UPDATE the game
		// delete the row from the table
		if (msg[0].trim() == "DELETE"){
			var number = msg[1].trim(0);
			sqlite3.run("DELETE FROM games ORDER BY time LIMIT #num - 1,1",{
				$num: number
			});
		}

		if (msg[1].trim() == "UPDATE"){
			var number = msg[1].trim(0);
			var row = sqlite3.run("SELECT * FROM games ORDER BY time DESC LIMIT $offset + 1, 1",{
				$offset: number
			});
		}

		sqlite3.close();
	});

});


function getPlayerElo(name){
	var player = sqlite3.run("SELECT * FROM players elo WHERE name = $playerName",{
		$playerName: name
	});
	var elo = player[0].elo;
	return elo
}

function getTable(div){
	let sql = `SELECT * FROM players ORDER BY division,elo DESC`;
	data = sqlite3.run(sql);
	names = [];
	elos = [];
	for (i = 0; i< data.length; i++){
		if (data[i].division == div){
			names.push(data[i].name);
			elos.push(data[i].elo);			
		}
	}
	return {'Name': names, 'ELO': elos};
}

function updateElos(name1, name2){
	var e1 = getPlayerElo(name1);
	var e2 = getPlayerElo(name2);

	var deltaElo = 0;
	// do cost calculation here
	deltaElo = parseInt(30 + (e2-e1)/60);
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

function addGameToDb(name1, name2, score1, score2, longword, winner_new_elo, loser_new_elo){
	// insert the game into the database
	sqlite3.run("INSERT INTO games (winner, loser, winner_score, loser_score, longword, winner_new_elo, loser_new_elo) VALUES($winner, $loser, $sc1, $sc2, $word, $wnew, $lnew)",{
		$winner: name1,
		$loser: name2,
		$sc1: score1,
		$sc2: score2,
		$word: longword,
		$wnew: winner_new_elo,
		$lnew: loser_new_elo
	});

}

function getPlayerWinPercentage(name){
	var losses = sqlite3.run("SELECT COUNT(*) FROM games WHERE loser=$player",{
		$player: name
	});

	var wins = sqlite3.run("SELECT COUNT(*) FROM games WHERE winner=$player",{
		$player: name
	});

	return (wins/losses) * 100;
}

//returns true if the game already exists
//returns false if the game doesn't exist
function checkForGame(winner, loser, score1, score2, longword){
	var searched = sqlite3.run("SELECT * FROM games WHERE winner=$p1 AND loser=$p2 AND winner_score=$s1 AND loser_score=$s2 AND longword=$word",{
		$p1: winner,
		$p2: loser,
		$s1: score1,
		$s2: score2,
		$word: longword
	});
	if (searched[0] == undefined){
		return false;
	}
	else {
		return true;		
	}
}
// gets the division that the player is in
function getDiv(name){
	var player = sqlite3.run("SELECT * FROM players WHERE name = $playerName",{
		$playerName: name
	});
	var div = player[0].division;
	return div;
}