// Import necessary modules and components
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogPlayerScoreComponent } from '../../dialogs/dialog-player-score/dialog-player-score.component';
import { handicapAllocation } from 'app/shared/classes/general';
import { Player } from 'app/shared/models/player.model';
import { Score } from 'app/shared/classes/score';
import { LeaderTypeValue } from 'app/shared/classes/leader';
import { PlayersScoreLoader } from 'app/shared/helper/PlayersViewScore';
import { FacadeService } from 'app/shared/services/facade.service';
import { LogsService } from 'app/shared/services/logs.service';
import { matchFormat } from 'app/shared/models/tournament.model';




@Component({
    standalone: false,
    selector: 'app-scramble', // This is the selector for the component
    templateUrl: './texaScramble.component.html', // HTML template file path
    styleUrls: ['../strokePlay/strokePlay.component.scss'] // CSS/SCSS styles file(s) path
})
export class ScrambleComponent implements OnInit, OnChanges {
    @Input() data: any;
    isGross: boolean = true;
    isNet: boolean = false;
    Leaderboard: any;
    activeRound: any = 1;
    totalRounds: any = 1;

    LeaderboardAllPlayers: any[] = [];
    LeaderboardPlayers: any[] = [];

    constructor(
        public dialog: MatDialog, private facadeService: FacadeService, private logger: LogsService
    ) { }
    ngOnInit(): void {
        //console.log('a');

        console.log(this.data);
        this.Leaderboard = this.data.TournamentQL[0];
        this.activeRound = this.Leaderboard.activeRound
        this.totalRounds = this.Leaderboard.noOfRounds
        this.LeaderboardAllPlayers = this.data.LeaderBoardQL;
        this.getPlayers(this.LeaderboardAllPlayers)
    }

    ngOnChanges(changes: SimpleChanges): void {
        //console.log(changes);
        //this.data = changes.data.currentValue;
        this.ngOnInit();
    }
    getPlayers(leaders: any[]) {
        this.LeaderboardPlayers = [];
        this.LeaderboardPlayers = leaders;
        if (leaders.length > 0) {

            if (this.isGross) {
                this.LeaderboardPlayers = [...this.LeaderboardPlayers].sort(this.ComparatorAllGross);;
                this.LeaderboardPlayers = this.sortAllGrossLeadersTie(this.LeaderboardPlayers)
            } else {
                this.LeaderboardPlayers = [...this.LeaderboardPlayers].sort(this.ComparatorAllNet);
                this.LeaderboardPlayers = this.sortAllNetLeadersTie(this.LeaderboardPlayers)
            }
        }

    }

    selectionChanged(item) {
        this.logger.log('User Changed Gross/Net Selection in Scramble Leaderboard', "info", item?.value);

        if (item.value == LeaderTypeValue.GROSS) {
            this.isGross = true;
            this.isNet = false;
            this.getPlayers(this.LeaderboardAllPlayers)
        } else if (item.value == LeaderTypeValue.NET) {
            this.isNet = true;
            this.isGross = false;
            this.getPlayers(this.LeaderboardAllPlayers)
        }
    }
    ComparatorAllGross(a, b) {
        if (a['underGross'] < b['underGross']) return -1;
        if (a['underGross'] > b['underGross']) return 1;
        return 0;
    }
    ComparatorAllNet(a, b) {
        if (a['underNet'] < b['underNet']) return -1;
        if (a['underNet'] > b['underNet']) return 1;
        return 0;
    }

    private sortAllGrossLeadersTie(leaderGrossList: any[]) {

        leaderGrossList = leaderGrossList.map(player => ({ ...player }));

        leaderGrossList.sort(this.ComparatorAllGrossPosition);
        let pos: number = 1;
        let tied: boolean;

        if (leaderGrossList.length > 0) leaderGrossList[0]['position'] = pos;

        //////console.log(leaderList);
        for (let i = 1; i < leaderGrossList.length; i++) {
            let leaderCurrent = leaderGrossList[i];
            let leaderPrevious = leaderGrossList[i - 1];
            // //console.log(i);

            let firstCompleted = false;
            let secondCompleted = false;

            let checkRoundPlayed =
                leaderCurrent.activeRound > leaderCurrent.totalRounds
                    ? leaderCurrent.totalRounds
                    : leaderCurrent.activeRound;

            if (checkRoundPlayed == 1) {
                firstCompleted = leaderCurrent.completed1;
                secondCompleted = leaderPrevious.completed1;
            } else if (checkRoundPlayed == 2) {
                firstCompleted = leaderCurrent.completed2;
                secondCompleted = leaderPrevious.completed2;
            } else if (checkRoundPlayed == 3) {
                firstCompleted = leaderCurrent.completed3;
                secondCompleted = leaderPrevious.completed3;
            } else if (checkRoundPlayed == 4) {
                firstCompleted = leaderCurrent.completed4;
                secondCompleted = leaderPrevious.completed4;
            }

            tied = leaderCurrent.underGross == leaderPrevious.underGross;

            if (tied) {
                //leaderCurrent["tied"]= true;
                //leaderPrevious["tied"]= true;
                leaderGrossList[i]['tied'] = true;
                leaderGrossList[i - 1]['tied'] = true;
                leaderGrossList[i]['position'] = 'T' + pos;
                leaderGrossList[i - 1]['position'] = 'T' + pos;
            } else {
                pos = i + 1;
                leaderGrossList[i]['position'] = pos;
            }
            //////console.log(pos);

            //////console.log("position-> " + pos + " -->" + leaderCurrent.name);
        }
        //console.log(leaderGrossList);

        return leaderGrossList;
    }

