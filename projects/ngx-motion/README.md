# NgxMotion

WIP - Trigger and control angular animations with a Framer Motion like workflow in template HTML.
Generated with [Angular CLI](https://github.com/angular/angular-cli) version 19.1.0.


## Setup

Make sure you have provideAnimations() in app config

```
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Router, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes , withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
  ]
};


```

Import motin directive in your component

```
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, Router, NavigationEnd , NavigationStart} from '@angular/router';
import { MotionDirective } from '../../../../dist/ngx-motion/';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MotionDirective
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent {
  title = 'ngx-motion-demo';
}

```


## Basic Example

```
 <div
    motion
    [initial]="{
    backgroundColor: 'red',
    scale: 1,
    transform: 'translateX(0px)'
    }"
    [animate]="{
    backgroundColor: 'blue',
    scale: 1,
    transform: 'translateX(100px)'
    }"
    [duration]="'.5s'"
    style="height: 100px; width: 100px; background-color: red"
>
    Hello World
</div>
```


## Variant Example

```
this.foodVariants = {
    egg: { opacity: 1, transform: 'translateX(0px)', backgroundColor: 'blue' },
    apple: { opacity: 1, transform: 'translateX(100px)', backgroundColor: 'green' },
    pasta: { opacity: 0.5, transform: 'scale(0.8)', backgroundColor: 'yellow' }
};

<div
    motion
    [variants]="foodVariants"
    [animate]="currentFood"
    style="
        height: 100px;
        width: 100px;
        background-color: red;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 100;
    "
    >
   {{currentFood}}
</div>

```

## MotionDirective

- @Input() initial: any = {};
- @Input() animate: any = {};
- @Input() exit: any = {};
- @Input() inView: any = {};
- @Input() duration = '0.3s';
- @Input() delay = '0s';
- @Input() repeat = false;
- @Input() exitDelay = '0s';
- @Input() easing = 'ease';
- @Input() offset = '0px';
- @Input() whileHover: any = {};
- @Input() staggerChildren = '0s';
- @Input() whileTap: any = {};
- @Input() whileFocus: any = {};
- @Input() whileInView: any = {};
- @Input() variants: any = {};
- @Output() animationComplete = new EventEmitter<void>();

Current Limitations:

- staggerChildren not complete.
- Dynamic animate values must be generated in ts, you cant set directly in the animate value.
- InView offset not complete.
- Repeat & offset only apply to inView animations.
- exitDelay not complete.

## MotionHostComponent

WIP - Atempt at Angular version of AnimatePresence.
So far unable to use @queue as expected using Animation Builder.
Relying on router event and getLongestDuration to delay the [motion] entry delay.

## MotionService

- scrollYProgress
- registerMotionElement
- unregisterMotionElement
- getMotionElements
- getAllElementsByRoute
- cancelAllAnimations
- runAllEnterAnimations
- runAllExitAnimations
- runAllEnterAnimationsForRoute
- getLongestExitDuration
- getLongestEnterDuration
- getLongestDurationForRoute
