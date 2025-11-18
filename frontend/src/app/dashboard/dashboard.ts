import { Component } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar";
import { TopbarComponent } from "../topbar/topbar";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-dashboard',
  imports: [SidebarComponent, TopbarComponent, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent {

}
