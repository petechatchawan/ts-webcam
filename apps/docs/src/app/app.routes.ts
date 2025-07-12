import { Routes } from "@angular/router";
import { WebcamDemoComponent } from "./webcam-demo/webcam-demo.component";

export const routes: Routes = [
	{ path: "", redirectTo: "webcam-demo", pathMatch: "full" },
	{ path: "webcam-demo", component: WebcamDemoComponent },
];
