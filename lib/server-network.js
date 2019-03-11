/**
 * Contains the implementation of ServerNetwork
 * @module server-network
 * @license Apache-2.0
 */

const EventEmitter = require('events');
const dgram = require('dgram');
const net = require('net');

const Util = require('./util');
const ReqQ4S = require('./request');
const ResQ4S = require('./response');

/**
 * Implements an abstraction layer over the network. Having access to the
 * database it validates the requests and forwards the messages using
 * listeners that the client, server, pingers and bandwidthers use.
 * @fires ServerNetwork#UDP-Req
 * @fires ServerNetwork#UDP-Res
 * @fires ServerNetwork#TCP-Req
 * @fires ServerNetwork#TCP-Res
 * @fires ServerNetwork#handshake-Req
 */
class ServerNetwork extends EventEmitter {
  /**
   * Constructor
   * @param {Collection} store - Session storage
   */
  constructor(store) {
    super();
    /**
     * @param {Collection} store - Session storage
     */
    this.store = store;
    /**
     * The handshake TCP server.
     * @member {net.Socket}
     */
    this.handshake = new net.Server();
    this.handshake.on('connection', (socket) => {
      socket.on('data', (data) => {
        try {
          const req = ReqQ4S.fromString(data.toString('utf-8'));
          // TODO -> Documentar el callback
          /**
           * Snowball event.
           *
           * @event handshake-Req
           * @property {Request} req - The recieved request
           */
          this.emit('handshake-Req', req, (msg) => {
            socket.write(msg.toString(), 'utf8');
          });
        } catch (error) {
          socket.write(ResQ4S.genRes(400).toString(), 'utf8');
        }
      });
    });
    /**
     * The TCP Q4S socket.
     * @member {net.Socket}
     */
    this.TCP = new net.Server();
    this.TCP.on('connection', (socket) => {
      const record = this.store.findOne({
        'addresses.clientAddress': socket.remoteAddress,
        'addresses.q4sClientPorts.TCP': socket.remotePort,
      });
      const replyFunc = (reply) => {
        if (reply) {
          socket.write(reply.toString(), 'utf8');
        }
      };
      if (record) {
        record.TCP = socket;
        socket.on('data', (data) => {
          const msg = data.toString('utf-8');
          if (Util.isRequest(msg)) {
            try {
              this.emit('TCP-Req', ReqQ4S.fromString(msg), record, replyFunc);
            } catch (err) {
              socket.write(ResQ4S.genRes(400).toString(), 'utf8');
            }
          } else {
            try {
              this.emit('TCP-Res', ResQ4S.fromString(msg), record, replyFunc);
            }
            catch (e) {
              this.emit('error', e);
            }
          }
        });
        this.store.update(record);
      } else {
        socket.write(ResQ4S.genRes(600).toString(), 'utf8');
      }
    });
    /**
     * The UDP Q4S socket.
     * @member {dgram.Socket}
     */
    this.UDP = dgram.createSocket('udp4');
    this.UDP.on('message', (msg, rinfo) => {
      const time = new Date();
      const record = this.store.findOne({
        'addresses.clientAddress': rinfo.address,
        'addresses.q4sClientPorts.UDP': rinfo.port,
      });
      const msgS = msg.toString('utf-8');
      const replyFunc = (reply) => {
        if (reply) {
          this.UDP.send(reply.toString(),
            record.addresses.appClientPorts.UDP,
            record.addresses.clientAddress);
        }
      };
      if (record) {
        if (Util.isRequest(msg.toString('utf-8'))) {
          try {
            this.emit('UDP-Req', ReqQ4S.fromString(msgS), time,
              record, replyFunc);
          }
          catch (e) {
            this.UDP.send(Response.genRes(400),
              record.addresses.appClientPorts.UDP,
              record.addresses.clientAddress);
          }

        } else {
          try {
            this.emit('UDP-Res', ResQ4S.fromString(msgS), time,
              record, replyFunc);
          }
          catch (e) {
            this.emit('error', e);
          }

        }
      } else {
        this.emit('error', new Error('Recieved UDP message without session'));
      }
    });
  }

  /**
   * Async method to create the handshake socket. After completition the
   * sendHandshakeTCP method can be called to send messages. After completition
   * the class starts to emit events.
   * @param {Number} HandshakePort - The string containing the ip to connect
   * @param {Number} TCPPort - Port to connect
   * @param {Number} UDPPort - Origin port for the handshake connection.
   */
  listen(HandshakePort, TCPPort, UDPPort) {
    const handshakeSocketOps = {
      port: HandshakePort,
      host: '0.0.0.0',
    };
    const TCPOps = {
      port: TCPPort,
      host: '0.0.0.0',
    };
    this.handshake.listen(handshakeSocketOps);
    this.TCP.listen(TCPOps);
    this.UDP.bind(UDPPort);
  }
  /**
   * Close all the sockets.
   */
  close() {
    this.handshake.close();
    this.UDP.close();
    this.TCP.close();
  }

  /**
   * Send an udp message with session Id.
   * @argument {String} message
   * @argument {Number} sessionId
   */
  sendUDP(message, sessionId) {
    const record = this.store.findOne({
      'id': sessionId,
    });
    if (record) {
      this.UDP.send(message.toString(),
        record.addresses.q4sClientPorts.UDP,
        record.addresses.clientAddress);
    }
    // else trow an exception;
  }

  /**
   * Send an TCP message
   * @argument {String} message
   * @argument {Number} sessionId
   */
  sendTCP(message, sessionId) {
    const record = this.store.findOne({
      'id': { eq: sessionId },
    });
    if (record) {
      record.TCP.write(message.toString(), 'utf8');
    }
    // else trow an exception;
  }
}

module.exports = ServerNetwork;
