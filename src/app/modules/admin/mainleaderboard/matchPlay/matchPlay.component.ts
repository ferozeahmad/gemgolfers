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
    selector: 'app-match-play', // This is the selector for the component
    templateUrl: './matchPlay.component.html', // HTML template file path
    styleUrls: ['./matchPlay.component.scss'] // CSS/SCSS styles file(s) path
})
export class MatchPlayComponent implements OnInit, OnChanges {
    @Input() data: any;
    Leaderboard: any;
    LeaderboardScore: any;
    flightResults: any[] = [];
    allRoundResults: any[] = [];
    team1Point: any = 0;
    team2Point: any = 0;
    team1PointD: any = 0;
    team2PointD: any = 0;
    selectedIndex: any = 0;
    flightRound: any = 1;
    totalRounds: number = 1;
    activeRound: any = 1;
    isDoubles: boolean = true;
    isSingles: boolean = false;
    dropdownOptions: { value: string, label: string }[] = [];
    tRounds: any[] = [];

    constructor(
        public dialog: MatDialog, private facadeService: FacadeService, private logger: LogsService
    ) { }

    ngOnInit(): void {
        console.log(this.data);
        this.Leaderboard = this.data.TournamentQL[0];
        this.LeaderboardScore = this.data.LeaderBoardQL;
        this.activeRound = this.Leaderboard.activeRound;
        this.totalRounds = this.Leaderboard.noOfRounds;
        this.flightRound = this.activeRound;
        let count = 1;
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
        this.dropdownOptions = this.getFormats(this.Leaderboard.pointsFormats, this.flightRound);
        this.getRoundFormat();


    }
    getFormats(pointFormats, flightRound) {
        const format = flightRound === 1 ? pointFormats['pointsFormat'] : pointFormats[`pointsFormat${flightRound}`];
        return this.getDropdownOptions(format);
    }
    getDropdownOptions(pointsFormat: string) {
        switch (pointsFormat) {
            case 'BOTH':
                return [
                    { value: '1', label: 'FOUR BALL' },
                    { value: '2', label: 'SINGLES' }
                ];
            case 'SINGLES':
                return [{ value: '2', label: 'SINGLES' }];
            case 'FOUR_BALL':
                return [{ value: '1', label: 'FOUR BALL' }];
            case 'GREENSOME':
                return [{ value: '1', label: 'GREENSOME' }];
            case 'FOURSOME':
                return [{ value: '1', label: 'FOURSOME' }];
            default:
                return [];
        }
    }
    getRoundFormat() {
        if (this.dropdownOptions.length > 1) {
            this.getSinglesResult(this.flightRound);
            this.getDoublesResult(this.flightRound);
            this.isDoubles = true;
            this.isSingles = false;
        } else if (this.dropdownOptions[0].value == '1') {
            this.isDoubles = true;
            this.isSingles = false;
            this.getDoublesResult(this.flightRound);
        } else if (this.dropdownOptions[0].value == '2') {
            this.isDoubles = false;
            this.isSingles = true;
            this.getSinglesResult(this.flightRound);
        }
        this.allRoundResults = [];
    }
    getSinglesResult(flightRound) {
        this.team1Point = 0;
        this.team2Point = 0;
        let dropdownOptions = this.getFormats(this.Leaderboard.pointsFormats, flightRound);
        if (dropdownOptions) {
            let check = dropdownOptions.filter((drop => { return drop.value == '2' }))
            if (check.length == 0) {
                return;
            }
        }
        let team1Id = this.data.TournamentQL[0].OpponentsQL[0].team1Id;
        let team2Id = this.data.TournamentQL[0].OpponentsQL[0].team2Id;
        this.flightResults = [];

        let processedPlayers = new Set();
        let flights = this.Leaderboard.flights.filter((fli => {
            return fli.flightRound == flightRound
        }))
        for (let flightData of flights) {
            let membersQLs = [...flightData.members];
            let flightId = flightData.id;
            let round = flightData.flightRound;
            let courseHoleSetsInverted = flightData.courseHoleSetsInverted;
            let courseHoleSets = flightData.courseHoleSets;
            let flightResult = { flightId, matches: [] };
            const mutableMembersQLs = membersQLs.map(m => ({ ...m }));
            for (let membersQL of mutableMembersQLs) {
                let player = membersQL.player;
                let name = player.firstName + " " + player.lastName;
                let playerId = membersQL.playerId;
                let score = membersQL.scores;
                if (processedPlayers.has(playerId)) {
                    continue;
                }
                let { opponentId, opponentTeamId, playerTeamId, playerTeamMemberId } = this.findOpponentFlightWise(playerId, this.Leaderboard, flightId);
                if (opponentId) {
                    let playerScore = this.getPlayerScore(playerId, round);
                    let opponentScore = this.getPlayerScore(opponentId, round);
                    let holesPlayed = this.getHolePlayed(playerId, round);
                    let opponentScores = mutableMembersQLs.filter((mem => { return mem.playerId == opponentId }))
                    if (playerScore !== null && opponentScore !== null) {
                        let playerWon = playerScore > opponentScore;
                        let tied = playerScore == opponentScore;
                        let color = this.getcolor(playerTeamId)
                        let matchResult = {
                            playerId,
                            opponentId: opponentId,
                            playerScore,
                            opponentScore,
                            flightNo: flightData.flightNo,
                            courseHoleSetsInverted,
                            courseHoleSets,
                            round: round,
                            score: playerWon && !tied ? playerScore : opponentScore,
                            winnerId: playerWon && !tied ? playerId : opponentId,
                            thru: holesPlayed,
                            playerColor: playerWon && !tied ? color : tied ? '#dfdfdf' : '',
                            opponentColor: !playerWon && !tied ? this.getcolor(opponentTeamId) : tied ? '#dfdfdf' : '',
                            playerName: name,
                            opponentName: this.getPlayerName(membersQLs, opponentId),
                            winningColor: !playerWon && !tied ? this.getcolor(opponentTeamId) : color,
                            holes: this.getHoles(score, color, this.getcolor(opponentTeamId), opponentScores[0]?.scores),
                            playerHandicap: this.getHandicap(playerId),
                            opponentHandicap: this.getHandicap(opponentId),
                        };
                        if (playerWon && playerTeamId == team1Id) {
                            this.team1Point++;
                        } else if (playerWon && playerTeamId == team2Id) {
                            this.team2Point++;
                        } else if (tied) {
                            this.team1Point += .5;
                            this.team2Point += .5;
                        } else if (!playerWon && playerTeamId == team1Id) {
                            this.team2Point++;
                        } else {
                            this.team1Point++;
                        }


                        // Assuming membersQL is the original member object with additional properties
                        membersQL.isWinner = playerWon;
                        processedPlayers.add(playerId);
                        processedPlayers.add(opponentId);
                        flightResult.matches.push(matchResult);
                    }
                }
            }
            this.flightResults.push(flightResult);
        }

        this.team1Point += this.team1PointD;
        this.team2Point += this.team2PointD;
        this.allRoundResults[flightRound] = {};
        this.allRoundResults[flightRound]['team1Points'] = this.team1Point
        this.allRoundResults[flightRound]['team2Points'] = this.team2Point
        console.log(this.flightResults);

    }
    getAllRoundScore() {
        let team1Id = this.data.TournamentQL[0].OpponentsQL[0].team1Id;
        let team2Id = this.data.TournamentQL[0].OpponentsQL[0].team2Id;
        for (let index = 1; index <= this.totalRounds; index++) {
            console.log(index);

            this.getDoublesResult(index);
            this.getSinglesResult(index);
        }
        this.isDoubles = false;
        this.isSingles = false;
        this.flightResults = [];
        this.team1Point = 0;
        this.team2Point = 0;
        for (let obj of this.allRoundResults) {
            let flightResult = { matches: [] };
            if (obj) {
                let team1Point = obj['team1Points'];
                let team2Point = obj['team2Points'];
                let teamAWon = team1Point > team2Point;
                let tied = team1Point == team2Point;
                let color = this.getcolor(team1Id)
                let matchResult = {
                    score: teamAWon && !tied ? team1Point : tied ? 0 : team2Point,
                    team1Color: teamAWon && !tied ? color : tied ? '#dfdfdf' : '',
                    team2Color: !teamAWon && !tied ? this.getcolor(team2Id) : tied ? '#dfdfdf' : '',
                    team1Name: this.getTeamName(team1Id),
                    team2Name: this.getTeamName(team2Id),
                    winningColor: !teamAWon && !tied ? this.getcolor(team2Id) : this.getcolor(team1Id),
                    team1Points: team1Point,
                    team2Points: team2Point,
                };
                this.team1Point += obj['team1Points'];
                this.team2Point += obj['team2Points'];
                flightResult.matches.push(matchResult);
                this.flightResults.push(flightResult);
            }
        }

        console.log(this.allRoundResults);

    }
    getDoublesResult(flightRound) {
        this.team1PointD = 0;
        this.team2PointD = 0;
        let dropdownOptions = this.getFormats(this.Leaderboard.pointsFormats, flightRound);
        if (dropdownOptions) {
            let check = dropdownOptions.filter((drop => { return drop.value == '1' }))
            if (check.length == 0) {
                return;
            }
        }
        let team1Id = this.data.TournamentQL[0].OpponentsQL[0].team1Id;
        let team2Id = this.data.TournamentQL[0].OpponentsQL[0].team2Id;
        let flights = this.Leaderboard.flights.filter((fli => {
            return fli.flightRound == flightRound
        }))
        this.flightResults = [];
        let processedPlayers = new Set();
        for (let flightData of flights) {
            let membersQLs = flightData.members;
            let flightId = flightData.id;
            let round = flightData.flightRound;
            let flightResult = { flightId, matches: [] };
            let color;
            let teamAResult;
            let doublesResult = this.getDoubleResult(flightId);
            if (doublesResult) {
                let team1Members = this.getFlightTeamMember(membersQLs, team1Id);
                let team2Members = this.getFlightTeamMember(membersQLs, team2Id);
                if (doublesResult.upScore > 0) {
                    if (doublesResult.finalResult == team2Id) {
                        color = this.getcolor(team2Id)
                        teamAResult = false;
                        this.team2PointD++;
                    } else {
                        color = this.getcolor(team1Id)
                        teamAResult = true;
                        this.team1PointD++;
                    }

                    let matchResult = {
                        flightNo: flightData.flightNo,
                        round: round,
                        score: doublesResult.upScore,
                        thru: 18 - doublesResult.remainingHoles,
                        playerColor: teamAResult ? color : '',
                        opponentColor: !teamAResult ? color : '',
                        playerName1: team1Members?.[0]?.name ?? '',
                        playerName2: team1Members?.[1]?.name ?? '',
                        player1Handicap: this.getHandicapDoubles(team1Members?.[0]?.id ?? '', round),
                        player2Handicap: this.getHandicapDoubles(team1Members?.[1]?.id ?? '', round),
                        opponentName1: team2Members?.[0]?.name ?? '',
                        opponentName2: team2Members?.[1]?.name ?? '',
                        winningColor: color,
                        opponent1Handicap: this.getHandicapDoubles(team2Members?.[0]?.id ?? '', round),
                        opponent2Handicap: this.getHandicapDoubles(team2Members?.[1]?.id ?? '', round),
                    };
                    flightResult.matches.push(matchResult);
                } else {
                    color = '#dfdfdf'
                    let matchResult = {
                        flightNo: flightData.flightNo,
                        round: round,
                        score: doublesResult.upScore,
                        thru: 18 - doublesResult.remainingHoles,
                        playerColor: '#dfdfdf',
                        player1Handicap: this.getHandicapDoubles(team1Members?.[0]?.id ?? '', round),
                        player2Handicap: this.getHandicapDoubles(team1Members?.[1]?.id ?? '', round),
                        opponentColor: '#dfdfdf',
                        playerName1: team1Members?.[0]?.name ?? '',
                        playerName2: team1Members?.[1]?.name ?? '',
                        opponentName1: team2Members?.[0]?.name ?? '',
                        opponentName2: team2Members?.[1]?.name ?? '',
                        winningColor: color,
                        opponent1Handicap: this.getHandicapDoubles(team2Members?.[0]?.id ?? '', round),
                        opponent2Handicap: this.getHandicapDoubles(team2Members?.[1]?.id ?? '', round),
                    };
                    this.team1PointD += .5;
                    this.team2PointD += .5;

                    flightResult.matches.push(matchResult);
                };
            }
            this.flightResults.push(flightResult);
        }
        this.allRoundResults[flightRound] = {};
        this.allRoundResults[flightRound]['team1Points'] = this.team1PointD
        this.allRoundResults[flightRound]['team2Points'] = this.team2PointD
        console.log(this.flightResults);
    }

