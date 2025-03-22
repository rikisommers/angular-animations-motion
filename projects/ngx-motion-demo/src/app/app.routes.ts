import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { WorkComponent } from './work/work.component';
import { PlayComponent } from './play/play.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'work',
    component: WorkComponent
  },
  {
    path: 'play',
    component: PlayComponent
  },
  // Wildcard route to catch all routes
  {
    path: '**',
    redirectTo: ''
  }
];
