# NgxMotion

WIP - Trigger and control angular animations with a Framer Motion like workflow in template HTML.
Generated with [Angular CLI](https://github.com/angular/angular-cli) version 19.1.0.

## MotionDirective

  @Input() initial: any = {};
  @Input() animate: any = {};
  @Input() exit: any = {};
  @Input() inView: any = {};
  @Input() duration = '0.3s';
  @Input() delay = '0s';
  @Input() repeat = false;
  @Input() exitDelay = '0s';
  @Input() easing = 'ease';
  @Input() offset = '0px';
  @Input() whileHover: any = {};
  @Input() staggerChildren = '0s';
  @Input() whileTap: any = {};
  @Input() whileFocus: any = {};
  @Input() whileInView: any = {};
  @Input() variants: any = {};
  @Output() animationComplete = new EventEmitter<void>();

Current Limitations:
* staggerChildren not running stil in progress
* dynamic animate values must be generated in ts, you cant use directly in the animate value.
* InView offset not complete.
* Repeat & offset only apply to inView animations.
* exitDelay not complete.


## MotionHostComponent

WIP - Atempt at Angular version of AnimatePresence.
Not quite there yet. So far unable to use @queue as expected using Animation Builder.
Relying on router event and getLongestDuration to delay the [motion] entry delay.


## MotionService

scrollYProgress 
registerMotionElement
unregisterMotionElement
getMotionElements
getAllElementsByRoute
cancelAllAnimations
runAllEnterAnimations
runAllExitAnimations
runAllEnterAnimationsForRoute
getLongestExitDuration
getLongestEnterDuration
getLongestDurationForRoute
