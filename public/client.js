function table(obj) {
    var s = "";

    var th = "<th scope=\"{0}\">{1}</th>";
    var td = "<td scope=\"row\">{0}</td>";

    s += "<thead><tr>";
    s += th.format("col", "Rank");
    for (i in obj) { s += th.format("col", i); }
    s += "</tr></thead>";

    s += "<tbody>";
    for ([idx, n] of obj['Name'].entries()) {
        s += "<tr>";
        s += th.format("row", idx + 1);
        s += td.format(n);
        for (arr in obj) {
            if (arr !== 'Name') {
                s += td.format(obj[arr][idx]);
            }
        }
        s += "</tr>";
    }
    s += "</tbody>";

    return s;
}

$(document).ready(function(){
    var socket = io.connect();
    socket.on('connect',function(){
        socket.emit('checkRankings');
    });
    socket.on('sendDB', msg => {
        $("#tablehere").empty().append(table(msg));
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