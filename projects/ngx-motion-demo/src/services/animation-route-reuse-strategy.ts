import { Injectable } from '@angular/core';
import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { AnimationRouterService } from './animation-router.service';

@Injectable()
export class AnimationRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();
  
  constructor(private animationRouter: AnimationRouterService) {}

  // Whether the route should be stored for later reuse
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Store all routes for potential reuse
    return true;
  }

  // Store the route
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const id = this.getRouteId(route);
    if (id && handle) {
      this.storedRoutes.set(id, handle);
    }
  }

  // Whether the route should be retrieved from storage
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const id = this.getRouteId(route);
    return !!id && !!this.storedRoutes.has(id);
  }

  // Retrieve the stored route
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const id = this.getRouteId(route);
    if (!id) return null;
    return this.storedRoutes.get(id) || null;
  }

  // Whether the same route should be reused
  // This is where we can delay component destruction during animations
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // If animations are running, keep the current route
    if (this.animationRouter.isAnimating()) {
      return true;
    }
    
    // Default Angular behavior - reuse if the route config is the same
    return future.routeConfig === curr.routeConfig;
  }

  // Helper to get a unique ID for a route
  private getRouteId(route: ActivatedRouteSnapshot): string | null {
    if (!route.routeConfig) return null;
    
    // Create a path-based ID
    const path = route.routeConfig.path || '';
    
    // Add any route params to make the ID more specific
    const paramKeys = Object.keys(route.params || {});
    const params = paramKeys.map(key => `${key}=${route.params[key]}`).join('&');
    
    return path + (params ? `?${params}` : '');
  }
} 