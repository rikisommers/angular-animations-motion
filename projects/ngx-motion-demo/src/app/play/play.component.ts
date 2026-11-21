import { Component } from '@angular/core';
import { MotionOneDirective } from '../../directives/motion-one.directive';
import { PageTransitionComponent } from '../components/transition/page-transition/page-transition.component';

@Component({
  selector: 'app-play',
  imports: [
    MotionOneDirective,
    PageTransitionComponent
  ],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss',
  standalone: true,
})
export class PlayComponent {
  constructor() {
    //console.log('Play component initialized');
  }
}
