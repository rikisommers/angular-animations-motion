import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationStart, NavigationEnd, Event } from '@angular/router';
import { MotionOnePresenceComponent, MotionOneService } from 'ngx-motion';
import { AnimationRouterService } from '../../../ngx-motion/src/lib/services/animation-router.service';
import { AnimationDebugComponent } from '../../../ngx-motion/src/lib/debug/animation-debug.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MotionOnePresenceComponent,
    AnimationDebugComponent,
  ],
  providers: [
    MotionOneService, 
    AnimationRouterService
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent implements AfterViewInit {
  title = 'ngx-motion-demo';

  maxDelay!: number;
  elements!: any[];

  constructor(
    private router: Router,
    private animationRouter: AnimationRouterService,
    private motionService: MotionOneService
  ) {
    console.log('App component initialized');
    
    // Configure animation router service with debug settings
    this.animationRouter.enableDebug(true);
    this.animationRouter.setFallbackTimeout(2000); // 2 second fallback timeout
  }

  ngAfterViewInit() {
    // Update max delay on navigation events
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
       // this.motionService.runAllExitAnimations();
        console.log('Navigation started');
        const currentRoute = this.router.url;
        const targetRoute = (event as NavigationStart).url;
        this.maxDelay = this.motionService.getLongestExitDurationForRoute(currentRoute);
        console.log('Navigating from:', currentRoute, 'to:', targetRoute);
      }
      
      if (event instanceof NavigationEnd) {
        console.log('Navigation ended');
        this.elements = this.motionService.getMotionElements();
        console.log('Elements:', this.elements);
        console.log('Max delay:', this.maxDelay);
      }
    });
  }
}
