import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Renderer2, Input } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AnimationRouterService } from '../services/animation-router.service';
import { MotionOneService } from '../services/motion-one.service';
import { NgIf } from '@angular/common';
export type AnimationMode = 'wait' | 'sync';

/**
 * A component that wraps the router outlet and handles animation timing
 * for all child elements. Supports two modes:
 * - wait: Delays entry animations until exit animations complete (default)
 * - sync: Allows exit and entry animations to run simultaneously
 */
@Component({
  selector: 'animation-router-outlet',
  standalone: true,
  imports: [RouterOutlet, NgIf],
  template: `
    <div class="animation-router-container" [class.sync-mode]="mode === 'sync'">
      <!-- Container for the exiting view when in sync mode -->
      <div 
        *ngIf="mode === 'sync'" 
        #exitingView 
        class="router-view exiting-view" 
        [style.display]="previousComponent ? 'block' : 'none'"
      >
      <h1>Fuck</h1>
        <ng-container #exitingContainer></ng-container>
      </div>
      
      <!-- Main router outlet container -->
      <div [class]="mode === 'sync' ? 'router-view entering-view' : ''">
      <h1 class="text-white">Fuckddd</h1>
        <router-outlet 
          (activate)="onActivate($event)" 
          (deactivate)="onDeactivate($event)"
        ></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .animation-router-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .animation-router-container.sync-mode {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      overflow: visible;
    }

    .router-view {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .sync-mode .router-view {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .sync-mode .exiting-view {
      opacity: 1;
      transform: none;
    }

    .sync-mode .entering-view {
      opacity: 1;
      transform: none;
    }
  `]
})
export class AnimationRouterOutletComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(RouterOutlet) routerOutlet!: RouterOutlet;
  @ViewChild('exitingContainer', { static: false }) exitingContainer?: ElementRef;
  @ViewChild('exitingView') exitingView?: ElementRef;
  
  @Input() mode: AnimationMode = 'sync';
  
  private subscription = new Subscription();
  private currentComponent: any = null;
  previousComponent: any = null;
  private isAnimating = false;
  private currentRoute: string = '';
  private exitingRoute: string = '';
  
  // Track all motion elements in the current view
  private currentMotionElements: HTMLElement[] = [];
  private exitingMotionElements: HTMLElement[] = [];
  
  constructor(
    private animationRouterService: AnimationRouterService,
    private motionService: MotionOneService,
    private renderer: Renderer2,
    private el: ElementRef,
    private router: Router
  ) {
    this.currentRoute = this.router.url;
  }
  
  ngOnInit(): void {
    console.log('[AnimationRouterOutlet] Current mode:', this.mode);
    
    this.subscription.add(
      this.animationRouterService.animating$.subscribe(isAnimating => {
        this.isAnimating = isAnimating;
        
        if (this.mode === 'wait') {
          if (!isAnimating) {
            this.showEnteringElements();
          }
        } else {
          if (!isAnimating) {
            this.cleanupExitingView();
          }
        }
      })
    );
    
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event.constructor.name === 'NavigationEnd') {
          this.currentRoute = this.router.url;
        }
      })
    );
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.findAndPrepareMotionElements();
    }, 0);
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  onActivate(component: any): void {
   // console.log('[AnimationRouterOutlet] Component activated:', component);
    
    // if (this.mode === 'sync' && this.currentComponent) {
    //   this.previousComponent = this.currentComponent;
    //   this.exitingRoute = this.currentRoute;
    //   this.moveToExitingView(this.previousComponent);
    //   // Immediately prepare both views without setTimeout
    //   this.findAndPrepareMotionElements();
    //   this.findAndPrepareExitingMotionElements();
    // } else {
      this.previousComponent = this.currentComponent;
      setTimeout(() => {
        this.findAndPrepareMotionElements();
      }, 0);
    // }
    
    this.currentComponent = component;
  }
  
  onDeactivate(component: any): void {
    console.log('[AnimationRouterOutlet] Component deactivated:', component);
  }
  
  private moveToExitingView(component: any): void {
    if (!this.exitingContainer || !component) return;
    
    try {
      const element = this.el.nativeElement.querySelector('.router-view:not(.exiting-view)');
      if (!element) return;
      
      const clone = element.cloneNode(true);
      
      while (this.exitingContainer.nativeElement.firstChild) {
        this.exitingContainer.nativeElement.firstChild.remove();
      }
      
      this.exitingContainer.nativeElement.appendChild(clone);
      
      if (this.exitingView?.nativeElement) {
        this.renderer.setStyle(this.exitingView.nativeElement, 'display', 'block');
      }
    } catch (error) {
      console.error('[AnimationRouterOutlet] Error moving component to exiting view:', error);
    }
  }
  
  private findAndPrepareExitingMotionElements(): void {
    this.exitingMotionElements = [];
    
    if (!this.exitingView?.nativeElement) return;
    
    const motionElements = this.exitingView.nativeElement.querySelectorAll('[motionone]');
    
    motionElements.forEach((element: HTMLElement) => {
      this.exitingMotionElements.push(element);
      
      // Get the exit animation properties from the element
      const exitAnimation = element.getAttribute('exit');
      if (exitAnimation) {
        // Trigger exit animation on the cloned element
        const exitDuration = this.motionService.getLongestExitDurationForRoute(this.exitingRoute) || 0;
        this.renderer.setAttribute(element, 'data-exiting', 'true');
        
        // Let the motion-one directive handle the exit animation
        // It will pick up the data-exiting attribute and run the exit animation
      }
    });
    
    console.log(`[AnimationRouterOutlet] Found ${this.exitingMotionElements.length} exiting motion elements`);
  }
  
  private findAndPrepareMotionElements(): void {
    this.currentMotionElements = [];
    
    const container = this.el.nativeElement.querySelector('.router-view:not(.exiting-view)');
    if (!container) return;
    
    const motionElements = container.querySelectorAll('[motionone]');
    
    motionElements.forEach((element: HTMLElement) => {
      this.currentMotionElements.push(element);
      
      if (this.mode === 'wait' && this.isAnimating) {
        this.hideElement(element);
      }
    });
    
    
    console.log(`[AnimationRouterOutlet] Found ${this.currentMotionElements.length} motion elements`);
  }
  
  private hideElement(element: HTMLElement): void {
    this.renderer.setStyle(element, 'opacity', '0');
    this.renderer.setStyle(element, 'transform', 'translateY(20px)');
    this.renderer.setStyle(element, 'transition', 'none');
    this.renderer.setStyle(element, 'will-change', 'opacity, transform');
    this.renderer.setAttribute(element, 'data-motion-hidden', 'true');
  }
  
  private showEnteringElements(): void {
    const routePath = this.getRoutePathFromUrl(this.currentRoute);
    
    this.currentMotionElements.forEach((element: HTMLElement) => {
      if (element.getAttribute('data-motion-hidden') !== 'true') return;
      
      if (this.mode === 'sync') {
        // In sync mode, show elements immediately without delays
        this.renderer.setStyle(element, 'transition', 'opacity 0.5s ease-out, transform 0.5s ease-out');
        this.renderer.setStyle(element, 'opacity', '1');
        this.renderer.setStyle(element, 'transform', 'translateY(0)');
        this.renderer.removeAttribute(element, 'data-motion-hidden');
      } else {
        // In wait mode, keep the original staggered behavior
        const baseDelay = 100;
        const staggerDelay = 50;
        const delay = baseDelay + (this.currentMotionElements.indexOf(element) * staggerDelay);
        
        this.renderer.setStyle(
          element, 
          'transition', 
          `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`
        );
        
        setTimeout(() => {
          this.renderer.setStyle(element, 'opacity', '1');
          this.renderer.setStyle(element, 'transform', 'translateY(0)');
          this.renderer.removeAttribute(element, 'data-motion-hidden');
        }, 10);
      }
    });
  }
  
  private cleanupExitingView(): void {
    if (!this.exitingView?.nativeElement) return;
    
    this.renderer.setStyle(this.exitingView.nativeElement, 'display', 'none');
    
    if (this.exitingContainer?.nativeElement) {
      while (this.exitingContainer.nativeElement.firstChild) {
        this.exitingContainer.nativeElement.firstChild.remove();
      }
    }
    
    this.previousComponent = null;
    this.exitingMotionElements = [];
  }
  
  private getRoutePathFromUrl(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    return path.startsWith('/') ? path.substring(1) : path;
  }
} 