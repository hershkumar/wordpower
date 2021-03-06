var games = {}, names = [], data_games = {}, divisions = {};

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

function selected_names() {
    // returns all names that are in the divisions currently selected by the user
    var n = [];
    for (var i = 1; i <= 3; i++) {
        if ($(`#div${i}`).is(":checked")) {
            for (j of divisions[i].Name) {
                n.push(j);
            }
        }
    }
    return n;
}

function read_data(data) {
    data_games = data;

    games = {};
    games['elo'] = obj_from_names(data.players);
    games['score'] = obj_from_names(data.players);

    for (game of data.games) {
        var t = new Date(game.time.replace(" ", "T")).getTime();
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

    graphs();

    // $("#checkboxes").empty().append(checkboxes());
}

function graphs() {
    make_time_chart();
    make_bar_chart();
    make_wins_table();
}

function make_time_chart() {
    var series = [];
    var type = $("#timechart-select").val();

    var s_names = selected_names();

    for (name of s_names) {
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
                },
                zooming: true
            },
            scaleY: {
                'min-value': Math.min(...all) - 100,
                'max-value': Math.max(...all) + 100,
                zooming: true
            },
            zoom: { //controls styling and some functionality of zooming
                backgroundColor: "#1e7bd3",
                borderColor: "#181818",
                borderStyle : 'dashed',
                borderWidth: 1
            },
            series: series
        }
    });
}

function make_bar_chart() {
    var s_names = selected_names();

    var p = {};
    for (i of s_names) { p[i] = [0, 0]; }
    for (g of data_games.games) {
        for (i of s_names) {
            if (i === g.winner)     { p[i][0]++; }
            else if (i === g.loser) { p[i][1]++; }
        }
    }

    var type = $("#barchart-select").val();
    var series = [];
    switch (type) {
        case "wins":
            for (i of s_names) {
                series.push({"values": [p[i][0]], "text": i});
            }
            break;
        case "losses":
            for (i of s_names) {
                series.push({"values": [p[i][1]], "text": i});
            }
            break;
        case "perc":
            for (i of s_names) {
                series.push({"values": [p[i][0] / (p[i][0] + p[i][1])], "text": i});
            }
            break;
        case "elo":
            var players_to_elo = {};
            for (i of s_names) {
                players_to_elo[i] = 1000;
            }
            for (g of data_games.games) {
                for (i of s_names) {
                    if (i == g.winner) {
                        players_to_elo[i] = g.winner_new_elo;
                    } else if (i == g.loser) {
                        players_to_elo[i] = g.loser_new_elo;
                    }
                }
            }
            for (i of s_names) {
                series.push({"values": [players_to_elo[i]], "text": i});
            }
            break;
        case "total":
            for (i of s_names) {
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
    var s_names = selected_names();

    var s = "<thead>";

    s += `<tr><th scope='col' id='wintable-0-0'></th>`;
    for ([i, n] of s_names.entries()) {
        s += `<th scope='col' id='wintable-0-${i + 1}'>${n}</th>`;
    }
    s += `<th scope='col' id='wintable-0-total'>Total</th>`;
    s += "</tr>";

    s += "</thead><tbody>";

    for ([row, n] of s_names.entries()) {
        s += "<tr>";
        s += `<td scope='row' id='wintable-${row + 1}-0'>${n}</td>`;
        var twins = 0, tlos = 0;
        for ([col, n2] of s_names.entries()) {
            var wins = 0, losses = 0;
            for (g of data_games.games) {
                if (n === g.winner && n2 === g.loser) { wins++; }
                else if (n === g.loser && n2 === g.winner) { losses++; }
            }
            if (row === col) {
                s += `<td id='wintable-${row + 1}-${col + 1}'>---</td>`;
            } else {
                s += `<td id='wintable-${row + 1}-${col + 1}'>${wins}-${losses}</td>`;
            }
            twins += wins;
            tlos += losses;
        }
        s += `<td id="wintable-${row + 1}-total">${twins}-${tlos}</td>`
        s += "</tr>";
    }

    s += "</tbody>";

    $("#wins-table").empty().append(s);
    $("#wins-table").stickyTableHeaders();
}

$(document).ready(function() {
    var socket = io.connect();
    socket.on('connect', () => {
        socket.emit('checkRankings');
    });

    socket.on('sendDiv1', msg => {
        divisions[1] = msg;
    });

    socket.on('sendDiv2', msg => {
        divisions[2] = msg;
    });

    socket.on('sendDiv3', msg => {
        divisions[3] = msg;
        socket.emit('getGames');
    });

    socket.on('sendGames', read_data);

    $("#timechart-select").on('change', make_time_chart);
    $("#barchart-select").on('change', make_bar_chart);

    $("#div1").change(graphs);
    $("#div2").change(graphs);
    $("#div3").change(graphs);
});
