import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, Router, NavigationEnd , NavigationStart} from '@angular/router';
import { MotionDirective } from '../../../../dist/ngx-motion/';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MotionDirective
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent {
  title = 'ngx-motion-demo';
}
