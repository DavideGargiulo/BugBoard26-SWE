import { Component } from '@angular/core';
import { User } from "../_internalComponents/user-card/user-card";
import { UserListComponent } from '../_internalComponents/users-list/users-list';
import { UserTopbar } from "../_internalComponents/user-topbar/user-topbar";

@Component({
  selector: 'app-users',
  imports: [UserListComponent, UserTopbar],
  templateUrl: './users.html'
})
export class UsersComponent {

  users: User[] = [
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },
      {
        name: 'Alice Johnson',
        role: 'Administrator'
      },

    ]

}