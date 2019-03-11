/**
 * Network Layer module. It implements an abstraction layer over the network.
 * Implements the ClientNetwork class.
 * @module ClientNetwork
 */
const dgram = require('dgram');
const EventEmitter = require('events');
const net = require('net');
const util = require('util');


const Response = require('./response');
const Request = require('./request');
const utilQ4S = require('./util');

/**
 * Network layer class. It emmits events for each recieved message. Implements
 * functions to send messages over the network
 * @extends EventEmitter
 * @fires ClientNetwork#handshake-Res
 * @fires ClientNetwork#TCP-Res
 * @fires ClientNetwork#TCP-Req
 * @fires ClientNetwork#UDP-Res
 * @fires ClientNetwork#UDP-Req
 */
class ClientNetwork extends EventEmitter {
  /** Constructor for the ClientNetwork. Only inicialices the super class. */
  constructor() {
    super();
    /**
     * The handshake socket.
     * @member {net.Socket}
     */
    this.handshakeSocket = new net.Socket();
    this.handshakeSocket.connectPromised = util.promisify(
        this.handshakeSocket.connect
    );
    this.handshakeSocket.on('data', (data) => {
      try {
        this.emit('handshake-Res', Response.fromString(data.toString('utf-8')));
      } catch (e) {
        this.emit('error', e);
      }
    });
    this.handshakeSocket.on('error', (err) => {
      this.closeHandshake();
      this.emit('error', err);
    });
    /**
     * The TCP Q4S socket.
     * @member {net.Socket}
     */
    this.TCPSocket = new net.Socket();
    this.TCPSocket.connectPromised = util.promisify(this.TCPSocket.connect);
    this.TCPSocket.on('data', (data) => {
      const msg = data.toString('utf-8');

        if (utilQ4S.isRequest(msg)) {
          try{
            this.emit('TCP-Req', Request.fromString(msg));
          }
          catch(e){
            this.TCPSocket.write(Response.genRes(400).toString(), 'utf8');
          }
          
        } else {
          try{
            this.emit('TCP-Res', Response.fromString(msg));
          }
          catch(e){
            this.emit('error', e);
          } 
        }

    });
    this.TCPSocket.on('error', (err) => {
      this.closeNetwork();
      this.emit('error', err);
    });
    /**
     * The UDP Q4S socket.
     * @member {dgram.Socket}
     */
    this.UDPSocket = dgram.createSocket('udp4');

    this.UDPSocket.bindPromised = util.promisify(this.UDPSocket.bind);
    this.UDPSocket.on('message', (msg, rinfo) => {
      const now = new Date();
      const msgString = msg.toString('utf-8');

      if (utilQ4S.isRequest(msgString)) {
        try{
          this.emit('UDP-Req', Request.fromString(msgString), now);
        }
        catch(e){
          sendUDP(Response.genRes(400));
        }
        
      } else {
        try{
          this.emit('UDP-Res', Response.fromString(msgString), now);
        }
        catch(e){
          this.emit('error', e);
        }  
      }
    });
    this.UDPSocket.on('error', (err) => {
      this.closeNetwork();
      this.emit('error', err);
    });
  }
  /**
   * Async method to create the handshake socket. After completition the
   * sendHandshakeTCP method can be called to send messages. After completition
   * the class starts to emit events.
   * @param {string} ip - The string containing the ip to connect
   * @param {string} port - Port to connect
   * @param {string} localPort - Origin port for the handshake connection.
   * @return {Promise} On success nothing, on error the network error.
   */
  async initHandshakeSocket(ip, port, localPort) {
    const handshakeSocketOps = {
      host: ip,
      port: port,
      localPort: localPort,
    };
    await this.handshakeSocket.connectPromised(handshakeSocketOps);
    return;
  }
  /**
   * Async method to create both q4s sockets for the connection.
   * @param {string} ip - The string containing the ip to connect
   * @param {Number} port - TCP port to connect
   * @param {Number} localPort - Origin port for the TCP connection
   * @param {Number} portUDP - Port for UDP communication
   * @param {Number} listeningPortUDP - Port to listen for UDP messages.
   * @return {Promise} On success nothing, on error the network error.
   */
  async initQ4sSocket(ip, port, localPort, portUDP, listeningPortUDP) {
    const TCPSocketOps = {
      host: ip,
      port: port,
      family: 4,
      localPort: localPort,
    };
    this.UDPSocketOps = {
      host: ip,
      port: portUDP,
      listeningPort: listeningPortUDP,
    };
    await Promise.all([
      this.TCPSocket.connectPromised(TCPSocketOps),
      this.UDPSocket.bindPromised(listeningPortUDP),
    ]);
    return;
  }
  /**
   * Send a message trough the handshake socket.
   * @param {(ReSQ4S|Request)} msg - The request or response to send.
   */
  sendHandshakeTCP(msg) {
    this.handshakeSocket.write(msg.toString(), 'utf8');
    return;
  }
  /**
   * Send a message trough the q4s TCP socket.
   * @param {(ReSQ4S|Request)} msg - The request or response to send.
   */
  sendTCP(msg) {
    this.TCPSocket.write(msg.toString(), 'utf8');
    return;
  }
  /**
   * Send a message trough the q4s UDP socket.
   * @param {(Response|Request)} msg - The request or response to send.
   */
  sendUDP(msg) {
    this.UDPSocket.send(
        msg.toString(),
        this.UDPSocketOps.port,
        this.UDPSocketOps.host
    );
    return;
  }
  /**
   * Close all communications. Call to clean up at the end.
   */
  closeNetwork() {
    this.handshakeSocket.end();
    this.TCPSocket.end();
    this.UDPSocket.close();
  }
  /**
   * Close the handshake socket.
   */
  closeHandshake() {
    this.handshakeSocket.end();
  }
}
module.exports = ClientNetwork;
