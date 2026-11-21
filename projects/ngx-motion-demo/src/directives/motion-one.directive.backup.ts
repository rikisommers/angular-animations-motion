import {
  Directive,
  Input,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  HostListener,
  OnInit,
  PLATFORM_ID,
  Inject,
  ContentChildren,
  QueryList,
  AfterContentInit
} from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { MotionOneService } from '../services/motion-one.service';
import { MotionAnimationService } from '../services/motion-animation.service';
import type { NativeAnimationControls, AnimationOptions, Target } from 'motion';
import { animate, easeIn, easeOut, easeInOut, stagger } from '../services/motion-browser-safe';

export interface TransitionOptions {
  duration?: number;
  delay?: number;
  ease?: string | number[];
  repeat?: number | boolean;
  repeatType?: 'loop' | 'mirror' | 'reverse';
  repeatDelay?: number;
  staggerChildren?: number;
  staggerDirection?: number;
  when?: 'beforeChildren' | 'afterChildren' | 'together';
  delayChildren?: number;
}

export interface VariantWithTransition {
  [key: string]: any;
  transition?: TransitionOptions;
}

type AnimationState = 'initial' | 'animate' | 'exit' | 'hover' | 'tap' | 'focus' | 'inView';

interface AnimationControls {
  main: ReturnType<typeof animate> | null;
  children: ReturnType<typeof animate>[];
}

let uniqueIdCounter = 0; 

@Directive({
  selector: '[motionone]',
  standalone: true,
  exportAs: 'motionone'
})

export class MotionOneDirective implements OnInit, OnDestroy, OnChanges, AfterContentInit {
  @Input() initial: VariantWithTransition = {};
  @Input() animate: VariantWithTransition = {};
  @Input() exit: VariantWithTransition = {};
  @Input() inView: VariantWithTransition = {};
  @Input() duration = 0.3; // Changed to number for Motion One
  @Input() delay = 0; // Changed to number for Motion One
  @Input() repeat = false;
  @Input() exitDelay = 0; // Changed to number for Motion One
  @Input() easing = 'ease';
  @Input() offset = '0px';
  @Input() whileHover: VariantWithTransition = {};
  @Input() staggerChildren = 1; // Changed to number for Motion One
  @Input() staggerDirection = 1; // Changed to number for Motion One
  @Input() whileTap: VariantWithTransition = {};
  @Input() whileFocus: VariantWithTransition = {};
  @Input() whileInView: VariantWithTransition = {};
  @Input() variants: { [key: string]: VariantWithTransition } = {};
  @Input() transition: TransitionOptions = {};
  @Output() animationComplete = new EventEmitter<void>();

  // Query for child motionone directives
  @ContentChildren(MotionOneDirective, { descendants: true }) childMotionDirectives!: QueryList<MotionOneDirective>;
  
  private animationControls: AnimationControls = {
    main: null,
    children: []
  };
  public elementId: string;
  private hoverTimeout: number | undefined;
  private observer?: IntersectionObserver;
  private routeDelay: number = 0;
  private inViewInstance: (() => void) | undefined;
  private isChild = false;
  private parentDirective: MotionOneDirective | null = null;
  private initialAnimationPlayed = false;
  private staggerDelay = 0;
  private childrenCount = 0;
  private childIndex = 0;

  get scrollProgress() {
    return this.motionService.scrollYProgress();
  }

