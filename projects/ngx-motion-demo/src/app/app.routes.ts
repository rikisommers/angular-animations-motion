import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { WorkComponent } from './work/work.component';
import { PlayComponent } from './play/play.component';
import { HomeComponent } from './home/home.component';
import { AnimationGuard } from '../../../ngx-motion/src/lib/guards/animation-guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canDeactivate: [AnimationGuard]
  },
  {
    path: 'work',
    component: WorkComponent,
    canDeactivate: [AnimationGuard]
  },
  {
    path: 'play',
    component: PlayComponent,
    canDeactivate: [AnimationGuard]
  }
];
