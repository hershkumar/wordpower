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

    // https://stackoverflow.com/questions/7717527/smooth-scrolling-when-clicking-an-anchor-link
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        console.log(anchor);
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});