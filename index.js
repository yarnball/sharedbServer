var http = require("http");
var ShareDB = require("sharedb");
var connect = require("connect");
var ShareDBMingoMemory = require('sharedb-mingo-memory');
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');
var WebSocket = require('ws');
var util = require('util');

// Start ShareDB
var share = ShareDB({db: new ShareDBMingoMemory()});

// Create a WebSocket server
var app = connect();
var server = http.createServer((req, res) => {
  app
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`Server homepage`)
});
var wss = new WebSocket.Server({server: server});
const PORT = process.env.PORT || 8088;

server.listen(PORT);

console.log(`Listening on http://localhost:${PORT}`);

const ACTIVE_SOCKETS =  new Map()

setInterval(() => { 
  for(const socket of ACTIVE_SOCKETS.values()) {
    console.log("POING")
   // This "should" keep socket when in production. 
   socket.ping(function() {}, false, true)
  }
}, 2000)

// Connect any incoming WebSocket connection with ShareDB
wss.on('connection', function(ws, req) {
  const token = req.url.split('/')[1]
  ACTIVE_SOCKETS.set(token, ws)
  var stream = new WebSocketJSONStream(ws);
  share.listen(stream);
  share.use('query', (request, done) => {
        done()
  })
  share.use('op', (request, done) => {
        done()
  })
});

// Create initial documents
var connection = share.connect();
connection.createFetchQuery('players', {}, {}, function(err, results) {
  if (err) { throw err; }

  if (results.length === 0) {
    var names = ["Ada Lovelace", "Grace Hopper", "Marie Curie",
                 "Carl Friedrich Gauss", "Nikola Tesla", "Claude Shannon"];

    names.forEach(function(name, index) {
      var doc = connection.get('players', ''+index);
      var data = {name: name, score: Math.floor(Math.random() * 10) * 5, created: 0 };
      doc.create(data);
    });
  }
});

  if (process.env.PROJECT_URL) {
    setInterval(()=> {
      http.get(process.env.PROJECT_URL)
      console.log("Ping made")
    }, process.env.PING_FREQ ? Number(process.env.PING_FREQ) : 30000) // every 5 minutes (300000)
  // ^ Keeps heroku alive- prevents H15 error
  }