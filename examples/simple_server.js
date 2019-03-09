const q4s = require('../index');
const ServerQ4S = q4s.server;

const Options = {

  /* Select the maximum latency required in miliseconds.
   * It is the same for the uplink and downlink.
   */
  latency: { max: 20, min: 0 },

  /* Select the maximum jitter required in the uplink
   * measured in miliseconds.
   */
  jitterUp: { max: 5, min: 0 },
  /* Select the maximum jitter required in the downlink
   * measured in miliseconds.
   */
  jitterDown: { max: 5, min: 0 },
  /* The minimum required bandwidth in the uplink.
   * Measured in kbps. kilo bits per second.
   */
  bandwidthUp: { max: 6000, min: 8 },
  /* The minimum required bandwidth in the downlink.
   * Measured in kbps. kilo bits per second.
   */
  bandwidthDown: { max: 6000, min: 8 },
  /* The maximum tolerance to packet loss in the uplink.
   * Measured in percentage.
   */
  packetlossUp: { max: 0.5, min: 0.2 },
  /* The maximum tolerance to packet loss in the downlink.
   * Measured in percentage.
   */
  packetlossDown: { max: 0.5, min: 0.2 },

  alertingMode: q4s.REACTIVE,
  alertPause: 1000,
  recoveryPause: 1000,

  procedure: {
    negotiationPingUp: 20,
    negotiationPingDown: 20,
    negotiationBandwidth: 5,
    continuityPingUp:20,
    continuityPingDown:20,
    windowSizeUp:255,
    windowSizeDown:255,
    windowSizePctLssUp:255,
    windowSizePctLssDown:255
  },
  ip: 'private',
  // Select the handshake TCP local port .
  portHanshakeTCP: 2503,
  portTCP: 2504,
  // Select the UDP local port .
  portUDP: 2505,
  /* Indicate the ports in which the local app is listening if any.
   * Do not define it is not required for the server.
   */
  appPortsTCP: '500-505',
  appPortsUDP: '600',
};

let server = new ServerQ4S(Options);

// Listen error events
server.on('error', (code, reason) => {
  console.log('Error:' + code + 'Reason:' + reason);
});
// Event fired when the client connects to the server.
server.on('connected', (sessionId, ip) => {
  console.log('Connected to the server');
});

// Event fired when the client connects to the server.
server.on('completed', (sessionId, ip) => {
  console.log('Completed initial measures');
});

// Event fired when the q4s session is fnished, by any mean.
server.on('end', (sessionId, ip) => {
  console.log('Finished session, either by server or client');
});

server.listen().then(() => {
  console.log("Listening")
  /* Do the app execution during the necesary time.
   * If an end event is emitted. It is because the server closed the connection.
   * In case error is raised the reason is given though code and reason.
   */

});

