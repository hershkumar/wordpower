$(document).ready(function(){
	var socket = io.connect();
	socket.on('connect',function(){
		// get the table of games when you connect
		socket.emit('checkGames');
	});

	socket.on('sendGames', msg => {
		//display the table of games so you can scroll through and stuff
		CreateTable(msg);
		console.log("Making table of games");
	});

	// when the admin decides to change something
	// send 'editGame' with the data that you want to change


});

// https://www.encodedna.com/javascript/populate-json-data-to-html-table-using-javascript.htm
function CreateTable(obj) {
        var col = [];
        for (var i = 0; i < obj.length; i++) {
            for (var key in obj[i]) {
                if (col.indexOf(key) === -1) {
                    col.push(key);
                }
            }
        }
        var table = document.createElement("table");
        var tr = table.insertRow(-1);                   // TABLE ROW.

        for (var i = 0; i < col.length; i++) {
            var th = document.createElement("th");      // TABLE HEADER.
            th.innerHTML = col[i];
            tr.appendChild(th);
        }
        for (var i = 0; i < obj.length; i++) {
            tr = table.insertRow(-1);
            for (var j = 0; j < col.length; j++) {
                var tabCell = tr.insertCell(-1);
                tabCell.innerHTML = obj[i][col[j]];
            }
        }
        
        var divContainer = document.getElementById("tablehere");
        divContainer.innerHTML = "";
        divContainer.appendChild(table);
    }