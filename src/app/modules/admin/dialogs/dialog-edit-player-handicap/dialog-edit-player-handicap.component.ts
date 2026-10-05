import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
  selector: 'app-dialog-edit-player-handicap',
  templateUrl: './dialog-edit-player-handicap.component.html',
  styleUrls: ['./dialog-edit-player-handicap.component.scss']
})

export class DialogEditPlayerHandicapComponent implements OnInit {


  public playersForm: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<DialogEditPlayerHandicapComponent>,
    private _formBuilder: FormBuilder,
    private logger: LogsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.logger.log('Edit Player Handicap Dialog Opened', "info", { playerId: this.data?.player?.id, handicap: this.data?.player?.handicap });

    this.playersForm = this._formBuilder.group({
      handicap: ['', [Validators.required]],
    });

    this.playersForm.patchValue({
      handicap: this.data.player.handicap
    });
  }


  onNoClick(): void {
    this.logger.log('Admin Click on Cancel in Edit Player Handicap Dialog', "info");
    this.dialogRef.close();
  }

  onSaveClick(): void {
    this.logger.log('Admin Click on Save in Edit Player Handicap Dialog', "info", { playerId: this.data?.player?.id, handicap: this.playersForm?.value?.handicap });
    this.dialogRef.close(this.playersForm.value);
  }

}
