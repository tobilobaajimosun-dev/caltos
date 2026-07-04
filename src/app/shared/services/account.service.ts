import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccountService {
  readonly accountNumber = signal('0162989824');
  readonly bankName = signal('Guaranty Trust Bank');
}
