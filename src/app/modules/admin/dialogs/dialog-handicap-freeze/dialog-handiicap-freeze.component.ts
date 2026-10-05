import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FacadeService } from 'app/shared/services/facade.service';
import { HandicapService } from 'app/shared/services/handicap.service';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-dialog-handicap-freeze',
    templateUrl: './dialog-handiicap-freeze.component.html',
    styleUrls: ['./dialog-handiicap-freeze.component.scss'],
})
export class DialoghandicapFreezeComponent implements OnInit {
    show: boolean = false;
    showPanelty: boolean = false;
    form: FormGroup;
    tees: any[] = [];

    constructor(
        public dialogRef: MatDialogRef<DialoghandicapFreezeComponent>, private handicapService: HandicapService, public snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: any, public facadeService: FacadeService,
        private logger: LogsService,
    ) { }

    async ngOnInit() {
        this.logger.log('Handicap Freeze Dialog Opened', "info", { playerId: this.data?.player?.id });
        let endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 2);

        this.form = new FormGroup({
            startDate: new FormControl(new Date(), [Validators.required]),
            endDate: new FormControl(endDate, [Validators.required]),
        });

        console.log(this.data);
    }
    onNoClick(): void {
        this.logger.log('Admin Click on Cancel in Handicap Freeze Dialog', "info");
        this.dialogRef.close();
    }
    async changeTee() {
        this.logger.log('Admin Click on Freeze Handicap in Handicap Freeze Dialog', "info", { playerId: this.data?.player?.id });
        console.log(this.form.getRawValue());
        try {
            let formValue = this.form.getRawValue();
            let startDate = new Date(formValue?.startDate).toLocaleDateString('en-CA');
            let endDate = new Date(formValue?.endDate).toLocaleDateString('en-CA');
            let response = await this.facadeService.freezePlayerHandicap(this.data.player.id, startDate, endDate);
            if (response) {
                this.logger.log('Player Handicap Freeze Successful', "info", { playerId: this.data?.player?.id, startDate: startDate, endDate: endDate });
                this.snackBar.open('Handicap Freeze successfully!.', 'x', {
                    duration: 2000,
                });
                this.dialogRef.close(true);
            }
        } catch (error) {
            this.logger.log('Player Handicap Freeze Failed', "error", error?.toString());
            this.snackBar.open('Error!.', 'x', {
                duration: 5000,
            });
        }
    }
}
