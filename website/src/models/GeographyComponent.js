const geolib = require('geolib');

export class GeographyComponent {

  constructor(latitude, longitude) {
    this.position_ = {latitude, longitude};
  }

  distance(other) {
    return geolib.getDistance(this.position_, other.position_);
  }

  position() {
    return this.position_;
  }
}
