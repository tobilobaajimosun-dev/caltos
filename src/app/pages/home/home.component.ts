import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent, KpiCardComponent, StatusBadgeComponent } from '../../shared/components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, SidebarComponent, KpiCardComponent, StatusBadgeComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  readonly orgName = 'Princeps Finance';
  readonly userName = 'Jesulademi';
  homePeriod: 'today' | 'week' | 'month' = 'today';

  get greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  readonly recentLoans: Array<{ name: string; initials: string; product: string; amount: string; status: 'active'|'pending'|'overdue'|'successful'|'failed'|'inactive'|'suspended'|'dormant'; date: string }> = [
    { name: 'Adaeze Okonkwo', initials: 'AO', product: 'Corper Wallet', amount: '₦80,000', status: 'active', date: 'Jun 19, 2026' },
    { name: 'Chukwuemeka Eze', initials: 'CE', product: 'Credit Alert', amount: '₦50,000', status: 'pending', date: 'Jun 19, 2026' },
    { name: 'Fatimah Bello', initials: 'FB', product: 'Credit Wallet', amount: '₦100,000', status: 'active', date: 'Jun 18, 2026' },
    { name: 'Olumide Adesanya', initials: 'OA', product: 'Corper Wallet', amount: '₦30,000', status: 'overdue', date: 'Jun 17, 2026' },
    { name: 'Ngozi Uche', initials: 'NU', product: 'WACS', amount: '₦75,000', status: 'active', date: 'Jun 17, 2026' },
  ];
}
