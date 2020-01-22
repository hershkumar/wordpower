var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var sqlite3 = require('sqlite3').verbose();

// replace the uri string with your connection string.
const pass = fs.readFileSync('pass.txt');

// initialize sqlite3 database
console.log('Initializing rankings database...');
var db = new sqlite3.Database('./db/rankings.db');
console.log('...done.');
// mock adding things to the table
db.run('CREATE TABLE IF NOT EXISTS players (name TEXT, elo INT)');
var stmt = db.prepare('INSERT INTO players (name, elo) VALUES(?,?)');
stmt.run('test', 500);



names = [];

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

let sql = `SELECT DISTINCT Name name FROM players ORDER BY name`;
app.route('/rankings').get(function(req,res){
	db.all(sql,[],(err,rows) => {
		rows.forEach((row) => {
			console.log(row.name);
		});

	});
});
