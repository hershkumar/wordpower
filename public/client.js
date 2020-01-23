$(document).ready(function(){
    var socket = io.connect();
    socket.on('connect',function(){
        socket.emit('checkRankings');
    });
    socket.on('sendDB', function(msg){
        // remove the old table and replace it with the new one
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
        var emit = true;
        // check the message for dumb stuff
        for (i = 0; i< msg.length; i++){
            if (msg[i] == "" || msg[i] == null){
                emit = false;
            }
        }
        if (emit == true){
            // empty the two text boxes
            $("#name1").empty();
            $("#name2").empty();
            $("#score1").empty();
            $("#score2").empty();
            $("#word").empty();
            // actually submit to the server that we have a new game

            socket.emit('submitNewGame', msg);
        }


    });

    new fullpage("#fullpage", {
        responsiveWidth: 700,
        parallax: true
    });

    $(".sforma").on('click', e => {
        fullpage_api.moveTo(2);
    })
});