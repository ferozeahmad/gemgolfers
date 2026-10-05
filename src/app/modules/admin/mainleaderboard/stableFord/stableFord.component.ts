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




@Component({
    standalone: false,
    selector: 'app-stable-ford', // This is the selector for the component
    templateUrl: './stableFord.component.html', // HTML template file path
    styleUrls: ['../strokePlay/strokePlay.component.scss'] // CSS/SCSS styles file(s) path
})
export class StableFordComponent implements OnInit, OnChanges {
    @Input() data: any;
    Leaderboard: any;
    LeaderboardAllPlayers: any[] = [];
    LeaderboardPlayers: any[] = [];
    allLeadersCutOffGross: any[] = [];
    allLeadersCutOffNet: any[] = [];
    selectedCategory: any;
    selectedIndex: any = 0;
    flightRound: any = 0;
    activeRound: any = 1;
    totalRounds: any = 1;
    lastActiveTab: any = 1;
    cuttOffScore: number = 0;

    showBestBall: boolean = false;
    isCuttOffRequired: boolean = false;
    allRoundGrossScore: boolean = false;
    allRoundNetScore: boolean = true;
    allRoundCutOff: boolean = false;
    searchName: boolean = false;
    allRoundCutOffNet: boolean = false;

    isGross: boolean = false;
    isNet: boolean = false;

    selectedCategoryValue: string = '';
    eventCategories: string[] = [];
    tRounds: any[] = [];
    categoryLimit: number;
    constructor(
        public dialog: MatDialog, public facadeService: FacadeService, private logger: LogsService
    ) { }

