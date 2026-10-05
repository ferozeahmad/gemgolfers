import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-dialog-overview',
    templateUrl: './dialog-overview.component.html',
    styleUrls: ['./dialog-overview.component.scss']
})
export class DialogOverviewComponent implements OnInit {
    ngOnInit() {
        this.logger.log('Overview Dialog Opened', "info");
    }
    constructor(
        public dialogRef: MatDialogRef<DialogOverviewComponent>,
        private logger: LogsService,
        @Inject(MAT_DIALOG_DATA) public message: any
    ) {}

    onNoClick(): void {
        this.logger.log('Admin Click on Close in Overview Dialog', "info");
        this.dialogRef.close();
    }
}
