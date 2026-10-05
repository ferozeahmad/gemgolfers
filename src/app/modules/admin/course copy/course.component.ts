import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewEncapsulation } from "@angular/core";
import { Apollo } from "apollo-angular";
import { Player, ClubMembership, UserSessionModel } from "app/shared/models/player.model";
import { FacadeService } from "app/shared/services/facade.service";
import {
  UniqueIdGenerator,
  generateGemId,
  Constants,
  General,
} from "app/shared/classes/general";
import { of } from "rxjs";
import { read, utils } from "xlsx";
import { LogsService } from "app/shared/services/logs.service";
import { Course } from "app/shared/models/course.model";
import { LocalStorageService } from "app/shared/services/localStorage";
import { FuseConfirmationService } from "@fuse/services/confirmation";

@Component({
    standalone: false,
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent implements OnInit {

  dataSource: MatTableDataSource<Course>
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  Courses: Course[] = [];
  displayedColumns = [
    "name",
    "noOfHoles",
    "par",
    "country",
    "city",
    "status",
    "action",
  ];
  courseData: any;
  public loggedInuser: UserSessionModel;
  constructor(
    private location: Router,
    private route: ActivatedRoute,
    private apollo: Apollo,
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    private facadeService: FacadeService,
    private logger: LogsService,
    public _localStorage: LocalStorageService,
    private _fuseConfirmationService: FuseConfirmationService,

  ) { }

  async ngOnInit() {
    this.logger.log('Admin comes to Courses Page', "info");

    this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
    let dataCourses: any;
    this.logger.log('Getting Courses Data', "info");
    if (this._localStorage.isSuperAdmin()) {
      dataCourses = await this.facadeService.getCoursesList();
    } else {
      dataCourses = await this.facadeService.getCoursesListbyID(this.loggedInuser.id);
    }
    this.Courses = dataCourses?.course;
    this.logger.log('Getting Courses Data Successful', "info", this.Courses?.length);
    //console.log(this.Courses)
    this.dataSource = new MatTableDataSource(this.Courses);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }


  redirectToUpdate = (id: string) => {
    this.logger.log('Admin Click on Edit in Courses Page', "info", id);
    this.location.navigate(["/course/update/" + id]);
  };

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createCourse() {
    this.logger.log('Admin Click on Create Course in Courses Page', "info");
    this.location.navigate(['/courses2/add']);
  }

  compelteCourse(id) {
    this.logger.log('Admin Click on Activate Course in Courses Page', "info", id);
    console.log(id);
    const confirmation = this._fuseConfirmationService.open({
      title: 'Course Status',
      message: 'Are you sure you want to activate this course?',
      actions: {
        confirm: {
          label: 'Confirm',
        },
      },
    });

    // Subscribe to the confirmation dialog closed action
    confirmation.afterClosed().subscribe(async (result) => {
      this.logger.log(result === 'confirmed' ? 'Admin confirmed Activate Course' : 'Admin cancelled Activate Course', "info", id);
      // If the confirm button pressed...
      if (result === 'confirmed') {
        try {
          const success = await this.facadeService.updateCourseStatus(id);
          console.log(success);

          if (success) {
            this.logger.log('Course status updated successfully', "info", id);
            // Update the dataSource data
            this.dataSource.data = this.dataSource.data.map(course => {
              if (course.id === id) {
                return { ...course, status: 'Active' };
              } else {
                return course;
              }
            });
            this.dataSource._updateChangeSubscription();
            // Optional: Refresh paginator if necessary
            //this.dataSource.paginator?.firstPage();
          }
        } catch (error) {
          this.logger.log('Updating Course status Failed', "error", error);
          console.error('Error updating course status:', error);
        }
      }
    })


  }
}
