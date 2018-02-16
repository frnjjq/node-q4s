const assert = require("chai").assert;
const parser = require("./src/q4s_message_parser");

describe("q4s_message_parser", function() {
  describe("parseRequest", function() {
    it('Should advise a empty message', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});
