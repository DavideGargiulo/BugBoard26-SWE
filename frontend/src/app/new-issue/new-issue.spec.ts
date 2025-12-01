import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewIssue } from './new-issue';

describe('NewIssue', () => {
  let component: NewIssue;
  let fixture: ComponentFixture<NewIssue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewIssue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewIssue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
