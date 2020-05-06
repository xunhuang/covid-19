/** Paths are the ID type for entities, and encode hierarchical information. */
export class Path {

  static parse(path) {
    if (path === '/') {
      return Path.root();
    } else {
      return new Path(path.substr(1).split('/'));
    }
  }

  static root() {
    return new Path([]);
  }

  constructor(components) {
    this.components = components;
  }

  child(name) {
    return new Path(this.components.concat(name));
  }

  parent() {
    if (this.level() > 0) {
      return new Path(this.components.slice(0, this.components.length - 1));
    } else {
      return undefined;
    }
  }

  level() {
    return this.components.length;
  }

  matches(pattern) {
    if (pattern === '/') {
      return this.components.length === 0;
    }

    const components = Path.parse(pattern).components;
    if (this.components.length !== components.length) {
      return false;
    }

    for (let i = 0; i < this.components.length; ++i) {
      if (components[i].startsWith(':') || this.components[i] === components[i]) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  }

  string() {
    return '/' + this.components.join('/');
  }
}

