import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ViewTransitionService {
  private readonly ANIMATION_DURATION = 2000;

  async startViewTransition(updateCallback: () => void) {
    if (!document.startViewTransition) {
      updateCallback();
      return;
    }

    const transition = document.startViewTransition(() => {
      updateCallback();
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          // Style the transition
          const oldContent = document.documentElement.getElementsByClassName('view-transition-old')[0] as HTMLElement;
          const newContent = document.documentElement.getElementsByClassName('view-transition-new')[0] as HTMLElement;
          
          if (oldContent) {
            oldContent.style.animationDuration = `${this.ANIMATION_DURATION}ms`;
            oldContent.style.animationName = 'rotate-out, -ua-view-transition-fade-out';
          }
          
          if (newContent) {
            newContent.style.animationDuration = `${this.ANIMATION_DURATION}ms`;
            newContent.style.animationName = 'rotate-in, -ua-view-transition-fade-in';
            newContent.style.animationDelay = `${this.ANIMATION_DURATION / 2}ms`;
          }
          
          resolve(true);
        });
      });
    });

    return transition.finished;
  }
} 