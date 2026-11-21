import { animate } from '../services/motion-browser-safe';

/**
 * Motion One related type definitions
 * Centralized types for better maintainability
 */

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

export type AnimationState = 'initial' | 'animate' | 'exit' | 'hover' | 'tap' | 'focus' | 'inView';

export interface AnimationControls {
  main: ReturnType<typeof animate> | null;
  children: ReturnType<typeof animate>[];
}

export interface StaggerConfig {
  staggerChildren: number;
  staggerDirection: number;
  delayChildren: number;
  when: 'beforeChildren' | 'afterChildren' | 'together';
}