import { Routes } from '@angular/router';
import { ShowcaseComponent } from './pages/showcase/showcase.component';
import { QuickActionsComponent } from './pages/quick-actions/quick-actions.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { ProductDetailComponent } from './features/products/product-detail/product-detail.component';
import { CreateLoanComponent } from './features/loans/create-loan/create-loan.component';
import { ApplyComponent } from './features/apply/apply.component';

export const routes: Routes = [
  { path: '', component: QuickActionsComponent },
  { path: 'home', component: HomeComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'products/create', component: CreateLoanComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'apply', component: ApplyComponent },
  { path: 'showcase', component: ShowcaseComponent },
];
