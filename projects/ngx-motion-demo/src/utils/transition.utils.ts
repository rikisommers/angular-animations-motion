import { AnimationOptions } from 'motion';
import { TransitionOptions, VariantWithTransition } from '../types/motion.types';
import { MotionAnimationService } from '../services/motion-animation.service';
import { getEasing } from './animation.utils';

/**
 * Transition utility functions for handling Motion One transitions
 * Extracted from motion-one.directive.ts for better separation of concerns
 */

/**
 * Generic helper to get transition values with priority order
 * Priority: 1. State-specific transition, 2. Global transition, 3. Default value
 * @param animateTransition - State-specific transition from animate property
 * @param globalTransition - Global transition object
 * @param key - The transition property key to retrieve
 * @param defaultValue - Default value if not found in transitions
 * @returns The resolved transition value
 */
export function getTransitionValue<T>(
  animateTransition: TransitionOptions | undefined,
  globalTransition: TransitionOptions,
  key: keyof TransitionOptions,
  defaultValue: T
): T {
  const stateTransition = animateTransition;
  const transitionObj = stateTransition || globalTransition || {};
  
  return (transitionObj[key] as T) ?? defaultValue;
}

/**
 * Gets stagger value from transitions with fallback
 * @param animateTransition - State-specific transition
 * @param globalTransition - Global transition
 * @param fallbackValue - Fallback stagger value
 * @returns Resolved stagger value
 */
export function getStaggerValue(
  animateTransition: TransitionOptions | undefined,
  globalTransition: TransitionOptions,
  fallbackValue: number
): number {
  return getTransitionValue(animateTransition, globalTransition, 'staggerChildren', fallbackValue);
}

/**
 * Gets stagger direction from transitions with fallback
 * @param animateTransition - State-specific transition
 * @param globalTransition - Global transition
 * @param fallbackValue - Fallback stagger direction
 * @returns Resolved stagger direction
 */
export function getStaggerDirection(
  animateTransition: TransitionOptions | undefined,
  globalTransition: TransitionOptions,
  fallbackValue: number
): number {
  return getTransitionValue(animateTransition, globalTransition, 'staggerDirection', fallbackValue);
}

/**
 * Gets delay children value from transitions
 * @param animateTransition - State-specific transition
 * @param globalTransition - Global transition
 * @returns Resolved delay children value
 */
export function getDelayChildren(
  animateTransition: TransitionOptions | undefined,
  globalTransition: TransitionOptions
): number {
  return getTransitionValue(animateTransition, globalTransition, 'delayChildren', 0);
}

/**
 * Gets when value from transitions with default
 * @param animateTransition - State-specific transition
 * @param globalTransition - Global transition
 * @returns Resolved when value
 */
export function getWhen(
  animateTransition: TransitionOptions | undefined,
  globalTransition: TransitionOptions
): 'beforeChildren' | 'afterChildren' | 'together' {
  return getTransitionValue(animateTransition, globalTransition, 'when', 'together');
}

/**
 * Converts repeat value from transition object to Motion One format
 * @param transitionObj - The transition object
 * @param fallbackRepeat - Fallback repeat value
 * @returns Motion One compatible repeat value
 */
export function getRepeatValue(transitionObj: TransitionOptions, fallbackRepeat: boolean): number {
  if (transitionObj.repeat !== undefined) {
    if (transitionObj.repeat === true) {
      return Infinity;
    } else if (typeof transitionObj.repeat === 'number') {
      return transitionObj.repeat;
    }
  }
  
  return fallbackRepeat ? Infinity : 0;
}

/**
 * Builds Motion One animation options from transition configuration
 * @param targetState - Target state variant (for state-specific transitions)
 * @param globalTransition - Global transition object
 * @param staggerDelay - Stagger delay override
 * @param directiveInputs - Directive input values for fallbacks
 * @param motionAnimation - Motion animation service for easing
 * @param onComplete - Animation completion callback
 * @returns Motion One compatible animation options
 */
export function buildAnimationOptions(
  targetState: VariantWithTransition | undefined,
  globalTransition: TransitionOptions,
  staggerDelay: number,
  directiveInputs: {
    duration: number;
    delay: number;
    easing: string;
    repeat: boolean;
  },
  motionAnimation: MotionAnimationService,
  onComplete?: () => void
): AnimationOptions {
  const stateTransition = targetState?.transition;
  const transitionObj = stateTransition || globalTransition || {};
  
  // Always prioritize stagger delay over any other delay settings
  const delay = staggerDelay > 0 ? staggerDelay : (transitionObj.delay ?? directiveInputs.delay);
  
  return {
    duration: transitionObj.duration ?? directiveInputs.duration,
    delay: delay,
    ease: getEasing(transitionObj.ease ?? directiveInputs.easing, motionAnimation),
    repeat: getRepeatValue(transitionObj, directiveInputs.repeat),
    repeatDelay: transitionObj.repeatDelay,
    onComplete
  } as AnimationOptions;
}