import { Injectable } from '@angular/core';
import { CanDeactivate, UrlTree, Router } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mapTo } from 'rxjs/operators';
import { MotionOneService } from '../services/ngx-motion-one.service';

@Injectable({
  providedIn: 'root'
})
export class AnimationGuard implements CanDeactivate<any> {
  // Minimum delay as fallback
  private readonly MIN_DELAY = 0;

  constructor(
    private motionService: MotionOneService,
    private router: Router
  ) {}

  canDeactivate(): Observable<boolean | UrlTree> {
    // Get the current route
    const currentRoute = this.router.url;
    
    // Get the exit duration from the MotionService
    const exitDuration = this.motionService.getLongestExitDurationForRoute(currentRoute);
    
    // Use the exit duration or the minimum delay if it's too small
    const delay = Math.max(exitDuration, this.MIN_DELAY);
    
    console.log(`Animation guard: Delaying navigation for ${delay}ms based on exit animations`);
    
    // Run exit animations
    this.motionService.runAllExitAnimations();
    
    // Delay navigation by the calculated duration
    return timer(delay).pipe(
      mapTo(true)
    );
  }
} 