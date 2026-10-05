import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
  selector: 'app-dialog-view-schedule',
  templateUrl: './dialog-view-schedule.component.html',
  styleUrls: ['./dialog-view-schedule.component.scss']
})
export class DialogViewScheduleComponent implements OnInit {

  public response: any;
  scheduleInfo: any;

  constructor(
      public dialogRef: MatDialogRef<DialogViewScheduleComponent>,
      private logger: LogsService,
      @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    this.logger.log('View Schedule Dialog Opened', "info", this.data?.schedule?.id);
    this.scheduleInfo = this.data.schedule;
    //console.log(this.scheduleInfo);
  }

  onNoClick(): void {
      this.logger.log('Admin Click on Close in View Schedule Dialog', "info");
      this.dialogRef.close();
  }

}