    private sortAllNetLeadersTie(leaderList: any[]) {
        //Collections.sort(grossLeaders);

        leaderList = leaderList.map(player => ({ ...player }));
        leaderList.sort(this.ComparatorAllNetPosition);
        //////console.log(leaderList);
        //return false;

        let pos: number = 1;
        let tied: boolean;

        if (leaderList.length > 0) leaderList[0]['position'] = pos;
        //////console.log(leaderList);
        for (let i = 1; i < leaderList.length; i++) {
            let leaderCurrent = leaderList[i];
            let leaderPrevious = leaderList[i - 1];
            let firstCompleted = false;
            let secondCompleted = false;

            let checkRoundPlayed =
                leaderCurrent.activeRound > leaderCurrent.totalRounds
                    ? leaderCurrent.totalRounds
                    : leaderCurrent.activeRound;

            if (checkRoundPlayed == 1) {
                firstCompleted = leaderCurrent.completed1;
                secondCompleted = leaderPrevious.completed1;
            } else if (checkRoundPlayed == 2) {
                firstCompleted = leaderCurrent.completed2;
                secondCompleted = leaderPrevious.completed2;
            } else if (checkRoundPlayed == 3) {
                firstCompleted = leaderCurrent.completed3;
                secondCompleted = leaderPrevious.completed3;
            } else if (checkRoundPlayed == 4) {
                firstCompleted = leaderCurrent.completed4;
                secondCompleted = leaderPrevious.completed4;
            }
            tied = leaderCurrent.underNet == leaderPrevious.underNet;

            if (tied) {
                //leaderCurrent["tied"]= true;
                //leaderPrevious["tied"]= true;
                leaderList[i]['tied'] = true;
                leaderList[i - 1]['tied'] = true;
                leaderList[i]['position'] = 'T' + pos;
                leaderList[i - 1]['position'] = 'T' + pos;
            } else {
                pos = i + 1;
                leaderList[i]['position'] = pos;
            }
            //////console.log(pos);

            //////console.log("position-> " + pos + " -->" + leaderCurrent.name);
        }
        //leaderList = leaderList.sort(this.ComparatorAllGrossPosition);
        //////console.log("return");
        //console.log(leaderList);
        return leaderList;
    }
    ComparatorAllGrossPosition(a, b) {
        let compare: number;

        compare = Number(a.status) - Number(b.status);
        if (compare != 0) {
            return compare;
        }
        if (a.playerStatus < b.playerStatus) {
            return -1;
        }
        if (a.playerStatus > b.playerStatus) {
            return 1;
        }

        // if (a.holes1 < b.holes1) {
        //     return 1;
        // }

        // if (a.holes1 < b.holes1) {
        //     return 1;
        // }
        let selfHoles: number = 0;
        let leaderHoles: number = 0;
        let completed: boolean = false;
        let checkRoundPlayed =
            a.activeRound > a.totalRounds ? a.totalRounds : a.activeRound;

        if (checkRoundPlayed == 1) {
            selfHoles = a.holes1;
            leaderHoles = b.holes1;

            completed = a.completed1 && b.completed1;
        } else if (checkRoundPlayed == 2) {
            selfHoles = a.holes2;
            leaderHoles = b.holes2;

            completed = a.completed2 && b.completed2;
        } else if (checkRoundPlayed == 3) {
            selfHoles = a.holes3;
            leaderHoles = b.holes3;

            completed = a.completed3 && b.completed3;
        } else if (checkRoundPlayed == 4) {
            selfHoles = a.holes4;
            leaderHoles = b.holes4;

            completed = a.completed4 && b.completed4;
        }

        if (selfHoles != 0 && leaderHoles != 0) {
            compare = a.AllGrossUnder - b.AllGrossUnder;

            if (compare != 0) {
                return compare;
            }
            if (completed) {
                let noOfHoles: number = 9;
                while (noOfHoles > 0) {
                    if (noOfHoles == 9)
                        compare = a.holeScoreLast9 - b.holeScoreLast9;
                    else if (noOfHoles == 6)
                        compare = a.holeScoreLast6 - b.holeScoreLast6;
                    else if (noOfHoles == 3)
                        compare = a.holeScoreLast3 - b.holeScoreLast3;
                    else if (noOfHoles < 3)
                        compare = a.holeScoreLast1 - b.holeScoreLast1;

                    if (compare != 0) {
                        return compare;
                    }
                    if (noOfHoles > 3) {
                        noOfHoles -= 3;
                    } else {
                        noOfHoles -= 2;
                    }
                }
                compare = leaderHoles - selfHoles;
                if (compare != 0) {
                    return compare;
                }
            }
        }

        //if (a["position"] < b["position"]) return -1;
        //if (a["position"] > b["position"]) return 1;

        return 0;
    }

