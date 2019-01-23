/**
 * Pinger module which is in change of measure the Ping
 * @module ClientPinger
 */

/**
 * Pinger class. In charge of sending pings and obtain the metrics
 */
class ClientPinger {
  constructor(network, measurementProcedure, QualityParameters) {
    this.network = network;
    this.measurementProcedure = measurementProcedure;
    this.QualityParameters = QualityParameters;
    this.sequence = 0;
  }

  startMeasurements(numberOfPackets ){
    setInterval(() => {
      this.network.sendUDP(new ReqQ4S());
      this.sequence++;
    }, this.measurementProcedure.negotiationPingUp);

    // Set up a timer to launch the request.
    // In an array store the sending time.
    // In an array store the response time.
    // When a response has been recieved. Calculate
    // When thelast response has been recieved. Or a timeout ocucurs
    // O

  }

}