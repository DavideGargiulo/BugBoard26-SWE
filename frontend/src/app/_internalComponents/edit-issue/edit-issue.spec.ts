import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditIssue } from './edit-issue';

describe('EditIssue', () => {
  let component: EditIssue;
  let fixture: ComponentFixture<EditIssue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditIssue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditIssue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