    ComparatorAllNetPosition(a, b) {
        let compare: number;

        compare = Number(a.status) - Number(b.status);
        if (compare != 0) {
            return compare;
        }
        if (a.playerStatus < b.playerStatus) {
            return -1;
        }
        if (a.playerStatus > b.playerStatus) {
            return 1;
        }

        let selfHoles: number = 0;
        let leaderHoles: number = 0;
        let completed: boolean = false;
        let checkRoundPlayed =
            a.activeRound > a.totalRounds ? a.totalRounds : a.activeRound;

        if (checkRoundPlayed == 1) {
            selfHoles = a.holes1;
            leaderHoles = b.holes1;
            completed = a.completed1 && b.completed1;
        } else if (checkRoundPlayed == 2) {
            selfHoles = a.holes2;
            leaderHoles = b.holes2;
            completed = a.completed2 && b.completed2;
        } else if (checkRoundPlayed == 3) {
            selfHoles = a.holes3;
            leaderHoles = b.holes3;
            completed = a.completed3 && b.completed3;
        } else if (checkRoundPlayed == 4) {
            selfHoles = a.holes4;
            leaderHoles = b.holes4;
            completed = a.completed4 && b.completed4;
        }

        if (selfHoles != 0 && leaderHoles != 0) {
            compare = a.underNet - b.underNet;

            if (compare != 0) {
                return compare;
            }
            if (completed) {
                let noOfHoles: number = 9;
                while (noOfHoles > 0) {
                    if (noOfHoles == 9)
                        compare = a.holeScoreLast9 - b.holeScoreLast9;
                    else if (noOfHoles == 6)
                        compare = a.holeScoreLast6 - b.holeScoreLast6;
                    else if (noOfHoles == 3)
                        compare = a.holeScoreLast3 - b.holeScoreLast3;
                    else if (noOfHoles < 3)
                        compare = a.holeScoreLast1 - b.holeScoreLast1;

                    if (compare != 0) {
                        return compare;
                    }
                    if (noOfHoles > 3) {
                        noOfHoles -= 3;
                    } else {
                        noOfHoles -= 2;
                    }
                }
                compare = leaderHoles - selfHoles;
                if (compare != 0) {
                    return compare;
                }
            }
        }

        //if (a["position"] < b["position"]) return -1;
        //if (a["position"] > b["position"]) return 1;

        return 0;
    }
    async viewPlayerScore(
        name: string,
        courseId: string,
        courseHoleSets: string,
        playerId: string,
        holeSetsInverted: string,
        scoreType: string
    ) {
        this.logger.log('User Click on View Player Score in Scramble Leaderboard', "info", { name: name, playerId: playerId });
        let playerGrossScore: any[] = [];
        let playerNetScore: any[] = [];
        let playerPerTeam: any[];
        let team: boolean = false;
        let removed: string[] = [];
        let scores: any[];
        let scoresArray: any[] = [];
        let scoreResult;
        let ScoreLoader = new PlayersScoreLoader(this.facadeService, this.Leaderboard.id, playerId);
        await ScoreLoader.fetchTournamentScores();
        if (this.Leaderboard.matchFormat == matchFormat.TEXAS_SCRAMBLE ||
            this.Leaderboard.matchFormat == matchFormat.TWO_BALL_SCRAMBLE ||
            this.Leaderboard.matchFormat == matchFormat.THREE_BALL_SCRAMBLE ||
            this.Leaderboard.matchFormat == matchFormat.FOUR_BALL_SCRAMBLE) {
            scoreResult = ScoreLoader.getTexasScrambleScore(playerId);
        } else if (this.Leaderboard.matchFormat == matchFormat.SHAMBLES ||
            this.Leaderboard.matchFormat == matchFormat.TWO_BALL_BEST_BALL || this.Leaderboard.matchFormat == matchFormat.GREENSOME || this.Leaderboard.matchFormat == matchFormat.FOURSOME) {
            scoreResult = ScoreLoader.getShamblesScore(playerId);
        }
        //console.log(scoreResult);

        this.logger.log('Player Score Loaded Successfully, Opening Score Dialog in Scramble Leaderboard', "info", playerId);
        const dialogRef = this.dialog.open(DialogPlayerScoreComponent, {
            data: {
                name: name,
                tee_id:
                    this.Leaderboard.tee_id != null
                        ? this.Leaderboard.tee_id
                        : 1,
                course: this.Leaderboard.courseId,
                players: scoreResult.grossScore[0].players,
                holeSets: this.Leaderboard.courseHoleSets ? this.Leaderboard.courseHoleSets : 3,
                allGross: scoreResult.grossScore,
                courseHoleSetsInverted: this.Leaderboard.courseHoleSetsInverted,
                allNet: scoreResult.netScore,
                round: 0,
                type: this.isGross ? 'Gross' : 'Net',
                team: true,
                removed: removed,
            },
        });
    }
}