$(document).ready(function(){
	var socket = io.connect();
	socket.on('connect',function(){
		// get the table of games when you connect
		socket.emit('checkGames');
	});

	socket.on('sendGames', msg => {
		//display the table of games so you can scroll through and stuff
		
		//$("#tablehere").empty().append(table(msg));
	});

	// when the admin decides to change something
	// send 'editGame' with the data that you want to change


});