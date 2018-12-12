/**
 * Session manipulation class. Implements  methods to build sessions from sdp and 
 * to generate new sdp.
 * @module session
 */

/** Session class. Options to build , generate and parse sessions*/
class Session {
  /**
   * Constructor for the ReqQ4S class. Does not validate input data coherence.
   * @param {number} qosLevelUp - Contains the QoS level for uplink. May be changed during session
   * @param {number} qosLevelDown - Contains the QoS level for downlink. May be changed during session
   * @param {number} alertingMode - The configured alert mode setted up for this session.
   * @param {number} alertPause - Alert pause value, number of miliseconds between Alert q4s messages.
   * @param {number} clientPublicAddressType - The IP version of the client address.
   * @param {string} clientPublicAddress - The client IP address.
   * @param {number} serverPublicAddressType - The IP version of the server address.
   * @param {string} serverPublicAddress - The server IP address.
   * @param {Object} measurementProcedure - An object containing each of the readed measurement procedures.
   * @param {String} measurementProcedure.default - An string containing the procedure for the name of the property.
   * @param {number} latency - The maximum latency allowed by the session.
   * @param {number} jitterUp - The maximum jitter allowed by the session in the uplink.
   * @param {number} jitterDown - The maximum jitter allowed by the session in the downlink.
   * @param {number} bandwidthUp - The minimum bandwidth allowed by the session in the uplink.
   * @param {number} bandwidthDown - The minimum bandwidth allowed by the session in the downlink.
   * @param {number} packetlossUp - The maximum packet loss allowed by the session in the uplink.
   * @param {number} packetlossDown - The minimum packet loss allowed by the session in the downlink.
   * @param {Object} flows - The flows object containing the different flows and ports.
   * @param {String} flows.app.clientListeningPort.TCP - String containing the TCP range opened in the client in which the app is listening.
   * @param {String} flows.app.clientListeningPort.UDP - String containing the UDP range opened in the client in which the app is listening.
   * @param {String} flows.app.serverListeningPort.TCP - String containing the TCP range opened in the server in which the app is listening.
   * @param {String} flows.app.serverListeningPort.UDP - String containing the UDP range opened in the server in which the app is listening.
   * @param {String} flows.q4s.clientListeningPort.TCP - String containing the TCP range opened in the client in which the q4s stack is listening.
   * @param {String} flows.q4s.clientListeningPort.UDP - String containing the UDP range opened in the client in which the q4s stack is listening.
   * @param {String} flows.q4s.serverListeningPort.TCP - String containing the TCP range opened in the server in which the q4s stack is listening.
   * @param {String} flows.q4s.serverListeningPort.UDP - String containing the UDP range opened in the server in which the q4s stack is listening.
   * @param {number} sessionId - The session Id of this session.
   */
  constructor(qosLevelUp, qosLevelDown, alertingMode,
    alertPause, recoveryPause, clientPublicAddressType,
     clientPublicAddress, serverPublicAddressType, serverPublicAddress,
     measurementProcedure, latency, jitterUp, jitterDown,
     bandwidthUp, bandwidthDown, packetlossUp,packetlossDown, flows, SessionId) {
       this.qosLevelUp = qosLevelUp;
       this.qosLevelDown = qosLevelDown;
       this.alertingMode = alertingMode;
       this.alertPause = alertPause;
       this.recoveryPause = recoveryPause;
       this.clientPublicAddressType = clientPublicAddressType;
       this.clientPublicAddress = clientPublicAddress;
       this.serverPublicAddressType = serverPublicAddressType;
       this.serverPublicAddress = serverPublicAddress;
       this.measurementProcedure = measurementProcedure;
       this.latency = latency;
       this.jitterUp = jitterUp;
       this.jitterDown = jitterDown;
       this.bandwidthUp = bandwidthUp;
       this.bandwidthDown = bandwidthDown;
       this.packetlossUp = packetlossUp;
       this.packetlossDown = packetlossDown;
       this.flows = flows;
       this.sessionId = SessionId;
  }
  /**
   * Returns a promise with the sdp representation of this session
   * @return {promise} -  On sucess (string) , on error (error).
   */
  toSdp() {
    return new Promise((resolve, reject) => {
      sdp = "";
      sdp = sdp + "o=q4s "+this.sessionId+" 2353687637 IN IPx xxx.xxx.xxx.xxx"
      sdp = sdp + "a=qos-level:"+qosLevelUp+"/"+qosLevelDown+"\r\n"
      if (alertingMode == alertTypes.REACTIVE) {
        sdp = sdp + "a=alerting-mode:Reactive\r\n"
      } else {
        sdp = sdp + "a=alerting-mode:Q4S-aware-network\r\n"
      }
      sdp = sdp + "a=alert-pause:"+alertPause+"\r\n"
      sdp = sdp + "a=public-address:client "+clientPublicAddressType+" "+clientPublicAddress+"\r\n"
      sdp = sdp + "a=public-address:server "+serverPublicAddressType+" "+serverPublicAddress+"\r\n"
      for(let measurement in measurementProcedure) {
        sdp = sdp + "a=measurement:"+measurement+measurementProcedure[measurement]+"\r\n"
      }
      sdp = sdp + "a=latency:"+latency+"\r\n"
      sdp = sdp + "a=jitter:"+jitterUp+"/"+jitterDown+"\r\n"
      sdp = sdp + "a=bandwidth:"+bandwidthUp+"/"+bandwidthDown+"\r\n"
      sdp = sdp + "a=packetloss:"+packetlossUp+"/"+packetlossDown+"\r\n"
      for(let flow in flows ){
        for(let end in flow ){
          for(let type in end ){
            sdp = sdp + "a=flow:"+flow+" "+end+" "+type+"/"+end[type]+"\r\n"
          }
        }
      }
      resolve(sdp);
    });   
  }

