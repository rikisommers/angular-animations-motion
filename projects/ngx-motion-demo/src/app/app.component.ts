import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, Router, NavigationEnd , NavigationStart} from '@angular/router';
import { MotionOneDirective, MotionOneService } from '../../../../dist/ngx-motion/';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MotionOneDirective,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent {
  title = 'ngx-motion-demo';

  constructor(private motionOneService: MotionOneService) {
    console.log('sss');
    this.motionOneService.getMotionElements().forEach(element => {
      console.log(element);
    });
  }
}
