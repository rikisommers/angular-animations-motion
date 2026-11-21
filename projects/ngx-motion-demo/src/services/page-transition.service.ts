import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PageTransitionService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private readonly ANIMATION_DURATION = 2000;
  private isTransitioning = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupRouterListener();
    }
  }

  private setupRouterListener() {
    // Listen for navigation start events
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      if (!this.isTransitioning) {
        this.handleTransition();
      }
    });
  }

  private async handleTransition() {
    if (!isPlatformBrowser(this.platformId) || !document.startViewTransition) {
      return;
    }

    this.isTransitioning = true;

    try {
      await document.startViewTransition(async () => {
        // Let the current navigation complete
        await new Promise(resolve => setTimeout(resolve, 0));

        // Style the transition
        requestAnimationFrame(() => {
          // Handle view transition groups
          const transitionGroups = document.documentElement.getElementsByClassName('view-transition-group');
          Array.from(transitionGroups).forEach((element) => {
            const group = element as HTMLElement;
            group.style.animationDuration = `${this.ANIMATION_DURATION}ms`;
          });

          // Handle old content
          const oldContent = document.documentElement.getElementsByClassName('view-transition-old')[0] as HTMLElement;
          if (oldContent) {
            oldContent.style.animationDuration = `${this.ANIMATION_DURATION}ms`;
            oldContent.style.animationName = 'rotate-out, -ua-view-transition-fade-out';
            oldContent.style.transformOrigin = 'center';
          }
          
          // Handle new content
          const newContent = document.documentElement.getElementsByClassName('view-transition-new')[0] as HTMLElement;
          if (newContent) {
            newContent.style.animationDuration = `${this.ANIMATION_DURATION}ms`;
            newContent.style.animationName = 'rotate-in, -ua-view-transition-fade-in';
            newContent.style.animationDelay = `${this.ANIMATION_DURATION / 2}ms`;
            newContent.style.transformOrigin = 'center';
          }
        });
      }).finished;
    } catch (error) {
      console.error('View transition error:', error);
    } finally {
      this.isTransitioning = false;
    }
  }

  // Public method to manually trigger a transition
  public async transition(callback: () => void | Promise<void>) {
    if (!isPlatformBrowser(this.platformId) || !document.startViewTransition || this.isTransitioning) {
      await callback();
      return;
    }

    this.isTransitioning = true;

    try {
      await document.startViewTransition(async () => {
        await callback();

        requestAnimationFrame(() => {
          // Handle view transition groups
          const transitionGroups = document.documentElement.getElementsByClassName('view-transition-group');
          Array.from(transitionGroups).forEach((element) => {
            const group = element as HTMLElement;
            group.style.animationDuration = `${this.ANIMATION_DURATION}ms`;
          });

          // Handle old content
          const oldContent = document.documentElement.getElementsByClassName('view-transition-old')[0] as HTMLElement;
          if (oldContent) {
            oldContent.style.animationDuration = `${this.ANIMATION_DURATION}ms`;
            oldContent.style.animationName = 'rotate-out, -ua-view-transition-fade-out';
            oldContent.style.transformOrigin = 'center';
          }
          
          // Handle new content
          const newContent = document.documentElement.getElementsByClassName('view-transition-new')[0] as HTMLElement;
          if (newContent) {
            newContent.style.animationDuration = `${this.ANIMATION_DURATION}ms`;
            newContent.style.animationName = 'rotate-in, -ua-view-transition-fade-in';
            newContent.style.animationDelay = `${this.ANIMATION_DURATION / 2}ms`;
            newContent.style.transformOrigin = 'center';
          }
        });
      }).finished;
    } catch (error) {
      console.error('View transition error:', error);
    } finally {
      this.isTransitioning = false;
    }
  }
} 