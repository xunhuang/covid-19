export class Envelope {

  constructor(label, low, high, ...extras) {
    this.label_ = label;
    this.low_ = low;
    this.high_ = high;
    this.extras_ = extras;
  }

  label() {
    return this.label_;
  }

  low() {
    return this.low_;
  }

  high() {
    return this.high_;
  }

  extras() {
    return this.extras_;
  }

  serieses() {
    return [this.low_, this.high_].concat(this.extras_);
  }
}
