module.exports.parseRequest = function parseRequest(msg) {
  return new Promise((resolve, reject) => {
    let data, values
    data.type = "request"
    data.body = msg.substring(msg.indexOf("\r\n\r\n") + 4)
    const headerPart = msg.substring(0, msg.indexOf("\r\n\r\n"))
    var headers = headerPart.split("\r\n")
    headers.forEach((item, index) => {
      if (index === 0) {
        values = item.split(" ")
        data.method = values[0]
        data.requestURI = values[1]
        data.q4sVersion = values[2]
      } else {
        values = item.split(": ")
        data[values[0]] = values[1]
      }
    })
    validateRequest(data)
      .then((data) => {
        resolve(data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}


function validateRequest(data) {
  return new Promise((resolve, reject) => {
    if (!data.method) {
      reject(new Error("Method is not present in the request line."))
    }
    if (!(data.method === "BEGIN" || data.method === "READY" || data.method === "PING" || data.method === "Q4S-ALERT" || data.method === "Q4S-RECOVERY" || data.method === "CANCEL" || data.method === "PING")) {
      reject(new Error("Method field of the request line does not contain a valid word."))
    }
    if (!data.requestURI) {
      reject(new Error("Request Uri is not present in the request line."))
    }
  })
}

module.exports.parseResponse = function parseResponse(msg) {
  return new Promise((resolve, reject) => {
    let data, values
    data.type = "response"
    data.body = msg.substring(msg.indexOf("\r\n\r\n") + 4)
    const headerPart = msg.substring(0, msg.indexOf("\r\n\r\n"))
    var headers = headerPart.split("\r\n")
    headers.forEach((item, index) => {
      if (index === 0) {
        values = item.split(" ")
        data.q4sVersion = values[0]
        data.statusCode = values[1]
        data.reasonPhrase = values[2]
      } else {
        values = item.split(": ")
        data[values[0]] = values[1]
      }
    })
    validateResponse(data)
      .then((data) => {
        resolve(data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

function validateResponse(data) {
  return new Promise((resolve, reject) => {
    if (!data.statusCode) {
      reject(new Error("Status code is not present in the request line."))
    }
    if (!(data.method === "BEGIN" || data.method === "READY" || data.method === "PING" || data.method === "Q4S-ALERT" || data.method === "Q4S-RECOVERY" || data.method === "CANCEL" || data.method === "PING")) {
      reject(new Error("Method field of the request line does not contain a valid word."))
    }
    if (!data.requestURI) {
      reject(new Error("Request Uri is not present in the request line."))
    }
  })
}