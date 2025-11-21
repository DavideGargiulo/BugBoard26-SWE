import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../../_internalComponents/sidebar/sidebar";

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  imports: [RouterOutlet, SidebarComponent]
})
export class MainLayoutComponent {}
