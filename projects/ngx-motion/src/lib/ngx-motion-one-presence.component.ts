import { Component, Input, ContentChildren, QueryList, AfterContentInit, OnDestroy, ViewChild, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf, NgComponentOutlet } from '@angular/common';
import { MotionOneDirective } from './ngx-motion-one.directive';
import { MotionOneService } from './services/ngx-motion-one.service';
import { Router, NavigationStart, RouterOutlet, NavigationEnd, Event, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription, filter, takeUntil, Subject } from 'rxjs';

@Component({
  selector: 'motion-one-presence',
  template: `
    <div class="router-container">
      <div *ngIf="previousComponent" class="router-component previous">
        <div class="debug-indicator previous-indicator" *ngIf="showDebugIndicators">Previous</div>
        <ng-container *ngComponentOutlet="previousComponent"></ng-container>
      </div>
      <div class="router-component current">
        <div class="debug-indicator current-indicator" *ngIf="showDebugIndicators">Current</div>
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
    .debug-indicator {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    }
    .previous-indicator {
      background: rgba(255,0,0,0.7);
    }
    .current-indicator {
      background: rgba(0,128,0,0.7);
    }
  `],
  standalone: true,
  providers: [MotionOneService],
  imports: [NgIf, NgComponentOutlet]
})
export class MotionOnePresenceComponent implements AfterContentInit, OnDestroy {
  @Input() mode: 'sync' | 'wait' = 'wait';
  @Input() showDebugIndicators: boolean = true;
  
  @ContentChildren(MotionOneDirective, { descendants: true }) 
  motionElements!: MotionOneDirective[];
  @ViewChild(RouterOutlet) routerOutlet?: RouterOutlet;
  
  previousComponent: any = null;
  currentComponent: any = null;
  private routerSubscription = new Subscription();
  private destroy$ = new Subject<void>();
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
    
    // Listen for router events
    this.routerSubscription = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart && !this.isAnimating) {
        this.isAnimating = true;
        
        // Store the current route before navigation
        this.previousRoute = this.router.url;
        // Store the target route
        this.currentRoute = (event as NavigationStart).url;
        
        console.log(`[MotionOnePresence] Navigation from ${this.previousRoute} to ${this.currentRoute}`);
        
        // Store the current component as the previous component
        if (this.routerOutlet?.activatedRoute.snapshot) {
          this.previousComponent = this.routerOutlet.activatedRoute.snapshot.component;
          this.cdr.detectChanges();
        }
        
        // Start exit animations for the current route
        this.motionService.startExitAnimationsForRoute(this.previousRoute || '');
      }
      
      if (event instanceof NavigationEnd) {
        // Store the new route after navigation
        this.currentRoute = event.urlAfterRedirects;
        console.log('[MotionOnePresence] Navigation completed to:', this.currentRoute);

        // Wait for exit animations to complete before running enter animations
        if (this.previousRoute) {
          console.log(`[MotionOnePresence] Waiting for exit animations to complete before running enter animations`);
          
          this.motionService.getExitAnimationsComplete(this.previousRoute)
            .pipe(takeUntil(this.destroy$))
            .subscribe(complete => {
              if (complete) {
                console.log(`[MotionOnePresence] Exit animations complete, now running enter animations`);
                this.runEnterAnimations();
              }
            });
        } else {
          // If no previous route, run enter animations immediately
          console.log('[MotionOnePresence] No previous route, running enter animations immediately');
          this.runEnterAnimations();
        }
      }
    });
  }
  
  /**
   * Run enter animations for the current route
   */
  private runEnterAnimations(): void {
    // We delay this slightly to ensure the component is fully rendered
    setTimeout(() => {
      // Get elements specific to the new route
      const elementsForNewRoute = this.motionService.getAllElementsByRoute(this.currentRoute || '');
      console.log(`[MotionOnePresence] Found ${elementsForNewRoute.length} elements for new route ${this.currentRoute}`);
      
      if (elementsForNewRoute.length > 0) {
        console.log(`[MotionOnePresence] Running enter animations for ${elementsForNewRoute.length} elements on route ${this.currentRoute}`);
        
        // Force a change detection cycle to ensure all components are rendered
        this.cdr.detectChanges();
        
        // Run enter animations
        this.motionService.runAllEnterAnimationsForRoute(this.currentRoute || '');
        
        // Get the longest enter duration
        const enterDuration = this.motionService.getLongestEnterDuration();
        console.log(`[MotionOnePresence] Enter animations running with duration: ${enterDuration}s`);
        
        // Clear previous component after enter animations have started
        setTimeout(() => {
          console.log('[MotionOnePresence] Enter animations started, clearing previous component');
          this.previousComponent = null;
          this.isAnimating = false;
          this.cdr.detectChanges();
        }, 100); // Short delay to ensure animations have started
      } else {
        console.log(`[MotionOnePresence] No elements to animate for new route ${this.currentRoute}`);
        
        // If no animations, clear previous component immediately
        this.previousComponent = null;
        this.isAnimating = false;
        this.cdr.detectChanges();
      }
    }, 50); // Short delay to ensure component is rendered
  }
  
  ngAfterContentInit() {
    console.log('[MotionOnePresence] ngAfterContentInit');
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.routerSubscription.unsubscribe();
  }
}