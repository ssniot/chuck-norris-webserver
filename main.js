#!/usr/bin/env node

const http = require('http'),
      path = require('path'),
      fs = require('fs'),
      Chuck  = require('chucknorris-io'),
      client = new Chuck();

// Let's define a port we want to listen on
const DEFAULT_PORT = 80;
var port = DEFAULT_PORT;

// same with webpage title
var DEFAULT_TITLE = "My local chuck nodejs web server";
var title = DEFAULT_TITLE;

const html = `
<header>
  <title>TITLE</title>
  <link rel="icon" type="image/png" href="ICON" />
  <style>
    img {
      display: inline;
      transform: scaleX(-1);
    }

    .quote {
      position:relative;
      padding:15px;
      margin:1em 0 3em;
      color:#fff;
      margin-left:40px;
      background:linear-gradient(#e96d20, #e95420);
      border-radius:10px;
    }
    .quote:after {
      content:"";
      position:absolute;
      bottom:-20px;
      top:16px;
      left:-40px;
      border-style:solid;
      bottom:auto;
      border-width:15px 40px 0 0;
      border-color:transparent #e95420;
    }
  </style>
</header>
<body>
    <div>
        <img src="IMGSRC" align="middle" />
        <span class="quote">QUOTE</span>
    </div>
    </div>(Quote provided by <a href="https://api.chucknorris.io/">chucknorris.io</a>.)</div>
</body>
`;

const rootdir = path.resolve(__dirname);
var CONFIG_DIR = process.env.SNAP_DATA;
if (!CONFIG_DIR) {
    CONFIG_DIR = '.'
}
const CONFIG_FILE = path.join(CONFIG_DIR, 'config');

function handleRequest(request, response){
    response.writeHeader(200, {"Content-Type": "text/html"});
    if (request.url === "/favicon.ico") {
        response.end();
        return;
    }
    client.getRandomJoke('dev').then(function (joke) { 
        var msg = html.replace('ICON', joke.iconUrl).replace('IMGSRC', joke.iconUrl).replace('QUOTE', joke.value).replace('TITLE', title);
        response.end(msg);
        console.log(`Quoted ${joke.sourceUrl}`);
    }).catch(function (err) {
        var joke = `I can't connect to chucknorris.io. Offering you a network-related joke then: Chuck Norris's OSI network model has only one layer - Physical.`;
        var msg = html.replace('QUOTE', joke).replace('TITLE', title);
        response.end(msg);
        console.log(`Used generic quote as couldn't connect to service: ${err}`);
    });    
}

var server = http.createServer(handleRequest);

server.activeconnections = {}
server.on('connection', function(conn) {
    var key = conn.remoteAddress + ':' + conn.remotePort;
    server.activeconnections[key] = conn;
    conn.on('close', function() {
        delete server.activeconnections[key];
    });
});
// we want to immediatetly close all connections on server restart (for port change)
server.force_close = function(cb) {
    server.close(cb);
    for (var key in server.activeconnections)
        server.activeconnections[key].destroy();
};

fs.watchFile(CONFIG_FILE, (filename, prev) => {
    // file doesn't exist (even on startup) or exists and changed from default port
    loadconfig_and_start_server();
});
// if file exists on startup: load config and start server here
if (fs.existsSync(CONFIG_FILE)) {
    loadconfig_and_start_server();
}

function loadconfig_and_start_server() {
    fs.readFile(CONFIG_FILE, (err, data) => {

        new_port = DEFAULT_PORT;
        new_title = DEFAULT_TITLE;

        if (err) {
            if (port != DEFAULT_PORT) {
                console.log("Error reading config file, reverting to defaut port:" + err);
            }
        } else {
            console.log("Load port configuration");
            fs.readFileSync(CONFIG_FILE).toString().split('\n').forEach(function (line) {
                var data = line.split("=");

                if (data[1] == undefined) {
                    return
                }

                switch(data[0]) {
                    case 'port':
                        port_candidate = parseInt(data[1]);
                        if (isNaN(port_candidate)) {
                            console.log(`Port defined "${data[1]}" is not a valid port. Ignoring.`)
                        } else {
                            new_port = port_candidate;
                        }
                        break;
                    case 'title':
                        new_title = data[1];
                        break;
                }
            });
        }

        title = new_title

        // reload server if needed
        if (new_port != port || !server._handle) {
            server.force_close(() => {
                port = new_port;
                server.listen(port, function(){
                    console.log("Server listening on: http://localhost:%s", port);
                });
            });
        }
    });
}   