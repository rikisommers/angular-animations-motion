import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions, RouteReuseStrategy } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

// Import our custom Route Reuse Strategy
import { AnimationRouteReuseStrategy } from './router/animation-route-reuse-strategy';

// Using Route Reuse Strategy approach for animations
// This keeps the previous component alive during navigation to allow exit animations to complete

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideAnimations(), // Required for animations to work
    
    // Route Reuse Strategy for animations
    { provide: RouteReuseStrategy, useClass: AnimationRouteReuseStrategy }
  ]
};
