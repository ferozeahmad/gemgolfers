import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FacadeService } from 'app/shared/services/facade.service';
import { Constants, UniqueIdGenerator } from 'app/shared/classes/general';
import { UserSessionModel } from 'app/shared/models/player.model';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { LogsService } from 'app/shared/services/logs.service';
import { TourService } from '../../tour/tour.service';
import { DialogAddTourMainComponent } from '../../dialogs/dialog-add-tour-main/dialog-add-tour-main.component';
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
    parseDateOnly,
} from '../../tour/tour-utils';

interface DashTour {
    id: string;
    name: string;
    logo: string | null;
    initials: string;
    startDate: string;
    endDate: string;
    status: TourStatus;
    statusLabel: string;
    statusClass: string;
    timing: string;
    progress: number;
    duration: number;
    members: number;
    tournaments: number;
}

interface DashTournament {
    id: string;
    title: string;
    tourId: string;
    tourName: string;
    startDate: string;
    endDate: string;
    formatLabel: string;
    status: TourStatus;
    statusLabel: string;
    statusClass: string;
    setupComplete: boolean;
}

interface CategoryBar {
    label: string;
    count: number;
    percent: number;
}

@Component({
    standalone: false,
    selector: 'app-tour-dashboard',
    templateUrl: './tour-dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourDashboardComponent implements OnInit {
    readonly today = new Date();
    loggedInuser: UserSessionModel;

    isLoading = true;
    loadFailed = false;

    tours: DashTour[] = [];
    /** Ongoing and upcoming tours first, then the most recent finished ones. */
    featuredTours: DashTour[] = [];
    recentTournaments: DashTournament[] = [];
    categoryBars: CategoryBar[] = [];
    /** The tour that is running now, or the next one to start. */
    spotlight: DashTour | null = null;

    totals = {
        tours: 0,
        ongoing: 0,
        upcoming: 0,
        completed: 0,
        members: 0,
        tournaments: 0,
        liveTournaments: 0,
    };

    constructor(
        private tourService: TourService,
        private facadeService: FacadeService,
        private localStorage: LocalStorageService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
        private logger: LogsService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.logger.log('Tour Operator comes to Dashboard Page', 'info');
        this.loggedInuser = this.localStorage.get(Constants.LOGGED_IN_USER);
        this.load();
    }

    get greetingName(): string {
        return this.loggedInuser?.firstName || this.loggedInuser?.name || '';
    }

    trackById(index: number, item: { id: string }): string {
        return item.id;
    }

    async load(): Promise<void> {
        this.isLoading = true;
        this.loadFailed = false;
        this.cdr.markForCheck();
        try {
            const rawTours = await this.tourService.getTourOperatorDashboard(this.loggedInuser.id);
            this.build(rawTours);
            this.logger.log('Getting Tour Dashboard Data Successful', 'info', { tours: rawTours.length });
        } catch (error) {
            this.loadFailed = true;
            this.logger.log('Getting Tour Dashboard Data Failed', 'error', error?.toString());
        } finally {
            this.isLoading = false;
            this.cdr.markForCheck();
        }
    }

    private build(rawTours: any[]): void {
        const members = new Map<string, string>(); // playerId -> category
        const tournaments: DashTournament[] = [];

        this.tours = rawTours.map((t) => {
            const status = getStatus(t.startDate, t.endDate);
            for (const m of t.members || []) {
                if (m.playerId && !members.has(m.playerId)) {
                    members.set(m.playerId, m.player?.playerCategory || 'Uncategorised');
                }
            }
            for (const tn of t.tournaments || []) {
                const tStatus = getStatus(tn.startDate, tn.endDate);
                tournaments.push({
                    id: tn.id,
                    title: tn.title,
                    tourId: t.id,
                    tourName: t.name,
                    startDate: tn.startDate,
                    endDate: tn.endDate,
                    formatLabel: this.prettyFormat(tn.matchFormat),
                    status: tStatus,
                    statusLabel: STATUS_LABELS[tStatus],
                    statusClass: STATUS_CLASSES[tStatus],
                    setupComplete: tn.isSetupComplete == null || tn.isSetupComplete === true,
                });
            }
            return {
                id: t.id,
                name: t.name,
                logo: t.logo || null,
                initials: getInitials(t.name),
                startDate: t.startDate,
                endDate: t.endDate,
                status,
                statusLabel: STATUS_LABELS[status],
                statusClass: STATUS_CLASSES[status],
                timing: getTimingLabel(t.startDate, t.endDate),
                progress: getProgress(t.startDate, t.endDate),
                duration: getDurationDays(t.startDate, t.endDate),
                members: t.members?.length ?? 0,
                tournaments: t.tournaments?.length ?? 0,
            } as DashTour;
        });

        const byStart = (a: { startDate: string }, b: { startDate: string }, dir: 1 | -1) =>
            dir * ((parseDateOnly(a.startDate)?.getTime() ?? 0) - (parseDateOnly(b.startDate)?.getTime() ?? 0));
        const ongoing = this.tours.filter((t) => t.status === 'ongoing').sort((a, b) => byStart(a, b, 1));
        const upcoming = this.tours.filter((t) => t.status === 'upcoming').sort((a, b) => byStart(a, b, 1));
        const completed = this.tours.filter((t) => t.status === 'completed').sort((a, b) => byStart(a, b, -1));

        this.featuredTours = [...ongoing, ...upcoming, ...completed].slice(0, 5);
        this.spotlight = ongoing[0] ?? upcoming[0] ?? null;
        this.recentTournaments = tournaments.sort((a, b) => byStart(a, b, -1)).slice(0, 6);

        this.totals = {
            tours: this.tours.length,
            ongoing: ongoing.length,
            upcoming: upcoming.length,
            completed: completed.length,
            members: members.size,
            tournaments: tournaments.length,
            liveTournaments: tournaments.filter((t) => t.status === 'ongoing').length,
        };

        // Members by category (distinct players across all tours)
        const counts = new Map<string, number>();
        members.forEach((category) => {
            const label = category === 'Seniors' ? 'Senior Amateurs' : category;
            counts.set(label, (counts.get(label) ?? 0) + 1);
        });
        const max = Math.max(1, ...Array.from(counts.values()));
        this.categoryBars = Array.from(counts.entries())
            .map(([label, count]) => ({ label, count, percent: Math.round((count / max) * 100) }))
            .sort((a, b) => b.count - a.count);
    }

    private prettyFormat(format: string): string {
        if (!format) {
            return '';
        }
        return String(format)
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    onLogoError(tour: DashTour): void {
        tour.logo = null;
        this.cdr.markForCheck();
    }

    addNewTour(): void {
        this.logger.log('Tour Operator Click on Add New Tour in Dashboard Page', 'info');
        const dialogRef = this.dialog.open(DialogAddTourMainComponent, { autoFocus: false });
        dialogRef.afterClosed().subscribe((result) => {
            this.logger.log(result ? 'Admin submits Add Tour dialog' : 'Admin cancelled Add Tour dialog', 'info');
            if (!result) {
                return;
            }
            const tour = buildTourPayload(result, this.loggedInuser.id, UniqueIdGenerator.generate());
            this.facadeService.addTour(tour, result.file).subscribe({
                next: () => {
                    this.logger.log('Tour added successfully', 'info', { id: tour.id, name: tour.name });
                    this.snackBar.open(`"${tour.name}" has been created.`, 'Close', { duration: 3000 });
                    // Take the operator straight to the new tour to add the itinerary, members and tournaments.
                    this.router.navigate(['/tours', tour.id]);
                },
                error: (error) => {
                    this.logger.log('Adding Tour Failed', 'error', { id: tour.id, name: tour.name, error: error?.toString() });
                    this.snackBar.open('Could not create the tour. Please try again.', 'Close', { duration: 4000 });
                },
            });
        });
    }

    openTournament(tournament: DashTournament): void {
        if (!tournament.setupComplete) {
            // Resume the wizard in the context of the tour the tournament belongs to.
            this.localStorage.set(Constants.TOUR_ID, tournament.tourId);
            this.localStorage.set(Constants.STATE, Constants.TOUR);
            this.router.navigate(['/tournaments/add', tournament.id], { queryParams: { tourId: tournament.tourId } });
            return;
        }
        this.router.navigate(['/tournaments/view', tournament.id]);
    }
}
