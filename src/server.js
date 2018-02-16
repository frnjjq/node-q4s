const dgram = require("dgram")
const EventEmitter = require("events")

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
    console.log('server got: ${msg} from ${rinfo.address}:${rinfo.port}')
  })
  
  upd.on('listening', () => {
    const address = server.address();
    console.log('server listening ${address.address}:${address.port}')
  })
  
  server.bind(port);
}
