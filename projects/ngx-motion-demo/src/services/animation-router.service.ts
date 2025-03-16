import { Injectable, OnDestroy, PLATFORM_ID, ApplicationRef } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, fromEvent } from 'rxjs';
import { Router, NavigationStart, NavigationEnd, Event as RouterEvent, NavigationCancel, UrlTree, NavigationError } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { MotionOneService } from './motion-one.service';
import { inject } from '@angular/core';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnimationRouterService implements OnDestroy {
  private animatingSubject = new BehaviorSubject<boolean>(false);
  private maxDelaySubject = new BehaviorSubject<number>(0);
  
  // Debug settings
  private debugMode = true;
  private fallbackTimeout: number | null = null;
  private fallbackTimeoutId: any = null;

  // Route transition handling
  private routerSubscription = new Subscription();
  private clickSubscription = new Subscription();
  private currentRoute: string | null = null;
  private previousRoute: string | null = null;
  private isNavigating = false;
  private pendingNavigation: string | null = null;
  private pendingUrlTree: UrlTree | null = null;
  private originalNavigateByUrl: any;
  private originalNavigate: any;

  // Inject dependencies
  private router = inject(Router);
  private motionService = inject(MotionOneService);
  private platformId = inject(PLATFORM_ID);
  private appRef = inject(ApplicationRef);

  public animating$: Observable<boolean> = this.animatingSubject.asObservable();
  public maxDelay$: Observable<number> = this.maxDelaySubject.asObservable();

  constructor() {
    console.log('AnimationRouterService: Initializing');
    this.overrideRouterMethods();
    this.initRouteListener();
    this.initLinkClickListener();
  }

  private overrideRouterMethods(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Store the original navigateByUrl method
    this.originalNavigateByUrl = this.router.navigateByUrl;
    this.originalNavigate = this.router.navigate;

    // Override the navigateByUrl method
    (this.router as any).navigateByUrl = (url: string | UrlTree, extras?: any) => {
      if (this.debugMode) {
        console.log(`AnimationRouterService: Router.navigateByUrl intercepted to ${typeof url === 'string' ? url : 'UrlTree'}`);
      }

      // If we're already handling a navigation, use the original method
      if (this.isNavigating && this.pendingNavigation) {
        if (this.debugMode) {
          console.log(`AnimationRouterService: Allowing pending navigation to proceed`);
        }
        return this.originalNavigateByUrl.call(this.router, url, extras);
      }

      // Otherwise, handle the navigation with our animation logic
      const urlString = typeof url === 'string' ? url : this.router.serializeUrl(url);
      
      // Don't intercept navigation to the current URL
      if (urlString === this.router.url) {
        return this.originalNavigateByUrl.call(this.router, url, extras);
      }

      // Handle the navigation with our animation logic
      this.handleNavigation(urlString);
      
      // Return a promise that resolves when the navigation is complete
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 0);
      });
    };

    // Override the navigate method
    (this.router as any).navigate = (commands: any[], extras?: any) => {
      if (this.debugMode) {
        console.log(`AnimationRouterService: Router.navigate intercepted`);
      }

      // If we're already handling a navigation, use the original method
      if (this.isNavigating && this.pendingNavigation) {
        if (this.debugMode) {
          console.log(`AnimationRouterService: Allowing pending navigation to proceed`);
        }
        return this.originalNavigate.call(this.router, commands, extras);
      }

      // Create a URL tree from the commands
      const urlTree = this.router.createUrlTree(commands, extras);
      const urlString = this.router.serializeUrl(urlTree);
      
      // Don't intercept navigation to the current URL
      if (urlString === this.router.url) {
        return this.originalNavigate.call(this.router, commands, extras);
      }

      // Handle the navigation with our animation logic
      this.handleNavigation(urlString);
      
      // Return a promise that resolves when the navigation is complete
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 0);
      });
    };
  }

  private initRouteListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.routerSubscription = this.router.events.subscribe((event: RouterEvent) => {
      // When navigation starts
      if (event instanceof NavigationStart) {
        console.log(`AnimationRouterService: NavigationStart event to ${event.url}`);
        
        // Skip if we're already handling a navigation or if this is our own navigation
        if (this.isNavigating && this.pendingNavigation === event.url) {
          console.log(`AnimationRouterService: Skipping NavigationStart as we're already handling it`);
          return;
        }

        this.previousRoute = this.router.url;
        this.currentRoute = event.url;
        
        if (this.debugMode) {
          console.log(`AnimationRouterService: Navigation from ${this.previousRoute} to ${this.currentRoute}`);
        }
        
        // If we're not already navigating, start the animation process
        if (!this.isNavigating) {
          console.log(`AnimationRouterService: Starting animation process for NavigationStart`);
          
          // Immediately run exit animations for all elements on the current route
          this.runExitAnimations();
          
          // Then handle the navigation with delay
          this.handleNavigation(this.currentRoute);
        }
      }
      
      // When navigation ends
      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        console.log(`AnimationRouterService: Navigation end/cancel/error event`);
        
        if (!this.pendingNavigation) {
          this.currentRoute = this.router.url;
          
          if (this.debugMode) {
            console.log(`AnimationRouterService: Navigation complete to: ${this.currentRoute}`);
          }
          
          this.isNavigating = false;
          this.completeAnimation();
        }
      }
    });
  }

  // Run exit animations for all elements on the current route
  private runExitAnimations(): void {
    console.log(`AnimationRouterService: Running exit animations for current route: ${this.router.url}`);
    this.motionService.runAllExitAnimations();
  }

  private initLinkClickListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Listen for clicks on the document with capture phase
    const options = { capture: true };
    this.clickSubscription = fromEvent<MouseEvent>(document, 'click', options).subscribe((event: MouseEvent) => {
      // Find the closest anchor element
      let target = event.target as HTMLElement;
      let anchor: HTMLAnchorElement | null = null;
      
      // Traverse up to find the anchor
      while (target && target !== document.body) {
        if (target.tagName === 'A') {
          anchor = target as HTMLAnchorElement;
          break;
        }
        if (target.tagName === 'BUTTON' && target.hasAttribute('ng-reflect-router-link')) {
          // Handle button with routerLink
          console.log(`AnimationRouterService: Found button with routerLink`);
          const routerLink = target.getAttribute('ng-reflect-router-link');
          if (routerLink) {
            event.preventDefault();
            event.stopPropagation();
            
            // Immediately run exit animations
            this.runExitAnimations();
            
            // Then handle navigation with delay
            this.handleNavigation(routerLink.replace(/['"]/g, ''));
            return;
          }
        }
        target = target.parentElement as HTMLElement;
      }
      
      // If we found an anchor with a routerLink
      if (anchor) {
        console.log(`AnimationRouterService: Found anchor element`, anchor);
        
        // Check if it has routerLink
        const hasRouterLink = anchor.hasAttribute('routerLink') || 
                             anchor.hasAttribute('ng-reflect-router-link') ||
                             anchor.getAttribute('href')?.startsWith('/');
        
        // Skip external links
        const isExternal = anchor.getAttribute('href')?.startsWith('http') || 
                          anchor.getAttribute('target') === '_blank';
        
        if (hasRouterLink && !isExternal) {
          // Get the URL from the href attribute
          const href = anchor.getAttribute('href');
          
          if (href && href !== this.router.url) {
            // Prevent the default navigation
            event.preventDefault();
            event.stopPropagation();
            
            if (this.debugMode) {
              console.log(`AnimationRouterService: Intercepted RouterLink click to ${href}`);
            }
            
            // Immediately run exit animations
            this.runExitAnimations();
            
            // Then handle navigation with delay
            this.handleNavigation(href);
          }
        }
      }
    });
  }

  private handleNavigation(targetUrl: string): void {
    console.log(`AnimationRouterService: Handling navigation to ${targetUrl}`);
    
    this.isNavigating = true;
    this.startAnimation();
    
    // Get the longest exit animation duration - hardcoded for testing
    const longestDuration = 1000;
    this.setMaxDelay(longestDuration);
    
    if (this.debugMode) {
      console.log(`AnimationRouterService: Longest exit animation duration: ${longestDuration}ms`);
    }
    
    // Store the pending navigation URL
    this.pendingNavigation = targetUrl;
    this.pendingUrlTree = this.router.parseUrl(targetUrl);
    
    // If there are exit animations, delay the navigation
    if (longestDuration > 0) {
      console.log(`AnimationRouterService: Delaying navigation for ${longestDuration}ms`);
      
      // Wait for animations to complete, then navigate
      setTimeout(() => {
        if (this.debugMode) {
          console.log(`AnimationRouterService: Exit animations complete, navigating to ${this.pendingNavigation}`);
        }
        
        if (this.pendingNavigation) {
          console.log(`AnimationRouterService: Executing delayed navigation to ${this.pendingNavigation}`);
          this.originalNavigateByUrl.call(this.router, this.pendingNavigation);
          this.pendingNavigation = null;
          this.pendingUrlTree = null;
        }
        
        this.isNavigating = false;
        this.completeAnimation();
      }, longestDuration);
    } else {
      // No animations, complete immediately
      if (this.pendingNavigation) {
        this.originalNavigateByUrl.call(this.router, this.pendingNavigation);
        this.pendingNavigation = null;
        this.pendingUrlTree = null;
      }
      
      this.isNavigating = false;
      this.completeAnimation();
    }
  }

  // Check if a navigation is already pending to the given URL
  public isNavigatingTo(url: string): boolean {
    return this.isNavigating && this.pendingNavigation === url;
  }

  public startAnimation(): void {
    if (this.debugMode) {
      console.log('AnimationRouterService: Starting animation');
    }
    
    this.animatingSubject.next(true);
    
    // Set a fallback timeout if configured
    if (this.fallbackTimeout !== null) {
      // Clear any existing timeout
      if (this.fallbackTimeoutId) {
        clearTimeout(this.fallbackTimeoutId);
      }
      
      // Set a new timeout
      this.fallbackTimeoutId = setTimeout(() => {
        if (this.isAnimating()) {
          console.warn(`AnimationRouterService: Fallback timeout (${this.fallbackTimeout}ms) reached, forcing animation completion`);
          this.completeAnimation();
          
          // If there's a pending navigation, execute it
          if (this.pendingNavigation) {
            console.log(`AnimationRouterService: Executing fallback navigation to ${this.pendingNavigation}`);
            this.originalNavigateByUrl.call(this.router, this.pendingNavigation);
            this.pendingNavigation = null;
            this.pendingUrlTree = null;
          }
          
          this.isNavigating = false;
        }
      }, this.fallbackTimeout);
    }
  }

  public completeAnimation(): void {
    if (this.debugMode) {
      console.log('AnimationRouterService: Completing animation');
    }
    
    this.animatingSubject.next(false);
    
    // Clear any fallback timeout
    if (this.fallbackTimeoutId) {
      clearTimeout(this.fallbackTimeoutId);
      this.fallbackTimeoutId = null;
    }
  }

  public isAnimating(): boolean {
    return this.animatingSubject.value;
  }

  public setMaxDelay(delay: number): void {
    if (this.debugMode) {
      console.log(`AnimationRouterService: Setting max delay to ${delay}ms`);
    }
    this.maxDelaySubject.next(delay);
  }

  public getMaxDelay(): number {
    return this.maxDelaySubject.value;
  }
  
  // Debug configuration methods
  public enableDebug(enable: boolean = true): void {
    this.debugMode = enable;
  }
  
  public setFallbackTimeout(timeout: number | null): void {
    this.fallbackTimeout = timeout;
    if (this.debugMode) {
      if (timeout === null) {
        console.log('AnimationRouterService: Fallback timeout disabled');
      } else {
        console.log(`AnimationRouterService: Fallback timeout set to ${timeout}ms`);
      }
    }
  }
  
  // Method to manually navigate with animations
  public navigateTo(url: string): void {
    if (this.isNavigating) {
      if (this.debugMode) {
        console.log(`AnimationRouterService: Already navigating, ignoring request to ${url}`);
      }
      return;
    }
    
    // Immediately run exit animations
    this.runExitAnimations();
    
    // Then handle navigation with delay
    this.handleNavigation(url);
  }
  
  ngOnDestroy(): void {
    // Restore original router methods
    if (this.originalNavigateByUrl) {
      (this.router as any).navigateByUrl = this.originalNavigateByUrl;
    }
    if (this.originalNavigate) {
      (this.router as any).navigate = this.originalNavigate;
    }
    
    this.routerSubscription.unsubscribe();
    this.clickSubscription.unsubscribe();
    
    // Clear any fallback timeout
    if (this.fallbackTimeoutId) {
      clearTimeout(this.fallbackTimeoutId);
      this.fallbackTimeoutId = null;
    }
  }
}