import {
    Injectable,
    Inject,
    signal,
    PLATFORM_ID
  } from '@angular/core';
  import { DOCUMENT, isPlatformBrowser } from '@angular/common';
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
      @Inject(PLATFORM_ID) private platformId: Object
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
      if (!isPlatformBrowser(this.platformId)) return;
      
      this.totalExitDuration = this.motionElements.reduce((total, element) => {
        return total + element.getDuration();
      }, 0);
    }
  
    private setupScrollListener() {
      if (!isPlatformBrowser(this.platformId)) return;
      
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
  
    private updateScrollProgress() {
      if (!isPlatformBrowser(this.platformId)) return;
      
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
      if (!isPlatformBrowser(this.platformId)) return;
      
      this.motionElements.forEach((motion) => {
        motion.cancel();
      });
    }
  
    runAllEnterAnimations(): void {
      if (!isPlatformBrowser(this.platformId)) return;
      
      this.motionElements.forEach((motion) => {
        motion.runInitAnimation();
      });
    }
  
    runAllExitAnimations(): void {
      if (!isPlatformBrowser(this.platformId)) return;
      
      // Proceed with the exit animations
      this.motionElements.forEach((motion) => {
        motion.runExitAnimation();
      });
    }
  
    runAllEnterAnimationsForRoute(route: string): MotionElement[] {
      if (!isPlatformBrowser(this.platformId)) return [];
      
      const enterAnimations = this.getAllElementsByRoute(route).map((motion) => {
        motion.runInitAnimation();
        return motion;
      });
      return enterAnimations;
    }
    
    getLongestExitDurationForRoute(route: string): number {
      if (!isPlatformBrowser(this.platformId)) return 0;
      
      console.log(`[MotionOneService] LEDFR: ${this.motionElements.length} elements for route ${route}`);
      
      if (this.motionElements.length === 0) {
        console.log('[MotionOneService] No motion elements registered');
        return 0;
      }
      
      const durations = this.getAllElementsByRoute(route).map((motion) => {
        const duration = motion.getDuration();
       console.log(`[MotionOneService] LEDFR Duration: ${duration}`);
       return duration;
      });
      
      const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
      //console.log(`[MotionOneService] Longest exit duration: ${maxDuration}`);
      return maxDuration;
    }

   
  
    getLongestEnterDuration(): number {
      if (!isPlatformBrowser(this.platformId)) return 0;
      
      //console.log(`[MotionOneService] Getting longest enter duration from ${this.motionElements.length} elements`);
      
      if (this.motionElements.length === 0) {
        //console.log('[MotionOneService] No motion elements registered');
        return 0;
      }
      
      const durations = this.motionElements.map((motion) => {
        const duration = motion.getDuration();
       // console.log(`[MotionOneService] Element ${motion.elementId} has duration: ${duration}`);
        return duration;
      });
      
      const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
      console.log(`[MotionOneService] Longest enter duration: ${maxDuration}`);
      return maxDuration;
    }
  
   
  }
  