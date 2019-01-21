const q4sClient = req('../src/client.js');

const Options = {
  /* Select the maximum latency required in miliseconds.
   * It is the same for the uplink and downlink.
   */
  latency: 100,
  /* Select the maximum jitter required in the uplink
   * measured in miliseconds.
   */
  jitterUp: 20,
  /* Select the maximum jitter required in the downlink
   * measured in miliseconds.
   */
  jitterDown: 20,
  /* The minimum required bandwidth in the uplink.
   * Measured in kbps. kilo bits per second.
   */
  bandwidthUp: 5000,
  /* The minimum required bandwidth in the downlink.
   * Measured in kbps. kilo bits per second.
   */
  bandwidthDown: 4000,
  /* The maximum tolerance to packet loss in the uplink.
   * Measured in percentage.
   */
  packetlossUp: 0.50,
  /* The maximum tolerance to packet loss in the downlink.
   * Measured in percentage.
   */
  packetlossDown: 0.50,
  // Select the TCP local port .
  portTCP: 2001,
  // Select the UDP local port .
  portUDP: 2002,
  /* Indicate the ports in which the local app is listening if any.
   * Do not define it is not required for the server.
   */
  appPortsTCP: '500-505',
  appPortsUDP: '600',
};

client = new q4sClient(Options);

// Listen error events to knwo when the client failed to comunicate with the server.
client.on('error', (code, reason) => {
  console.log('Error:'+code+ 'Reason:'+ reason);
});
// Event fired when the client connects to the server.
client.on('connected', (appServerPorts) => {
  console.log('Connected to the server');
});
// Event fired when the q4s session is fnished, by any mean.
client.on('end', () => {
  console.log('Finished session, either by server or client');
});

// Call connect with the host and port parameters.
client.connect('localhost', 521);

/* Do the app execution during the necesary time.
 * If an end event is emitted. It is because the server closed the connection.
 * In case error is raised the reason is given though code and reason.
 */

// Close gently the connection when the app finishes.
cli.close();

