/*
 * Public API Surface of ngx-motion
 */

// Original ngx-motion exports
export * from './lib/ngx-motion.module';
export * from './lib/ngx-motion.directive'; 
export { MotionService } from './lib/services/ngx-motion.service';
export * from './lib/motion-host/motion-host.component';
export * from './lib/motion-host/motion-page-transition';   

// Motion One specific exports
export * from './lib/ngx-motion-one.directive';
export * from './lib/ngx-motion-one-presence.component';
export * from './lib/services/ngx-motion-one.service';
export * from './lib/services/motion-animation.service';
export * from './lib/directives/motion-if.directive';

// Animation routing exports
export * from './lib/services/animation-router.service';
export * from './lib/guards/animation-guard';
export * from './lib/router/animation-route-reuse-strategy';

// Debug tools
export * from './lib/debug/animation-debug.component';