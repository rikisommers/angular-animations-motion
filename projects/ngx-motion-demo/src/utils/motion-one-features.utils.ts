import { MotionAnimationService } from '../services/motion-animation.service';
import { VariantWithTransition, AnimationControls } from '../types/motion.types';
import { extractStyleProperties } from './animation.utils';
import { Target, AnimationOptions } from 'motion';

/**
 * Enhanced Motion One utilities that leverage native Motion One features
 * Provides better performance and simpler code by using Motion One's built-in capabilities
 */

/**
 * Creates staggered animations using Motion One's native stagger function
 * This is more efficient than manual stagger calculation
 * @param elements - Array of elements to animate
 * @param keyframes - Animation keyframes
 * @param options - Base animation options
 * @param staggerValue - Stagger delay between elements
 * @param motionAnimation - Motion animation service
 * @returns Array of animation controls
 */
export function createStaggeredAnimation(
  elements: HTMLElement[],
  keyframes: Record<string, any>,
  options: AnimationOptions,
  staggerValue: number,
  motionAnimation: MotionAnimationService
): ReturnType<typeof motionAnimation.animate>[] {
  if (elements.length === 0 || staggerValue <= 0) {
    // Fallback to individual animations if no stagger needed
    return elements.map(element => 
      motionAnimation.animate(element, keyframes, options)
    );
  }

  // Use Motion One's native stagger function for better performance
  try {
    // Handle Motion One's DynamicOption<number> type for delay
    const baseDelay = typeof options.delay === 'number' ? options.delay : 0;
    
    const staggeredOptions = {
      ...options,
      delay: motionAnimation.stagger(staggerValue, { from: baseDelay })
    };

    // Animate all elements at once with stagger
    return [motionAnimation.animate(elements, keyframes, staggeredOptions)];
  } catch (error) {
    // Fallback to individual animations if stagger fails
    console.warn('Native stagger failed, falling back to individual animations');
    return elements.map((element, index) => {
      // Handle Motion One's DynamicOption<number> type for delay
      const baseDelay = typeof options.delay === 'number' ? options.delay : 0;
      
      const delayedOptions = {
        ...options,
        delay: baseDelay + (index * staggerValue)
      };
      return motionAnimation.animate(element, keyframes, delayedOptions);
    });
  }
}

/**
 * Creates an in-view animation using Intersection Observer as fallback
 * @param element - Element to observe
 * @param variant - Animation variant
 * @param options - Animation options
 * @param motionAnimation - Motion animation service
 * @param offset - Viewport offset for triggering
 * @returns Cleanup function
 */
export function createInViewAnimation(
  element: HTMLElement,
  variant: VariantWithTransition,
  options: AnimationOptions,
  motionAnimation: MotionAnimationService,
  offset = '0px'
): (() => void) | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    // Try Motion One's inView first, fallback to Intersection Observer
    import('motion').then(motion => {
      if ((motion as any).inView) {
        const styles = extractStyleProperties(variant);
        
        (motion as any).inView(element, (info: any) => {
          if (info.isInView) {
            motionAnimation.animate(element, styles, options);
          }
        }, {
          margin: offset,
          amount: 'some'
        });
      } else {
        // Fallback to Intersection Observer
        createIntersectionObserverAnimation(element, variant, options, motionAnimation, offset);
      }
    }).catch(() => {
      // Fallback to Intersection Observer
      createIntersectionObserverAnimation(element, variant, options, motionAnimation, offset);
    });

    return () => {};
  } catch (error) {
    // Fallback to Intersection Observer
    return createIntersectionObserverAnimation(element, variant, options, motionAnimation, offset);
  }
}

/**
 * Fallback implementation using Intersection Observer
 */
function createIntersectionObserverAnimation(
  element: HTMLElement,
  variant: VariantWithTransition,
  options: AnimationOptions,
  motionAnimation: MotionAnimationService,
  offset = '0px'
): (() => void) {
  const styles = extractStyleProperties(variant);
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          motionAnimation.animate(element, styles, options);
          observer.unobserve(element); // Run only once
        }
      });
    },
    {
      rootMargin: offset,
      threshold: 0.1
    }
  );

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
}

/**
 * Creates a simple sequenced animation (alternative to timeline)
 * @param animations - Array of animation configurations
 * @param motionAnimation - Motion animation service
 * @returns Promise that resolves when all animations complete
 */
export function createSequencedAnimations(
  animations: Array<{
    element: HTMLElement;
    keyframes: Record<string, any>;
    options?: AnimationOptions;
    delay?: number;
  }>,
  motionAnimation: MotionAnimationService
): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let completed = 0;
    const total = animations.length;

    animations.forEach((anim, index) => {
      // Handle Motion One's DynamicOption<number> type for delay
      const baseDelay = typeof anim.options?.delay === 'number' ? anim.options.delay : 0;
      const additionalDelay = anim.delay || 0;
      
      const delayedOptions = {
        ...anim.options,
        delay: baseDelay + additionalDelay,
        onComplete: () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        }
      };

      motionAnimation.animate(anim.element, anim.keyframes, delayedOptions);
    });

    if (total === 0) {
      resolve();
    }
  });
}

/**
 * Optimized animation control management
 * Better memory management and cleanup
 * @param controls - Current animation controls
 */
export function stopAllAnimationsOptimized(controls: AnimationControls): void {
  // Stop main animation
  if (controls.main) {
    controls.main.stop();
    controls.main = null;
  }
  
  // Stop child animations more efficiently
  if (controls.children.length > 0) {
    controls.children.forEach(control => control?.stop());
    controls.children.length = 0; // More efficient than recreating array
  }
}

/**
 * Batch applies styles to multiple elements efficiently
 * @param elements - Elements to style
 * @param variant - Style variant
 */
export function batchApplyStyles(elements: HTMLElement[], variant: VariantWithTransition): void {
  const styles = extractStyleProperties(variant);
  
  if (Object.keys(styles).length === 0) {
    return;
  }

  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    elements.forEach(element => {
      Object.assign(element.style, styles);
    });
  });
}