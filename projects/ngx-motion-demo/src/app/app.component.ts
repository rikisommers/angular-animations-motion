import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList, ContentChildren } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MotionOneDirective, MotionOnePresenceComponent } from 'ngx-motion';
import { AnimationRouterService } from '../../../ngx-motion/src/lib/services/animation-router.service';
import { AnimationDebugComponent } from '../../../ngx-motion/src/lib/debug/animation-debug.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MotionOnePresenceComponent,
    AnimationDebugComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent implements AfterViewInit {
  title = 'ngx-motion-demo';
  private clickInterceptionEnabled = true;

  constructor(
    private el: ElementRef,
    private router: Router,
    private animationRouter: AnimationRouterService
  ) {
    console.log('App component initialized');
  }

  ngAfterViewInit() {
    // Add a click listener to intercept navigation
    this.el.nativeElement.addEventListener('click', (event: MouseEvent) => {
      // Skip if interception is disabled
      if (!this.clickInterceptionEnabled) return;
      
      // Check if the click was on a router link
      let target = event.target as HTMLElement;
      
      // Traverse up to find the closest router link
      while (target && !target.hasAttribute('routerLink') && target !== this.el.nativeElement) {
        target = target.parentElement as HTMLElement;
      }
      
      // If we found a router link
      if (target && target.hasAttribute('routerLink')) {
        // Prevent the default navigation
        event.preventDefault();
        
        // Get the target URL
        const routerLink = target.getAttribute('routerLink');
        if (!routerLink) return;
        
        // Convert to absolute URL if it's an array
        let targetUrl = routerLink;
        if (routerLink.startsWith('[') && routerLink.endsWith(']')) {
          try {
            const routeArray = JSON.parse(routerLink);
            targetUrl = routeArray.join('/');
            if (!targetUrl.startsWith('/')) {
              targetUrl = '/' + targetUrl;
            }
          } catch (e) {
            console.error('Failed to parse routerLink:', routerLink);
            return;
          }
        }
        
        console.log('Intercepted navigation to:', targetUrl);
        
        // Try to access the presence component
        const presenceComponent = (window as any).__motionPresenceComponent;
        if (presenceComponent && typeof presenceComponent.triggerExitAnimations === 'function') {
          console.log('Found presence component, triggering exit animations');
          
          // Start the animation process
          this.animationRouter.startAnimation();
          
          // Trigger exit animations and navigate when complete
          presenceComponent.triggerExitAnimations().then(() => {
            console.log('Exit animations complete, navigating to:', targetUrl);
            this.animationRouter.completeAnimation();
            this.router.navigateByUrl(targetUrl);
          });
        } else {
          // Fallback to direct element access
          this.forceExitAnimations(document.querySelectorAll('[motionone]'), targetUrl);
        }
      }
    });
  }

  private forceExitAnimations(elements: NodeListOf<Element>, targetUrl: string) {
    // Create an array to store all animation promises
    const promises: Promise<void>[] = [];
    let animationsStarted = 0;
    
    // Start the animation process
    this.animationRouter.startAnimation();
    
    // Process each element with the motionone directive
    elements.forEach((el: Element, index) => {
      // Try to access the directive instance
      try {
        // Force trigger exit animation
        console.log(`Forcing exit animation on element ${index + 1}/${elements.length}`);
        
        // Method 1: Try to access the directive through __ngContext__
        const directive = this.getDirectiveFromElement(el);
        
        if (directive) {
          console.log('Found directive, running exit animation');
          animationsStarted++;
          
          // Run the exit animation and add its promise to our array
          promises.push(
            directive.runExitAnimation().then(() => {
              console.log(`Exit animation completed for element ${index + 1}`);
            })
          );
        } else {
          console.log(`Could not find directive for element ${index + 1}`);
          
          // Method 2: Manually trigger animation using Motion One
          // This is a fallback if we can't access the directive
          if (el.hasAttribute('exit')) {
            console.log('Element has exit attribute, manually applying exit styles');
            
            // Get exit styles from attribute
            const exitAttr = el.getAttribute('exit');
            if (exitAttr) {
              try {
                const exitStyles = JSON.parse(exitAttr);
                Object.assign((el as HTMLElement).style, exitStyles);
              } catch (e) {
                console.error('Failed to parse exit styles:', exitAttr);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error triggering exit animation for element ${index + 1}:`, error);
      }
    });
    
    console.log(`Started ${animationsStarted} exit animations`);
    
    // If we didn't start any animations, navigate immediately
    if (animationsStarted === 0) {
      console.log('No exit animations were started, navigating immediately');
      this.animationRouter.completeAnimation();
      this.router.navigateByUrl(targetUrl);
      return;
    }
    
    // When all animations complete, navigate
    Promise.all(promises)
      .then(() => {
        console.log('All exit animations complete, navigating to:', targetUrl);
        
        // Add a small delay to ensure animations are visually complete
        setTimeout(() => {
          this.animationRouter.completeAnimation();
          this.router.navigateByUrl(targetUrl);
        }, 50);
      })
      .catch(error => {
        console.error('Error running exit animations:', error);
        this.animationRouter.completeAnimation();
        this.router.navigateByUrl(targetUrl);
      });
  }

  private getDirectiveFromElement(el: Element): any {
    // Try different methods to access the directive instance
    
    // Method 1: Direct property access
    if ((el as any)._motionDirective) {
      return (el as any)._motionDirective;
    }
    
    // Method 2: Through __ngContext__
    if ((el as any).__ngContext__) {
      const context = (el as any).__ngContext__;
      
      // Find the MotionOneDirective in the context
      if (Array.isArray(context)) {
        const directive = context.find(
          (item: any) => item && 
            (item.constructor?.name === 'MotionOneDirective' || 
             (item.runExitAnimation && typeof item.runExitAnimation === 'function'))
        );
        
        if (directive) {
          return directive;
        }
      }
    }
    
    // Method 3: Look for a property that might contain the directive
    for (const key in el) {
      if (key.includes('motionone') || key.includes('Motion')) {
        const prop = (el as any)[key];
        if (prop && typeof prop.runExitAnimation === 'function') {
          return prop;
        }
      }
    }
    
    // Method 4: Last resort - dispatch a custom event that the directive might listen to
    const exitEvent = new CustomEvent('motionExit', { bubbles: true });
    el.dispatchEvent(exitEvent);
    
    return null;
  }
  
  // Public method to enable/disable click interception
  public setClickInterception(enabled: boolean) {
    this.clickInterceptionEnabled = enabled;
  }
}
