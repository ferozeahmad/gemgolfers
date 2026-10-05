import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CourseHoleSet } from 'app/shared/models/course.model';
import { Course } from 'app/shared/models/course.model';
import { FacadeService } from '../../../../shared/services/facade.service';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
  selector: 'app-dialog-course-details',
  templateUrl: './dialog-course-details.component.html',
  styleUrls: ['./dialog-course-details.component.scss']
})
export class DialogCourseDetailsComponent implements OnInit {
  currentCourse: any;
  par: string;
  index: void;
  slopeRating: string;
  courseRating: string;
  CourseName: string;
  CourseCity: string;
  NoOfHoles: string;
  CourseCountry: string;



  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private facadeService: FacadeService,
    private logger: LogsService
  ) { }

  async ngOnInit() {
    this.logger.log('Course Details Dialog Opened', "info", this.data?.course);

    //console.log(this.data);
    ////console.log( this.data.course["TournamentQL"][0]["CourseQL"].id);
    this.currentCourse = <CourseHoleSet>(
      await this.facadeService.getCourseByID( this.data.course)
    );
    //console.log(this.currentCourse);
    this.logger.log('Getting Course Details in Course Details Dialog Successful', "info", this.data?.course);

    this.par=this.currentCourse["course"][0].par;
    // this.index=this.currentCourse["course"][0].index;
    this.slopeRating=this.currentCourse["course"][0].slopeRating
    this.courseRating=this.currentCourse["course"][0].courseRating
    this.CourseCity=this.currentCourse["course"][0].city
    this.CourseCountry=this.currentCourse["course"][0].country
    this.NoOfHoles=this.currentCourse["course"][0].noOfHoles
    this.CourseName=this.currentCourse["course"][0].name
    //console.log(this.par);
    
  }

}
