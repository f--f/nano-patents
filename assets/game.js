// Initialize game variables.
var NUM_QUESTIONS = 10;
var setup = true;
var patnum = 0;
var currpat;
var x, y; 
var guess = null;
var answer, connect; // Graphical objects

// Helper functions:
// Convert longitude to point
function lon2x(lon) {
    var xfactor = 2.6938;
    var xoffset = 465.4;
    var x = (lon * xfactor) + xoffset;
    return x;
}

// Convert latitude to point
function lat2y(lat) {
    var yfactor = -2.6938;
    var yoffset = 227.066;
    var y = (lat * yfactor) + yoffset;
    return y;
}

// Disable map click
function disableMap() {
    $("#container").css({"pointer-events": "none"});
}

// Enable map click
function enableMap() {
    $("#container").css({"pointer-events": "auto"});
}

// Crossfade text by id. Enables map click upon end of animation.
function textFade(id, text) {
    $(id).animate({'opacity': 0}, 750, function () {
        $(this).html(text);
    }).animate({'opacity': 1}, 750, enableMap);
}

// Return link given patent ID
function getPatentLink(num) {
    return "http://patft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HITOFF&d=PALL&p=1&u=%2Fnetahtml%2FPTO%2Fsrchnum.htm&r=1&f=G&l=50&s1=" + num + ".PN."
}

$(document).ready(function(){

    // Load map
    var w = 980;
    var h = 380;
    var R = Raphael("container");

    // Scale box to window (hack)
    R.setViewBox(0, 0, w, h, true);
    var svg = document.querySelector("svg");
    svg.removeAttribute("width");
    svg.removeAttribute("height");

    var map = {};
    var map_attr = {
        fill: "#333",
        stroke: "#888",
        "stroke-width": .7,
        "stroke-linejoin": "round"
    };

    render_map(R, map, map_attr);
    var current = null;
    for (var state in map) {
        // Initialize each country with a random colour which appears on hover
        map[state].color = Raphael.getColor();
        (function (st, state) {
            st[0].style.cursor = "pointer";

            st[0].onmouseover = function () {
                current && map[current].animate({fill: "#333", stroke: "#888"}, 300);
                st.animate({fill: st.color, stroke: "#ccc"}, 300);
                current = state;
            };
            
            st[0].onmouseout = function () {
                st.animate({fill: "#333", stroke: "#888"}, 300);
            };
        })(map[state], state);
    };

    // Retrieve database (XML request)
    // Note Chrome disables local file requests so this will not work by default.
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "db.sqlite", true);
    xhr.responseType = "arraybuffer";
    xhr.send();

    xhr.onload = function() {
        var uInt8Array = new Uint8Array(this.response);
        var sql = window.SQL;
        var db = new sql.Database(uInt8Array);
        var patents = db.exec("SELECT * FROM patents ORDER BY RANDOM() LIMIT " + NUM_QUESTIONS);

        // Event: Map is clicked
        $("#container").click(function(e){
            disableMap();

            if (setup) { // Show question on first click.
                currpat = patents[0].values[patnum];
                
                // Destroy drawing
                if (guess) {
                    answer.animate({opacity:0}, 500, answer.remove);
                    guess.animate({opacity:0}, 500, guess.remove);
                    connect.animate({opacity:0}, 500, connect.remove);
                }

                if (patnum < NUM_QUESTIONS){
                    textFade("#header", (patnum+1) + ". " + currpat[1]);
                    textFade("#description", currpat[5]);
                    textFade("#score", "&nbsp;");
                    patnum += 1;
                    setup = false;
                } else {
                    textFade("#header", "Thanks for playing!")
                    textFade("#description", "");
                    textFade("#score", "Click the map again to restart with another ten patents.");
                    // Reset variables
                    patents = db.exec("SELECT * FROM patents ORDER BY RANDOM() LIMIT 10");
                    patnum = 0;
                }
            
            } else { // Process game click (location) on next click.

                // Get position of click relative to canvas coordinates.
                x = (e.pageX - $(this).offset().left)*w/$(this).width();
                y = (e.pageY - $(this).offset().top)*h/$(this).height();
                var lon = currpat[7];
                var lat = currpat[6]; 

                // Draw blue circle at guess
                guess = R.circle(x, y, 0).attr({fill: "none", stroke: "#0066CC", 'stroke-width':0});

                // Draw white circle at answer
                answer = R.circle(lon2x(lon), lat2y(lat),0).attr({fill:"none",stroke:"#fff",opacity:0.1});
                answer.animate({'r':5,'opacity':0.8}, 500);

                // Connect guess and answer
                connect = R.path("M"+x+" "+y+"L"+lon2x(lon)+" "+lat2y(lat)).attr({stroke:"#fff", opacity:0, scale:0});
                connect.animate({opacity: 1, scale: 1}, 2000);
                guess.animate({'r': connect.getTotalLength(), opacity: 0.5, 'stroke-width': 3}, 650);

                // Show answer to user
                textFade("#score", 'Assignee: ' + currpat[3] + ' (' + currpat[4] + '). <a target="_blank" href="'+getPatentLink(currpat[0])+'">Click this link to access the full patent</a>.');

                setup = true;
            }
            
        });

    };

}); 
