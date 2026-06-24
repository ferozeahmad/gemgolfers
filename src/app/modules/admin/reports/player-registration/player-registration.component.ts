import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { Constants } from 'app/shared/classes/general';
import { PlayerRegistrationService } from './player-registration.service';
import { PlayerRegistrationFormComponent } from './player-registration-form/player-registration-form.component';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
  selector: 'app-player-registration',
  templateUrl: './player-registration.component.html',
  styleUrls: ['./player-registration.component.scss'],
  standalone:false,
})
export class PlayerRegistrationComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedColumns: string[] = [
    'firstName',
    'lastName',
    'handicap',
    'date',
    'amount',
    'actions',
  ];

  dataSource: MatTableDataSource<any>;
  filterForm: FormGroup;
  isLoading = false;
  loggedInUser: any;
  clubId: string;
  minDate: Date;
  maxDate: Date;
  totalAmountToday: number = 0;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private fb: FormBuilder,
    private _playerRegistrationService: PlayerRegistrationService,
    private _localStorage: LocalStorageService,
    private _dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private _logger: LogsService
  ) {
    this.dataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this._logger.log('PlayerRegistrationComponent initialized', "info");
    this.loggedInUser = this._localStorage.get(Constants.LOGGED_IN_USER);
    this.clubId = this.loggedInUser?.clubId || '';
    this._logger.log(`Logged in user: ${this.loggedInUser?.id}, Club ID: ${this.clubId}`, "info");

    // Initialize filter form with current date
    const today = new Date();
    this.filterForm = this.fb.group({
      selectedDate: [today, [Validators.required]],
      searchInputControl: [''],
    });
    this._logger.log('Filter form initialized with todays date', "info", today.toISOString());

    // Set min and max dates for date picker
    this.minDate = new Date(2000, 0, 1);
    this.maxDate = new Date();

    // Subscribe to guest entries
    this._playerRegistrationService.guestEntries$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((entries) => {
        this.dataSource = new MatTableDataSource(entries);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
        this._logger.log(`Guest entries updated. Total entries: ${entries.length}`, "info");
      });

    // Listen for search input changes
    this.filterForm.get('searchInputControl')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe((value) => {
        this.applySearchFilter(value);
      });

    // Load initial data
    this.loadGuestEntries();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this._logger.log('Paginator and sort initialized after view init', "info");
  }

  /**
   * Load guest entries based on selected date
   */
  loadGuestEntries(): void {
    this.isLoading = true;
    this._logger.log('Loading guest entries...', "info");
    const selectedDate = this.filterForm.get('selectedDate')?.value;
    
    if (selectedDate) {
      const dateString = this.formatDate(selectedDate);
      this._logger.log(`Fetching guest entries for date: ${dateString}`, "info");
      this._playerRegistrationService
        .getGuestEntries(this.clubId, dateString)
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe({
          next: (entries) => {
            this.dataSource.data = entries;
            this.totalAmountToday = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
            this.isLoading = false;
            this._logger.log(`Successfully loaded ${entries.length} guest entries. Total amount: ${this.totalAmountToday}`, "info");
          },
          error: (error) => {
            console.error('Error loading guest entries:', error);
            this._logger.log(`Error loading guest entries: ${error.message}`, "error", error);
            this._snackBar.open('Error loading data', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            });
            this.isLoading = false;
          },
        });
    } else {
      this._logger.log('No date selected for loading guest entries.', "warn");
    }
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  /**
   * Open add/edit form dialog
   */
  openFormDialog(entry?: any): void {
    const dialogTitle = entry ? 'Edit Guest Entry' : 'Add New Guest Entry';
    this._logger.log(`Opening form dialog for: ${dialogTitle}`, "info", entry);
    const dialogRef = this._dialog.open(PlayerRegistrationFormComponent, {
      width: '500px',
      data: {
        entry: entry || null,
        clubId: this.clubId,
        selectedDate: this.formatDate(
          this.filterForm.get('selectedDate')?.value
        ),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadGuestEntries();
        this._logger.log(`Guest entry form dialog closed with success. Result:`, "info", result);
        this._snackBar.open('Guest entry saved successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        });
      } else {
        this._logger.log('Guest entry form dialog closed without saving.', "info");
      }
    });
  }

  /**
   * Delete guest entry
   */
  deleteEntry(entry: any): void {
    this._logger.log(`Attempting to delete guest entry with ID: ${entry.id}`, "warn", entry);
    if (confirm('Are you sure you want to delete this entry?')) {
      this.isLoading = true;
      const dateString = this.formatDate(
        this.filterForm.get('selectedDate')?.value
      );
      this._logger.log(`User confirmed deletion for entry ID: ${entry.id} on date: ${dateString}`, "warn");

      this._playerRegistrationService
        .deleteGuestEntry(entry.id, this.clubId, dateString)
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe({
          next: () => {
            this.loadGuestEntries();
            this._logger.log(`Successfully deleted guest entry with ID: ${entry.id}`, "info");
            this._snackBar.open('Guest entry deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
            });
          },
          error: (error) => {
            console.error('Error deleting entry:', error);
            this._logger.log(`Error deleting guest entry ID ${entry.id}: ${error.message}`, "error", error);
            this._snackBar.open('Error deleting entry', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            });
            this.isLoading = false;
          },
        });
    } else {
      this._logger.log(`User cancelled deletion for entry ID: ${entry.id}`, "info");
    }
  }

  /**
   * Apply date filter
   */
  applyFilter(): void {
    this._logger.log('Applying date filter.', "info", this.filterForm.get('selectedDate')?.value);
    this.loadGuestEntries();
  }

  /**
   * Apply search filter to the data source.
   * @param filterValue The value to filter by.
   */
  applySearchFilter(filterValue: string): void {
    this._logger.log(`Applying search filter: ${filterValue}`, "info");
    this.dataSource.filter = filterValue.trim();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
 
  /**
   * Reset filter to today's date
   */
  resetFilter(): void {
    const today = new Date();
    this.filterForm.patchValue({ selectedDate: today, searchInputControl: '' });
    this._logger.log('Resetting filter to todays date.', "info", today.toISOString());
    this.loadGuestEntries();
    this.applySearchFilter(''); // Also clear the search filter
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.complete();
    this._logger.log('PlayerRegistrationComponent destroyed.', "info");
  }
}
