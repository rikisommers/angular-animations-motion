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
import type { AnimationOptions, Target } from 'motion';

// Import types
import { 
  TransitionOptions, 
  VariantWithTransition, 
  AnimationControls,
  StaggerConfig 
} from '../types/motion.types';

// Import utilities
import { 
  extractStyleProperties,
  applyStylesToElement,
  hasVariantProperties,
  getKeyByValue 
} from '../utils/animation.utils';
import { 
  buildAnimationOptions,
  getStaggerValue,
  getStaggerDirection,
  getDelayChildren,
  getWhen 
} from '../utils/transition.utils';
import { 
  calculateStaggerDelay,
  calculateTotalStaggerDuration,
  shouldApplyStagger,
  createStaggerConfig,
  filterChildDirectives 
} from '../utils/stagger.utils';
import { 
  createStaggeredAnimation,
  createInViewAnimation,
  stopAllAnimationsOptimized,
  batchApplyStyles,
  createSequencedAnimations 
} from '../utils/motion-one-features.utils';

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
  @Input() duration = 0.3;
  @Input() delay = 0;
  @Input() repeat = false;
  @Input() exitDelay = 0;
  @Input() easing = 'ease';
  @Input() offset = '0px';
  @Input() whileHover: VariantWithTransition = {};
  @Input() staggerChildren = 1;
  @Input() staggerDirection = 1;
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

  ngOnInit(): void {
    // Only run animations in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.detectParentChild();
      
      // Only auto-play animation if not a child of another motionone element
      if (!this.isChild) {
        this.playAnimation(this.initial, this.animate);
      }

      // Setup inView animation using Motion One's native API
      this.setupInViewAnimation();
    }
  }

  ngAfterContentInit(): void {
    // Register child directives if we have staggerChildren
    if (this.childMotionDirectives && this.childMotionDirectives.length > 0) {
      // Set this directive as the parent for all children
      setTimeout(() => {
        const childDirectives = filterChildDirectives(this.childMotionDirectives.toArray(), this);
        this.childrenCount = childDirectives.length;
        
        // Set parent and index for each child
        childDirectives.forEach((child, index) => {
          child.setParent(this, index, this.childrenCount);
        });
        
        // Apply stagger if needed
        this.applyStaggerToChildrenOptimized();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.exit && Object.keys(this.exit).length > 0) {
      this.runExitAnimation();
    }

    // Clean up inView instance
    if (this.inViewInstance) {
      this.inViewInstance();
    }

    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Use optimized cleanup
    stopAllAnimationsOptimized(this.animationControls);
  }

  ngOnChanges(changes: SimpleChanges): void {
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
      this.playAnimation(this.initial, this.animate);
    }
  }

  // Interaction handlers using extracted utilities
  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.handleInteractionStart(this.whileHover, () => clearTimeout(this.hoverTimeout));
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.handleInteractionEnd(this.whileHover, 100);
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPress(event: Event): void {
    if (hasVariantProperties(this.whileTap)) {
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
  onFocus(): void {
    this.handleInteractionStart(this.whileFocus);
  }

  @HostListener('blur')
  onBlur(): void {
    this.handleInteractionEnd(this.whileFocus);
  }

  @HostListener('motionExit')
  onMotionExit(): void {
    this.runExitAnimation();
  }

  // Public API methods
  applyInitialValues(): void {
    applyStylesToElement(this.el.nativeElement, this.initial);
  }

  cancel(): void {
    stopAllAnimationsOptimized(this.animationControls);
    applyStylesToElement(this.el.nativeElement, this.animate);
  }

  getDuration(): number {
    if (!isPlatformBrowser(this.platformId)) return 0;
    
    try {
      const animateTransition = this.exit?.transition || this.transition || {};
      const duration = animateTransition.duration ?? this.duration;
      const delay = animateTransition.delay ?? this.delay;
      return (duration + delay) * 1000;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 0;
    }
  }

  getKeyByValue<T>(object: Record<string, T>, key: T): string | undefined {
    return getKeyByValue(object, key);
  }

  public triggerExitAnimation(): Promise<void> {
    return this.runExitAnimation();
  }

  runInViewAnimation(): void {
    if (hasVariantProperties(this.inView)) {
      this.playAnimation(this.initial, this.inView);
    }
  }

  runInitAnimation(): void {
    if (!isPlatformBrowser(this.platformId) || !this.initial || !this.animate) return;
    
    // For child elements with stagger, use the stagger delay
    if (this.isChild && this.staggerDelay > 0) {
      this.runStaggeredInitAnimation();
    } else {
      this.playAnimation(this.initial, this.animate);
    }
  }

  runExitAnimation(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }
    
    if (!hasVariantProperties(this.exit)) {
      return Promise.resolve();
    }
    
    const exitTransition = this.exit.transition || this.transition || {};
    
    return new Promise<void>((resolve) => {
      const exitOptions = buildAnimationOptions(
        this.exit,
        this.transition,
        0,
        {
          duration: this.duration,
          delay: this.exitDelay,
          easing: this.easing,
          repeat: this.repeat
        },
        this.motionAnimation,
        () => {
          this.animationComplete.emit();
          resolve();
        }
      );
      
      stopAllAnimationsOptimized(this.animationControls);
      
      const exitStyles = extractStyleProperties(this.exit);
      this.animationControls.main = this.motionAnimation.animate(
        this.el.nativeElement as Target,
        exitStyles,
        exitOptions
      );
      
      if (!exitOptions.duration) {
        resolve();
      }
    });
  }

  setParent(parent: MotionOneDirective, index: number, totalChildren: number): void {
    this.parentDirective = parent;
    this.isChild = true;
    this.childIndex = index;
    this.childrenCount = totalChildren;
  }

  overrideDelay(delay: number): void {
    this.staggerDelay = delay;
  }

  // Private helper methods
  private detectParentChild(): void {
    let parent = this.el.nativeElement.parentElement;
    while (parent) {
      if (parent.hasAttribute('motionone')) {
        this.isChild = true;
        break;
      }
      parent = parent.parentElement;
    }
  }

  private applyInitialStyles(): void {
    applyStylesToElement(this.el.nativeElement, this.initial, true);
  }

  private setupInViewAnimation(): void {
    if (hasVariantProperties(this.whileInView)) {
      this.inViewInstance = createInViewAnimation(
        this.el.nativeElement,
        this.whileInView,
        buildAnimationOptions(
          this.whileInView,
          this.transition,
          0,
          {
            duration: this.duration,
            delay: this.delay,
            easing: this.easing,
            repeat: this.repeat
          },
          this.motionAnimation
        ),
        this.motionAnimation,
        this.offset
      );
    }
  }

  private applyStaggerToChildrenOptimized(): void {
    const staggerValue = getStaggerValue(this.animate?.transition, this.transition, this.staggerChildren);
    
    if (!shouldApplyStagger(staggerValue, this.childrenCount)) {
      return;
    }

    const config = createStaggerConfig(
      staggerValue,
      getStaggerDirection(this.animate?.transition, this.transition, this.staggerDirection),
      getDelayChildren(this.animate?.transition, this.transition),
      getWhen(this.animate?.transition, this.transition)
    );

    const childDirectives = filterChildDirectives(this.childMotionDirectives.toArray(), this);

    // Animate parent if needed
    if (config.when !== 'afterChildren') {
      this.runSelfAnimation();
    }

    // Use Motion One's native stagger for better performance
    this.applyNativeStaggerToChildren(childDirectives, config);

    // Animate parent after children if specified
    if (config.when === 'afterChildren') {
      const totalDuration = calculateTotalStaggerDuration(this.childrenCount, config);
      this.overrideDelay(totalDuration);
      this.runSelfAnimation();
    }
  }

  private applyNativeStaggerToChildren(childDirectives: MotionOneDirective[], config: StaggerConfig): void {
    const elements = childDirectives.map(child => child.el.nativeElement);
    const targetStyles = extractStyleProperties(this.animate);
    
    // Apply initial styles to all children
    batchApplyStyles(elements, this.initial);

    // Create base options
    const baseOptions = buildAnimationOptions(
      this.animate,
      this.transition,
      0,
      {
        duration: this.duration,
        delay: this.delay,
        easing: this.easing,
        repeat: this.repeat
      },
      this.motionAnimation
    );

    // Use Motion One's native stagger
    const staggeredControls = createStaggeredAnimation(
      elements,
      targetStyles,
      baseOptions,
      config.staggerChildren,
      this.motionAnimation
    );

    // Store controls for cleanup
    this.animationControls.children.push(...staggeredControls);

    // Mark children as animated
    childDirectives.forEach(child => {
      child.initialAnimationPlayed = true;
    });
  }

  private runSelfAnimation(): void {
    const options = buildAnimationOptions(
      this.animate,
      this.transition,
      this.staggerDelay,
      {
        duration: this.duration,
        delay: this.delay,
        easing: this.easing,
        repeat: this.repeat
      },
      this.motionAnimation
    );
    
    const targetStyles = extractStyleProperties(this.animate);
    
    // Apply start state immediately
    applyStylesToElement(this.el.nativeElement, this.initial);
    
    // Create animation
    this.animationControls.main = this.motionAnimation.animate(
      this.el.nativeElement as Target,
      targetStyles,
      options
    );
    
    this.initialAnimationPlayed = true;
  }

  private runStaggeredInitAnimation(): void {
    // Apply start state immediately
    applyStylesToElement(this.el.nativeElement, this.initial);
    
    // Get animation options with stagger delay
    const options = buildAnimationOptions(
      this.animate,
      this.transition,
      this.staggerDelay,
      {
        duration: this.duration,
        delay: this.delay,
        easing: this.easing,
        repeat: this.repeat
      },
      this.motionAnimation
    );
    
    const targetStyles = extractStyleProperties(this.animate);
    
    // Create animation with stagger delay
    this.animationControls.main = this.motionAnimation.animate(
      this.el.nativeElement as Target,
      targetStyles,
      options
    );
    
    this.initialAnimationPlayed = true;
  }

  private playAnimation(startState: VariantWithTransition | string, targetState: VariantWithTransition | string): void {
    if (!targetState || !isPlatformBrowser(this.platformId)) return;

    // Resolve variant strings to objects
    const resolvedStartState = this.resolveVariant(startState);
    const resolvedTargetState = this.resolveVariant(targetState);

    stopAllAnimationsOptimized(this.animationControls);

    // Check if this is the initial animation to the animate state
    const isInitialAnimation = (targetState === this.animate || 
     (typeof targetState === 'string' && this.variants?.[targetState] === this.animate));

    // Apply start state immediately
    if (resolvedStartState) {
      applyStylesToElement(this.el.nativeElement, resolvedStartState, true);
      
      // Continue animation after styles are applied
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.continueAnimation(resolvedTargetState, isInitialAnimation);
        });
      });
      return;
    }
    
    this.continueAnimation(resolvedTargetState, isInitialAnimation);
  }

  private resolveVariant(variant: VariantWithTransition | string): VariantWithTransition {
    if (variant === undefined) {
      return this.animate;
    } else if (typeof variant === 'string' && this.variants?.[variant]) {
      return this.variants[variant];
    } else if (typeof variant === 'object') {
      return variant;
    }
    return {};
  }

  private continueAnimation(resolvedTargetState: VariantWithTransition, isInitialAnimation: boolean): void {
    // Check if this is the initial animation to the animate state
    if (isInitialAnimation && !this.initialAnimationPlayed) {
      const staggerValue = getStaggerValue(this.animate?.transition, this.transition, this.staggerChildren);
      
      if (shouldApplyStagger(staggerValue, this.childMotionDirectives?.length || 0)) {
        const when = getWhen(this.animate?.transition, this.transition);
        
        if (when !== 'afterChildren') {
          this.runSelfAnimation();
        }
        return;
      }
    }

    // For non-staggered animations or non-initial animations
    const options = buildAnimationOptions(
      resolvedTargetState,
      this.transition,
      this.staggerDelay,
      {
        duration: this.duration,
        delay: this.delay,
        easing: this.easing,
        repeat: this.repeat
      },
      this.motionAnimation,
      () => this.animationComplete.emit()
    );
    
    const targetStyles = extractStyleProperties(resolvedTargetState);
    
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
      this.animateRegularChildren(targetStyles, options);
    }
  }

  private animateRegularChildren(targetStyles: Record<string, string | number>, options: any): void {
    const children = Array.from(this.el.nativeElement.children) as HTMLElement[];
    
    children.forEach((child) => {
      // Skip children that have their own motionone directive
      if (child.hasAttribute('motionone')) {
        return;
      }
      
      // Create child animation
      const childControl = this.motionAnimation.animate(child, targetStyles, options);
      this.animationControls.children.push(childControl);
    });
  }

  private getCurrentState(): VariantWithTransition {
    return hasVariantProperties(this.animate) ? this.animate : this.initial;
  }

  private handleInteractionStart(interactionVariant: VariantWithTransition, callback?: () => void): void {
    if (hasVariantProperties(interactionVariant)) {
      callback?.();
      this.animateToInteractionState(interactionVariant);
    }
  }

  private handleInteractionEnd(interactionVariant: VariantWithTransition, delay = 0): void {
    if (hasVariantProperties(interactionVariant)) {
      if (delay > 0) {
        this.hoverTimeout = window.setTimeout(() => {
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