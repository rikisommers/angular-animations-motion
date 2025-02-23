import { NgModule } from '@angular/core';
import { MotionDirective } from './ngx-motion.directive';
import { MotionHostComponent } from './motion-host/motion-host.component';
@NgModule({
  declarations: [
    MotionDirective,
  ],
  imports: [
    MotionHostComponent
  ],
  exports: [
    MotionDirective,
    MotionHostComponent
  ]
})
export class NgxMotionModule { }
