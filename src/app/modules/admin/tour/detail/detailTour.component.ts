import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { TourService } from '../tour.service';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import {
  STATUS_CLASSES,
  STATUS_LABELS,
  TourStatus,
  getDurationDays,
  getInitials,
  getProgress,
  getStatus,
  getTimingLabel,
} from '../tour-utils';

type TourTab = 'itinerary' | 'members' | 'tournaments';

@Component({
  standalone: false,
  selector: 'app-_detailtour',
  templateUrl: './detailTour.component.html',
  styleUrls: ['./detailTour.component.scss']
})
export class DetailTourComponent implements OnInit, OnDestroy {

  tour: any;
  tourId: string;
  isLoading = true;
  loadFailed = false;
  logoFailed = false;

  activeTab: TourTab = 'itinerary';
  readonly tabs: { id: TourTab; label: string; icon: string }[] = [
    { id: 'itinerary', label: 'Itinerary', icon: 'heroicons_outline:map' },
    { id: 'members', label: 'Members', icon: 'heroicons_outline:user-group' },
    { id: 'tournaments', label: 'Tournaments', icon: 'heroicons_outline:flag' },
  ];

  // View model derived from the loaded tour
  status: TourStatus = 'upcoming';
  statusLabel = '';
  statusClass = '';
  timing = '';
  progress = 0;
  duration = 0;
  initials = '';

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _tourService: TourService,
    private _localStorage: LocalStorageService,
    private logger: LogsService,
  ) { }

  ngOnInit(): void {
    this.logger.log('Admin comes to Tour Detail Page', "info");
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([params, query]) => {
        const requestedTab = query.get('tab') as TourTab;
        if (this.tabs.some(t => t.id === requestedTab)) {
          this.activeTab = requestedTab;
        }
        const id = params.get('id');
        if (id && id !== this.tourId) {
          this.tourId = id;
          this.loadTour();
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  async loadTour(silent = false): Promise<void> {
    if (!this.tourId) {
      return;
    }
    this.logger.log('Getting Tour Detail Data', "info", this.tourId);
    if (!silent) {
      this.isLoading = true;
    }
    this.loadFailed = false;
    try {
      const data = await this._tourService.getTourById(this.tourId);
      const tour = data?.tour?.[0];
      if (!tour) {
        this.tour = null;
        this.loadFailed = true;
        this.logger.log('Tour Detail Data not found', "warn", this.tourId);
      } else {
        this.tour = tour;
        this.logoFailed = false;
        this.deriveView();
        this.logger.log('Getting Tour Detail Data Successful', "info", this.tourId);
      }
    } catch (error) {
      this.loadFailed = true;
      this.logger.log('Getting Tour Detail Data Failed', "error", error?.toString());
    } finally {
      this.isLoading = false;
    }
  }

  private deriveView(): void {
    const { startDate, endDate, name } = this.tour;
    this.status = getStatus(startDate, endDate);
    this.statusLabel = STATUS_LABELS[this.status];
    this.statusClass = STATUS_CLASSES[this.status];
    this.timing = getTimingLabel(startDate, endDate);
    this.progress = getProgress(startDate, endDate);
    this.duration = getDurationDays(startDate, endDate);
    this.initials = getInitials(name);
  }

  setPrimaryTab(tab: TourTab): void {
    this.logger.log('Admin Click on Tab in Tour Detail Page', "info", tab);
    this.activeTab = tab;
    // Keep the tab in the URL so a refresh / coming back from "Create tournament" lands on the same tab.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  activePrimaryTab(): TourTab {
    return this.activeTab;
  }

  /** Called by the members tab after members were added so the header counters stay in sync. */
  onMembersChanged(): void {
    this.loadTour(true);
  }

  trackByTab(index: number, tab: { id: string }): string {
    return tab.id;
  }
}
