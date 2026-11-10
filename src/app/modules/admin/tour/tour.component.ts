import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TourService } from './tour.service';
import { DialogAddTourComponent } from '../dialogs/dialog-add-tour/dialog-add-tour.component';
import { FacadeService } from 'app/shared/services/facade.service';
import { Constants, UniqueIdGenerator } from 'app/shared/classes/general';
import { UserSessionModel } from 'app/shared/models/player.model';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import {
  STATUS_CLASSES,
  STATUS_LABELS,
  TourStatus,
  buildTourPayload,
  getDurationDays,
  getInitials,
  getProgress,
  getStatus,
  getTimingLabel,
} from './tour-utils';

export interface TourCard {
  id: string;
  title: string;
  logo: string | null;
  date: string;
  tournaments: number;
  members: number;
  startDate: string;
  endDate: string;
  status: TourStatus;
  statusLabel: string;
  statusClass: string;
  timing: string;
  progress: number;
  duration: number;
  initials: string;
}

type StatusFilter = 'all' | TourStatus;

@Component({
  standalone: false,
  selector: 'app-tour',
  templateUrl: './tour.component.html',
  styleUrls: ['./tour.component.scss']
})
export class TourComponent implements OnInit, OnDestroy {

  private _unsubscribeAll: Subject<any> = new Subject<any>();
  private rawTours: any[] = [];

  /** Every tour the user can see. */
  tours: TourCard[] = [];
  /** Tours after search + status filter are applied. */
  filteredTours: TourCard[] = [];
  loggedInuser: UserSessionModel;

  searchTerm = '';
  statusFilter: StatusFilter = 'all';
  counts: Record<StatusFilter, number> = { all: 0, ongoing: 0, upcoming: 0, completed: 0 };
  readonly statusTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ];

  constructor(
    private _tourService: TourService,
    public dialog: MatDialog,
    private facadeService: FacadeService,
    public _localStorage: LocalStorageService,
    private logger: LogsService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.logger.log('Admin comes to Tours Page', "info");
    this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
    this._tourService.data$.pipe(takeUntil(this._unsubscribeAll))
      .subscribe((res) => {
        this.rawTours = res || [];
        this.tours = this.rawTours.map((tour) => this.toCard(tour));
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  get isSuperAdmin(): boolean {
    return this._localStorage.isSuperAdmin();
  }

  private toCard(tour: any): TourCard {
    const status = getStatus(tour.startDate, tour.endDate);
    return {
      id: tour.id,
      title: tour.name,
      logo: tour.logo || null,
      date: tour.dateCreated,
      tournaments: tour.tournaments?.length ?? 0,
      members: tour.members?.length ?? 0,
      startDate: tour.startDate,
      endDate: tour.endDate,
      status,
      statusLabel: STATUS_LABELS[status],
      statusClass: STATUS_CLASSES[status],
      timing: getTimingLabel(tour.startDate, tour.endDate),
      progress: getProgress(tour.startDate, tour.endDate),
      duration: getDurationDays(tour.startDate, tour.endDate),
      initials: getInitials(tour.name),
    };
  }

  trackByFn(index: number, item: TourCard): string {
    return item.id || String(index);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Filtering
  // -----------------------------------------------------------------------------------------------------

  filterByQuery(query: string): void {
    this.searchTerm = query ?? '';
    this.applyFilters();
  }

  filterByStatus(status: StatusFilter): void {
    this.logger.log('Admin changes Status filter in Tours Page', "info", status);
    this.statusFilter = status;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.statusFilter !== 'all';
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.counts = {
      all: this.tours.length,
      ongoing: this.tours.filter(t => t.status === 'ongoing').length,
      upcoming: this.tours.filter(t => t.status === 'upcoming').length,
      completed: this.tours.filter(t => t.status === 'completed').length,
    };
    this.filteredTours = this.tours.filter(t =>
      (this.statusFilter === 'all' || t.status === this.statusFilter) &&
      (!term || (t.title || '').toLowerCase().includes(term))
    );
  }

  onLogoError(tour: TourCard): void {
    // The stored logo could not be loaded (deleted / broken link): fall back to the initials avatar.
    tour.logo = null;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Actions
  // -----------------------------------------------------------------------------------------------------

  addnewTour(): void {
    this.logger.log('Admin Click on Add New Tour in Tours Page', "info");
    const dialogRef = this.dialog.open(DialogAddTourComponent, { autoFocus: false });
    dialogRef.afterClosed().subscribe((result) => {
      this.logger.log(result ? 'Add Tour Dialog Confirmed in Tours Page' : 'Add Tour Dialog Cancelled in Tours Page', "info", result ? result.title : undefined);
      if (!result) {
        return;
      }
      const tour = buildTourPayload(result, this.loggedInuser.id, UniqueIdGenerator.generate());
      this.facadeService.addTour(tour, result.file).subscribe({
        next: () => {
          this.logger.log('Tour Added Successfully', "info", { id: tour.id, name: tour.name });
          this.snackBar.open(`"${tour.name}" has been created.`, 'Close', { duration: 3000 });
          // `tour.logo` now holds the uploaded logo URL (if a logo was chosen).
          this._tourService.setData([{ ...tour, tournaments: [], members: [] }, ...this.rawTours]);
        },
        error: (error) => {
          this.logger.log('Adding Tour Failed', "error", { id: tour.id, name: tour.name, error: error?.toString() });
          this.snackBar.open('Could not create the tour. Please try again.', 'Close', { duration: 4000 });
        },
      });
    });
  }
}
