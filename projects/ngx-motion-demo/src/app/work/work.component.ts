import { Component } from '@angular/core';
import { MotionOneDirective } from 'ngx-motion';

@Component({
  selector: 'app-work',
  imports: [
    MotionOneDirective
  ],
  standalone: true,
  templateUrl: './work.component.html',
  styleUrl: './work.component.scss'
})
export class WorkComponent {

}
