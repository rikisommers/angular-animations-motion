import { Component } from '@angular/core';
import { MotionOneDirective } from '../../directives/motion-one.directive';

@Component({
  selector: 'app-play',
  imports: [
    MotionOneDirective
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
