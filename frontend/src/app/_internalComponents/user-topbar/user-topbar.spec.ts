import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTopbar } from './user-topbar';

describe('UserTopbar', () => {
  let component: UserTopbar;
  let fixture: ComponentFixture<UserTopbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTopbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTopbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
