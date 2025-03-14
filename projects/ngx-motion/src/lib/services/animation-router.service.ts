import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnimationRouterService {
  private animatingSubject = new BehaviorSubject<boolean>(false);
  private maxDelaySubject = new BehaviorSubject<number>(0);
  
  // Debug settings
  private debugMode = true;
  private fallbackTimeout: number | null = null;
  private fallbackTimeoutId: any = null;

  public animating$: Observable<boolean> = this.animatingSubject.asObservable();
  public maxDelay$: Observable<number> = this.maxDelaySubject.asObservable();

  constructor() {}

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
} 