    ngOnInit(): void {
        //console.log(this.data);
        this.Leaderboard = this.data.TournamentQL[0];
        this.activeRound = this.Leaderboard.activeRound
        this.totalRounds = this.Leaderboard.noOfRounds
        this.LeaderboardAllPlayers = this.data.LeaderBoardQL;
        this.tRounds = [];
        if (this.tRounds.length >= 0) {
            for (
                let round = 1;
                round <= this.Leaderboard.noOfRounds;
                round++
            ) {
                let r: any = {
                    Text: 'Round ' + round,
                    Value: round,
                };
                this.tRounds.push(r);
            }
        }
        this.getPlayers(this.LeaderboardAllPlayers, 0, 1)

    }
    ngOnChanges(changes: SimpleChanges): void {
        //console.log(changes);
        //this.data = changes.data.currentValue;
        this.ngOnInit();
    }
    getPlayers(leaders: any[], round: any, lastTab: any) {
        this.LeaderboardPlayers = [];
        this.allLeadersCutOffGross = [];
        this.allLeadersCutOffNet = [];
        if (round == 0) {
            if (leaders.length > 0) {
                this.LeaderboardPlayers = leaders;
                //console.log(this.LeaderboardPlayers);
                if (this.Leaderboard.cutOffCriteria != null && this.Leaderboard.cutOffCriteria.cutOff && this.Leaderboard.cutOffCriteria.cutOff.length > 0) {
                    this.cutLeaders(this.Leaderboard.cutOffCriteria, this.LeaderboardPlayers)
                }
                if (this.allLeadersCutOffNet.length > 0) {
                    this.isCuttOffRequired = true;
                    this.allRoundCutOffNet = true;
                    this.allLeadersCutOffNet = this.sortAllNetLeadersTie(this.allLeadersCutOffNet)
                }
                this.LeaderboardPlayers = [...this.LeaderboardPlayers].sort(this.ComparatorAllNet);

                this.LeaderboardPlayers =
                    this.sortAllNetLeadersTie(this.LeaderboardPlayers);
            }
        } else {
            this.getPlayersByRound(leaders, round, lastTab);
        }
    }
    cutLeaders(cutOff, leaders) {
        let cutObj = this.Leaderboard.cutOffCriteria["cutOff"].filter(
            (obj) => obj.name === this.selectedCategoryValue
        );
        if (cutObj) {
            this.cuttOffScore = cutObj[0].score;
            for (let i = leaders.length - 1; i >= 0; i--) {
                const item = leaders[i];
                if (
                    cutObj[0].type == 'GROSS' && item.underGross > cutObj[0].score &&
                    cutObj[0].score > 0 &&
                    item.PlayingRound != this.activeRound
                ) {
                    leaders.splice(i, 1);
                    this.allLeadersCutOffGross.push(item);
                } else if (cutObj[0].type == 'NET' && item.underNet > cutObj[0].score &&
                    cutObj[0].score > 0 &&
                    item.PlayingRound != this.activeRound) {
                    leaders.splice(i, 1);
                    this.allLeadersCutOffNet.push(item);
                }
            }
        }
    }
    getPlayersByRound(leaders: any[], round: number, lastTab: any) {
        this.LeaderboardPlayers = [];
        if (leaders.length > 0) {
            this.LeaderboardPlayers = leaders.filter(obj => {
                const propertyName = `holesPlayedR${round}`; // Dynamically construct the property name
                return obj[propertyName] > 0;
            });
        }

        this.LeaderboardPlayers.sort((a, b) => {
            return this.ComparatorScoreN(a, b, this.flightRound);
        });
        this.sortLeadersNet(this.LeaderboardPlayers, round);

    }
    getScoreByRoundG(item: any, round: number): string {
        const propertyName = `scoreR${round}`;
        return item[propertyName] || ''; // Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getUnderByRoundG(item: any, round: number): string {
        const propertyName = `underGross${round}`;
        return item[propertyName] || ''; // Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getHolesByRoundG(item: any, round: number): string {
        const propertyName = `holesPlayedR${round}`;
        return item[propertyName] || ''; // Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getScoreByRoundN(item: any, round: number): string {
        const propertyName = `netScoreR${round}`;
        return item[propertyName] || ''; // Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getUnderByRoundN(item: any, round: number): string {
        const propertyName = `underNet${round}`;
        return item[propertyName] || ''; // Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getHolesByRoundN(item: any, round: number): string {
        const propertyName = `holesPlayedR${round}`;
        return item[propertyName] || ''; // Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getUnderStyleG(item: any, round: number): { [key: string]: string } {
        const underValue = parseFloat(this.getUnderByRoundG(item, round)); // Parse the value if needed
        const style = {};

        if (underValue < 0) {
            style['color'] = 'red'; // Set the 'color' property to 'red'
        }

        // Add more style properties as needed

        return style;
    }
    getUnderStyleN(item: any, round: number): { [key: string]: string } {
        const underValue = parseFloat(this.getUnderByRoundN(item, round)); // Parse the value if needed
        const style = {};

        if (underValue < 0) {
            style['color'] = 'red'; // Set the 'color' property to 'red'
        }

        // Add more style properties as needed

        return style;
    }
    getTotal(item) {
        return item.pointsRound1 + item.pointsRound2 + item.pointsRound3 + item.pointsRound4;
    }
    changeRound(item) {
        this.logger.log('User Changed Round in Stableford Leaderboard', "info", item?.value);
        this.flightRound = item.value;
        if (item.value == '0') {
            this.isNet = false;
            this.allRoundCutOff = true;
            this.allRoundNetScore = true;
            this.getPlayers(this.LeaderboardAllPlayers, +this.flightRound, 1)
        } else {
            this.isNet = true;
            this.allRoundCutOff = false;
            this.allRoundNetScore = false;
            this.getPlayers(this.LeaderboardAllPlayers, +this.flightRound, 1)
        }
    }
    selectionChanged(item) {
        this.logger.log('User Changed Selection in Stableford Leaderboard', "info", item?.value);
        this.activeRound = this.Leaderboard.activeRound;
        if (this.flightRound == 0) {
            if (item.value == LeaderTypeValue.GROSS) {
                //////console.log("Selected value: " + item.value);
                this.allRoundGrossScore = true;
                this.allRoundCutOff = true;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;

                this.isGross = false;
                this.isNet = false;
                this.lastActiveTab = 1;
                this.getPlayers(this.LeaderboardAllPlayers, 0, 1)

            } else if (item.value == LeaderTypeValue.NET) {
                //////console.log("Selected value: " + item.value);
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = true;
                this.allRoundCutOffNet = true;
                this.isNet = false;
                this.isGross = false;
                this.lastActiveTab = 2;
                this.getPlayers(this.LeaderboardAllPlayers, 0, 2)

            }

        } else {
            if (item.value == LeaderTypeValue.GROSS) {
                //////console.log("Selected value: " + item.value);
                this.isGross = true;
                this.isNet = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.lastActiveTab = 1;
                this.getPlayers(this.LeaderboardAllPlayers, +this.flightRound, 1)

            } else if (item.value == LeaderTypeValue.NET) {
                //////console.log("Selected value: " + item.value);
                this.isNet = true;
                this.isGross = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.lastActiveTab = 2;
                this.getPlayers(this.LeaderboardAllPlayers, +this.flightRound, 2)

            }
        }
    }
    filterByQuery(query) {
        // if (query.length > 3) {
        //     this.searchName = true;
        //     //console.log(this.allMatchResults);
        //     if (this.allLeadersGross.length > 0) {
        //         this.allMatchSearchResults = this.allLeadersGross.filter(
        //             (obj) => {
        //                 return obj.name
        //                     .toString()
        //                     .toLowerCase()
        //                     .includes(query.toString().toLowerCase());
        //             }
        //         );
        //     } else {
        //         this.allMatchSearchResults = this.grossLeaders.filter((obj) => {
        //             return obj.name
        //                 .toString()
        //                 .toLowerCase()
        //                 .includes(query.toString().toLowerCase());
        //         });
        //     }
        // } else {
        //     this.allMatchSearchResults = [];
        //     this.searchName = false;
        // }
    }
    getHandicapAllocation(): string {
        let hcAllocation: string;

        if (this.Leaderboard.handicapAllocations)
            hcAllocation =
                this.Leaderboard.handicapAllocations['handicapAllocation'];
        else hcAllocation = handicapAllocation.AS_IS;

        return hcAllocation;
    }
    async viewPlayerScore(
        name: string,
        courseId: string,
        courseHoleSets: string,
        playerId: string,
        holeSetsInverted: string,
        scoreType: string
    ) {
        this.logger.log('User Click on View Player Score in Stableford Leaderboard', "info", { name: name, playerId: playerId });
        let playerGrossScore: any[] = [];
        let playerNetScore: any[] = [];
        let playerPerTeam: any[];
        let team: boolean = false;
        let removed: string[] = [];
        let scores: any[];
        let scoresArray: any[] = [];
        let ScoreLoader = new PlayersScoreLoader(this.facadeService, this.Leaderboard.id, playerId);
        await ScoreLoader.fetchTournamentScores();
        let scoreResult = ScoreLoader.getStrokePlayScore(playerId, this.flightRound);
        console.log(scoreResult);

        this.logger.log('Player Score Loaded Successfully, Opening Score Dialog in Stableford Leaderboard', "info", playerId);
        const dialogRef = this.dialog.open(DialogPlayerScoreComponent, {
            data: {
                name: name,
                tee_id:
                    this.Leaderboard.tee_id != null
                        ? this.Leaderboard.tee_id
                        : 1,
                course: this.Leaderboard.courseId,
                players: [],
                holeSets: this.Leaderboard.courseHoleSets ? this.Leaderboard.courseHoleSets : 3,
                allGross: scoreResult.grossScore,
                courseHoleSetsInverted: this.Leaderboard.courseHoleSetsInverted,
                allNet: scoreResult.netScore,
                round: this.flightRound,
                type: this.allRoundNetScore ? 'Net' : 'Gross',
                team: team,
                removed: removed,
            },
        });
    }
    ComparatorAllNet(a, b) {
        let totalA = a.pointsRound1 + a.pointsRound2 + a.pointsRound3 + a.pointsRound4;
        let totalB = b.pointsRound1 + b.pointsRound2 + b.pointsRound3 + b.pointsRound4;
        if (totalA < totalB) return 1;
        if (totalA > totalB) return -1;
        return 0;
    }
    ComparatorScoreN(a, b, flightRound) {

        if (a[`pointsRound${flightRound}`] < b[`pointsRound${flightRound}`]) return 1;
        if (a[`pointsRound${flightRound}`] > b[`pointsRound${flightRound}`]) return -1;
        return 0;
    }
    public getLastHolesTotal(noOfHoles: number, holeScores: any[]): number {
        let total: number = 0;

        for (let i = holeScores.length - 1; i >= 0 && noOfHoles > 0; i--) {
            total += holeScores[i];
            noOfHoles--;
        }

        return total;
    }

