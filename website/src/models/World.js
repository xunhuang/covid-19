/** A world contains all the entities and their components. */
export class World {

  constructor(source) {
    this.componentsByPath = new Map();
    this.frontier = new Set();
    this.source = source;
  }

  get(path, componentType) {
    this.ensure_(path);

    const asStr = path.string();
    if (!this.componentsByPath.has(asStr)) {
      return undefined;
    } else {
      return this.componentsByPath.get(asStr).get(componentType);
    }
  }

  getMultiple(path, componentTypes) {
    this.ensure_(path);

    const asStr = path.string();
    if (!this.componentsByPath.has(asStr)) {
      return undefined;
    } else {
      const components = this.componentsByPath.get(asStr);
      return componentTypes.map(c => components.get(c));
    }
  }

  has(path, componentType) {
    this.ensure_(path);

    const asStr = path.string();
    if (!this.componentsByPath.has(asStr)) {
      return false;
    } else {
      return !!this.componentsByPath.get(asStr).get(componentType);
    }
  }

  set(path, component) {
    const asStr = path.string();
    if (!this.componentsByPath.has(asStr)) {
      this.componentsByPath.set(asStr, new Map());
      this.frontier.add(asStr);
    }
    this.componentsByPath.get(asStr).set(component.constructor, component);
  }

  ensure_(target, componentType) {
    const asStr = target.string();
    const haveTarget = this.componentsByPath.has(asStr);
    if (!this.frontier.has(asStr) && haveTarget) {
      // We have fully loaded it
      return;
    } else if (haveTarget) {
      // We have something for the target
      const components = this.componentsByPath.get(asStr);
      if (components.has(componentType)) {
        // We at least have the component, so don't load more
        return;
      }
    }

    for (const [path, components] of this.source.fetch(target)) {
      this.frontier.add(path.string());
      components.forEach(c => {
        this.set(path, c);
      });
    }

    this.frontier.delete(asStr);
  }
}
