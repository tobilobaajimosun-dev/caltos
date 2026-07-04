import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly expired = signal(false);

  expire() {
    this.expired.set(true);
  }

  resume() {
    this.expired.set(false);
  }
}
