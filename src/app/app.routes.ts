import { Routes } from '@angular/router';
import { ShowcaseComponent } from './pages/showcase/showcase.component';
import { CreateProductComponent } from './features/products/create-product/create-product.component';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { CreateLoanComponent } from './features/loans/create-loan/create-loan.component';

export const routes: Routes = [
  { path: '', component: ShowcaseComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'products/create', component: CreateProductComponent },
  { path: 'loans/create', component: CreateLoanComponent },
];
