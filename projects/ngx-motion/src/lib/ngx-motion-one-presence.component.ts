import { Component, Input, ContentChildren, QueryList, AfterContentInit, OnDestroy, ViewChild, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf, NgComponentOutlet } from '@angular/common';
import { MotionOneDirective } from './ngx-motion-one.directive';
import { MotionOneService } from './services/ngx-motion-one.service';
import { Router, NavigationStart, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'motion-one-presence',
  template: `
    <div class="router-container">
      <div *ngIf="previousComponent" class="router-component previous" [@.disabled]="true">
        <h1>Previous</h1>
        <ng-container *ngComponentOutlet="previousComponent"></ng-container>
      </div>
      <div class="router-component current">
        <h1>Current</h1>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .router-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .router-component {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
    .previous {
      z-index: 1;
    }
    .current {
      z-index: 2;
    }
  `],
  standalone: true,
  providers: [MotionOneService],
  imports: [RouterOutlet, NgIf, NgComponentOutlet]
})
export class MotionOnePresenceComponent implements AfterContentInit, OnDestroy {
  @Input() mode: 'sync' | 'wait' = 'wait';
  @ContentChildren(MotionOneDirective, { descendants: true }) 
  motionElements!: MotionOneDirective[];
  @ViewChild(RouterOutlet) routerOutlet?: RouterOutlet;
  
  previousComponent: any = null;
  private routerSubscription = new Subscription();
  private cachedElements: MotionOneDirective[] = [];
  
  constructor(
    private router: Router,
    private motionService: MotionOneService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Make component accessible globally for debugging
    (window as any).__motionPresenceComponent = this;
    
    // Listen for router events
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
          // Store the current component and run exit animations
          this.previousComponent = this.routerOutlet?.activatedRoute.snapshot.component;
          this.motionService.runAllExitAnimations();
      }
      if (event instanceof NavigationEnd) {
        
        this.motionService.runAllEnterAnimations();
       }
    });
  }
  
  ngAfterContentInit() {
    console.log('ngAfterContentInit');

  }
  
  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
    
    if (isPlatformBrowser(this.platformId)) {
      (window as any).__motionPresenceComponent = null;
    }
  }
  

  

 
}