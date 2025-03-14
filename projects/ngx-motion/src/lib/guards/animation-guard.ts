import { Injectable } from '@angular/core';
import { CanDeactivate, UrlTree } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mapTo } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnimationGuard implements CanDeactivate<any> {
  // Fixed delay of 2 seconds
  private readonly FIXED_DELAY = 2000;

  canDeactivate(): Observable<boolean | UrlTree> {
    console.log(`Animation guard: Delaying navigation for ${this.FIXED_DELAY}ms`);
    
    // Simple fixed delay
    return timer(this.FIXED_DELAY).pipe(
      mapTo(true)
    );
  }
} 