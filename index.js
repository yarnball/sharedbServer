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
var server = http.createServer(app);
var wss = new WebSocket.Server({server: server});
const PORT = process.env.PORT || 8088;

server.listen(PORT);

console.log(`Listening on http://localhost:${PORT}`);

// Connect any incoming WebSocket connection with ShareDB
wss.on('connection', function(ws, req) {
  var stream = new WebSocketJSONStream(ws);
  share.listen(stream);
  share.use('query', (request, done) => {
      console.log('listening on....', request.collection)
      done()
  })
  share.use('op', (request, done) => {
        console.log('OP happened', request.collection)
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
