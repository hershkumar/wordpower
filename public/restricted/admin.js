$(document).ready(function(){
	var socket = io.connect();
	socket.on('connect',function(){
		// get the table of games when you connect
		//socket.emit('checkGames');
		var pass = "";
		while (pass == "" || pass == null || pass == undefined){
			pass = prompt("Enter Password", "");
		}
		socket.emit('authRequest', pass);
	});

	socket.on('sendGames', msg => {
		//display the table of games so you can scroll through and stuff
		CreateTable(msg);
		console.log("Making table of games");
	});

    socket.on('badSubmission', msg => {
        alert(msg);
    });
    socket.on('redirect', dest =>{
    	window.location.href = dest;
    });
    // when the radio buttons change
    $('input:radio[name="editType"]').change(function(){
    	if ($(this).val() == "Delete"){
    		var rowNum = prompt("What row would you like to delete? (0 indexed)", "");
    		if (rowNum != null && rowNum != undefined && ~isNaN(rowNum)){
    			var msg = ["DELETE",rowNum];
    			socket.emit('editGame',msg);
    		}
    	}

    	else {
    		var rowNum = prompt("What row would you like to edit? (0 indexed)", "");
    		if (rowNum != null && rowNum != undefined && ~isNaN(rowNum)){
				var new_winner = prompt("New winner?", "skip");
				var new_loser = prompt("New loser?", "skip");
				var new_wscore = prompt("New winner score?", "skip");
				var new_lscore = prompt("New loser score?", "skip");
				var new_lword = prompt("New word?", "skip");
				var msg = ["UPDATE",rowNum,new_winner,new_loser,new_wscore,new_lscore,new_lword];
				socket.emit('editGame',msg);
			}
    	}
    });
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