    getcolor(teamId) {

        let find = this.Leaderboard.TeamQL.filter(a => a.id === teamId);
        if (find.length > 0) {
            let color = find[0].color;
            // Check if the color string already includes '#'
            if (!color.startsWith('#')) {
                color = `#${color}`;
            }
            return color;
        } else {
            // Handle case where no matching team is found, if necessary
            return null; // or any default value
        }


    }

    getTeamName(teamId) {
        let find = this.Leaderboard.TeamQL.filter(a => a.id === teamId);
        if (find.length > 0) {
            let name = find[0].name;
            // Check if the name string already includes '#'
            return name;
        } else {
            // Handle case where no matching team is found, if necessary
            return null; // or any default value
        }

    }

    getPlayerName(members, playerId) {
        let find = members.filter(a => { return a.playerId == playerId });
        if (find) {
            let player = find[0]?.player;
            let name = player?.firstName + " " + player?.lastName;
            return name ? name : '';
        }
    }

    getDoubleResult(flightId) {
        let find = this.Leaderboard.TeamResultDoublesQL.filter((team => { return team.flightId == flightId }))
        if (find.length > 0) {
            return find[0];
        }
        return null;
    }
    getFlightTeamMember(membersQLs, teamId) {
        const result = [];
        let find = this.Leaderboard.TeamQL.filter(team => team.id === teamId);

        if (find.length > 0) {
            let teamMember = find[0].teamMembers;

            teamMember.forEach(element => {
                let check = membersQLs.filter(mem => mem.playerId === element.playerId);

                if (check.length > 0) {
                    let player = check[0].player;

                    if (player && player.id && player.firstName && player.lastName) {
                        let name = { id: player.id, name: `${player.firstName} ${player.lastName}` };
                        result.push(name);
                    } else {
                        // console.error('Player object is missing id, firstName, or lastName:', player);
                    }
                } else {
                    // c//onsole.error('No matching member found for playerId:', element.playerId);
                }
            });
        } else {
            // consol//e.error('No matching team found for teamId:', teamId);
        }

        return result;
    }

