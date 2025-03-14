import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as motion from 'motion';
import type { AnimationOptions, Target } from 'motion';

@Injectable({
  providedIn: 'root'
})
export class MotionAnimationService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Mock implementations for server environment
  private mockAnimate = () => ({ stop: () => {} });
  private mockEasing = { ease: [0, 0, 1, 1] };
  private mockStagger = () => 0;

  // Wrapper for animate function
  animate(target: any, keyframes: any, options?: any): any {
    if (!isPlatformBrowser(this.platformId)) {
      return this.mockAnimate();
    }
    
    try {
      return motion.animate(target, keyframes, options);
    } catch (e) {
      console.error('Error in animate:', e);
      return this.mockAnimate();
    }
  }

  // Wrapper for easing functions
  get easeIn() {
    return isPlatformBrowser(this.platformId) ? motion.easeIn : this.mockEasing;
  }

  get easeOut() {
    return isPlatformBrowser(this.platformId) ? motion.easeOut : this.mockEasing;
  }

  get easeInOut() {
    return isPlatformBrowser(this.platformId) ? motion.easeInOut : this.mockEasing;
  }

  // Wrapper for stagger function
  stagger(duration: number, options?: any): any {
    if (!isPlatformBrowser(this.platformId)) {
      return this.mockStagger();
    }
    
    try {
      return motion.stagger(duration, options);
    } catch (e) {
      console.error('Error in stagger:', e);
      return this.mockStagger();
    }
  }
} 