import { Component } from '@angular/core';
import { MotionOneDirective } from '../../directives/motion-one.directive';
import { PageTransitionComponent } from '../components/transition/page-transition/page-transition.component';
import { HomeComponent } from "../home/home.component";
@Component({
  selector: 'app-work',
  imports: [
    MotionOneDirective,
    PageTransitionComponent,
    HomeComponent
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
