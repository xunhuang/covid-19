export class BasicDataComponent {

  constructor(confirmed, active, recovered, died) {
    this.confirmed_ = confirmed;
    this.active_ = active;
    this.recovered_ = recovered;
    this.died_ = died;
  }

  confirmed() {
    return this.confirmed_;
  }

  active() {
    return this.active_;
  }

  recovered() {
    return this.recovered_;
  }

  died() {
    return this.died_;
  }
}
