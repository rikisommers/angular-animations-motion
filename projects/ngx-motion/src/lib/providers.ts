import { Provider } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { AnimationRouteReuseStrategy } from './router/animation-route-reuse-strategy';
import { MotionOneService } from './services/ngx-motion-one.service';

/**
 * Provides the NgxMotion services and configuration
 * @returns Array of providers for NgxMotion
 */
export function provideNgxMotion(): Provider[] {
  return [
    { provide: RouteReuseStrategy, useClass: AnimationRouteReuseStrategy },
    MotionOneService
  ];
} 