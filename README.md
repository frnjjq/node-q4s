# node-q4s

[![Build Status](https://travis-ci.org/frnjjq/node-q4s.svg?branch=master)](https://travis-ci.org/frnjjq/node-q4s) [![Test Coverage](https://api.codeclimate.com/v1/badges/815c07569b06770c5dc9/test_coverage)](https://codeclimate.com/github/frnjjq/node-q4s/test_coverage) [![Maintainability](https://api.codeclimate.com/v1/badges/815c07569b06770c5dc9/maintainability)](https://codeclimate.com/github/frnjjq/node-q4s/maintainability)

A node.js implementation of the Q4S protocol.

## Getting Started

The main components of this project are the Q4S server and the Q4S client. Those are served as modules to import to your own program. The use of those is shown in example programs under example folder. 

The server example shows a simple Q4S server. That server only logs the recieved messages. The Q4S client example does the same logging the ocurred events.

To know more about the Q4S protocol please visit the [official website](https://q4sprotocol.wordpress.com/). Or visit the [current Q4S draft in the IETF](https://datatracker.ietf.org/doc/draft-aranda-dispatch-q4s/)

See docs and example programs for notes on how to use this project in a production system.

### Compatibility

This module is aimed to be compatible with current [nodejs LTS releases](https://github.com/nodejs/Release) from 8.x.

This module does not have production dependencies. So there is not associated security risks associated to third party modules.

### Installing

Clone the repository to the desired location.
```
git clone https://github.com/frnjjq/node-q4s.git
```

And then include in your source the server and clients.

```
const server = require('node-q4s/index.js').server;
```

For more information the use check the example sources under example and the documentation in folder doc. 

## Running the tests

In order to run the tests install first the development dependencies
```
npm install --only=dev
```
Then run the test script
```
npm run test
```
The results should show no error on main branch.

## Documentation

Documentation can be generated from sources running the next script.
```
npm run gendoc
```
The documentation will be placed in web format in /docs/index.html

Or can be [found online](https://frnjjq.github.io/node-q4s/), for the master branch.

There are use examples at examples folder which demostrate the use.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/frnjjq/node-q4s/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/frnjjq/node-q4s/tags). 

## Authors

* **Francisco José Juan Quintanilla** - *Initial work* - Nokia Spain

See also the list in [CONTRIBUTORS.md](https://github.com/frnjjq/node-q4s/blob/master/CONTRIBUTORS.md) who participated in this project.

## License

This project is licensed under the Apache License v2 - see the [LICENSE](https://github.com/frnjjq/node-q4s/blob/master/LICENSE) file for details

## Acknowledgments

* My working team in Nokia Spain
* Jose Javier Garcia Aranda as brain behind the protocol.
