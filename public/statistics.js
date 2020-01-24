var games = {};

function obj_from_names(players) {
    var o = {};
    for (p of players) {
        o[p.name] = [];
    }
    return o;
}

Array.prototype.last_or_0 = function() {
    var a = this.slice(-1).pop();
    return a === undefined ? 0 : a;
};

function read_data(data) {
    games = {};
    games['elo'] = obj_from_names(data.players);
    games['score'] = obj_from_names(data.players);

    for (game of data.games) {
        for (p of data.players) {
            if (p.name === game.winner) {
                games['elo'][p.name].push(game.winner_new_elo);
                games['score'][p.name].push(game.winner_score);
            } else if (p.name === game.loser) {
                games['elo'][p.name].push(game.loser_new_elo);
                games['score'][p.name].push(game.loser_score);
            } else {
                games['elo'][p.name].push(games['elo'][p.name].last_or_0());
                games['score'][p.name].push(games['score'][p.name].last_or_0());
            }
        }
    }

    make_graph(data.players.map(i => i.name), 'elo');
}

function make_graph(names, type) {
    var series = [];
    for (name of names) {
        series.push({'values': games[type][name]});
    }
    console.log(series);
    zingchart.render({
        id: 'myChart',
        data: {
            type: 'line',
            series: series
        }
    });
}

$(document).ready(function() {
    var socket = io.connect();
    socket.on('connect', function () {
        socket.emit('getGames');
    });

    socket.on('sendGames', read_data);
});