  /**
   * Build a new ResQ4S from an stdp in string format.
   * @param {string} str - The sdp message to generate a new session.
   * @return {Promise} On sucess (ResQ4S) , on error (error).
   */
  static fromSdp(str) {
    return new Promise((resolve, reject) => {
      let qosLevelUp = 0, qosLevelDown = 0 , alertingMode = alertTypes.REACTIVE,
      alertPause = 1000, recoveryPause = 1000, clientPublicAddressType,
        clientPublicAddress, serverPublicAddressType, serverPublicAddress,
        measurementProcedure, latency = 0, jitterUp = 0, jitterDown = 0,
        bandwidthUp = 0, bandwidthDown = 0 , packetlossUp = 0,
        packetlossDown = 0, flow={}, aux, aux2, SessionId;
        
      const lines = str.split('\r\n');
      lines.forEach((line) => {
        if (line.indexOf('a=') === 0) {
          if (line.indexOf('a=qos-level:') === 0) {
            aux = line.substring(12).split('/');
            qosLevelUp = parseInt(aux[0], 10);
            qosLevelDown = parseInt(aux[1], 10);
          } else if (line.indexOf('a=alerting-mode:') === 0) {
            aux = line.substring(16);
            if (aux.localeCompare("Q4S-aware-network") === 0){
              alertingMode = alertTypes.Q4SAWARE;
            }
          } else if (line.indexOf('a=alert-pause:') === 0) {
            alertPause = parseInt(line.substring(14), 10);
          } else if (line.indexOf('a=recovery-pause:') === 0) {
              recoveryPause = parseInt(line.substring(14), 10);
          } else if (line.indexOf('a=public-address:client') === 0) {
            clientPublicAddressType = line.substring(24, 27);
            clientPublicAddress = line.substring(28);
          } else if (line.indexOf('a=public-address:server') === 0) {
            serverPublicAddressType = line.substring(24, 27);
            serverPublicAddress = line.substring(28);
          } else if (line.indexOf('a=measurement:procedure') === 0) {
            aux2 = line.indexOf('('); 
            aux = line.substring(24, aux2);
            measurementProcedure[aux] = line.substring(aux2)
          } else if (line.indexOf('a=latency:') === 0) {
            latency = line.substring(10);
          } else if (line.indexOf('a=jitter:') === 0) {
            aux = line.substring(9).split('/');
            jitterUp = parseInt(aux[0], 10);
            jitterDown = parseInt(aux[1], 10);
          } else if (line.indexOf('a=bandwidth:') === 0) {
            aux = line.substring(12);
            bandwidthUp = parseInt(aux[0], 10);
            bandwidthDown = parseInt(aux[1], 10);
          } else if (line.indexOf('a=packetloss:') === 0) {
            aux = line.substring(13).split('/');
            packetlossUp = parseInt(aux[0], 10);
            packetlossDown = parseInt(aux[1], 10);
          } else if (line.indexOf('a=flow') === 0) {
            aux = line.substring(7).split(' ');
            aux2 = [2].split('/');
            flows[aux[0]][aux[1]][aux2[0]]= aux2[1];
          }
        } else if (line.indexOf('o=') === 0) {
          SessionId = line.split(' ')[2];
        }
      resolve( new Session(qosLevelUp, qosLevelDown, alertingMode,
        alertPause, recoveryPause, clientPublicAddressType,
        clientPublicAddress, serverPublicAddressType, serverPublicAddress,
        measurementProcedure, latency, jitterUp, jitterDown,
        bandwidthUp, bandwidthDown, packetlossUp,packetlossDown, flow, SessionId));
      });
    });
  }

  validate() { }
};
const alertTypes = Object.freeze({"Q4SAWARE":0, "REACTIVE":1});

/** A constant object that exports the two alerting modes that can be possible in a session*/
module.exports.alertTypes= alertTypes;
module.exports = Session;
