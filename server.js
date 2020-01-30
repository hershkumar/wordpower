var express = require('express');
var app = express();
var http = require('http').createServer(app);
var sqlite3 = require('sqlite-sync');
var io = require('socket.io')(http);
var path = require('path');
var fs = require('fs');

app.use(express.static('public'));


const key = fs.readFileSync('pass.txt', 'utf-8').trim(); 
const adminPass = fs.readFileSync('public/restricted/admin.txt', 'utf-8').trim();
// initialize sqlite3 database
console.log('Initializing rankings database...');
// sqlite3.connect('db/rankings.db');
// sqlite3.run("CREATE TABLE players(name TEXT, elo INTEGER, division INTEGER)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Lucinda',1000,1)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Nate',1000,1)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Shawn',1000,1)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Zoe',1000,1)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Katherine',1000,1)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Emmy',1000,1)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Simon',1000,2)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Dhruv',1000,2)");

// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Aarthi',1000,3)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Victoria',1000,3)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Eric',1000,3)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Daniel',1000,3)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Shreeya',1000,3)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Seoyoung',1000,3)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Hersh',1000,3)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Patrick',1000,2)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Michelle',1000,2)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Amanda',1000,2)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Tekla',1000,2)");
// sqlite3.run("INSERT INTO players (name, elo, division) VALUES('Bryan',1000,2)");

// sqlite3.run("CREATE TABLE games(time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, winner TEXT, loser TEXT, winner_score INTEGER, loser_score INTEGER, longword TEXT, winner_new_elo INTEGER, loser_new_elo INTEGER)");
// sqlite3.close();
console.log('...done.');
console.log(sqlite3.run(`SELECT * FROM games`));


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


app.get('/statistics', function(req, res){
    res.sendFile(__dirname + '/statistics.html');
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
			var nameCheck1 = sqlite3.run("SELECT 1 FROM players WHERE name=$name",{
				$name: name1
			})[0];
			var nameCheck2 = sqlite3.run("SELECT 1 FROM players WHERE name=$name",{
				$name: name2
			})[0];

			if (nameCheck1 != undefined && nameCheck2 != undefined){
				if (name1 != name2){
					var divWinner = getDiv(name1);
					var divLoser = getDiv(name2);
		
					if (divWinner == divLoser){
						var gameCheck = checkForGame(name1, name2, score1, score2, longword);
						if (gameCheck == false){
							updateElos(name1,name2);
							io.emit('sendDiv1', getTable(1));
							io.emit('sendDiv2', getTable(2));
							io.emit('sendDiv3', getTable(3));
							addGameToDb(name1, name2, score1, score2, longword, getPlayerElo(name1), getPlayerElo(name2));
						}
						else {
							// game has already been submitted
							var msg = "That game has already been submitted!";
							socket.emit('badSubmission', msg);
						}
					}
					else {
						// the players aren't in the same division
						var msg = "Those players aren't in the same division!";
						socket.emit('badSubmission', msg);
					}
				}
				else{
					socket.emit('badSubmission', "Those two players are the same!");
				}
			}
			else {
				// One of the players doesn't exist
				var msg = "One or more of those players does not exist!";
				socket.emit('badSubmission', msg);
			}
		}
		else {
			socket.emit('badSubmission', "Wrong password!");
		}
		sqlite3.close();
	});



	///////////// ADMIN PANEL ////////////////

	// when the admin loads the page and tries to get the list of games played
	socket.on('checkGames', function(){
		sqlite3.connect('db/rankings.db');
		var msg = sqlite3.run("SELECT * FROM games ORDER BY time");
		io.emit('sendGames', msg);
		console.log("Sent list of games!");
		sqlite3.close();
	});

	socket.on('authRequest', msg => {
		if (msg.trim() != adminPass){
			socket.emit('badSubmission', "Incorrect Password!");
			socket.emit('redirect', '/');
		}
		else{
			sqlite3.connect('db/rankings.db');
			var msg = sqlite3.run("SELECT * FROM games ORDER BY time");
			socket.emit('sendGames', msg);
			sqlite3.close();
		}

	});

	// when the admin tries to edit a game
	socket.on('editGame', function(msg){
		sqlite3.connect('db/rankings.db');
		var number = msg[1].trim(0);
		var row  = sqlite3.run("SELECT * FROM games LIMIT 1 OFFSET $num",{
			$num: number - 1
		});	
		row = row[0];
		var time =  row.time;
		var cwinner = row.winner;
		var closer = row.loser;
		var cwscore = row.winner_score;
		var clscore = row.loser_score;
		var clword = row.longword;

		// Can either DELETE or UPDATE the game
		// delete the row from the table
		if (msg[0].trim() == "DELETE"){
			sqlite3.run("DELETE FROM games WHERE time = $time",{
				$time: time
			});
		}

		if (msg[0].trim() == "UPDATE"){
			if (msg[2].trim() != "skip"){
				sqlite3.run("UPDATE games SET winner=$winner WHERE time=$time",{
					$winner:msg[2].trim(),
					$time:time
				});
			}
			if (msg[3].trim() != "skip"){
				sqlite3.run("UPDATE games SET loser=$loser WHERE time=$time",{
					$loser:msg[3].trim(),
					$time:time
				});
			}
			if (msg[4].trim() != "skip"){
				sqlite3.run("UPDATE games SET winner_score=$winner WHERE time=$time",{
					$winner:msg[4].trim(),
					$time:time
				});
			}
			if (msg[5].trim() != "skip"){
				sqlite3.run("UPDATE games SET loser_score=$loser WHERE time=$time",{
					$loser:msg[5].trim(),
					$time:time
				});
			}
			if (msg[6].trim() != "skip"){
				sqlite3.run("UPDATE games SET longword=$word WHERE time=$time",{
					$word:msg[6].trim(),
					$time:time
				});
			}
		}
		updateAllElos();
		var msg = sqlite3.run("SELECT * FROM games ORDER BY time");
		socket.emit('sendGames',msg);
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

function getGames(){
    return {'games': sqlite3.run(`SELECT * FROM games`),
            'players': sqlite3.run(`SELECT * FROM players`)};
}

function updateElos(name1, name2){
	var e1 = getPlayerElo(name1);
	var e2 = getPlayerElo(name2);

	var deltaElo = 0;
	// do cost calculation here
	deltaElo = parseInt(40/(1+ Math.E^(-.0025*(e2-e1)))+10);
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
// this function gets called after you edit/delete a row in the games db
// essentially recalcs all elos
function updateAllElos(){
	// reset all elos to 1k
	var temp = sqlite3.run("UPDATE players SET elo=1000");
	console.log(temp);
	//iterate through all pairs of wins/losses in the new games database
	var allGames = sqlite3.run("SELECT * FROM games ORDER BY time");
	for (i = 0; i < allGames.length; i++){
		var winner = allGames[i].winner;
		var loser = allGames[i].loser;
		var time = allGames[i].time;
		// call updateElo() on the pair
		updateElos(winner, loser);
		// update the new elos stored in games
		sqlite3.run("UPDATE games SET winner_new_elo=$wne WHERE time = $time",{
			$wne:getPlayerElo(winner),
			$time: time
		});
		sqlite3.run("UPDATE games SET loser_new_elo=$lne WHERE time = $time",{
			$lne:getPlayerElo(loser),
			$time: time
		});
	}


}