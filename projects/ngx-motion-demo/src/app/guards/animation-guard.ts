import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

// Interface for components that can be animated
export interface AnimatedComponent {
  // Optional method to run exit animations
  runExitAnimations?(): Observable<boolean> | Promise<boolean> | boolean;
  // Optional method to get animation duration
  getExitAnimationDuration?(): number;
}

@Injectable({
  providedIn: 'root'
})
export class AnimationGuard implements CanDeactivate<AnimatedComponent> {
  // Default animation duration in milliseconds
  private defaultDuration = 500;
  
  // Debug mode flag
  private debug = false;
  
  /**
   * Enable or disable debug mode
   */
  setDebug(debug: boolean): void {
    this.debug = debug;
  }
  
  /**
   * Set the default animation duration
   */
  setDefaultDuration(durationMs: number): void {
    this.defaultDuration = durationMs;
  }
  
  /**
   * Implementation of CanDeactivate interface
   * Delays navigation until animations complete
   */
  canDeactivate(
    component: AnimatedComponent
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.debug) {
      console.log('[AnimationGuard] Checking if can deactivate component', component);
    }
    
    // If component has a runExitAnimations method, use it
    if (component.runExitAnimations) {
      if (this.debug) {
        console.log('[AnimationGuard] Running exit animations');
      }
      return component.runExitAnimations();
    }
    
    // Otherwise, delay navigation based on animation duration
    const duration = component.getExitAnimationDuration?.() || this.defaultDuration;
    
    if (this.debug) {
      console.log(`[AnimationGuard] Delaying navigation for ${duration}ms`);
    }
    
    return of(true).pipe(
      tap(() => {
        // This is where you would trigger exit animations
        // For example, by setting a state variable in the component
        if (this.debug) {
          console.log('[AnimationGuard] Starting exit animations');
        }
      }),
      delay(duration),
      tap(() => {
        if (this.debug) {
          console.log('[AnimationGuard] Exit animations complete, allowing navigation');
        }
      })
    );
  }
} 