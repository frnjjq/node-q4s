/**
 * Network Layer module. It implements an abstraction layer over the network.
 * Implements the ClientNetwork class.
 * @module ClientNetwork
 */
const dgram = require('dgram');
const EventEmitter = require('events');
const net = require('net');
const util = require('util');

const res = require('ResQ4S.js');
const req = require('ReqQ4S.js');

const connectPromised = util.promisify(net.Socket.connect);
const bindPromised = util.promisify(dgram.Socket.bind);

/** Network layer class. It emmits events for each recieved message. Implements
 *  functions to send messages over the network*/
class ClientNetwork extends EventEmitter {
  /** Constructor for the ClientNetwork. Only inicialices the super class. */
  constructor() {
    super();
    this.handshakeSocket = new net.Socket();
    this.handshakeSocket.connectPromised = connectPromised;
    this.handshakeSocket.on('data', (data) => {
      this.emit('handshakeResponse', res.fromString(data));
    });
    this.handshakeSocket.on('error', (err) => {
      this.closeNetwork();
      this.emit('error', err);
    });

    this.TCPSocket = new net.Socket();
    this.TCPSocket.connectPromised = connectPromised;
    this.TCPSocket.on('data', (data) => {
      this.emit('TCPResponse', res.fromString(data));
    });
    this.TCPSocket.on('error', (err) => {
      this.closeNetwork();
      this.emit('error', err);
    });

    this.UDPSocket = dgram.createSocket('udp4');
    this.UDPSocket.bindPromised = bindPromised;
    this.UDPSocket.on('message', (msg, rinfo) => {
      if (res.isResponse(msg)) {
        this.emit('UDPResponse', res.fromString(msg));
      } else {
        this.emit('UDPRequest', req.fromString(msg));
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
   * @param {(ReSQ4S|ReqQ4S)} msg - The request or response to send.
   */
  sendHandshakeTCP(msg) {
    this.handshakeSocket.write(msg.toString(), 'utf8');
    return;
  }
  /**
   * Send a message trough the q4s TCP socket.
   * @param {(ReSQ4S|ReqQ4S)} msg - The request or response to send.
   */
  sendTCP(msg) {
    this.TCPSocket.write(msg.toString(), 'utf8');
    return;
  }
  /**
   * Send a message trough the q4s UDP socket.
   * @param {(ResQ4S|ReqQ4S)} msg - The request or response to send.
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
}
module.exports = ClientNetwork;
