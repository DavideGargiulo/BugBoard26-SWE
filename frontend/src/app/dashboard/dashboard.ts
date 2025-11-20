import { Component } from '@angular/core';
import { TopbarComponent } from "../topbar/topbar";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-dashboard',
  imports: [TopbarComponent, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent {

}
