import {
    Injectable,
    Inject,
    signal,
  } from '@angular/core';
  import { DOCUMENT } from '@angular/common';
  import { fromEvent, Subscription } from 'rxjs';
  import { throttleTime, debounceTime } from 'rxjs/operators';
  import { Router } from '@angular/router';
  
  // Define the interface for motion elements
  export interface MotionElement {
    elementId: string;
    getDuration(): number;
    runInitAnimation(): void;
    runExitAnimation(): void;
    cancel(): void;
  }
  
  @Injectable({
    providedIn: 'root',
  })
  export class MotionOneService {
    private scrollSubscription: Subscription;
    private motionElements: MotionElement[] = [];
    scrollYProgress = signal(0);
    totalExitDuration: number = 0;
  
    constructor(
      private router: Router,
      @Inject(DOCUMENT) private document: Document,
    ) {
      this.setupScrollListener();
      this.scrollSubscription = new Subscription();
    }
  
    ngOnDestroy() {
      if (this.scrollSubscription) {
        this.scrollSubscription.unsubscribe();
      }
    }
  
    private updateTotalExitDuration() {
      this.totalExitDuration = this.motionElements.reduce((total, element) => {
        return total + element.getDuration();
      }, 0);
    }
  
    private setupScrollListener() {
      if (typeof window !== 'undefined') {
        this.scrollSubscription = fromEvent(window, 'scroll')
          .pipe(
            throttleTime(16), // Limit to about 60fps
            debounceTime(1), // Wait for scroll to settle
          )
          .subscribe(() => {
            this.updateScrollProgress();
          });
        this.updateScrollProgress();
      }
    }
  
    private updateScrollProgress() {
      const doc = this.document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const progress =
        scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
      this.scrollYProgress.set(progress);
    }
  
    registerMotionElement(element: MotionElement) {
      this.motionElements.push(element);
      this.updateTotalExitDuration();
    }
  
    unregisterMotionElement(element: MotionElement) {
      this.motionElements = this.motionElements.filter((e) => e !== element);
      this.updateTotalExitDuration();
    }
  
    getMotionElements(): MotionElement[] {
      return this.motionElements;
    }
  
    getAllElementsByRoute(route: string): MotionElement[] {
      return this.motionElements;
    }
  
    cancelAllAnimations() {
      this.motionElements.forEach((motion) => {
        motion.cancel();
      });
    }
  
    runAllEnterAnimations(): void {
      this.motionElements.forEach((motion) => {
        motion.runInitAnimation();
      });
    }
  
    runAllExitAnimations(): void {
      // Proceed with the exit animations
      this.motionElements.forEach((motion) => {
        motion.runExitAnimation();
      });
    }
  
    runAllEnterAnimationsForRoute(route: string): MotionElement[] {
      const enterAnimations = this.getAllElementsByRoute(route).map((motion) => {
        motion.runInitAnimation();
        return motion;
      });
      return enterAnimations;
    }
    
    getLongestExitDuration(): number {
      const durations = this.motionElements.map((motion) => motion.getDuration());
      return durations.length > 0 ? Math.max(...durations) : 0;
    }
  
    getLongestEnterDuration(): number {
      const durations = this.motionElements.map((motion) => motion.getDuration());
      return durations.length > 0 ? Math.max(...durations) : 0;
    }
  
    getLongestDurationForRoute(): number {
      const route = this.router.url;
      const elements = this.getAllElementsByRoute(route);
      const durations = elements.map((motion) => motion.getDuration());
      return durations.length > 0 ? Math.max(...durations) : 0;
    }
  }
  