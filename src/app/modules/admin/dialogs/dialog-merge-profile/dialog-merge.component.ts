import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-dialog-merge',
    templateUrl: './dialog-merge.component.html',
    styleUrls: ['./dialog-merge.component.scss'],
})
export class DialogMergeComponent implements OnInit {
    show: boolean = false;
    showPanelty: boolean = false;
    form: FormGroup;

    ngOnInit() {
        this.logger.log('Merge Profile Dialog Opened', "info", { isPanelty: this.data?.isPanelty });
        this.form = new FormGroup({
            count: new FormControl('', [Validators.required]),
        });
        this.form.get('count').clearValidators();
        this.form.get('count').updateValueAndValidity();
        this.showPanelty=this.data.isPanelty;
    }
    constructor(
        public dialogRef: MatDialogRef<DialogMergeComponent>,
        private logger: LogsService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    onNoClick(): void {
        this.logger.log('Admin Click on Cancel in Merge Profile Dialog', "info");
        this.dialogRef.close();
    }
    toggle(event) {
        this.logger.log('Admin Toggles Checkbox in Merge Profile Dialog', "info", event?.checked);
        //console.log(event);
        this.show = event.checked;

        if (this.show) {
            this.form.get('count').addValidators([Validators.required]);

        } else {
            this.form.get('count').clearValidators();
        }
        this.form.get('count').updateValueAndValidity();
    }
}
