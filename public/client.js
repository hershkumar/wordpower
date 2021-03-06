
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

    socket.on('sendDiv1', msg => {
        for (var i = 0 ; i < msg['ELO'].length; i++){
            msg['ELO'][i] = parseInt(msg['ELO'][i])
        }
        $("#div1").empty().append(table(msg));
    });
    
    socket.on('sendDiv2', msg => {
        for (var i = 0 ; i < msg['ELO'].length; i++){
            msg['ELO'][i] = parseInt(msg['ELO'][i])
        }
        $("#div2").empty().append(table(msg));
    });

    socket.on('sendDiv3', msg => {
        for (var i = 0 ; i < msg['ELO'].length; i++){
            msg['ELO'][i] = parseInt(msg['ELO'][i])
        }
        $("#div3").empty().append(table(msg));
    });

    socket.on('badSubmission', msg => {
        alert(msg);
    });


    $("#submitform").submit(function(e){
        e.preventDefault();
        var name1 = $("#name1").val();
        var name2 = $("#name2").val();
        var score1 = $("#score1").val();
        var score2 = $("#score2").val();
        var longword = $("#word").val();
        var password = $("#password").val();
        msg = [name1, name2, score1, score2, longword, password];
        var emit = true;
        // check the message for dumb stuff
        for (i = 0; i< msg.length; i++){
            if (msg[i] == "" || msg[i] == null){
                emit = false;
            }
        }
        if (emit == true){
            // empty the text boxes
            $("#name1").val('');
            $("#name2").val('');
            $("#score1").val('');
            $("#score2").val('');
            $("#word").val('');
            $("#password").val('');
            // actually submit to the server that we have a new game

            socket.emit('submitNewGame', msg);
            console.log("submitted game!");
        }


    });

    new fullpage("#fullpage", {
        responsiveWidth: 700,
        autoScrolling: false,
        parallax: true,
        onLeave: (o, d, dir) => {
            console.log(o.index, d.index);
            $("#nav-list li:nth-child({0})".format(o.index + 1)).toggleClass("active");
            $("#nav-list li:nth-child({0})".format(d.index + 1)).toggleClass("active");
        }
    });

    $("#nav-list li:nth-child(1)").on('click', () => { fullpage_api.moveTo(1); });
    $("#nav-list li:nth-child(2)").on('click', () => { fullpage_api.moveTo(2); });
    $("#nav-list li:nth-child(3)").on('click', () => { fullpage_api.moveTo(3); });
});