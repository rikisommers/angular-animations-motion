import { NgModule } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { MotionDirective } from './ngx-motion.directive';
import { MotionHostComponent } from './motion-host/motion-host.component';
import { MotionOneDirective } from './ngx-motion-one.directive';
import { MotionIfDirective } from './directives/motion-if.directive';
import { MotionAnimationService } from './services/motion-animation.service';
import { AnimationRouterService } from './services/animation-router.service';
import { AnimationGuard } from './guards/animation-guard';
import { AnimationRouteReuseStrategy } from './router/animation-route-reuse-strategy';

@NgModule({
  imports: [
    MotionDirective,
    MotionHostComponent,
    MotionOneDirective,
    MotionIfDirective
  ],
  exports: [
    MotionDirective,
    MotionHostComponent,
    MotionOneDirective,
    MotionIfDirective
  ],
  providers: [
    MotionAnimationService,
    AnimationRouterService,
    AnimationGuard,
    {
      provide: RouteReuseStrategy,
      useClass: AnimationRouteReuseStrategy
    }
  ]
})
export class NgxMotionModule { }
