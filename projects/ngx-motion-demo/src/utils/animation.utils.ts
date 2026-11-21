import { MotionAnimationService } from '../services/motion-animation.service';
import { VariantWithTransition } from '../types/motion.types';

/**
 * Animation utility functions for Motion One directive
 * Extracted from motion-one.directive.ts for better separation of concerns
 */

/**
 * Normalizes color values to a consistent format for Motion One animations
 * @param color - The color value to normalize
 * @returns Normalized color string
 */
export function normalizeColor(color: string | undefined | null): string {
  if (!color) {
    return '';
  }
  
  // If it's already in rgb/rgba format, return as is
  if (color.startsWith('rgb')) {
    return color;
  }
  
  // Color mapping for named colors to hex
  const colorMap: Record<string, string> = {
    aqua: '#00ffff',
    red: '#ff0000',
    blue: '#0000ff',
    green: '#008000',
    yellow: '#ffff00',
    purple: '#800080',
    orange: '#ffa500',
    black: '#000000',
    white: '#ffffff'
  };
  
  return colorMap[color] || color;
}

/**
 * Extracts only style properties from a variant, excluding transition
 * @param variant - The variant object to extract styles from
 * @returns Object containing only style properties
 */
export function extractStyleProperties(variant: VariantWithTransition): Record<string, string | number> {
  if (!variant) return {};
  
  const result: Record<string, string | number> = {};
  
  for (const key in variant) {
    if (key !== 'transition') {
      // Handle color properties to ensure consistent formats
      if (key === 'backgroundColor' || key === 'color' || key === 'borderColor') {
        result[key] = normalizeColor(variant[key]);
      } else {
        result[key] = variant[key];
      }
    }
  }
  
  return result;
}

/**
 * Resolves easing string to Motion One easing function
 * @param easingString - The easing string or array
 * @param motionAnimation - The motion animation service
 * @returns Resolved easing function or array
 */
export function getEasing(
  easingString: string | number[] | undefined,
  motionAnimation: MotionAnimationService
): any {
  if (!easingString) {
    return motionAnimation.easeInOut;
  }

  if (Array.isArray(easingString)) {
    // Handle cubic bezier array
    return easingString;
  }

  const easingMap: Record<string, any> = {
    'ease-in': motionAnimation.easeIn,
    'ease-out': motionAnimation.easeOut,
    'ease-in-out': motionAnimation.easeInOut,
    'ease': motionAnimation.easeInOut // Default 'ease' to easeInOut
  };
  
  return easingMap[easingString] || motionAnimation.easeInOut;
}

/**
 * Applies styles to an element with optional requestAnimationFrame
 * @param element - The HTML element to apply styles to
 * @param variant - The variant containing styles
 * @param useRequestAnimationFrame - Whether to use requestAnimationFrame
 */
export function applyStylesToElement(
  element: HTMLElement,
  variant: VariantWithTransition,
  useRequestAnimationFrame = false
): void {
  const styles = extractStyleProperties(variant);
  
  if (styles && Object.keys(styles).length > 0) {
    if (useRequestAnimationFrame) {
      requestAnimationFrame(() => {
        Object.assign(element.style, styles);
      });
    } else {
      Object.assign(element.style, styles);
    }
  }
}

/**
 * Checks if a variant has any properties (excluding empty objects)
 * @param variant - The variant to check
 * @returns True if variant has properties
 */
export function hasVariantProperties(variant: VariantWithTransition): boolean {
  return Object.keys(variant).length > 0;
}

/**
 * Finds a key in an object by its value
 * @param object - The object to search
 * @param value - The value to find
 * @returns The key if found, undefined otherwise
 */
export function getKeyByValue<T>(object: Record<string, T>, value: T): string | undefined {
  return Object.keys(object).find((k) => object[k] === value);
}