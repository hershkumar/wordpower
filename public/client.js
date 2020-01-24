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

$(document).ready(function(){
    var socket = io.connect();
    socket.on('connect',function(){
        socket.emit('checkRankings');
    });
    socket.on('sendDB', function(msg){
        console.log(msg);
        $("tablehere").empty();
        $("tablehere").append(msg);
    });

    $("#submitform").submit(function(e){
        e.preventDefault();
        var name1 = $("#name1").val();
        var name2 = $("#name2").val();
        var score1 = $("#score1").val();
        var score2 = $("#score2").val();
        var longword = $("#word").val();
        msg = [name1, name2, score1, score2, longword];

        // check the message for dumb stuff

        // empty the two text boxes
        $("#name1").empty();
        $("#name2").empty();
        $("#score1").empty();
        $("#score2").empty();
        $("#word").empty();
        // actually submit to the server that we have a new game

        socket.emit('submitNewGame', msg);

    });

    new fullpage("#fullpage", {
        responsiveWidth: 700,
        parallax: true
    });

    $(".sforma").on('click', e => {
        fullpage_api.moveTo(2);
    })
});