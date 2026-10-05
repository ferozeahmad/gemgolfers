import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FacadeService } from 'app/shared/services/facade.service';
import { HandicapService } from 'app/shared/services/handicap.service';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-dialog-tee',
    templateUrl: './dialog-tee.component.html',
    styleUrls: ['./dialog-tee.component.scss'],
})
export class DialogTeeComponent implements OnInit {
    show: boolean = false;
    showPanelty: boolean = false;
    form: FormGroup;
    tees: any[] = [];
    constructor(
        public dialogRef: MatDialogRef<DialogTeeComponent>, private handicapService: HandicapService, public snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: any, public facadeService: FacadeService,
        private logger: LogsService,
    ) { }
    async ngOnInit() {
        this.logger.log('Change Tee Dialog Opened', "info", { playerId: this.data?.player?.playerId, tournamentId: this.data?.player?.tournamentId });
        this.form = new FormGroup({
            tee: new FormControl('', [Validators.required]),
        });

        console.log(this.data);

        let courseID = this.data.loggedInUser.courseId ?? '-LUFS3FCQKOGpJ2IEHmf';
        let tees = await this.facadeService.getTeesOfCourse(courseID);
        console.log(tees);
        this.tees = tees?.course_tees;


    }
    onNoClick(): void {
        this.logger.log('Admin Click on Cancel in Change Tee Dialog', "info");
        this.dialogRef.close();
    }
    async changeTee() {
        this.logger.log('Admin Click on Change Tee in Change Tee Dialog', "info", { playerId: this.data?.player?.playerId, tournamentId: this.data?.player?.tournamentId, teeId: this.form?.value?.tee?.tee_id });
        console.log(this.form.getRawValue());
        try {
            let formValue = this.form.getRawValue();
            let response = await this.facadeService.changePlayerTee(this.data.player.playerId, this.data.player.tournamentId, formValue?.tee?.tee_name?.key, formValue?.tee?.tee_id);
            if (response) {
                let newObj = {
                    playerId: this.data.player.playerId,
                    tournamentIds: [this.data.player.tournamentId]
                };
                await this.handicapService
                    .updatePlayerHandicapTee(newObj)
                    .then(async (response) => {
                        await this.handicapService.calculateHandicapWHS({ playerId: this.data.player.playerId, count: 1 }).then((res) => {
                            this.logger.log('Player Tee Changed Successfully', "info", { playerId: this.data?.player?.playerId, tournamentId: this.data?.player?.tournamentId });
                            this.snackBar.open('Tees Changed successfully!.', 'x', {
                                duration: 2000,
                            });
                            this.dialogRef.close(true);
                        })
                    })
                    .catch((err) => {
                        //console.log('error' + err);
                        this.logger.log('Updating Player Handicap After Tee Change Failed', "error", err?.toString());
                        this.snackBar.open('Error!.', 'x', {
                            duration: 5000,
                        });
                    });
            }
        } catch (error) {
            this.logger.log('Changing Player Tee Failed', "error", error?.toString());
            this.snackBar.open('Error!.', 'x', {
                duration: 5000,
            });
        }
    }
}
