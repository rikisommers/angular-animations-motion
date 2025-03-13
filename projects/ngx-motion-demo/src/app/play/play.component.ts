import { Component } from '@angular/core';
import { MotionOneDirective } from 'ngx-motion';

@Component({
  selector: 'app-play',
  imports: [
    MotionOneDirective
  ],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss',
  standalone: true,
})
export class PlayComponent {

}
