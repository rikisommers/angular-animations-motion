import 'zone.js';
import { Component, inject, input, computed, NgZone } from '@angular/core';
import { RouterLink, 
  RouterLinkActive, 
  RouterOutlet,
  ViewTransitionInfo,
  withComponentInputBinding,
  withViewTransitions,

 } from '@angular/router';
import { AnimationRouterOutletComponent } from '../directives/animation-router-outlet.component';
import { MotionOnePresenceComponent } from '../directives/motion-one-presence.component';
import { PageTransitionComponent } from './components/transition/page-transition/page-transition.component';
import { MotionOneService } from 'ngx-motion';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    RouterLinkActive,
    PageTransitionComponent,
    AnimationRouterOutletComponent,

  ],
  
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ngx-motion-demo';
}

