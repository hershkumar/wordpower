$(document).ready(function(){
    var socket = io.connect();
    socket.on('connect',function(){
        socket.emit('checkRankings');
    });
    socket.on('sendDB', function(msg){
        $("body").after(msg);
    });

    $("#submitform").submit(function(e){
        e.preventDefault();
        var name1 = $("#name1").val();
        var name2 = $("#name2").val();
        msg = [name1, name2];

        // check the message for dumb stuff

        // empty the two text boxes
        $("name1").empty();
        $("name2").empty();
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