    private sortLeadersNet(leaderList: any[], round) {
        //Collections.sort(grossLeaders);
        //console.log(leaderList);

        //leaderList = leaderList.sort(this.ComparatorPosition);
        //////console.log(leaderList);
        //return false;
        leaderList = leaderList.map(leader => ({ ...leader }));
        let pos: number = 1;
        let tied: boolean;

        if (leaderList.length > 0) leaderList[0]['position'] = pos;
        //////console.log(leaderList);
        for (let i = 1; i < leaderList.length; i++) {
            let leaderCurrent = leaderList[i];
            let leaderPrevious = leaderList[i - 1];

            let currentHoleScore: number = 0;
            let previousHoleScore: number = 0;

            tied = leaderCurrent[`pointsRound${round}`] == leaderPrevious[`pointsRound${round}`];
            //////console.log(tied);
            if (tied && leaderCurrent.completed && leaderPrevious.completed) {
                let noOfHoles = 9;
                while (tied && noOfHoles > 0) {
                    //tied = this.getLastHolesTotal(noOfHoles, leaderCurrent.holeScores) == this.getLastHolesTotal(noOfHoles, leaderPrevious.holeScores);
                    currentHoleScore = this.getLastHolesTotal(
                        noOfHoles,
                        leaderCurrent.holeScores
                    );
                    previousHoleScore = this.getLastHolesTotal(
                        noOfHoles,
                        leaderPrevious.holeScores
                    );

                    tied = currentHoleScore == previousHoleScore;

                    if (noOfHoles > 3) {
                        noOfHoles -= 3;
                    } else {
                        noOfHoles -= 2;
                    }
                }
            }

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

            //////console.log("position-> " + pos + " -->" + leaderCurrent.name);
        }
        //leaderList = leaderList.sort(this.ComparatorPosition);
    }
    ComparatorPosition(a, b) {
        let compare: number;

        compare = Number(a.status) - Number(b.status);
        if (compare != 0) {
            return compare;
        }

        let selfHoles: number = a.holes;
        let leaderHoles: number = b.holes;

        if (selfHoles != 0 && leaderHoles != 0) {
            compare = a.under - b.under;

            if (compare != 0) {
                return compare;
            }
            if (a.completed && b.completed) {
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
            }
        }
        compare = leaderHoles - selfHoles;
        if (compare != 0) {
            return compare;
        }

        //if (a["position"] < b["position"]) return -1;
        //if (a["position"] > b["position"]) return 1;

        return 0;
    }
    private sortAllNetLeadersTie(leaderList: any[]) {
        //Collections.sort(grossLeaders);

        leaderList = leaderList.map(player => ({ ...player }));

        // sort safely
        leaderList.sort(this.ComparatorAllNetPosition);

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

            tied = (leaderCurrent.pointsRound1 + leaderCurrent.pointsRound2 + leaderCurrent.pointsRound3 + leaderCurrent.pointsRound4) == (leaderPrevious.pointsRound1 + leaderPrevious.pointsRound2 + leaderPrevious.pointsRound3 + leaderPrevious.pointsRound4);

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
            compare = a.pointsRound1 - b.pointsRound1;

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
}
