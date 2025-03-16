import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { Injectable } from '@angular/core';
import { MotionOneService } from './motion-one.service';

/**
 * Custom RouteReuseStrategy that keeps the previous component alive during navigation
 * to allow for exit animations to complete.
 */
@Injectable()
export class AnimationRouteReuseStrategy implements RouteReuseStrategy {
  // Store detached routes
  private storedRoutes = new Map<string, DetachedRouteHandle>();
  
  // Track the current route that's being animated out
  private currentAnimatingRoute: string | null = null;
  
  // Flag to indicate if we're in the middle of a navigation
  private isNavigating = false;
  
  // Default animation duration in milliseconds
  private defaultAnimationDuration = 1000;
  
  // Debug mode
  private debug = true;
  
  constructor(private motionService: MotionOneService) {}
  
  /**
   * Whether the route should be detached for later reuse
   */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Only detach routes that have exit animations
    const shouldDetach = this.hasExitAnimation(route);
    if (this.debug) {
      console.log(`[AnimationRouteStrategy] shouldDetach: ${shouldDetach} for route: ${this.getPath(route)}`);
    }
    return shouldDetach;
  }
  
  /**
   * Store the detached route
   */
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const routeId = this.getRouteId(route);
    if (routeId) {
      if (this.debug) {
        console.log(`[AnimationRouteStrategy] Storing route: ${routeId}`);
      }
      this.storedRoutes.set(routeId, handle);
      this.currentAnimatingRoute = routeId;
    }
  }
  
  /**
   * Whether the route should be reattached
   */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const routeId = this.getRouteId(route);
    // Only reattach if we have the route stored and it's not the one being animated out
    const shouldAttach = !!routeId && this.storedRoutes.has(routeId) && routeId !== this.currentAnimatingRoute;
    if (this.debug) {
      console.log(`[AnimationRouteStrategy] shouldAttach: ${shouldAttach} for route: ${routeId}`);
    }
    return shouldAttach;
  }
  
  /**
   * Retrieve the stored route
   */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const routeId = this.getRouteId(route);
    if (!routeId) return null;
    
    const handle = this.storedRoutes.get(routeId) || null;
    if (this.debug) {
      console.log(`[AnimationRouteStrategy] Retrieving route: ${routeId}, found: ${!!handle}`);
    }
    return handle;
  }
  
  /**
   * Whether the route should be reused
   * This is the key method for animation purposes
   */
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const futurePath = this.getPath(future);
    const currentPath = this.getPath(curr);
    
    // If we're navigating and the paths are different, we want to keep both components
    // alive temporarily to allow for exit animations
    if (futurePath !== currentPath) {
      this.isNavigating = true;
      
      if (this.debug) {
        console.log(`[AnimationRouteStrategy] Navigation from ${currentPath} to ${futurePath}`);
      }
      
      // Get the exit duration for the current route
      const exitDuration = this.getExitDuration(curr);
      
      if (this.debug) {
        console.log(`[AnimationRouteStrategy] Exit duration: ${exitDuration}ms`);
      }
      
      // Set a timeout to clear the animating route after animations complete
      setTimeout(() => {
        if (this.currentAnimatingRoute) {
          if (this.debug) {
            console.log(`[AnimationRouteStrategy] Clearing animated route: ${this.currentAnimatingRoute}`);
          }
          this.storedRoutes.delete(this.currentAnimatingRoute);
          this.currentAnimatingRoute = null;
        }
        this.isNavigating = false;
      }, exitDuration);
      
      return false;
    }
    
    // Default Angular behavior - reuse if the route config is the same
    return future.routeConfig === curr.routeConfig;
  }
  
  /**
   * Get a unique ID for the route
   */
  private getRouteId(route: ActivatedRouteSnapshot): string | null {
    const path = this.getPath(route);
    return path ? path : null;
  }
  
  /**
   * Get the path for the route
   */
  private getPath(route: ActivatedRouteSnapshot): string {
    if (route.routeConfig && route.routeConfig.path) {
      return route.routeConfig.path;
    }
    return '';
  }
  
  /**
   * Check if the route has components with exit animations
   */
  private hasExitAnimation(route: ActivatedRouteSnapshot): boolean {
    // In a real implementation, you would check if the component has exit animations
    // For this example, we'll assume all routes have exit animations
    return true;
  }
  
  /**
   * Get the exit duration for a route
   */
  private getExitDuration(route: ActivatedRouteSnapshot): number {
    try {
      // Try to get the exit duration from the MotionOneService
      const routePath = this.getPath(route);
      const exitDuration = this.motionService.getLongestExitDurationForRoute(routePath);
      
      // Convert to milliseconds and ensure a minimum duration
      return Math.max(exitDuration * 1000, this.defaultAnimationDuration);
    } catch (error) {
      console.error('[AnimationRouteStrategy] Error getting exit duration:', error);
      return this.defaultAnimationDuration;
    }
  }
  
  /**
   * Set the animation duration for the strategy
   */
  setAnimationDuration(durationMs: number): void {
    this.defaultAnimationDuration = durationMs;
  }
  
  /**
   * Enable or disable debug mode
   */
  setDebug(debug: boolean): void {
    this.debug = debug;
  }
}