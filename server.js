var express = require('express');
var app = express();
var http = require('http').createServer(app);
var sqlite3 = require('sqlite3').verbose();

// initialize sqlite3 database
console.log('Initializing rankings database...');
var db = new sqlite3.Database('./db/rankings.db');
console.log('...done.');
// mock adding things to the table
//db.run('CREATE TABLE If NOT EXISTS players (name TEXT, elo INTEGER)');
var stmt = db.prepare('INSERT INTO players (name, elo) VALUES(?,?)');
//stmt.run('Hersh', 500);
//stmt.run('Emmy', 500);
//stmt.run('Nate', 500);
//stmt.run('Shawn', 5000);





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
app.route('/rankings').get(function(req,res){
	res.sendFile(__dirname + '/rankings.html');
	// accessing the database
	db.each(sql,[],(err,rows) => {
		if (err) throw err;
		console.log(rows.name, rows.elo)
	});
});
