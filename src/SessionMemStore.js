module.exports = class SessionMemStore {
  constructor(){
    this.arr = [];
  }
  push(session) {
    this.arr.push(session);
  };

  findById(id) {
    return this.arr.find( (element) => {
      if(element.id === id) {
        return true
      }
      else {
        return false
      }
    });
  }
  deleteById(id) {
    const index = this.arr.findIndex( (element) => {
      if(element.id === id) {
        return true
      }
      else {
        return false
      }
    });
    this.arr.splice(index, 1);
  }
  updateById(id, session) {
    const index = this.arr.findIndex( (element) => {
      if(element.id === id) {
        return true
      }
      else {
        return false
      }
    });
    this.arr.splice(index, 1);  
    this.arr.push(session); 
  }
}