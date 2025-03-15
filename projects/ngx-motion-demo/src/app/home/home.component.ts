import { Component } from '@angular/core';
import { MotionOneDirective } from '../../directives/motion-one.directive';
import { MotionIfDirective } from '../../directives/motion-if.directive';

type VariantName = 'hidden' | 'visible';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MotionOneDirective,
    MotionIfDirective
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  host: {
    'class': 'flex w-full h-full'
  }
})
export class HomeComponent {
  constructor() {
    console.log('Home component initialized');
  }

  status: VariantName = 'hidden';
  status2 = false;
  status3 = true;

  foodVariants = {
    hidden: { display: 'none', opacity: 0.5, transform: 'translateX(-100px)', backgroundColor: 'red' },
    visible: { display: 'block', opacity: 1, transform: 'translateX(0px)', backgroundColor: 'blue' }
  };

  // Variants for toggle animation
  toggleVariants = {
    hidden: { 
      display: 'none',
      opacity: 0, 
      backgroundColor: 'red',
      height: '0px',
      transition: {
        duration: 0.5,
        ease: 'ease-in-out'
      }
    },
    visible: { 
      display: 'block',
      opacity: 1, 
      backgroundColor: 'blue',
      height: 'auto',
      transition: {
        duration: 0.5,
        ease: 'ease-in-out'
      }
    }
  };

  changeStatus() {
    this.status = this.status === 'hidden' ? 'visible' : 'hidden';
  }

  changeStatus2() {
    this.status2 = !this.status2;
  }
  
  toggleStatus3() {
    this.status3 = !this.status3;
    console.log('Status3 toggled:', this.status3);
  }
}
