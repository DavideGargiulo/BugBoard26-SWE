import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../../_internalComponents/sidebar/sidebar";
import { ToastComponent } from "../../_internalComponents/toast/toast";

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  imports: [RouterOutlet, SidebarComponent, ToastComponent]
})
export class MainLayoutComponent {}
