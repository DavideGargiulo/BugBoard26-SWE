import { Component } from '@angular/core';
import { TopbarComponent } from "../_internalComponents/topbar/topbar";

@Component({
  selector: 'app-dashboard',
  imports: [TopbarComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent {

}
