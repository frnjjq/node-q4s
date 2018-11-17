module.exports = class session {
  constructor() {}
  toSdp() {}


  static fromSdp(str) {
    let qosLevel; let alertingMode; let alertPause;
    const lines = str.split('\r\n');
    lines.forEach((line) => {
      if ( line.indexOf('a=') === 0 ) {
        if (line.indexOf('a=qos-level:') === 0) {
          qosLevel = line.substring(12);
        } else if (line.indexOf('a=alerting-mode:') === 0) {
          alertingMode = line.substring(16);
        } else if (line.indexOf('a=alert-pause:') === 0) {
          alertPause = line.substring(14);
        } else if (line.indexOf('a=public-address:client') === 0) {
          clientPublicAddressType = line.substring(24, 27);
          clientPublicAddress = line.substring(28);
        } else if (line.indexOf('a=public-address:server') === 0) {
          serverPublicAddressType = line.substring(24, 27);
          serverPublicAddress = line.substring(28);
        }
      } else if (line.indexOf('o=') === 0 ) {

      }
    });
  }

  validate() {}
};
