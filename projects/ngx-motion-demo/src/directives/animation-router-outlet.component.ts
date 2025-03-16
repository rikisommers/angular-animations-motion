import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AnimationRouterService } from '../services/animation-router.service';
import { MotionOneService } from '../services/motion-one.service';

/**
 * A component that wraps the router outlet and handles animation timing
 * for all child elements. This provides a centralized way to delay
 * entry animations until exit animations are complete.
 */
@Component({
  selector: 'animation-router-outlet',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="animation-router-container">
      <router-outlet (activate)="onActivate($event)"></router-outlet>
    </div>
  `,
  styles: [`
    .animation-router-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  `]
})
export class AnimationRouterOutletComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(RouterOutlet) routerOutlet!: RouterOutlet;
  
  private subscription = new Subscription();
  private currentComponent: any = null;
  private previousComponent: any = null;
  private isAnimating = false;
  private currentRoute: string = '';
  
  // Track all motion elements in the current view
  private currentMotionElements: HTMLElement[] = [];
  
  constructor(
    private animationRouterService: AnimationRouterService,
    private motionService: MotionOneService,
    private renderer: Renderer2,
    private el: ElementRef,
    private router: Router
  ) {
    // Get the current route
    this.currentRoute = this.router.url;
  }
  
  ngOnInit(): void {
    // Subscribe to animation state changes
    this.subscription.add(
      this.animationRouterService.animating$.subscribe(isAnimating => {
        this.isAnimating = isAnimating;
        
        if (!isAnimating) {
          // Exit animations are complete, show the entering elements
          this.showEnteringElements();
        }
      })
    );
    
    // Subscribe to router events to track the current route
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event.constructor.name === 'NavigationEnd') {
          this.currentRoute = this.router.url;
        }
      })
    );
  }
  
  ngAfterViewInit(): void {
    // Initial setup
    setTimeout(() => {
      this.findAndPrepareMotionElements();
    }, 0);
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  /**
   * Called when a new component is activated by the router
   */
  onActivate(component: any): void {
    console.log('[AnimationRouterOutlet] Component activated:', component);
    
    // Store the previous component
    this.previousComponent = this.currentComponent;
    this.currentComponent = component;
    
    // Find and prepare motion elements in the new component
    setTimeout(() => {
      this.findAndPrepareMotionElements();
    }, 0);
  }
  
  /**
   * Find all elements with the motionone directive and prepare them for animation
   */
  private findAndPrepareMotionElements(): void {
    // Clear previous elements
    this.currentMotionElements = [];
    
    // Find all elements with the motionone attribute
    const container = this.el.nativeElement.querySelector('.animation-router-container');
    if (!container) return;
    
    const motionElements = container.querySelectorAll('[motionone]');
    
    // Hide all motion elements initially
    motionElements.forEach((element: HTMLElement) => {
      this.currentMotionElements.push(element);
      
      // Only hide elements if we're in the middle of a navigation
      if (this.isAnimating) {
        this.hideElement(element);
      }
    });
    
    console.log(`[AnimationRouterOutlet] Found ${this.currentMotionElements.length} motion elements`);
  }
  
  /**
   * Hide an element by setting its initial state
   */
  private hideElement(element: HTMLElement): void {
    // Set initial styles - hidden but in the DOM
    this.renderer.setStyle(element, 'opacity', '0');
    this.renderer.setStyle(element, 'transform', 'translateY(20px)');
    this.renderer.setStyle(element, 'transition', 'none');
    this.renderer.setStyle(element, 'will-change', 'opacity, transform');
    
    // Add a data attribute to mark this element as hidden
    this.renderer.setAttribute(element, 'data-motion-hidden', 'true');
  }
  
  /**
   * Show all entering elements with a staggered delay
   */
  private showEnteringElements(): void {
    // Extract route path from URL
    const routePath = this.getRoutePathFromUrl(this.currentRoute);
    
    // Get the exit duration for the current route
    const exitDuration = this.motionService.getLongestExitDurationForRoute(routePath) || 0;
    
    // Base delay in milliseconds (after exit animations complete)
    const baseDelay = 100;
    
    // Stagger delay between elements in milliseconds
    const staggerDelay = 50;
    
    // Show each element with a staggered delay
    this.currentMotionElements.forEach((element: HTMLElement, index: number) => {
      // Only show elements that are hidden
      if (element.getAttribute('data-motion-hidden') !== 'true') return;
      
      // Calculate delay for this element
      const delay = baseDelay + (index * staggerDelay);
      
      // Set transition properties
      this.renderer.setStyle(
        element, 
        'transition', 
        `opacity 0.5s ease-out ${delay/1000}s, transform 0.5s ease-out ${delay/1000}s`
      );
      
      // Apply final styles after a small delay to ensure transition works
      setTimeout(() => {
        this.renderer.setStyle(element, 'opacity', '1');
        this.renderer.setStyle(element, 'transform', 'translateY(0)');
        this.renderer.removeAttribute(element, 'data-motion-hidden');
      }, 10);
    });
  }
  
  /**
   * Extract the route path from a URL
   */
  private getRoutePathFromUrl(url: string): string {
    // Remove query parameters and hash
    const path = url.split('?')[0].split('#')[0];
    
    // Remove leading slash
    return path.startsWith('/') ? path.substring(1) : path;
  }
} 