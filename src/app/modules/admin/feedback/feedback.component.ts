import { Component, OnInit, ViewChild } from "@angular/core";
import { FacadeService } from "../../../shared/services/facade.service";
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogShowfeedbackComponent } from "../dialogs/dialog-showfeedback/dialog-showfeedback.component";
import { Constants, UniqueIdGenerator } from "app/shared/classes/general";
import { LocalStorageService } from "app/shared/services/localStorage";
import { UserSessionModel } from "app/shared/models/player.model";
import { LogsService } from "app/shared/services/logs.service";

export const FEEDBACK_STATUSES = [
  { value: 'pending',   label: 'Pending',   color: '#f97316' },
  { value: 'reviewing', label: 'Reviewing', color: '#3b82f6' },
  { value: 'resolved',  label: 'Resolved',  color: '#22c55e' },
];

@Component({
    standalone: false,
  selector: "app-feedback",
  templateUrl: "./feedback.component.html",
  styleUrls: ["./feedback.component.scss"],
})
export class FeedbackComponent implements OnInit {

  dataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  feedback: any[] = [];
  displayedColumns = ["id", "name", "type", "contact", "createdAt", "status", "details"];
  public loggedInuser: UserSessionModel;
  statuses = FEEDBACK_STATUSES;

  constructor(
    private facadeService: FacadeService,
    public dialog: MatDialog,
    public _localStorage: LocalStorageService,
    public snackBar: MatSnackBar, private logger: LogsService
  ) {}

  async ngOnInit() {
    this.logger.log('Admin comes to Feedback Page', "info");
    this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
    let feedbacks: any;
    if (this._localStorage.isSuperAdmin()) {
      feedbacks = await this.facadeService.getAllFeedback();
    } else {
      feedbacks = await this.facadeService.getAllFeedbackByUserId(this.loggedInuser.id);
    }
    this.feedback = feedbacks.feedback;
    this.logger.log('Getting Feedback Data Successful', "info", this.feedback?.length);
    this.dataSource = new MatTableDataSource(this.feedback);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  openDetail(row: any) {
    this.logger.log('Admin Click on View Details in Feedback Page', "info", row?.id);
    const dialogRef = this.dialog.open(DialogShowfeedbackComponent, {
      width: "600px",
      data: { feedback: row },
    });
    dialogRef.afterClosed().subscribe((newStatus: string | undefined) => {
      this.logger.log(newStatus ? 'Feedback status updated from Feedback detail dialog' : 'Admin closes Feedback detail dialog', "info", { id: row.id, status: newStatus });
      if (newStatus) {
        row.status = newStatus;
        this.dataSource._updateChangeSubscription();
      }
    });
  }

  addNewFeedback() {
    this.logger.log('Admin Click on Add New Feedback in Feedback Page', "info");
    const dialogRef = this.dialog.open(DialogShowfeedbackComponent, {
      width: "500px",
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.logger.log(result ? 'Admin submits New Feedback dialog' : 'Admin cancelled New Feedback dialog', "info");
      if (result) {
        const feedback = {
          id: UniqueIdGenerator.generate(),
          userId: this.loggedInuser.id,
          type: result.type,
          name: this.loggedInuser.firstName + ' ' + this.loggedInuser.lastName,
          contact: this.loggedInuser.email,
          message: result.message,
        };
        this.facadeService.addFeedback(feedback).then(() => {
          this.logger.log('Feedback submitted successfully', "info", { id: feedback.id, type: feedback.type });
          this.snackBar.open('Feedback submitted successfully!', 'x', { duration: 2000 });
          this.ngOnInit();
        });
      }
    });
  }

  markAllAs(status: string) {
    this.logger.log('Admin Click on Mark All in Feedback Page', "info", status);
    const s = this.statuses.find(s => s.value === status);
    const label = s?.label ?? status;
    if (!confirm(`Mark ALL ${this.feedback.length} feedback entries as "${label}"?`)) return;
    this.logger.log('Admin confirmed Mark All Feedback', "info", status);

    this.facadeService.updateAllFeedbackStatus(status).then((ok) => {
      if (ok) {
        this.logger.log('All Feedback status updated successfully', "info", status);
        this.feedback.forEach(f => f.status = status);
        this.dataSource._updateChangeSubscription();
        this.snackBar.open(`All feedback marked as ${label}`, 'x', { duration: 2500 });
      } else {
        this.logger.log('Updating All Feedback status Failed', "error", status);
        this.snackBar.open('Failed to update. Please try again.', 'x', { duration: 2500 });
      }
    });
  }

  getStatusColor(status: string): string {
    return this.statuses.find(s => s.value === status)?.color ?? '#94a3b8';
  }

  getStatusLabel(status: string): string {
    return this.statuses.find(s => s.value === status)?.label ?? 'Pending';
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
