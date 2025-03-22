import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AnimationRouterOutletComponent } from '../directives/animation-router-outlet.component';
import { MotionOnePresenceComponent } from '../directives/motion-one-presence.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AnimationRouterOutletComponent,
    MotionOnePresenceComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor() {
    console.log('App component initialized');
  }
}
