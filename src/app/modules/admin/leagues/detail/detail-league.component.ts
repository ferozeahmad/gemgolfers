import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from 'app/shared/classes/general';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { FacadeService } from 'app/shared/services/facade.service';
import { LogsService } from 'app/shared/services/logs.service';
import { Subject, takeUntil } from 'rxjs';


@Component({
    standalone: false,
  selector: 'app-add-league',
  templateUrl: './detail-league.component.html',
  styleUrls: ['./detail-league.component.scss']
})
export class DetailLeagueComponent implements OnInit, OnDestroy {

  private leagueId: string;
  tour: any; // Assuming 'tour' will hold the league data for consistency with HTML
  tabs: string[] = ['Members', 'Tournaments'];
  activePrimaryTab: string = this.tabs[0];
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(private router: ActivatedRoute, private route: Router, private _localStorage: LocalStorageService, private _facadeService: FacadeService, private _logsService: LogsService) { }

  ngOnInit(): void {
    this._logsService.log('DetailLeagueComponent initialized', 'INFO');
    this.router.paramMap.subscribe((params) => {
      this.leagueId = params.get('id');
      if (this.leagueId) {
        this.loadLeagueData(this.leagueId);
      }
    });
  }

  ngOnDestroy(): void {
    this._logsService.log('DetailLeagueComponent destroyed', 'INFO');
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  async loadLeagueData(id: string): Promise<void> {
    try {
      this.tour = await this._facadeService.getLeagueById(id);
      this._logsService.log('League data loaded successfully', 'INFO', this.tour);
    } catch (error) {
      this._logsService.log('Error loading league data', 'ERROR', error);
    }
  }

  setPrimaryTab(tab: string): void {
    this.activePrimaryTab = tab;
    this._logsService.log(`Active tab changed to: ${tab}`, 'INFO');
  }

  viewTournaments() {
    this._logsService.log(`Navigating to tournaments for league: ${this.leagueId}`, 'INFO');
    this._localStorage.set(Constants.LEAGUE_ID, this.leagueId);
    this._localStorage.set(Constants.STATE, Constants.LEAGUE);
    this.route.navigate(['/tournaments/']);
  }

  viewMembers() {
    this._logsService.log(`Navigating to members for league: ${this.leagueId}`, 'INFO');
    this._localStorage.set(Constants.LEAGUE_ID, this.leagueId);
    this._localStorage.set(Constants.STATE, Constants.LEAGUE);
    this.route.navigate(['/players/']);
  }
}
