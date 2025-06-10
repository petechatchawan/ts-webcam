import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>Webcam Demo</h1>
        <nav>
          <a routerLink="/webcam" routerLinkActive="active">Webcam Demo</a>
        </nav>
      </header>
      <main class="app-content">
        <router-outlet></router-outlet>
        <div *ngIf="!isWebcamSupported" class="browser-support-warning">
          <h3>Webcam Access Not Supported</h3>
          <p>
            Your browser does not support webcam access or you haven't granted the necessary
            permissions.
          </p>
          <p>Please try using a modern browser like Chrome, Firefox, or Edge.</p>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .app-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: Arial, sans-serif;
      }

      .app-header {
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }

      .app-header h1 {
        margin: 0 0 10px 0;
        color: #333;
      }

      nav {
        display: flex;
        gap: 15px;
      }

      nav a {
        text-decoration: none;
        color: #666;
        padding: 5px 10px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      nav a:hover,
      nav a.active {
        background-color: #f0f0f0;
        color: #007bff;
      }

      .browser-support-warning {
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        color: #856404;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
      }

      .browser-support-warning h3 {
        margin-top: 0;
        color: #856404;
      }

      .browser-support-warning p {
        margin: 0.5rem 0 0 0;
      }

      .browser-support-warning p:last-child {
        margin-bottom: 0;
      }
    `
  ]
})
export class AppComponent {
  title = 'Webcam Demo';
  isWebcamSupported = true;

  constructor() {
    // Check if the browser supports the MediaDevices API
    this.isWebcamSupported = !!(
      navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }
}
