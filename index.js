var http = require("http");
var ShareDB = require("sharedb");
var connect = require("connect");
var ShareDBMingoMemory = require('sharedb-mingo-memory');
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');
var WebSocket = require('ws');
var util = require('util');
require('dotenv').config()

let mongo = null
const PORT = process.env.PORT || 8088;
process.env.MONGO_URL && (mongo = require('sharedb-mongo')(process.env.MONGO_URL))

// Start ShareDB
var share = ShareDB({ db: mongo || new ShareDBMingoMemory(), extraDbs: { ping: ()=> null }})

// Create a WebSocket server
var app = connect();
var server = http.createServer((req, res) => {
  app
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`Server homepage`)
});

server.listen(PORT);

var wss = new WebSocket.Server({server: server})

wss.on('error', function(e){ 
  console.log('must handle this error', e)
})

// Connect any incoming WebSocket connection with ShareDB
wss.on('connection', function(ws, req) {
  var stream = new WebSocketJSONStream(ws);
  stream.on('error', (err) => {
    // MUST Have this here- otherwise passing the socket anything NON-JSON will kill it (eg a string)!
  })
  share.listen(stream)
});

// Create initial documents
var connection = share.connect();
var DATA = {
  'players': ["Ada Lovelace", "Grace Hopper", "Marie Curie", "Carl Friedrich Gauss", "Nikola Tesla", "Claude Shannon"].map((name,score)=> ({ name, score, id:score, created: 0, attch:'' })) 
}

Object.entries(DATA).forEach(([collection,data])=>{
  connection.createFetchQuery(collection, {}, {}, function(err, results) {
    if (err) { throw err; }
    if (results.length > 0) { return }
      data.forEach((itm, inx)=>{
        var doc = connection.get(collection,''+itm.id) 
        doc.create(itm)
      })
  })
})

console.log(`Listening on http://localhost:${PORT}`);

// wss.on('connection') ...
// ACTIVE_SOCKETS.set(req.url.split('/')[0], ws)

// const ACTIVE_SOCKETS =  new Map()

//   setInterval(() => { 
//     for(const socket of ACTIVE_SOCKETS.values()) {
//      // This "should" keep socket when in production. 
//      console.log('pinga')
//      socket.ping(function() {}, false, true)
//     }
//   }, 1000)
// if (process.env.PROJECT_URL) {
//   setInterval(()=> {
//     http.get(process.env.PROJECT_URL)
//     console.log("Ping made")
//   }, process.env.PING_FREQ ? Number(process.env.PING_FREQ) : 10000) // every 5 minutes (300000)
// // ^ Keeps heroku alive- prevents H15 error
// }