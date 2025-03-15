// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MotionOneService } from './motion-one.service';

// @Component({
//   selector: 'animation-debug',
//   standalone: true,
//   imports: [CommonModule],
//   providers: [MotionOneService],
//   template: `
//     <div class="debug-panel">
//       <div class="debug-header">Animation Debug</div>
//       <div class="debug-timing">
//         <div>Fixed Delay: 2000ms</div>
//       </div>
//       <div class="debug-actions">
//         <button (click)="triggerExitAnimations()" class="debug-button">
//           Trigger Exit
//         </button>
//         <button (click)="findMotionElements()" class="debug-button">
//           Find Elements
//         </button>
//       </div>
//       <div class="debug-count" *ngIf="elementCount !== null">
//         Found {{ elementCount }} motion elements
//       </div>
//     </div>
//   `,
//   styles: [`
//     .debug-panel {
//       position: fixed;
//       bottom: 20px;
//       right: 20px;
//       background-color: rgba(0, 0, 0, 0.7);
//       color: white;
//       padding: 10px;
//       border-radius: 5px;
//       font-family: monospace;
//       z-index: 9999;
//       min-width: 200px;
//     }
//     .debug-header {
//       font-weight: bold;
//       margin-bottom: 5px;
//       border-bottom: 1px solid rgba(255, 255, 255, 0.3);
//     }
//     .debug-timing {
//       font-size: 0.8em;
//       color: #aaa;
//       margin-bottom: 10px;
//       padding: 5px;
//       background-color: rgba(255, 255, 255, 0.1);
//       border-radius: 3px;
//     }
//     .debug-actions {
//       display: flex;
//       flex-wrap: wrap;
//       gap: 5px;
//       margin-top: 10px;
//     }
//     .debug-button {
//       background-color: #444;
//       border: none;
//       color: white;
//       padding: 5px 8px;
//       border-radius: 3px;
//       font-size: 0.8em;
//       cursor: pointer;
//     }
//     .debug-button:hover {
//       background-color: #555;
//     }
//     .debug-count {
//       margin-top: 5px;
//       font-size: 0.8em;
//       color: #aaa;
//     }
//   `]
// })
// export class AnimationDebugComponent implements OnInit {
//   elementCount: number | null = null;

//   constructor(
//     private motionService: MotionOneService
//   ) {}

//   ngOnInit() {
//     console.log('Animation debug component initialized');
//   }

//   triggerExitAnimations() {
//     console.log('Manually triggering exit animations');
//     this.motionService.runAllExitAnimations();
//   }

//   findMotionElements() {
//     console.log('Finding motion elements');
//     const elements = this.motionService.getMotionElements();
//     this.elementCount = elements.length;
//     console.log(`Found ${elements.length} motion elements`);
//   }
// } 