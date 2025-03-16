import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, Event, RouterOutlet, NavigationCancel } from '@angular/router';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { MotionOneService } from '../services/motion-one.service';

@Component({
  selector: 'motion-route-animator',
  template: `
    <div class="route-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .route-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
  `],
  standalone: true,
  imports: [RouterOutlet]
})
export class MotionRouteAnimatorComponent implements OnInit, OnDestroy {
  private routerSubscription = new Subscription();
  private currentRoute: string | null = null;
  private previousRoute: string | null = null;
  private isNavigating = false;
  private pendingNavigation: string | null = null;

  constructor(
    private router: Router,
    private motionService: MotionOneService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.routerSubscription = this.router.events.subscribe((event: Event) => {
      // When navigation starts
      if (event instanceof NavigationStart) {
        this.previousRoute = this.router.url;
        this.currentRoute = (event as NavigationStart).url;
        this.isNavigating = true;
        
        console.log(`[MotionRouteAnimator] Navigation from ${this.previousRoute} to ${this.currentRoute}`);
        
        // Run exit animations for the current route
        //this.motionService.runAllExitAnimationsForRoute(this.previousRoute || '');
        this.motionService.runAllExitAnimations();

        // Get the longest exit animation duration
        const longestDuration = this.motionService.getLongestExitDurationForRoute(this.previousRoute || '');
        
        console.log(`[MotionRouteAnimator] Longest exit animation duration: ${longestDuration}ms`);
        
        // If there are exit animations, delay the navigation
       // if (longestDuration > 0) {
          // Store the pending navigation URL
          this.pendingNavigation = this.currentRoute;
          
          // Cancel the current navigation
          this.router.navigateByUrl(this.previousRoute || '', { skipLocationChange: true });
          
          // Wait for animations to complete, then navigate
          setTimeout(() => {
            console.log(`[MotionRouteAnimator] Exit animations complete, navigating to ${this.pendingNavigation}`);
            if (this.pendingNavigation) {
              this.router.navigateByUrl(this.pendingNavigation);
              this.pendingNavigation = null;
            }
            this.isNavigating = false;
          }, 2000); //longestDuration
       // }
      }
      
      // When navigation ends
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        if (!this.pendingNavigation) {
          this.currentRoute = this.router.url;
          console.log(`[MotionRouteAnimator] Navigation complete to: ${this.currentRoute}`);
          this.isNavigating = false;
        }
      }
    });
  }
  
  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }
} 