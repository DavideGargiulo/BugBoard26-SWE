import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueDetail } from './issue-detail';

describe('IssueDetail', () => {
  let component: IssueDetail;
  let fixture: ComponentFixture<IssueDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
