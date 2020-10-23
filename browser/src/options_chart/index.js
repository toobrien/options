
class index {

  // index of strikes to expiries, or expiries to strikes
  constructor(type) {
    this.type = type;
    this.list = [];     // number for searching
    this.index = {};    // string for indexing
  }

  get_type() {
    return type;
  }

  add_location(i) {
    const str = i.toString();
    if (!(str in this.index)) {
      this.index[str] = [];
      this.list.push(i);        // int, searchable
    }
  }

  add_heading(i, j) {
    const str = i.toString();
    this.index[str].push(j);
  }

  finalize() {
    this.list.sort((a,b) => a - b);
    for (var location in this.index)
      this.index[location] = new Set(this.index[location]);
  }

  contains() {
    const str = i.toString();
    return item in index;
  }


}

export { index };
