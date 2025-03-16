import { Injectable, NgZone, Inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { filter, take } from 'rxjs/operators';
import { Observable, Subject, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnimationRouterService {
  // Flag to track if we're currently handling a navigation
  private isNavigating = false;
  
  // Subject to track when exit animations are complete
  private exitAnimationsComplete = new Subject<boolean>();
  
  // Default animation duration in milliseconds
  private animationDuration = 500;
  
  // Fallback timeout to ensure navigation completes even if animations fail
  private fallbackTimeout = 1000;
  
  // Debug mode flag
  private debug = false;
  
  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document
  ) {
    // Listen for router events
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.handleNavigationStart(event);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating = false;
      }
    });
    
    // Listen for clicks on RouterLink elements
    this.setupRouterLinkInterception();
  }
  
  /**
   * Enable or disable debug mode
   */
  enableDebug(debug: boolean): void {
    this.debug = debug;
  }
  
  /**
   * Set the animation duration
   */
  setAnimationDuration(durationMs: number): void {
    this.animationDuration = durationMs;
  }
  
  /**
   * Set the fallback timeout
   */
  setFallbackTimeout(timeoutMs: number): void {
    this.fallbackTimeout = timeoutMs;
  }
  
  /**
   * Navigate to a URL after running exit animations
   */
  navigateTo(url: string, extras?: any): Promise<boolean> {
    if (this.debug) {
      console.log(`[AnimationRouter] Navigating to ${url}`);
    }
    
    if (this.isNavigating) {
      if (this.debug) {
        console.log('[AnimationRouter] Already navigating, ignoring request');
      }
      return Promise.resolve(false);
    }
    
    this.isNavigating = true;
    
    // Run exit animations
    this.runExitAnimations();
    
    // Wait for animations to complete
    return new Promise<boolean>(resolve => {
      // Set a fallback timeout to ensure navigation completes
      const fallbackTimer = setTimeout(() => {
        if (this.debug) {
          console.log('[AnimationRouter] Fallback timeout reached, forcing navigation');
        }
        this.completeNavigation(url, extras, resolve);
      }, this.fallbackTimeout);
      
      // Listen for animation completion
      this.exitAnimationsComplete
        .pipe(take(1))
        .subscribe(() => {
          clearTimeout(fallbackTimer);
          this.completeNavigation(url, extras, resolve);
        });
      
      // Also wait for the animation duration as a backup
      setTimeout(() => {
        this.exitAnimationsComplete.next(true);
      }, this.animationDuration);
    });
  }
  
  /**
   * Run exit animations for the current route
   */
  private runExitAnimations(): void {
    if (this.debug) {
      console.log('[AnimationRouter] Running exit animations');
    }
    
    // This is where you would trigger exit animations
    // For example, by setting a state variable or calling a service
    
    // For this example, we'll just wait for the animation duration
    // In a real implementation, you would coordinate with your animation service
  }
  
  /**
   * Complete the navigation after animations finish
   */
  private completeNavigation(url: string, extras: any, resolve: (value: boolean) => void): void {
    if (this.debug) {
      console.log(`[AnimationRouter] Completing navigation to ${url}`);
    }
    
    this.ngZone.run(() => {
      this.router.navigateByUrl(url, extras).then(result => {
        resolve(result);
      });
    });
  }
  
  /**
   * Handle NavigationStart events
   */
  private handleNavigationStart(event: NavigationStart): void {
    if (this.debug) {
      console.log(`[AnimationRouter] Navigation started to ${event.url}`);
    }
    
    // If this is a navigation we didn't initiate, run exit animations
    if (!this.isNavigating) {
      this.isNavigating = true;
      this.runExitAnimations();
      
      // Wait for animations to complete before allowing navigation to continue
      setTimeout(() => {
        this.exitAnimationsComplete.next(true);
      }, this.animationDuration);
    }
  }
  
  /**
   * Set up interception of RouterLink clicks
   */
  private setupRouterLinkInterception(): void {
    this.ngZone.runOutsideAngular(() => {
      this.document.addEventListener('click', (event: MouseEvent) => {
        // Find the closest RouterLink element
        const routerLink = this.findRouterLink(event.target as HTMLElement);
        
        if (routerLink) {
          // Get the URL from the RouterLink
          const url = routerLink.getAttribute('href');
          
          if (url) {
            // Prevent the default navigation
            event.preventDefault();
            
            // Navigate using our service
            this.ngZone.run(() => {
              this.navigateTo(url);
            });
          }
        }
      });
    });
  }
  
  /**
   * Find the closest RouterLink element
   */
  private findRouterLink(element: HTMLElement | null): HTMLElement | null {
    if (!element) return null;
    
    // Check if this element is a RouterLink
    if (
      element.hasAttribute('routerLink') ||
      element.hasAttribute('href') && element.hasAttribute('ng-reflect-router-link')
    ) {
      return element;
    }
    
    // Check parent elements
    return this.findRouterLink(element.parentElement);
  }
} 