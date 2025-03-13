import { Component, Input, ContentChildren, QueryList, AfterContentInit, OnDestroy } from '@angular/core';
import { MotionOneDirective } from './ngx-motion-one.directive';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { from, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'motion-one-presence',
  template: `<ng-content></ng-content>`,
})
export class MotionOnePresenceComponent implements AfterContentInit, OnDestroy {
  @Input() mode: 'sync' | 'wait' = 'sync';
  @ContentChildren(MotionOneDirective, { descendants: true }) 
  motionElements!: QueryList<MotionOneDirective>;
  
  private routerSubscription: Subscription = new Subscription();
  private isAnimatingOut = false;
  private pendingNavigation: string | null = null;
  
  constructor(private router: Router) {
    // Listen for route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationStart || event instanceof NavigationEnd))
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          if (this.mode === 'wait' && this.isAnimatingOut) {
            // Store pending navigation
            this.pendingNavigation = event.url;
            // Cancel current navigation by navigating to the same URL
            this.router.navigateByUrl(this.router.url, { skipLocationChange: true });
          } else {
            // Start exit animations
            this.runExitAnimations();
          }
        } else if (event instanceof NavigationEnd) {
          this.isAnimatingOut = false;
        }
      });
  }
  
  ngAfterContentInit() {
    // Listen for changes to motion elements
    this.motionElements.changes.subscribe(() => {
      // New elements have been added, run enter animations
      this.runEnterAnimations();
    });
  }
  
  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }
  
  private runExitAnimations() {
    if (!this.motionElements || this.motionElements.length === 0) {
      return;
    }
    
    this.isAnimatingOut = true;
    let completedCount = 0;
    const totalElements = this.motionElements.length;
    
    // Run exit animations for all motion elements
    this.motionElements.forEach(element => {
      // Add a one-time listener for animation completion
      const subscription = element.animationComplete.subscribe(() => {
        completedCount++;
        subscription.unsubscribe();
        
        // If all animations are complete and we have a pending navigation
        if (completedCount === totalElements && this.pendingNavigation) {
          this.isAnimatingOut = false;
          const url = this.pendingNavigation;
          this.pendingNavigation = null;
          this.router.navigateByUrl(url);
        }
      });
      
      // Start the exit animation
      element.runExitAnimation();
    });
  }
  
  private runEnterAnimations() {
    if (!this.motionElements) return;
    
    this.motionElements.forEach(element => {
      element.runInitAnimation();
    });
  }
}