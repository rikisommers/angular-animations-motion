import { Component, Input, ContentChildren, QueryList, AfterContentInit, OnDestroy, ViewChild, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf, NgComponentOutlet } from '@angular/common';
import { MotionOneDirective } from './ngx-motion-one.directive';
import { MotionOneService } from './services/ngx-motion-one.service';
import { Router, NavigationStart, RouterOutlet, NavigationEnd, Event, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'motion-one-presence',
  template: `
    <div class="router-container">
      <div *ngIf="previousComponent" class="router-component previous">
        <ng-container *ngComponentOutlet="previousComponent"></ng-container>
      </div>
      <div class="router-component current">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .router-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .router-component {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
    .previous {
      z-index: 1;
    }
    .current {
      z-index: 2;
    }
  `],
  standalone: true,
  providers: [MotionOneService],
  imports: [NgIf, NgComponentOutlet]
})
export class MotionOnePresenceComponent implements AfterContentInit, OnDestroy {
  @Input() mode: 'sync' | 'wait' = 'wait';
  @ContentChildren(MotionOneDirective, { descendants: true }) 
  motionElements!: MotionOneDirective[];
  @ViewChild(RouterOutlet) routerOutlet?: RouterOutlet;
  
  previousComponent: any = null;
  currentComponent: any = null;
  private routerSubscription = new Subscription();
  private cachedElements: MotionOneDirective[] = [];
  private previousRoute: string | null = null;
  private currentRoute: string | null = null;
  private exitDuration: number = 0;
  private isAnimating: boolean = false;

  constructor(
    private router: Router,
    private motionService: MotionOneService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Make component accessible globally for debugging
    (window as any).__motionPresenceComponent = this;
    
    // Listen for router events
    this.routerSubscription = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart && !this.isAnimating) {
        
        // Run exit animations on the current route that's about to be navigated away from
        this.motionService.runAllExitAnimations();
      }
      
      if (event instanceof NavigationEnd) {
        // Store the new route after navigation
        this.currentRoute = event.urlAfterRedirects;
        console.log('Navigation completed to:', this.currentRoute);

        // Run enter animations for the NEW route after navigation completes
        // We delay this slightly to ensure the component is fully rendered
        setTimeout(() => {
          console.log('Running enter animations for new route:', this.currentRoute);
          
          // Clear previous component after enter animations complete
          setTimeout(() => {

            console.log('Clearing previous component');
            this.motionService.runAllEnterAnimations();

            this.previousComponent = null;
            this.isAnimating = false;

            this.cdr.detectChanges();
          }, Math.max(1000, this.exitDuration)); // Use at least 1 second or the exit duration, whichever is longer
        }, 100);
      }
    });
  }
  
  // This method will be called from the app component
  setCurrentComponent(component: any): void {
    console.log('Setting current component:', component);
    this.currentComponent = component;
  }
  
  ngAfterContentInit() {
    console.log('ngAfterContentInit');
  }
  
  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
    
    if (isPlatformBrowser(this.platformId)) {
      (window as any).__motionPresenceComponent = null;
    }
  }
}