/** A world contains all the entities and their components. */
export class World {

  constructor() {
    this.componentsByPath = new Map();
  }

  get(path, componentType) {
    const asStr = path.string();
    if (!this.componentsByPath.has(asStr)) {
      return undefined;
    } else {
      return this.componentsByPath.get(asStr).get(componentType);
    }
  }

  getMultiple(path, componentTypes) {
    const asStr = path.string();
    if (!this.componentsByPath.has(asStr)) {
      return undefined;
    } else {
      const components = this.componentsByPath.get(asStr);
      return componentTypes.map(c => components.get(c));
    }
  }

  set(path, component) {
    const asStr = path.string();
    if (!this.componentsByPath.has(asStr)) {
      this.componentsByPath.set(asStr, new Map());
    }
    this.componentsByPath.get(asStr).set(component.constructor, component);
  }
}
