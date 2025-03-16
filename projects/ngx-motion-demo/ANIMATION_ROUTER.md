# Animation Router for Motion One

This document explains how the enhanced `AnimationRouterService` works to keep elements in the DOM until exit animations are complete during route changes, without using route guards.

## How It Works

The `AnimationRouterService` intercepts all navigation events, including RouterLink clicks, and manages the timing of route changes to ensure that exit animations complete before the actual route change occurs. Here's the process:

1. When a navigation starts (either from `NavigationStart` event or RouterLink click):
   - The service captures the current route and the target route
   - It runs exit animations for elements on the current route
   - It calculates the longest exit animation duration
   - If there are exit animations, it:
     - For RouterLink clicks: prevents the default navigation
     - For programmatic navigation: intercepts the navigation event
     - Waits for the exit animations to complete
     - Then navigates to the target route

2. This approach keeps elements in the DOM until their exit animations are complete, without using route guards.

## Benefits Over Route Guards

1. **No Guard Configuration**: You don't need to configure route guards for each route.
2. **Centralized Logic**: All animation timing logic is in one service.
3. **Better User Experience**: Elements stay in the DOM until their animations complete, providing a smoother transition.
4. **Fallback Safety**: A configurable fallback timeout ensures navigation completes even if animations fail.
5. **Works with RouterLinks**: Intercepts clicks on RouterLink elements to apply the same animation logic.

## Implementation Details

The service uses these key techniques:

1. **Navigation Interception**: Listens to router events to intercept programmatic navigation.
2. **RouterLink Interception**: Uses a global click listener to intercept RouterLink clicks.
3. **Animation Tracking**: Uses the `MotionOneService` to track and run exit animations.
4. **Delayed Navigation**: Delays navigation until animations complete.
5. **Fallback Mechanism**: Ensures navigation completes even if animations fail.

## Usage

1. **Remove Route Guards**: Remove any `canDeactivate` guards from your routes.

2. **Ensure Service is Provided**: Make sure `AnimationRouterService` is provided in your app module or component.

3. **Configure (Optional)**: You can configure debug mode and fallback timeout:
   ```typescript
   constructor(private animationRouter: AnimationRouterService) {
     animationRouter.enableDebug(true);
     animationRouter.setFallbackTimeout(2000); // 2 second fallback
   }
   ```

4. **Use Motion Directives**: Use the `motionone` directive on elements that should animate during route changes.

5. **For Programmatic Navigation**: Use the service's `navigateTo` method instead of the router's `navigate` or `navigateByUrl`:
   ```typescript
   // Instead of this:
   this.router.navigateByUrl('/some-route');
   
   // Use this:
   this.animationRouter.navigateTo('/some-route');
   ```

## Example

```html
<div motionone [exit]="{ opacity: 0, y: 20 }" [duration]="0.5">
  This element will animate out before the route changes
</div>

<!-- RouterLinks will automatically be intercepted -->
<a routerLink="/some-route">This link will wait for animations</a>
```

The element will fade out and move down before the route changes, and the route change will be delayed until the animation completes. 