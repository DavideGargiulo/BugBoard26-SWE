import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueCard } from './issue-card';

describe('IssueCard', () => {
  let component: IssueCard;
  let fixture: ComponentFixture<IssueCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
