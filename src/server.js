const dgram = require("dgram")
const EventEmitter = require("events")
const db = new loki('db.db');

const users = db.addCollection('connections');

class Q4SServer extends EventEmitter {
  constructor() {
    super()
  }     
}

module.exports.createServer = function (port) {
  const upd = dgram.createSocket("udp4")
    
  upd.on('error', (err) => {
    console.log('server error:\n${err.stack}')
    upd.close()
  })
  
  upd.on('message', (msg, rinfo) => {
    let results = users.find({ address: rinfo.address, port: rinfo.port});

    
    console.log('server got: ${msg} from ${rinfo.address}:${rinfo.port}')
  })
  
  upd.on('listening', () => {
    const address = server.address();
    console.log('server listening ${address.address}:${address.port}')
  })
  
  server.bind(port);
}
