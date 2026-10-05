import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
    Player,
    TournamentMemberStatus,
    enumPlayerCategory,
} from 'app/shared/models/player.model';
import {
    TournamentCategory,
    TournamentRounds,
    LeaderboardAd,
    matchFormat,
    HandicapAllocation,
} from 'app/shared/models/tournament.model';
import { FacadeService } from 'app/shared/services/facade.service';
import { of, interval, Subscription, takeUntil, Subject } from 'rxjs';
import { Score } from 'app/shared/classes/score';
import { handicapAllocation, Constants } from 'app/shared/classes/general';
import { LeaderType, LeaderTypeValue } from 'app/shared/classes/leader';
//import { TournamentHandicapCategory } from 'src/app/shared/classes/TournamentHandicapCategory';

import { Apollo } from 'apollo-angular';
import { DialogPlayerScoreComponent } from '../dialogs/dialog-player-score/dialog-player-score.component';
import { LeaderboardSubscription } from 'app/shared/GraphQL/tournament.gql';
import { LeaderboardService } from './mainleaderboard.service';
import { LogsService } from 'app/shared/services/logs.service';


@Component({
    standalone: false,
    selector: 'app-mainleaderboard',
    templateUrl: './mainleaderboard.component.html',
    styleUrls: ['./mainleaderboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLeaderboardComponent implements OnInit {
    private tournamentID: string;
    Leaderboard: any;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private noOfHolesInCourse: number = 18;
    flightRounds = [];
    activeRound: number;
    totalRounds: number;
    flightRound: number;
    isLoading: boolean = true;
    roundCheck: boolean = false;
    roundCheck2: boolean = false;
    roundCheck3: boolean = false;
    searchName: boolean = false;
    tRounds: TournamentRounds[] = [];
    roundFlights: any[] = [];
    catRound: number = 1;
    catsRound: number = 1;
    matchFormat: string = 'STROKE_PLAY';
    teamMatch: boolean;
    selectedSubTournament: string;
    subTournamentDetail: any[] = [];
    net: any[] = [];
    loggedInUser: Player;
    showdata: Promise<boolean>;
    players: Player;
    activePlayers: Player[] = [];
    playerScores: Score[];
    memberStatusesQLs: TournamentMemberStatus[] = [];
    categories: any[] = [];
    leaderboardAd: LeaderboardAd[];
    allllll: any[] = [];
    showTaxes: boolean = false;
    showBestBall: boolean = false;

    allMatchResults: any[] = [];
    allMatchSearchResults: any[] = [];
    allLeadersGross: any[] = [];
    allLeadersCutOffGross: any[] = [];
    allLeadersCutOffNet: any[] = [];
    allLeadersNet: any[] = [];

    grossLeaders: any[] = [];
    netLeaders: any[] = [];
    grossAllLeaders: any[] = [];
    netAllLeaders: any[] = [];

    selectedCategory: any;
    selectedIndex: any = 0;
    selectedCategoryValue: string = '';
    eventCategories: string[] = [];
    categoryLimit: number;

    upperCategoryLimit: boolean = false;
    showPairs: boolean;
    allRoundGrossScore: boolean = true;
    allRoundNetScore: boolean;
    allRoundCutOff: boolean = false;
    allRoundCutOffNet: boolean = false;
    cuttOffScore: number = 0;
    cuttType: string = 'GROSS';
    isCuttOffRequired: boolean = false;
    cutOffLine: any;
    leaderGrossQL: any;
    leaderNetQL: any;
    clubLogo: any = 'e2esp.png';
    leaderLogo: any;
    selectedMembers: Player[][] = [];
    runningFlights: number = 0;
    isClubAdmin: boolean = false;
    isGross: boolean;
    isNet: boolean;
    lastActiveTab = 1;
    cutOffList: any;
    subscription: Subscription;
    webLogoUrl: string =
        'http://gemgolfers.com/wp-content/uploads/2019/01/gem-logo.png';
    dataLeaderboards: any;

    constructor(
        private apollo: Apollo,
        private route: ActivatedRoute,
        public dialog: MatDialog,
        public facadeService: FacadeService,
        private _leaderBoardService: LeaderboardService,
        private cdr: ChangeDetectorRef,
        private logger: LogsService

    ) { }

    async ngOnInit() {
        this.logger.log('User comes to Main Leaderboard Page', "info");
        this.getOnLoadData();

        // const source = interval(60000 * 30);
        // this.subscription = source.subscribe((val) => window.location.reload());
    }

    async getOnLoadData() {
        this.route.paramMap.subscribe((params) => {
            ////console.log(params.get("id"));
            this.tournamentID = params.get('id');
        });

        // let clubInfo: any;
        // this.loggedInUser = JSON.parse(
        //     localStorage.getItem(Constants.LOGGED_IN_USER)
        // );
        // if (this.loggedInUser) {
        //     clubInfo =
        //         this.loggedInUser.membership.length > 0
        //             ? this.loggedInUser.membership[0].club
        //             : null;
        // }

        if (this.tournamentID == '10jazaman2024') {
            this.clubLogo = 'J-Zaman.png';
        } else if (this.tournamentID == 'IST') {
            this.clubLogo = 'rumanza.png';
        } else {
            this.clubLogo = 'e2esp.png';
        }
        
        //this.clubLogo = 'J-Zaman.png';
        this.apollo
            .watchQuery({
                query: LeaderboardSubscription,
                variables: {
                    tournamentPrefix: this.tournamentID,
                },
                pollInterval: 2000,
            })
            .valueChanges.subscribe(({ data }) => {
                if (!data) {
                    ////console.log(data);
                } else {
                    console.log(data);
                    this.Leaderboard = data;
                    this.matchFormat = this.Leaderboard.TournamentQL[0].matchFormat;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
    }
}
