import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { WorkComponent } from './work/work.component';
import { PlayComponent } from './play/play.component';
import { HomeComponent } from './home/home.component';
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
  }
];
