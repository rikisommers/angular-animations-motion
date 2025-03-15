import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { Injectable } from '@angular/core';

@Injectable()
export class AnimationRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();
  private animatingRoutes = new Set<string>();

  // Mark a route as animating out
  markRouteAsAnimating(path: string): void {
    console.log('Marking route as animating:', path);
    this.animatingRoutes.add(path);

    // Ensure animation cleanup
    setTimeout(() => {
      this.clearAnimatingRoute(path);
    }, 1000); // Adjust duration based on your animation time
  }

  clearAnimatingRoute(path: string): void {
    console.log('Clearing animating route:', path);
    this.animatingRoutes.delete(path);
    this.storedRoutes.delete(path); // Remove route after animation completes
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getPath(route);
    console.log('shouldDetach:', path, this.animatingRoutes.has(path));
    return true; // Always detach to enable reuse
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const path = this.getPath(route);
    console.log('Storing route:', path);
    this.storedRoutes.set(path, handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getPath(route);
    console.log('shouldAttach:', path, this.storedRoutes.has(path));
    return this.storedRoutes.has(path);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const path = this.getPath(route);
    console.log('Retrieving route:', path);
    return this.storedRoutes.get(path) || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private getPath(route: ActivatedRouteSnapshot): string {
    return route.pathFromRoot.map(r => r.url.join('/')).join('/');
  }
}