    getHoles(score, playerId, opponentId, opponentScore) {
        const result = [];
        for (let i = 0; i < 18; i++) {
            const playerHoleScore = score[i]?.netScore;
            const opponentHoleScore = opponentScore[i]?.netScore;

            let winnerId;

            if (playerHoleScore < opponentHoleScore) {
                winnerId = playerId;
            } else if (opponentHoleScore < playerHoleScore) {
                winnerId = opponentId;
            } else if (opponentHoleScore != null && opponentHoleScore == playerHoleScore) {
                winnerId = '#dfdfdf'; // It's a tie
            } else {
                winnerId = null;
            }

            result.push({
                holeNo: i + 1,
                winnerId: winnerId
            });
        }

        return result;
    }
    ngOnChanges(changes: SimpleChanges): void {
        //console.log(changes);
        //this.data = changes.data.currentValue;
        this.ngOnInit();
    }

    changeRound(item) {
        this.logger.log('User Changed Round in Match Play Leaderboard', "info", item?.value);
        this.team1PointD = 0;
        this.team2PointD = 0;
        this.flightRound = item.value;
        this.dropdownOptions = this.getFormats(this.Leaderboard.pointsFormats, this.flightRound);
        if (this.flightRound != 0) {
            this.getRoundFormat();
        } else {
            this.getAllRoundScore();
        }
    }

