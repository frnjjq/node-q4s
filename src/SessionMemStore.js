/**
 * Session store. Stores in memory sessions and allows to retrieve and modify
 *  them.
 * @module SessionMemStore
 */

/** Session storage. Allows to push sessions in memory and retrieve those later.
  *  Allows to create, destroy and modify sessions in here by sessionId which is
  *  the unique identifier
  */
class SessionMemStore {
  /**
   * Constructor for class. Generates a new empty store.
   */
  constructor() {
    this.arr = [];
  }
  /**
   * Pushes a new session into the store. Autogenerates the sessionId.
   * @param {Session} session - The session to store.
   */
  push(session) {
    let sessionId = 0;
    while (this.arr.findById(sessionId) !== undefined) {
      sessionId = sessionId+1;
    }
    session.sessionid = sessionId;
    this.arr.push(session);
  };
  /**
   * Return the session with the SessionId specified
   * @param {number} id - The sessionId of the session to retrieve.
   * @return {Session} -  The session found with the id. Undefined if not found
   */
  findById(id) {
    return this.arr.find( (element) => {
      if (element.sessionId === id) {
        return true;
      }
      return false;
    });
  }
  /**
   * Delete from the store the session with sessionid
   * @param {number} id - The sessionId of the session to delete.
   */
  deleteById(id) {
    const index = this.arr.findIndex( (element) => {
      if (element.sessionId === id) {
        return true;
      }
      return false;
    });
    if (index !== undefined) {
      this.arr.splice(index, 1);
    }
  }
  /**
   * Updates the session with the specified id with a new session.
   * The sessionid is forced to be the same.
   * @param {number} id - The sessionId of the session to replace.
   * @param {Session} session - The new session to be added to the datastore.
   */
  updateById(id, session) {
    const index = this.arr.findIndex( (element) => {
      if (element.sessionId === id) {
        return true;
      }
      return false;
    });
    session.sessionId = id;
    this.arr.splice(index, 1, session);
  }
}

module.exports = SessionMemStore;
