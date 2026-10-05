import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {FormBuilder, Validators, FormGroup} from "@angular/forms";
import { Course } from '../../../../shared/models/course.model';
import { ClubSchedule } from '../../../../shared/models/club.model';
import { Player } from '../../../../shared/models/player.model';
import { FacadeService } from '../../../../shared/services/facade.service';
import { General, UniqueIdGenerator, Constants } from '../../../../shared/classes/general';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
  selector: 'app-dialog-club-schedule',
  templateUrl: './dialog-club-schedule.component.html',
  styleUrls: ['./dialog-club-schedule.component.scss']
})
export class DialogClubScheduleComponent implements OnInit {

  public collection: any;
  scheduleForm: FormGroup;
  copyFlights: boolean = false;
  Courses: Course[] = [];
  loggedInuser: Player;
  refresh: boolean = false;
  minDate: Date;
  maxDate: Date;

  constructor(
    public dialogRef: MatDialogRef<DialogClubScheduleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private fb: FormBuilder,
    private facadeService: FacadeService, public snackBar: MatSnackBar, private _localStorage: LocalStorageService,
    private logger: LogsService
  ) {}

  async ngOnInit() {
    this.logger.log('Club Schedule Dialog Opened', "info");
    this.scheduleForm = this.fb.group({
      courseId: ["", Validators.required],
      tournamentTitle: ["", Validators.required],
      date: ['09:00 AM', Validators.required],
      matchFormat: [Constants.MF_STROKE_PLAY, Validators.required],
      description: ['', Validators.required]
    });

    let today: Date = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    let todayDate: Date = General.parseToDate( mm + '/' + dd + '/' + yyyy);

    const currentYear = new Date().getFullYear();
    this.minDate = todayDate;
    this.maxDate = new Date(currentYear + 1, 11, 31);

    let dataCourses = await this.facadeService.getCoursesList();
    this.Courses = dataCourses.course;
  }

  onSubmit() {
    this.logger.log('Admin Click on Add Schedule in Club Schedule Dialog', "info", { courseId: this.scheduleForm?.value?.courseId, tournamentTitle: this.scheduleForm?.value?.tournamentTitle });
    // TODO: Use EventEmitter with form value
    
   this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);

    const schedule: any = {
      id: UniqueIdGenerator.generate(),
      clubId: this.loggedInuser.adminClubId,
      courseId: this.scheduleForm.value.courseId,
      tournamentTitle: this.scheduleForm.value.tournamentTitle,
      date: General.parseToDate(this.scheduleForm.value.date),
      matchFormat: this.scheduleForm.value.matchFormat,
      description: this.scheduleForm.value.description
    }

    //console.log(schedule.matchFormat);
    
    let result = this.facadeService.AddClubSchedule(schedule);

    if(result) {
      this.logger.log('Club Schedule Added Successfully', "info", { id: schedule.id, tournamentTitle: schedule.tournamentTitle });
      this.snackBar.open("Schedule has been added.", "x", {
        duration: 5000,
      });
      this.reset();
      this.refresh = true;
    }
  }  

  public reset() {
    this.scheduleForm.reset();
  }

}