    selectionChanged(item) {
        this.logger.log('User Changed Selection in Match Play Leaderboard', "info", item?.value);

        if (item.value == '1') {
            this.isDoubles = true;
            this.isSingles = false;
            this.getDoublesResult(this.flightRound);
        } else {
            this.isDoubles = false;
            this.isSingles = true;
            this.getSinglesResult(this.flightRound);
        }


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
        playerName: string,
        opponentName: string,
        playerId: string,
        opponentId: string,
        courseHoleSets: string,
        holeSetsInverted: string,
    ) {
        this.logger.log('User Click on View Player Score in Match Play Leaderboard', "info", { name: playerName, playerId: playerId, opponentId: opponentId });
        let playerGrossScore: any[] = [];
        let playerNetScore: any[] = [];
        let playerPerTeam: any[];
        let team: boolean = false;
        let removed: string[] = [];
        let scores: any[];
        let scoresArray: any[] = [];
        let ScoreLoader = new PlayersScoreLoader(this.facadeService, this.Leaderboard.id, playerId);
        await ScoreLoader.fetchTournamentScores();
        let scoreResult = ScoreLoader.getMatchPlayScore(playerId);
        let scoreResultOpponent = ScoreLoader.getMatchPlayScore(opponentId);
        console.log(scoreResult);
        console.log(scoreResultOpponent);
        scoreResult.netScore.push(scoreResultOpponent.netScore[0])

        this.logger.log('Player Score Loaded Successfully, Opening Score Dialog in Match Play Leaderboard', "info", playerId);
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
                type: 'Net',
                team: team,
                removed: removed,
            },
        });
    }
    async viewTeamScore(
        name: string,
        courseId: string,
        courseHoleSets: string,
        playerId: string,
        holeSetsInverted: string,
        scoreType: string
    ) {
        this.logger.log('User Click on View Team Score in Match Play Leaderboard', "info", { name: name, playerId: playerId });
        let playerGrossScore: any[] = [];
        let playerNetScore: any[] = [];
        let playerPerTeam: any[];
        let team: boolean = false;
        let removed: string[] = [];
        let scores: any[];
        let scoresArray: any[] = [];
        let ScoreLoader = new PlayersScoreLoader(this.facadeService, this.Leaderboard.id, playerId);
        await ScoreLoader.fetchTournamentScores();
        let scoreResult = ScoreLoader.getMatchPlayTeamScore(playerId);
        //console.log(scoreResult);

        this.logger.log('Player Score Loaded Successfully, Opening Score Dialog in Match Play Leaderboard', "info", playerId);
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
                type: 'Net',
                team: team,
                removed: removed,
            },
        });
    }
    ComparatorAllNet(a, b) {
        if (a['scoreR1'] < b['scoreR1']) return -1;
        if (a['scoreR1'] > b['scoreR1']) return 1;
        return 0;
    }
    ComparatorScoreN(a, b, flightRound) {

        if (a[`underNet${flightRound}`] < b[`underNet${flightRound}`]) return -1;
        if (a[`underNet${flightRound}`] > b[`underNet${flightRound}`]) return 1;
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

        let pos: number = 1;
        let tied: boolean;

        if (leaderList.length > 0) leaderList[0]['position'] = pos;
        //////console.log(leaderList);
        for (let i = 1; i < leaderList.length; i++) {
            let leaderCurrent = leaderList[i];
            let leaderPrevious = leaderList[i - 1];

            let currentHoleScore: number = 0;
            let previousHoleScore: number = 0;

            tied = leaderCurrent[`underNet${round}`] == leaderPrevious[`underNet${round}`];
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

        leaderList = leaderList.sort(this.ComparatorAllNetPosition);
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
            tied = leaderCurrent.scoreR1 == leaderPrevious.scoreR1;

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
            compare = a.scoreR1 - b.scoreR1;

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
    findOpponentFlightWise(playerId, TournamentQL, flightId) {
        if (TournamentQL.OpponentsQL.length > 0) {
            let opponentId;
            let opponentTeamId;
            let playerTeamId;
            let playerTeamMemberId;
            for (let data of TournamentQL.OpponentsQL) {
                if (data.team1MemberId == playerId && data.flightId == flightId) {
                    opponentId = data.team2MemberId;
                    opponentTeamId = data.team2Id;
                    playerTeamId = data.team1Id;
                } else if (data.team2MemberId == playerId && data.flightId == flightId) {
                    opponentId = data.team1MemberId;
                    opponentTeamId = data.team1Id;
                    playerTeamId = data.team2Id;
                }
            }
            for (let data of TournamentQL.OpponentsQL) {
                if (data.team1MemberId !== playerId && data.team2MemberId !== playerId && data.flightId == flightId) {
                    if (playerTeamId && playerTeamId == data.team1Id) {
                        playerTeamMemberId = data.team1MemberId;
                    } else if (playerTeamId && playerTeamId == data.team2Id) {
                        playerTeamMemberId = data.team2MemberId;
                    }
                }
            }
            return { opponentId, opponentTeamId, playerTeamId, playerTeamMemberId };
        }
    }
    getPlayerScore(playerId, round) {
        const playerScore = this.LeaderboardScore.find(score => score.playerId === playerId);
        return playerScore ? playerScore[`scoreR${round}`] : null;
    }
    getHolePlayed(playerId, round) {
        const playerScore = this.LeaderboardScore.find(score => score.playerId === playerId);
        return playerScore ? playerScore[`holesPlayedR${round}`] : null;
    }
    getHandicap(playerId) {
        const playerScore = this.LeaderboardScore.find(score => score.playerId === playerId);
        return playerScore ? playerScore[`handicap`] : null;
    }
    getHandicapDoubles(playerId, round) {
        const playerScore = this.LeaderboardScore.find(score => score.playerId === playerId);
        return playerScore ? playerScore[`playerHandicapDoublesRound${round}`] : null;
    }
}
