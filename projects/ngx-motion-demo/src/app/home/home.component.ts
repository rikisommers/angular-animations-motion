import { Component } from '@angular/core';
import { MotionOneDirective } from 'ngx-motion';
@Component({
  selector: 'app-home',
  imports: [
    MotionOneDirective
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,
  host: {
    'class': 'flex w-full h-full'
  }
})
export class HomeComponent {

}
