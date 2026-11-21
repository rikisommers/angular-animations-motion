import { StaggerConfig } from '../types/motion.types';

/**
 * Stagger utility functions for Motion One directive
 * Extracted from motion-one.directive.ts for better separation of concerns
 */

/**
 * Calculates stagger delay for a child element based on its index and stagger configuration
 * @param index - The index of the child element
 * @param totalChildren - Total number of children
 * @param config - Stagger configuration
 * @returns The calculated stagger delay in seconds
 */
export function calculateStaggerDelay(
  index: number,
  totalChildren: number,
  config: StaggerConfig
): number {
  const { staggerChildren, staggerDirection, delayChildren } = config;
  
  // Calculate the stagger index based on direction
  let staggerIndex: number;
  if (staggerDirection >= 0) {
    staggerIndex = index;
  } else {
    staggerIndex = totalChildren - 1 - index;
  }
  
  return delayChildren + (staggerIndex * staggerChildren);
}

/**
 * Calculates the total duration for all staggered children animations
 * @param totalChildren - Total number of children
 * @param config - Stagger configuration
 * @returns Total duration in seconds
 */
export function calculateTotalStaggerDuration(
  totalChildren: number,
  config: StaggerConfig
): number {
  const { staggerChildren, delayChildren } = config;
  return delayChildren + (totalChildren * staggerChildren);
}

/**
 * Determines if stagger should be applied based on configuration
 * @param staggerValue - The stagger value
 * @param childrenCount - Number of children
 * @returns True if stagger should be applied
 */
export function shouldApplyStagger(staggerValue: number, childrenCount: number): boolean {
  return staggerValue > 0 && childrenCount > 0;
}

/**
 * Creates a stagger configuration object from individual values
 * @param staggerChildren - Stagger children value
 * @param staggerDirection - Stagger direction
 * @param delayChildren - Delay children value
 * @param when - When to animate parent relative to children
 * @returns StaggerConfig object
 */
export function createStaggerConfig(
  staggerChildren: number,
  staggerDirection: number,
  delayChildren: number,
  when: 'beforeChildren' | 'afterChildren' | 'together'
): StaggerConfig {
  return {
    staggerChildren,
    staggerDirection,
    delayChildren,
    when
  };
}

/**
 * Filters out self from child directives list
 * @param allChildren - All child directives including self
 * @param self - The parent directive instance
 * @returns Filtered list excluding self
 */
export function filterChildDirectives<T>(allChildren: T[], self: T): T[] {
  return allChildren.filter(child => child !== self);
}