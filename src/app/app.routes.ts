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
import { RepaymentPortalComponent } from './features/portal/repayment-portal/repayment-portal.component';
import { LoanListComponent } from './features/loans/loan-list/loan-list.component';
import { LoanDetailComponent } from './features/loans/loan-detail/loan-detail.component';
import { ManualReviewComponent } from './features/loans/manual-review/manual-review.component';
import { RefundsComponent } from './features/loans/refunds/refunds.component';
import { MandatesComponent } from './features/loans/mandates/mandates.component';
import { RepaymentManagementComponent } from './features/loans/repayment-management/repayment-management.component';
import { LoanProcessingComponent } from './features/loans/loan-processing/loan-processing.component';
import { BulkMandatesComponent } from './features/loans/bulk-mandates/bulk-mandates.component';
import { CollectionsDashboardComponent } from './features/collections/collections-dashboard/collections-dashboard.component';
import { ReconciliationComponent } from './features/collections/reconciliation/reconciliation.component';
import { ExceptionsComponent } from './features/collections/exceptions/exceptions.component';
import { EscalationsComponent } from './features/collections/escalations/escalations.component';
import { RecoveryPortalComponent } from './features/collections/recovery-portal/recovery-portal.component';
import { ReportsComponent } from './features/reports/reports.component';
import { EmployerPortalComponent } from './features/employers/employer-portal/employer-portal.component';
import { AlertSettingsComponent } from './features/settings/alert-settings/alert-settings.component';
import { OrganizationSettingsComponent } from './features/settings/organization-settings/organization-settings.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { OnboardingComponent } from './features/auth/onboarding/onboarding.component';
import { AcceptInviteComponent } from './features/auth/accept-invite/accept-invite.component';
import { LandingComponent } from './pages/landing/landing.component';
import { CustomerListComponent } from './features/customers/customer-list/customer-list.component';
import { CustomerProfileComponent } from './features/customers/customer-profile/customer-profile.component';
import { WalletComponent } from './features/wallet/wallet.component';
import { NotificationsPageComponent } from './features/notifications/notifications.component';
import { RiskMonitorComponent } from './features/risk-monitor/risk-monitor.component';
import { TeamsComponent } from './features/teams/teams.component';
import { LoanCalculatorComponent } from './features/loans/loan-calculator/loan-calculator.component';
import { EligibilityCalculatorComponent } from './features/loans/eligibility-calculator/eligibility-calculator.component';
import { SchedulesComponent } from './features/repayments/schedules/schedules.component';
import { BulkUploadsComponent } from './features/repayments/bulk-uploads/bulk-uploads.component';
import { CollectionMethodsComponent } from './features/repayments/collection-methods/collection-methods.component';
import { VendorManagementComponent } from './features/utilities/vendor-management/vendor-management.component';

export const routes: Routes = [
  // Public marketing landing page — the app's true entry point
  { path: '', pathMatch: 'full', component: LandingComponent },
  // Public, unauthenticated flows — no shell chrome
  { path: 'apply', component: ApplyComponent },
  { path: 'portal/repayments', component: RepaymentPortalComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'onboarding', component: OnboardingComponent },
  { path: 'invite/:token', component: AcceptInviteComponent },
  // Self-contained component-library demo (renders its own sidebar) — no shell chrome
  { path: 'showcase', component: ShowcaseComponent },
  // Full-screen wizard — no sidebar/header chrome (Mercury-style)
  { path: 'products/create', component: CreateLoanComponent },

  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: 'quick-actions', component: QuickActionsComponent },
      { path: 'home', component: HomeComponent },
      { path: 'customers', component: CustomerListComponent },
      { path: 'customers/:id', component: CustomerProfileComponent },
      { path: 'wallet', component: WalletComponent },
      { path: 'notifications', component: NotificationsPageComponent },
      { path: 'products', component: ProductListComponent },
      { path: 'products/create-bnpl', component: CreateBnplComponent },
      { path: 'products/:id', component: ProductDetailComponent },
      { path: 'loans', component: LoanListComponent },
      { path: 'loans/processing', component: LoanProcessingComponent },
      { path: 'loans/calculator', component: LoanCalculatorComponent },
      { path: 'loans/eligibility-calculator', component: EligibilityCalculatorComponent },
      { path: 'loans/manual-review', component: ManualReviewComponent },
      { path: 'loans/:id', component: LoanDetailComponent },
      { path: 'loans/:id/refunds', component: RefundsComponent },
      { path: 'repayments', component: RepaymentManagementComponent },
      { path: 'repayments/schedules', component: SchedulesComponent },
      { path: 'repayments/bulk-uploads', component: BulkUploadsComponent },
      { path: 'repayments/collection-methods', component: CollectionMethodsComponent },
      { path: 'repayments/mandates/bulk', component: BulkMandatesComponent },
      { path: 'repayments/mandates/:loanId', component: MandatesComponent },
      { path: 'collections', component: CollectionsDashboardComponent },
      { path: 'collections/reconciliation', component: ReconciliationComponent },
      { path: 'collections/exceptions', component: ExceptionsComponent },
      { path: 'collections/escalations', component: EscalationsComponent },
      { path: 'recovery', component: RecoveryPortalComponent },
      { path: 'risk-monitor', component: RiskMonitorComponent },
      { path: 'teams', component: TeamsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'utilities', redirectTo: 'utilities/organizations', pathMatch: 'full' },
      { path: 'utilities/organizations', component: EmployerPortalComponent },
      { path: 'utilities/vendors', component: VendorManagementComponent },
      { path: 'settings', component: OrganizationSettingsComponent },
      { path: 'settings/alerts', component: AlertSettingsComponent },
    ],
  },

  { path: '**', component: NotFoundComponent },
];
