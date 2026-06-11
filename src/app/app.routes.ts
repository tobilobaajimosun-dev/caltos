import { Routes } from '@angular/router';
import { ShowcaseComponent } from './pages/showcase/showcase.component';
import { CreateProductComponent } from './features/products/create-product/create-product.component';

export const routes: Routes = [
  { path: '', component: ShowcaseComponent },
  { path: 'products/create', component: CreateProductComponent },
];
