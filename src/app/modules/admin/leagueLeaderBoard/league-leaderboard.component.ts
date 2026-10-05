import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FacadeService } from 'app/shared/services/facade.service';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-league-leaderboard',
    templateUrl: './league-leaderboard.component.html',
    styleUrls: ['./league-leaderboard.component.scss'],
})
export class LeagueLeaderboardComponent implements OnInit {
    Leaders: any[] = [];
    results: any[] = [];

    isLoading: boolean = true;
    leagueId: any = '';
    leagueQL: any;
    leagueTitle: any;
    selectedTab;
    constructor(
        private route: ActivatedRoute,
        private facadeService: FacadeService,
        private logger: LogsService
    ) {}

    ngOnInit(): void {
        this.route.paramMap.subscribe((params) => {
            ////console.log(params.get("id"));
            this.leagueId = params.get('id');
        });
        this.logger.log('User comes to League Leaderboard Page', "info", this.leagueId);
        this.fetchData();
        this.isLoading = false;
    }

    async fetchData() {
        this.logger.log('Getting League Leaderboard Data', "info", this.leagueId);
        this.leagueTitle = await this.facadeService.getLeagueName(
            this.leagueId
        );
        let leaderboard = await this.facadeService.getLeageLeaderBoards(
            this.leagueId
        );
        //console.log(leaderboard);
        this.leagueQL = leaderboard['LeaderBoardQL'];
        this.logger.log('Getting League Leaderboard Data Successful', "info", { leagueId: this.leagueId, count: this.leagueQL?.length });
        for (let obj of leaderboard['LeaderBoardQL']) {
            this.Leaders.push(obj);
        }
        this.selectedTab = this.Leaders[0].id;
        // this.calculatePoints();
    }

    calculatePoints() {
        let players = [];
        for (let obj of this.leagueQL) {
            if (this.selectedTab == obj.id) {
                for (let objA of obj.points) {
                    if (objA.entityId in players) {
                        objA.points = Math.round(objA.points * 10) / 10;
                        players[objA.entityId]['points'] += objA.points;
                        players[objA.entityId]['points'] =
                            Math.round(players[objA.entityId]['points'] * 10) /
                            10;
                    } else {
                        // objA.points = Math.round(objA.points * 10) / 10;
                        players[objA.entityId] = [];
                        players[objA.entityId]['position'] = '';
                        players[objA.entityId]['name'] = objA.name;
                        players[objA.entityId]['handicap'] =
                            this.getPlayerHandicap(objA.entityId);
                        players[objA.entityId]['points'] = objA.points;
                        players[objA.entityId]['points'] =
                            Math.round(objA.points * 10) / 10;
                    }
                    // this.results.push(score);
                }
            }
        }
        for (let leader in players) {
            this.results.push(players[leader]);
        }
        this.results.sort(this.Comparotor);
        //console.log(this.results);
    }
    Comparotor(a, b) {
        if (a['points'] < b['points']) return 1;
        if (a['points'] > b['points']) return -1;
        return 0;
    }
    changeleaderBoard(leader) {
        this.logger.log('User Changed Tab in League Leaderboard Page', "info", leader?.tab?.textLabel);
        //console.log(leader);

        for (let obj of this.leagueQL) {
            if (obj.name == leader.tab.textLabel) {
                this.selectedTab = obj.id;
                break;
            }
        }
        this.calculatePoints();
    }

    getPlayerHandicap(id) {
        let members = this.leagueTitle.LeaderBoardQL[0].members;
        let handicap = members.filter((a) => {
            return a.playerId === id;
        });
        if (handicap.length>0) {
            return handicap[0].player.handicap;
        } else {
            return '-';
        }
    }
}
