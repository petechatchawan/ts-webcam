import { Routes } from '@angular/router';
import { WebcamDemoComponent } from './webcam-demo/webcam-demo.component';

export const routes: Routes = [
  { path: '', redirectTo: '/webcam', pathMatch: 'full' },
  { path: 'webcam', component: WebcamDemoComponent }
];