  constructor(
    public el: ElementRef,
    private motionService: MotionOneService,
    private motionAnimation: MotionAnimationService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.elementId = `motion-${uniqueIdCounter++}`;
    
    // Only run browser-specific code in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.el.nativeElement.setAttribute('id', this.elementId);
      // Store a reference to this directive on the element for easier access
      (this.el.nativeElement as any)._motionDirective = this;
      this.motionService.registerMotionElement(this);
      this.applyInitialStyles();
      this.routeDelay = this.motionService.getLongestExitDurationForRoute(this.router.url);

    }
  }

  ngOnInit() {
    
    // Only run animations in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Check if this is a child of another motionone directive
      let parent = this.el.nativeElement.parentElement;
      while (parent) {
        if (parent.hasAttribute('motionone')) {
          this.isChild = true;
          break;
        }
        parent = parent.parentElement;
      }

      
      // Only auto-play animation if not a child of another motionone element
      if (!this.isChild) {
        this.playAnimation(this.initial, this.animate);

      }
    }
  }

  ngAfterContentInit() {
    // Register child directives if we have staggerChildren
    if (this.childMotionDirectives && this.childMotionDirectives.length > 0) {
      
      // Set this directive as the parent for all children
      setTimeout(() => {
        // Filter out self from children
        const childDirectives = this.childMotionDirectives.filter(child => child !== this);
        this.childrenCount = childDirectives.length;
        
        
        // Set parent and index for each child
        childDirectives.forEach((child, index) => {
          child.setParent(this, index, this.childrenCount);
        });
        
        // Check if we need to stagger children
        const staggerValue = this.getStaggerValue();
        
        if (staggerValue > 0 && this.childrenCount > 0) {
          // Trigger staggered animations for children
          this.applyStaggerToChildren();
        } else {
        }
      });
    } else {
    }
  }

  setParent(parent: MotionOneDirective, index: number, totalChildren: number) {
    this.parentDirective = parent;
    this.isChild = true;
    this.childIndex = index;
    this.childrenCount = totalChildren;
  }

  // Method to stagger children animations
  applyStaggerToChildren() {
    // Get stagger configuration
    const staggerValue = this.getStaggerValue();
    const staggerDirection = this.getStaggerDirection();
    const delayChildren = this.getDelayChildren();
    
    
    // Get all child directives (excluding self)
    const childDirectives = this.childMotionDirectives.filter(child => child !== this);
    
    // Determine when to animate parent relative to children
    const when = this.getWhen();
    
    // Animate parent if needed
    if (when !== 'afterChildren') {
      this.runSelfAnimation();
    }
    
    // Animate each child with appropriate stagger delay
    childDirectives.forEach((childDirective, index) => {
      // Calculate the stagger delay based on index and direction
      // If staggerDirection is positive, start from first child
      // If staggerDirection is negative, start from last child
      let staggerIndex;
      if (staggerDirection >= 0) {
        staggerIndex = index;
      } else {
        staggerIndex = this.childrenCount - 1 - index;
      }
      
      const staggerDelay = delayChildren + (staggerIndex * staggerValue);
      
      
      // Force override the child's delay
      childDirective.overrideDelay(staggerDelay);
      
      // Trigger the child's animation
      childDirective.runInitAnimation();
    });
    
    // Animate parent after children if specified
    if (when === 'afterChildren') {
      const totalChildrenDuration = delayChildren + (this.childrenCount * staggerValue);
      this.overrideDelay(totalChildrenDuration);
      this.runSelfAnimation();
    }
  }

  // Method to override the delay for this directive
  overrideDelay(delay: number) {
    this.staggerDelay = delay;
  }

  // Run animation only for this element (not children)
  runSelfAnimation() {
    // Get animation options
    const options = this.getAnimationOptions();
    
    
    // Extract only style properties for animation
    const targetStyles = this.extractStyleProperties(this.animate);
    
    // Apply start state immediately
    const startStyles = this.extractStyleProperties(this.initial);
    Object.assign(this.el.nativeElement.style, startStyles);
    
    // Create animation
    this.animationControls.main = this.motionAnimation.animate(
      this.el.nativeElement as Target,
      targetStyles,
      options
    );
    
    this.initialAnimationPlayed = true;
  }

  ngOnDestroy() {

    
    if (this.exit && Object.keys(this.exit).length > 0) {
      this.runExitAnimation();
    }

    if (this.inViewInstance) {
      this.inViewInstance.stop();
    }

    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.stopAllAnimations();


  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['animate'] && changes['animate'].previousValue !== undefined) {
      const oldState = changes['animate'].previousValue;
      let newState = changes['animate'].currentValue;
      
      if (typeof newState === 'object') {
        this.playAnimation(oldState, newState);
      } else if (typeof newState === 'string' && this.variants?.[newState]) {
        newState = this.variants[newState];
        this.playAnimation(oldState, newState);
      } 
    }

    // Handle transition changes
    if (changes['transition'] && !changes['transition'].firstChange) {
      // Re-apply animation with new transition settings
      this.playAnimation(this.initial, this.animate);
    }
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.handleInteractionStart(this.whileHover, () => clearTimeout(this.hoverTimeout));
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.handleInteractionEnd(this.whileHover, 100);
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPress(event: Event) {
    if (this.hasVariant(this.whileTap)) {
      this.animateToInteractionState(this.whileTap);
      
      if (isPlatformBrowser(this.platformId)) {
        const endEvent = event.type === 'mousedown' ? 'mouseup' : 'touchend';
        const endListener = () => {
          this.animateFromInteractionState(this.whileTap);
          window.removeEventListener(endEvent, endListener);
        };
        window.addEventListener(endEvent, endListener);
      }
    }
  }

  @HostListener('focus')
  onFocus() {
    this.handleInteractionStart(this.whileFocus);
  }

  @HostListener('blur')
  onBlur() {
    this.handleInteractionEnd(this.whileFocus);
  }

  applyInitialValues() {
    this.applyStyles(this.initial);
  }

  private applyInitialStyles(): void {
    this.applyStyles(this.initial, true);
  }

  private applyAnimateStyles(): void {
    this.applyStyles(this.animate);
  }

  private applyStyles(variant: VariantWithTransition, useRequestAnimationFrame = false): void {
    const styles = this.extractStyleProperties(variant);
    
    if (styles && Object.keys(styles).length > 0) {
      if (useRequestAnimationFrame) {
        requestAnimationFrame(() => {
          Object.assign(this.el.nativeElement.style, styles);
        });
      } else {
        Object.assign(this.el.nativeElement.style, styles);
      }
    }
  }

  // Helper to extract only style properties from a variant (excluding transition)
  private extractStyleProperties(variant: VariantWithTransition): Record<string, string | number> {
    if (!variant) return {};
    
    const result: Record<string, string | number> = {};
    
    for (const key in variant) {
      if (key !== 'transition') {
        // Handle color properties to ensure consistent formats
        if (key === 'backgroundColor' || key === 'color' || key === 'borderColor') {
          result[key] = this.normalizeColor(variant[key]);
        } else {
          result[key] = variant[key];
        }
      }
    }
    
    return result;
  }

  private getEasing(easingString: string | number[] | undefined): string | number[] {
    if (!easingString) {
      return this.motionAnimation.easeInOut;
    }

    if (Array.isArray(easingString)) {
      // Handle cubic bezier array
      return easingString;
    }

    const easingMap: Record<string, string | number[]> = {
      'ease-in': this.motionAnimation.easeIn,
      'ease-out': this.motionAnimation.easeOut,
      'ease-in-out': this.motionAnimation.easeInOut,
      'ease': this.motionAnimation.easeInOut // Default 'ease' to easeInOut
    };
    
    return easingMap[easingString] || this.motionAnimation.easeInOut;
  }

  private getAnimationOptions(targetState?: VariantWithTransition): AnimationOptions {
    // Priority: 1. Stagger delay, 2. State-specific transition, 3. Global transition, 4. Individual properties
    const stateTransition = targetState?.transition ?? this.animate?.transition;
    const globalTransition = this.transition;
    
    const transitionObj = stateTransition || globalTransition || {};
    
    // Always prioritize stagger delay over any other delay settings
    const delay = this.staggerDelay > 0 ? this.staggerDelay : (transitionObj.delay ?? this.delay);
    
    
    return {
      duration: transitionObj.duration ?? this.duration,
      delay: delay,
      ease: this.getEasing(transitionObj.ease ?? this.easing),
      repeat: this.getRepeatValue(transitionObj),
      repeatDelay: transitionObj.repeatDelay,
      onComplete: () => this.animationComplete.emit()
    };
  }

  private getRepeatValue(transitionObj: TransitionOptions): number {
    // Handle repeat value from transition object or fallback to directive input
    if (transitionObj.repeat !== undefined) {
      if (transitionObj.repeat === true) {
        return Infinity;
      } else if (typeof transitionObj.repeat === 'number') {
        return transitionObj.repeat;
      }
    }
    
    return this.repeat ? Infinity : 0;
  }

  private getTransitionValue<T>(key: keyof TransitionOptions, defaultValue: T): T {
    const stateTransition = this.animate?.transition;
    const globalTransition = this.transition;
    const transitionObj = stateTransition || globalTransition || {};
    
    return (transitionObj[key] as T) ?? defaultValue;
  }

  private getStaggerValue(): number {
    return this.getTransitionValue('staggerChildren', this.staggerChildren);
  }

  private getStaggerDirection(): number {
    return this.getTransitionValue('staggerDirection', this.staggerDirection);
  }

  private getDelayChildren(): number {
    return this.getTransitionValue('delayChildren', 0);
  }

  private getWhen(): 'beforeChildren' | 'afterChildren' | 'together' {
    return this.getTransitionValue('when', 'together');
  }

  private playAnimation(startState: VariantWithTransition | string, targetState: VariantWithTransition | string): void {
    if (!targetState || !isPlatformBrowser(this.platformId)) return;

    // Resolve variant strings to objects
    let resolvedStartState: VariantWithTransition = {};
    let resolvedTargetState: VariantWithTransition = {};

    if (startState === undefined) {
      resolvedStartState = this.initial;
    } else if (typeof startState === 'string' && this.variants?.[startState]) {
      resolvedStartState = this.variants[startState];
    } else if (typeof startState === 'object') {
      resolvedStartState = startState;
    }

    if (targetState === undefined) {
      resolvedTargetState = this.animate;
    } else if (typeof targetState === 'string' && this.variants?.[targetState]) {
      resolvedTargetState = this.variants[targetState];
    } else if (typeof targetState === 'object') {
      resolvedTargetState = targetState;
    }

    this.stopAllAnimations();

    // Check if this is the initial animation to the animate state
    const isInitialAnimation = 
      (targetState === this.animate || 
       (typeof targetState === 'string' && this.variants?.[targetState] === this.animate));

    // Apply start state immediately (excluding transition property)
    if (resolvedStartState) {
      const styles = this.extractStyleProperties(resolvedStartState);
      
      // Apply initial styles immediately to prevent flash
      if (styles && Object.keys(styles).length > 0) {
        // Use requestAnimationFrame to ensure styles are applied before animation starts
        requestAnimationFrame(() => {
          Object.assign(this.el.nativeElement.style, styles);
          
          // Use another requestAnimationFrame to ensure the next frame has the styles applied
          requestAnimationFrame(() => {
            // Continue with animation after styles are applied
            this.continueAnimation(resolvedTargetState, isInitialAnimation);
          });
        });
        return; // Exit early, animation will continue in the callback
      }
    }
    
    // If no start state or no styles to apply, continue immediately
    this.continueAnimation(resolvedTargetState, isInitialAnimation);
  }

  private continueAnimation(resolvedTargetState: VariantWithTransition, isInitialAnimation: boolean): void {
    // Check if this is the initial animation to the animate state
    if (isInitialAnimation && !this.initialAnimationPlayed) {
      const staggerValue = this.getStaggerValue();
      
      if (staggerValue > 0 && this.childMotionDirectives && this.childMotionDirectives.length > 1) {
        // Stagger will be handled by ngAfterContentInit
        // Just animate self according to 'when' property
        const when = this.getWhen();
        
        if (when !== 'afterChildren') {
          this.runSelfAnimation();
        }
        
        return;
      }
    }

    // For non-staggered animations or non-initial animations
    // Get animation options with priority to target state's transition
    const options = this.getAnimationOptions(resolvedTargetState);
    
    // Extract only style properties for animation (excluding transition)
    const targetStyles = this.extractStyleProperties(resolvedTargetState);
    
    // Create animation with Motion One for the element itself
    this.animationControls.main = this.motionAnimation.animate(
      this.el.nativeElement as Target,
      targetStyles,
      options
    );
    
    if (isInitialAnimation) {
      this.initialAnimationPlayed = true;
    }
    
    // Handle regular DOM children (without motionone directives) for non-initial animations
    if (!isInitialAnimation && this.el.nativeElement.children.length > 0) {
      // Get children elements
      const children = Array.from(this.el.nativeElement.children) as HTMLElement[];
      
      // Animate each child with the same animation
      children.forEach((child) => {
        // Skip children that have their own motionone directive
        if (child.hasAttribute('motionone')) {
          return;
        }
        
        // Create child animation
        const childControl = this.motionAnimation.animate(
          child,
          targetStyles,
          options
        );
        
        // Store the control for cleanup
        this.animationControls.children.push(childControl);
      });
    }
  }


  runInViewAnimation() {
    if (this.inView && Object.keys(this.inView).length > 0) {
      this.playAnimation(this.initial, this.inView);
    }
  }

  runInitAnimation() {
    if (!isPlatformBrowser(this.platformId) || !this.initial || !this.animate) return;
    
    // For child elements with stagger, make sure we use the stagger delay
    if (this.isChild && this.staggerDelay > 0) {
      
      // Apply start state immediately
      const startStyles = this.extractStyleProperties(this.initial);
      Object.assign(this.el.nativeElement.style, startStyles);
      
      // Get animation options with stagger delay
      const options = this.getAnimationOptions();
      
      // Extract only style properties for animation
      const targetStyles = this.extractStyleProperties(this.animate);
      
      // Create animation with stagger delay
      this.animationControls.main = this.motionAnimation.animate(
        this.el.nativeElement as Target,
        targetStyles,
        options
      );
      
      this.initialAnimationPlayed = true;
    } else {
      // Normal animation without stagger

        this.playAnimation(this.initial, this.animate);


    }
  }


  runExitAnimation(): Promise<void> {
    
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }
    
    // If no exit animation defined, resolve immediately
    if (!this.exit || Object.keys(this.exit).length === 0) {
      return Promise.resolve();
    }
    
    
    // Use exit-specific transition if available, otherwise use global transition
    const exitTransition = this.exit.transition || this.transition || {};
    
    // Create a promise that resolves when the exit animation completes
    return new Promise<void>((resolve) => {
      const exitOptions: AnimationOptions = {
        duration: exitTransition.duration ?? this.duration,
        delay: exitTransition.delay ?? this.exitDelay,
        ease: this.getEasing(exitTransition.ease ?? this.easing),
        onComplete: () => {
          this.animationComplete.emit();
          resolve();
        }
      };
      
      this.stopAllAnimations();
      
      // Extract only style properties for animation (excluding transition)
      const exitStyles = this.extractStyleProperties(this.exit);
      
      
      // Create exit animation
      this.animationControls.main = this.motionAnimation.animate(
        this.el.nativeElement as Target,
        exitStyles,
        exitOptions
      );
      
      // If no duration is set, resolve immediately
      if (!exitOptions.duration) {
        resolve();
      }
    });
  }

  cancel() {
    this.stopAllAnimations();
    this.applyAnimateStyles();
  }

  getDuration(): number {
    if (!isPlatformBrowser(this.platformId)) return 0;
    
    try {
      // Consider state-specific transition if available
      // Check transitions in order of priority: exit, animate, then default transition
      const animateTransition = this.exit?.transition  || this.transition || {};
      const duration = animateTransition.duration ?? this.duration;
      const delay = animateTransition.delay ?? this.delay;
      return (duration + delay) * 1000;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 0;
    }
  }

  getKeyByValue<T>(object: Record<string, T>, key: T): string | undefined {
    return Object.keys(object).find((k) => object[k] === key);
  }


  // Helper to normalize color values to a consistent format
  private normalizeColor(color: string | undefined | null): string {
    // Handle undefined or null values
    if (!color) {
      return '';
    }
    
    // If it's already in rgb/rgba format, return as is
    if (color.startsWith('rgb')) {
      return color;
    }
    
    // For named colors, convert to hex
    if (color === 'aqua') return '#00ffff';
    if (color === 'red') return '#ff0000';
    if (color === 'blue') return '#0000ff';
    if (color === 'green') return '#008000';
    if (color === 'yellow') return '#ffff00';
    if (color === 'purple') return '#800080';
    if (color === 'orange') return '#ffa500';
    if (color === 'black') return '#000000';
    if (color === 'white') return '#ffffff';
    
    // Return original if no conversion needed
    return color;
  }

  // Add a method to manually trigger exit animation from outside
  public triggerExitAnimation(): Promise<void> {
    return this.runExitAnimation();
  }

  // Add a listener for the custom exit event
  @HostListener('motionExit')
  onMotionExit() {
    this.runExitAnimation();
  }

  private stopAllAnimations(): void {
    if (this.animationControls.main) {
      this.animationControls.main.stop();
      this.animationControls.main = null;
    }
    
    this.animationControls.children.forEach(control => {
      if (control) control.stop();
    });
    this.animationControls.children = [];
  }

  private hasVariant(variant: VariantWithTransition): boolean {
    return Object.keys(variant).length > 0;
  }

  private getCurrentState(): VariantWithTransition {
    return this.hasVariant(this.animate) ? this.animate : this.initial;
  }

  private handleInteractionStart(interactionVariant: VariantWithTransition, callback?: () => void): void {
    if (this.hasVariant(interactionVariant)) {
      callback?.();
      this.animateToInteractionState(interactionVariant);
    }
  }

  private handleInteractionEnd(interactionVariant: VariantWithTransition, delay = 0): void {
    if (this.hasVariant(interactionVariant)) {
      if (delay > 0) {
        this.hoverTimeout = setTimeout(() => {
          this.animateFromInteractionState(interactionVariant);
        }, delay);
      } else {
        this.animateFromInteractionState(interactionVariant);
      }
    }
  }

  private animateToInteractionState(interactionVariant: VariantWithTransition): void {
    this.playAnimation(this.getCurrentState(), interactionVariant);
  }

  private animateFromInteractionState(interactionVariant: VariantWithTransition): void {
    this.playAnimation(interactionVariant, this.getCurrentState());
  }
}
