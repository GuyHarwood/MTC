import { Component, EventEmitter, OnInit, Output, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { SubmissionService } from '../services/submission/submission.service';
import { StorageService } from '../services/storage/storage.service';
import { AuditService } from '../services/audit/audit.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SpeechService } from '../services/speech/speech.service';
import { CheckStatusService } from '../services/check-status/check-status.service';
import { QuestionService } from '../services/question/question.service';
import { CheckCompleteService } from '../services/check-complete/check-complete.service';

@Component({
  selector: 'app-submission-pending',
  templateUrl: './submission-pending.component.html',
  styleUrls: ['./submission-pending.component.scss']
})
export class SubmissionPendingComponent implements OnInit, AfterViewInit, OnDestroy {
  private speechListenerEvent: any;

  @Output()
  clickEvent: EventEmitter<any> = new EventEmitter();

  public title;
  constructor(private storageService: StorageService,
              private submissionService: SubmissionService,
              private auditService: AuditService,
              private router: Router,
              private route: ActivatedRoute,
              private questionService: QuestionService,
              private speechService: SpeechService,
              private checkStatusService: CheckStatusService,
              private checkCompleteService: CheckCompleteService,
              private elRef: ElementRef) {
  }

  async ngOnInit() {
    if (this.checkStatusService.hasFinishedCheck()) {
      await this.router.navigate(['/check-complete']);
      return;
    }
    const queryParams = this.route.snapshot.queryParams;
    this.title = queryParams && queryParams.unfinishedCheck ?
      'Uploading previous check' : 'You have finished';
    const startTime = Date.now();
    await this.checkCompleteService.submit(startTime);
  }

  ngAfterViewInit() {
    if (this.questionService.getConfig().speechSynthesis) {
      this.speechService.speakElement(this.elRef.nativeElement);

      this.speechListenerEvent = this.elRef.nativeElement.addEventListener('focus', (event) => {
        this.speechService.speakFocusedElement(event.target);
      }, true);
    }
  }

  ngOnDestroy(): void {
    // stop the current speech process if the page is changed
    if (this.questionService.getConfig().speechSynthesis) {
      this.speechService.cancel();

      this.elRef.nativeElement.removeEventListener('focus', this.speechListenerEvent, true);
    }
  }
}
