import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/components';
import { ShowcaseComponent } from './pages/showcase/showcase.component';
import { QuickActionsComponent } from './pages/quick-actions/quick-actions.component';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { ProductDetailComponent } from './features/products/product-detail/product-detail.component';
import { CreateLoanComponent } from './features/loans/create-loan/create-loan.component';
import { CreateBnplComponent } from './features/products/create-bnpl/create-bnpl.component';
import { ApplyComponent } from './features/apply/apply.component';
import { LoanListComponent } from './features/loans/loan-list/loan-list.component';
import { LoanDetailComponent } from './features/loans/loan-detail/loan-detail.component';
import { BulkMandatesComponent } from './features/loans/bulk-mandates/bulk-mandates.component';
import { CollectionsDashboardComponent } from './features/collections/collections-dashboard/collections-dashboard.component';
import { ReconciliationComponent } from './features/collections/reconciliation/reconciliation.component';
import { ExceptionsComponent } from './features/collections/exceptions/exceptions.component';
import { EscalationsComponent } from './features/collections/escalations/escalations.component';
import { RecoveryPortalComponent } from './features/collections/recovery-portal/recovery-portal.component';
import { ReportsComponent } from './features/reports/reports.component';
import { EmployerPortalComponent } from './features/employers/employer-portal/employer-portal.component';
import { AlertSettingsComponent } from './features/settings/alert-settings/alert-settings.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { OnboardingComponent } from './features/auth/onboarding/onboarding.component';
import { AcceptInviteComponent } from './features/auth/accept-invite/accept-invite.component';

export const routes: Routes = [
  // Public, unauthenticated flows — no shell chrome
  { path: 'apply', component: ApplyComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'onboarding', component: OnboardingComponent },
  { path: 'invite/:token', component: AcceptInviteComponent },
  // Self-contained component-library demo (renders its own sidebar) — no shell chrome
  { path: 'showcase', component: ShowcaseComponent },

  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', component: QuickActionsComponent },
      { path: 'home', component: HomeComponent },
      { path: 'products', component: ProductListComponent },
      { path: 'products/create', component: CreateLoanComponent },
      { path: 'products/create-bnpl', component: CreateBnplComponent },
      { path: 'products/:id', component: ProductDetailComponent },
      { path: 'loans', component: LoanListComponent },
      { path: 'loans/:id', component: LoanDetailComponent },
      { path: 'mandates/bulk', component: BulkMandatesComponent },
      { path: 'collections', component: CollectionsDashboardComponent },
      { path: 'collections/reconciliation', component: ReconciliationComponent },
      { path: 'collections/exceptions', component: ExceptionsComponent },
      { path: 'collections/escalations', component: EscalationsComponent },
      { path: 'recovery', component: RecoveryPortalComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'employers', component: EmployerPortalComponent },
      { path: 'settings/alerts', component: AlertSettingsComponent },
    ],
  },

  { path: '**', component: NotFoundComponent },
];
