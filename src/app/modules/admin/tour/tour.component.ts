import { Component, OnInit } from '@angular/core';
import { TourService } from './tour.service';
import { Subject, takeUntil } from 'rxjs';
import { DialogAddTourComponent } from '../dialogs/dialog-add-tour/dialog-add-tour.component';
import { MatDialog } from '@angular/material/dialog';
import { FacadeService } from 'app/shared/services/facade.service';
import { Constants, UniqueIdGenerator } from 'app/shared/classes/general';
import { Player, UserSessionModel } from 'app/shared/models/player.model';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
  selector: 'app-tour',
  templateUrl: './tour.component.html',
  styleUrls: ['./tour.component.scss']
})
export class TourComponent implements OnInit {

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  tours: any[];
  loggedInuser: UserSessionModel;

  constructor(
    private _tourService: TourService,
    public dialog: MatDialog,
    private facadeService: FacadeService,
    public _localStorage: LocalStorageService,
    private logger: LogsService,
  ) { }

  ngOnInit(): void {
    this.logger.log('Admin comes to Tours Page', "info");
    this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
    this._tourService.data$.pipe(takeUntil(this._unsubscribeAll))
      .subscribe((res) => {
        //console.log(res);
        this.tours = [];
        for (let tour of res) {
          let obj = {
            id: tour.id,
            title: tour.name,
            logo: tour.logo,
            date: tour.dateCreated,
            tournaments: tour.tournaments.length,
            members: tour.members.length,
            startDate:tour.startDate,
            endDate:tour.endDate,
          }
          this.tours.push(obj);
        }

      })
  }

  async addnewTour() {
    this.logger.log('Admin Click on Add New Tour in Tours Page', "info");
    const dialogRef = this.dialog.open(DialogAddTourComponent);
    dialogRef.afterClosed().subscribe(async (result) => {
      //console.log(result);
      this.logger.log(result ? 'Add Tour Dialog Confirmed in Tours Page' : 'Add Tour Dialog Cancelled in Tours Page', "info", result ? result.title : undefined);
      if (result) {
        let tour = {
          id: UniqueIdGenerator.generate(),
          adminId: this.loggedInuser.id,
          name: result.title,
          logo: null,
          dateCreated:new Date().toISOString(),
          startDate:result.startDate,
          endDate:result.endDate,
        }
        this.facadeService.addTour(tour, result.file).subscribe((result) => {
          //console.log(result);
          this.logger.log(result ? 'Tour Added Successfully' : 'Adding Tour Failed', result ? "info" : "error", { id: tour.id, name: tour.name });
          if (result) {
            this.tours.push({
              id: tour.id,
              title: tour.name,
              logo: result,
              date: Date.now(),
              tournaments: 0,
              members: 0
            });
          }
        })

      }

    })

  }


  filterByQuery(query) {}

}
