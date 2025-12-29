import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../../_internalComponents/sidebar/sidebar";
import { ToastComponent } from "../../_internalComponents/toast/toast";

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  imports: [CommonModule, RouterOutlet, SidebarComponent, ToastComponent]
})
export class MainLayoutComponent {
  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }
}