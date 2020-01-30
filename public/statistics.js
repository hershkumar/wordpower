var games = {}, names = [], data_games = {};

const LEGEND = {
    header: {
        "text": "Players"
    },
    // "max-items": 10, // todo fix
    // "overflow": "scroll",
    "highlight-plot": true,
    minimize: true,
    draggable: true
};

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

function checkboxes() {
    var check = "<div class=\"form-check\"><input checked class=\"form-check-input\" type=\"checkbox\" value=\"\" id=\"check-{0}\"><label class=\"form-check-label\" for=\"check-{0}\">{0}</label></div>"

    var s = "";
    for (n of names) {
        s += check.format(n);
    }

    return s
}

function read_data(data) {
    data_games = data;

    games = {};
    games['elo'] = obj_from_names(data.players);
    games['score'] = obj_from_names(data.players);

    for (game of data.games) {
        var t = new Date(game.time).getTime();
        for (p of data.players) {
            if (p.name === game.winner) {
                games['elo'][p.name].push([t, game.winner_new_elo]);
                games['score'][p.name].push([t, game.winner_score]);
            } else if (p.name === game.loser) {
                games['elo'][p.name].push([t, game.loser_new_elo]);
                games['score'][p.name].push([t, game.loser_score]);
            } /* else {
                games['elo'][p.name].push(games['elo'][p.name].last_or_0());
                games['score'][p.name].push(games['score'][p.name].last_or_0());
            } */
        }
    }

    names = data.players.map(i => i.name);

    make_time_chart();
    make_bar_chart();
    make_wins_table();

    // $("#checkboxes").empty().append(checkboxes());
}

function make_time_chart() {
    var series = [];
    var type = $("#timechart-select").val();

    for (name of names) {
        series.push({'values': games[type][name], 'text': name});
    }

    var all = series.map(a => a.values.map(b => b[1])).flat();

    zingchart.render({
        id: 'time-chart',
        data: {
            type: 'line',
            legend: LEGEND,
            scaleX: {
                transform: {
                    type: 'date',
                    all: '%m/%d/%y  %h:%i %A'
                }
            },
            scaleY: {
                'min-value': Math.min(...all) - 100,
                'max-value': Math.max(...all) + 100,
            },
            series: series
        }
    });
}

function make_bar_chart() {
    var p = {};
    for (i of names) { p[i] = [0, 0]; }
    for (g of data_games.games) {
        for (i of names) {
            if (i === g.winner)     { p[i][0]++; }
            else if (i === g.loser) { p[i][1]++; }
        }
    }

    var type = $("#barchart-select").val();
    var series = [];
    switch (type) {
        case "wins":
            for (i of names) {
                series.push({"values": [p[i][0]], "text": i});
            }
            break;
        case "losses":
            for (i of names) {
                series.push({"values": [p[i][1]], "text": i});
            }
            break;
        case "perc":
            for (i of names) {
                series.push({"values": [p[i][0] / (p[i][0] + p[i][1])], "text": i});
            }
            break;
        case "elo":
            var players_to_elo = {};
            for (i of names) {
                players_to_elo[i] = 1000;
            }
            for (g of data_games.games) {
                for (i of names) {
                    if (i == g.winner) {
                        players_to_elo[i] = g.winner_new_elo;
                    } else if (i == g.loser) {
                        players_to_elo[i] = g.loser_new_elo;
                    }
                }
            }
            for (i of names) {
                series.push({"values": [players_to_elo[i]], "text": i});
            }
            break;
        case "total":
            for (i of names) {
                series.push({"values": [(p[i][0] + p[i][1])], "text": i});
            }
            break;
        default: break;
    }

    series = series.filter(i => !Number.isNaN(i.values[0]) && i.values[0] !== 0);

    series.sort((a, b) => (b.values[0] - a.values[0]) );

    zingchart.render({
        id: 'bar-chart',
        data: {
            type: 'hbar',
            legend: LEGEND,
            series: series
        }
    });
}

function make_wins_table() {
    // ids: row-col
    var s = "<thead>";

    s += `<tr><th scope='col' id='wintable-0-0'></th>`;
    for ([i, n] of names.entries()) {
        s += `<th scope='col' id='wintable-0-${i + 1}'>${n}</th>`;
    }
    s += "</tr>";

    s += "</thead><tbody>";

    for ([row, n] of names.entries()) {
        s += "<tr>";
        s += `<td scope='row' id='wintable-${row + 1}-0'>${n}</td>`;
        for ([col, n2] of names.entries()) {
            var wins = 0, losses = 0;
            for (g of data_games.games) {
                if (n === g.winner && n2 === g.loser) { wins++; }
                else if (n === g.loser && n2 === g.winner) { losses++; }
            }
            s += `<td id='wintable-${row + 1}-${col + 1}'>${wins}-${losses}</td>`;
        }
        s += "</tr>";
    }

    s += "</tbody>";

    $("#wins-table").empty().append(s);
    $("#wins-table").stickyTableHeaders();
}

$(document).ready(function() {
    var socket = io.connect();
    socket.on('connect', function () {
        socket.emit('getGames');
    });

    socket.on('sendGames', read_data);

    $("#timechart-select").on('change', make_time_chart);
    $("#barchart-select").on('change', make_bar_chart);

    $('#wins-tbody').scroll(function(e) { //detect a scroll event on the tbody
        /*
      Setting the thead left value to the negative valule of tbody.scrollLeft will make it track the movement
      of the tbody element. Setting an elements left value to that of the tbody.scrollLeft left makes it maintain 			it's relative position at the left of the table.
      */
        $('#wins-thead').css("left", -$("#wins-tbody").scrollLeft()); //fix the thead relative to the body scrolling
        $('#wins-thead th:nth-child(1)').css("left", $("#wins-tbody").scrollLeft()); //fix the first cell of the header
        $('#wins-tbody td:nth-child(1)').css("left", $("#wins-tbody").scrollLeft()); //fix the first column of tdbody
    });
});
