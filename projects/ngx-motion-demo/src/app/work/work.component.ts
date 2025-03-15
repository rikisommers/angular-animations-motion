import { Component } from '@angular/core';
import { MotionOneDirective } from '../../directives/motion-one.directive';

@Component({
  selector: 'app-work',
  imports: [
    MotionOneDirective
  ],
  standalone: true,
  templateUrl: './work.component.html',
  styleUrl: './work.component.scss'
})
export class WorkComponent {
  constructor() {
  //  console.log('Work component initialized');
  }
}
