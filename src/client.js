const EventEmitter = require('events');
const dgram = require('dgram');
const net = require('net');
const req = require('ReqQ4S.js');

class Q4SClient extends EventEmitter{
  constructor(options) {
    super();

    this.serverTCP = net.createServer((socket) => {
      //new socket openned
    });
    
    this.serverUDP = dgram.createSocket('udp4');
  
    if (typeof options.portTCP === "undefined") {
      this.serverTCP.listen();
    }
    else {
      this.serverTCP.listen(options.port);
    }

    if(options.portUDP != undefined) {
      this.portUDP=portUDP
    }
    else {
      this.portUDP=0
    }    
    if(options.timeOut != undefined) {
      this.timeOut=timeOut
    }
    else {
      this.timeOut=1000
    } 
  }

  connect(ip,port){
    this.socket = net.createConnection({ host: ip, port: port }, () => {
      this.emit('connect',ip,port)
      const start= new req('BEGIN', 'URI',"Q4S");
      this.socket.write(start.toString(),'utf8');
    });

    this.socket.on('data', (data) => {
      const response = res.fromString(data);

    });
    this.socket.on('end', () => {
      this.emit('end');
    });
  }
  destroy() {
    this.socket.end();
  }
  close() {
    //TODO => Send finishing verb to the server to end the session
    this.emit('end',ip,port)
  }

  


}

module.exports = Q4SClient;