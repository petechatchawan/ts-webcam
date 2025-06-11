import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Webcam Demo';
  isWebcamSupported = true;

  constructor(private router: Router) {
    // Check if the browser supports the MediaDevices API
    this.isWebcamSupported = !!(
      navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }

  get isWebcamRoute(): boolean {
    return this.router.url.includes('/webcam');
  }
}
