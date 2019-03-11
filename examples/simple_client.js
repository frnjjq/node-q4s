const ClientQ4S = require('../index').client;

const Options = {
  /* The URL to make to the requests to */
  url: 'q4s://www.example.com',
  
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
  bandwidthUp: 570,
  /* The minimum required bandwidth in the downlink.
   * Measured in kbps. kilo bits per second.
   */
  bandwidthDown: 550,
  /* The maximum tolerance to packet loss in the uplink.
   * Measured in percentage.
   */
  packetlossUp: 0.50,
  /* The maximum tolerance to packet loss in the downlink.
   * Measured in percentage.
   */
  packetlossDown: 0.50,
  // Select the TCP local port .
  portTCP: 2501,
  // Select the UDP local port .
  portUDP: 2502,
  /* Indicate the ports in which the local app is listening if any.
   * Do not define it is not required for the server.
   */
  appPortsTCP: '500-505',
  appPortsUDP: '600',

  ip: "private"
  // ip: "public"
  // ip: "127.0.0.1"
};

let client = new ClientQ4S();

// Listen error events to knwo when the client failed to comunicate with the server.
client.on('error', (code, reason) => {
  console.log('Error:'+code+ 'Reason:'+ reason);
});
// Event fired when the client connects to the server.
client.on('connected', (appServerPorts) => {
  console.log('Connected to the server');
});

// Event fired when the client connects to the server.
client.on('completed', (appURI) => {
  console.log('Completed initial measures. Reported URI is '+appURI);
});

// Event fired when the q4s session is fnished, by any mean.
client.on('end', () => {
  console.log('Finished session, either by server or client');
});
client.on('measure', (measure) => {
  console.log(measure);
});

client.importClientOps(Options).then( ()=> {
  // Call connect with the host and port parameters.
  client.connect('127.0.0.1', 2503);

  /* Do the app execution during the necesary time.
   * If an end event is emitted. It is because the server closed the connection.
   * In case error is raised the reason is given though code and reason.
   */
  setTimeout(() => {
    // Close gently the connection when the app finishes.
    client.close();
  },60*1000000);
});








