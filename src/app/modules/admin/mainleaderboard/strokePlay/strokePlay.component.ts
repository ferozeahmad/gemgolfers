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
import { matchFormat } from 'app/shared/models/tournament.model';

@Component({
    standalone: false,
    selector: 'app-stroke-play', // This is the selector for the component
    templateUrl: './strokePlay.component.html', // HTML template file path
    styleUrls: ['./strokePlay.component.scss'] // CSS/SCSS styles file(s) path
})
export class StrokePlayComponent implements OnInit, OnChanges {
    @Input() data: any;
    Leaderboard: any;
    LeaderboardAllPlayers: any[] = [];
    LeaderboardPlayers: any[] = [];
    allLeadersCutOffGross: any[] = [];
    allLeadersCutOffNet: any[] = [];
    allMatchSearchResults: any[] = [];
    selectedCategory: any;
    selectedIndex: any = 0;
    flightRound: any = 0;
    activeRound: any = 1;
    currentFormat: number = 2;
    totalRounds: any = 1;
    lastActiveTab: any = 1;
    cuttOffScore: number = 0;
    matchFormat: string = '';
    showBestBall: boolean = false;
    isCuttOffRequired: boolean = false;
    allRoundGrossScore: boolean = true;
    allRoundNetScore: boolean;
    allRoundCutOff: boolean = false;
    searchName: boolean = false;
    allRoundCutOffNet: boolean = false;
    categoryLowerLimt: number = 90;
    categoryUpperLimt: number = 0;
    isGross: boolean = false;
    isNet: boolean = false;

    selectedCategoryValue: string = '';
    eventCategories: any[] = [];
    tRounds: any[] = [];
    categoryLimit: string;
    constructor(
        public dialog: MatDialog, public facadeService: FacadeService
    ) {
        this.flightRound = 0;
    }

    ngOnInit(): void {
        console.log(this.data);
        this.Leaderboard = this.data.TournamentQL[0];
        this.activeRound = this.Leaderboard.activeRound
        this.totalRounds = this.Leaderboard.noOfRounds
        this.LeaderboardAllPlayers = this.data.LeaderBoardQL;
        this.matchFormat = this.Leaderboard.matchFormat;
        this.flightRound = 0;
        if (!this.selectedCategoryValue) {
            this.updateCategoryNames();
        }
        let count = 0;
        if (this.Leaderboard.CategoriesQL.length > 0) {
            if (!this.selectedCategoryValue) {
                this.selectedCategory =
                    this.Leaderboard.CategoriesQL.find((a) => {
                        this.selectedIndex = count;
                        count++;

                        return a.default == true;
                    });
                const fullCategory = this.selectedCategory.category;
                this.categoryLimit = this.hasLimits(this.selectedCategory) ? '0' : undefined;
                this.applyCategoryLimit(this.selectedCategory, this.categoryLimit);
                const match = fullCategory.match(/^([^(]+)/); // Match everything before '(' or entire string

                this.selectedCategoryValue = match ? match[1].trim() : fullCategory;
                // this.selectedCategoryValue = this.selectedCategory;
            }
            //console.log(this.selectedCategoryValue);

        } else {
            if (!this.selectedCategoryValue) {
                this.eventCategories = [];
                let eventCat: any = {
                    Text: 'All',
                    Value: 'All',
                    Limit: false,
                };
                this.selectedCategoryValue = 'All';
                this.eventCategories.push(eventCat);
            }
        }
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
        if (this.totalRounds > 1) {
            this.getPlayers([...this.LeaderboardAllPlayers], 0, this.lastActiveTab, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)
        } else {
            this.flightRound = 1;
            if (this.lastActiveTab == 1) {
                this.isGross = true;
                this.isNet = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.getPlayers([...this.LeaderboardAllPlayers], 1, 1, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)
            } else {
                this.isNet = true;
                this.isGross = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.getPlayers([...this.LeaderboardAllPlayers], 1, 2, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)
            }
        }


    }
    ngOnChanges(changes: SimpleChanges): void {
        //console.log(changes);
        //this.data = changes.data.currentValue;
        this.ngOnInit();
    }
    getPlayers(leaders: any[], round: any, lastTab: any, matchFormat: string) {
        this.LeaderboardPlayers = [];
        this.allLeadersCutOffGross = [];
        this.allLeadersCutOffNet = [];
        if (round == 0) {
            if (leaders.length > 0) {
                if (this.Leaderboard.CategoriesQL.length > 0) {
                    this.LeaderboardPlayers = leaders.filter(obj => {
                        return obj.category === this.selectedCategoryValue && obj.matchFormat == matchFormat && obj.handicap <= this.categoryLowerLimt && obj.handicap >= this.categoryUpperLimt;
                    })
                } else {
                    this.LeaderboardPlayers = leaders.filter((lead) => lead.matchFormat == matchFormat);
                }
                console.log(this.LeaderboardPlayers);
                if (this.Leaderboard.cutOffCriteria !== null) {
                    this.cutLeaders(this.Leaderboard.cutOffCriteria, this.LeaderboardPlayers)
                }
                if (this.allLeadersCutOffGross.length > 0) {
                    this.isCuttOffRequired = true;
                    this.allRoundCutOff = true;
                    this.sortAllGrossLeadersTie(this.allLeadersCutOffGross)
                }
                if (this.allLeadersCutOffNet.length > 0) {
                    this.isCuttOffRequired = true;
                    this.allRoundCutOffNet = true;
                    this.sortAllNetLeadersTie(this.allLeadersCutOffNet)
                }
                let newArray = this.LeaderboardPlayers.map(obj => ({ ...obj }));
                if (lastTab == 1) {
                    if (this.allLeadersCutOffGross.length > 0) {
                        this.allRoundCutOff = true;
                    } else {
                        this.allRoundCutOff = false;

                    }
                    this.allRoundCutOffNet = false;
                    newArray.sort(this.ComparatorAllGross);
                    this.sortAllGrossLeadersTie(newArray)
                } else {
                    if (this.allLeadersCutOffNet.length > 0) {
                        this.allRoundCutOffNet = true;
                    } else {
                        this.allRoundCutOffNet = false;
                    }
                    this.allRoundCutOff = false;
                    newArray.sort(this.ComparatorAllNet);
                    this.sortAllNetLeadersTie(newArray)
                }
                this.LeaderboardPlayers = newArray
            }
        } else {
            leaders = leaders.filter((lead) => lead.matchFormat == matchFormat);
            // if (this.Leaderboard.matchFormat == 'BEST_TWO') {
            //     this.getPlayerHandicap(leaders, this.Leaderboard.TeamQL);
            // }
            this.getPlayersByRound(leaders, round, lastTab);
        }
    }
    cutLeaders(cutOff, leaders) {
        let cutObj = this.Leaderboard.cutOffCriteria["cutOff"].filter(
            (obj) => obj.name === this.selectedCategoryValue
        );
        if (cutObj && cutObj.length > 0) {
            this.cuttOffScore = cutObj[0].score;
            for (let i = leaders.length - 1; i >= 0; i--) {
                const item = leaders[i];
                if (
                    cutObj[0].type == 'GROSS' && item.underGross > this.cuttOffScore &&
                    this.cuttOffScore > 0 &&
                    item.playingRound != this.activeRound
                ) {
                    leaders.splice(i, 1);
                    this.allLeadersCutOffGross.push(item);
                    this.allLeadersCutOffNet.push(item);
                } else if (cutObj[0].type == 'NET' && item.underNet > this.cuttOffScore &&
                    this.cuttOffScore > 0 &&
                    item.playingRound != this.activeRound) {
                    leaders.splice(i, 1);
                    this.allLeadersCutOffGross.push(item);
                    this.allLeadersCutOffNet.push(item);
                }
            }
        }
    }
    getPlayerHandicap(leaders, teams) {

        let firstPlayer = null;
        let secondPlayer = null;

        for (const player of leaders) {
            for (const team of teams) {
                const matchingIndex = team.teamMembers.findIndex(member => member.playerId === player.playerId);
                // If a matching member is found
                if (matchingIndex !== -1) {
                    firstPlayer = team.teamMembers[matchingIndex].playerId; // Store first playerId

                    // Select the other player based on the index
                    if (matchingIndex === 0) {
                        secondPlayer = team.teamMembers[1].playerId; // Select the second member if the first is matched
                    } else if (matchingIndex === 1) {
                        secondPlayer = team.teamMembers[0].playerId; // Select the first member if the second is matched
                    }
                    break; // Exit the loop once both are set
                }
            }
            // Output the two found player IDs
            console.log('First Player ID:', firstPlayer);
            console.log('Second Player ID:', secondPlayer);
            if (firstPlayer) {
                this.Leaderboard.flights.forEach(element => {
                    const play = element.members.find((mem) => mem.playerId == firstPlayer);
                    if (play) {
                        player.handicap1 = play.playingHandicap;
                    }
                });
            }
            if (secondPlayer) {
                this.Leaderboard.flights.forEach(element => {
                    const play = element.members.find((mem) => mem.playerId == secondPlayer);
                    if (play) {
                        player.handicap2 = play.playingHandicap;
                        player.playerId2 = secondPlayer;
                    }
                });
            }
        }

    }
    getPlayersByRound(leaders: any[], round: number, lastTab: any) {
        this.LeaderboardPlayers = [];
        if (leaders.length > 0) {
            if (this.Leaderboard.CategoriesQL.length > 0) {
                this.LeaderboardPlayers = leaders.filter(obj => {
                    const propertyName = `holesPlayedR${round}`; // Dynamically construct the property name
                    return obj.category === this.selectedCategoryValue && obj[propertyName] > 0 && obj.handicap <= this.categoryLowerLimt && obj.handicap >= this.categoryUpperLimt;;
                });
            } else {
                if (this.Leaderboard.noOfRounds == 1) {
                    this.LeaderboardPlayers = leaders;
                } else {
                    this.LeaderboardPlayers = leaders.filter(obj => {
                        const propertyName = `holesPlayedR${round}`; // Dynamically construct the property name
                        return obj[propertyName] > 0;
                    });
                }
            }
        }
        if (lastTab == 1) {
            this.LeaderboardPlayers.sort((a, b) => {
                return this.ComparatorScoreG(a, b, this.flightRound);
            });
            this.LeaderboardPlayers = this.sortLeadersGross(
                this.LeaderboardPlayers.map(player => ({ ...player })),
                round
            );
        } else {
            this.LeaderboardPlayers.sort((a, b) => {
                return this.ComparatorScoreN(a, b, this.flightRound);
            });
            this.LeaderboardPlayers = this.sortLeadersNet(
                this.LeaderboardPlayers.map(player => ({ ...player })),
                round
            );
        }
    }
    getScoreByRoundG(item: any, round: number): string {
        const propertyName = `scoreR${round}`;
        return (item[propertyName] !== undefined && item[propertyName] !== null)
            ? item[propertyName].toString()
            : '0'; // Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getUnderByRoundG(item: any, round: number): string {
        const propertyName = `underGross${round}`;
        return (item[propertyName] !== undefined && item[propertyName] !== null)
            ? item[propertyName].toString()
            : '0';
    }

    getHolesByRoundG(item: any, round: number): any {
        const propertyName = `holesPlayedR${round}`;
        return item[propertyName] === 18 ? 'F' : (item[propertyName] || 0);// Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getScoreByRoundN(item: any, round: number): any {
        const propertyName = `netScoreR${round}`;
        return (item[propertyName] !== undefined && item[propertyName] !== null)
            ? item[propertyName].toString()
            : '0'; // Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getUnderByRoundN(item: any, round: number): string {
        const propertyName = `underNet${round}`;
        return (item[propertyName] !== undefined && item[propertyName] !== null)
            ? item[propertyName].toString()
            : '0'; // Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
    }
    getHolesByRoundN(item: any, round: number): any {
        const propertyName = `holesPlayedR${round}`;
        return item[propertyName] === 18 ? 'F' : (item[propertyName] || 0);// Return the scoreR1 or scoreR2 property if it exists, or an empty string if it doesn't
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
    changeRound(item) {
        this.flightRound = item.value;
        if (item.value == '0') {
            if (this.lastActiveTab == 1) {
                this.isGross = false;
                this.isNet = false;
                this.allRoundGrossScore = true;
                this.allRoundCutOff = true;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.getPlayers([...this.LeaderboardAllPlayers], +this.flightRound, 1, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)
            } else if (this.lastActiveTab == 2) {
                this.isNet = false;
                this.isGross = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = true;
                this.allRoundCutOffNet = true;
                this.getPlayers([...this.LeaderboardAllPlayers], +this.flightRound, 2, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)
            } else {
                this.isGross = false;
                this.isNet = false;
                this.allRoundGrossScore = true;
                this.allRoundCutOff = true;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.getPlayers([...this.LeaderboardAllPlayers], +this.flightRound, 1, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)
            }
        } else {
            if (this.lastActiveTab == 1) {
                this.isGross = true;
                this.isNet = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.getPlayers([...this.LeaderboardAllPlayers], +this.flightRound, 1, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)
            } else if (this.lastActiveTab == 2) {
                this.isNet = true;
                this.isGross = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.getPlayers([...this.LeaderboardAllPlayers], +this.flightRound, 2, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)
            } else {
                this.isGross = true;
                this.isNet = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.getPlayers([...this.LeaderboardAllPlayers], +this.flightRound, 1, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)
            }
        }
    }
    selectionChanged(item) {
        this.activeRound = this.Leaderboard.activeRound;
        if (this.flightRound == 0) {
            if (item.value == LeaderTypeValue.GROSS) {
                console.log("Selected value: " + item.value);
                this.allRoundGrossScore = true;
                this.allRoundCutOff = true;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;

                this.isGross = false;
                this.isNet = false;
                this.lastActiveTab = 1;
                this.getPlayers([...this.LeaderboardAllPlayers], 0, 1, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)

            } else if (item.value == LeaderTypeValue.NET) {
                //////console.log("Selected value: " + item.value);
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = true;
                this.allRoundCutOffNet = true;
                this.isNet = false;
                this.isGross = false;
                this.lastActiveTab = 2;
                this.getPlayers([...this.LeaderboardAllPlayers], 0, 2, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)

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
                this.getPlayers([...this.LeaderboardAllPlayers], +this.flightRound, 1, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)

            } else if (item.value == LeaderTypeValue.NET) {
                //////console.log("Selected value: " + item.value);
                this.isNet = true;
                this.isGross = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.lastActiveTab = 2;
                this.getPlayers([...this.LeaderboardAllPlayers], +this.flightRound, 2, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat)

            }
        }
    }
    formatChange(event) {
        console.log(this.LeaderboardAllPlayers);
        console.log(this.LeaderboardAllPlayers);
        this.currentFormat = +event.value;
        if (event.value == 1) {
            let leaders = this.LeaderboardAllPlayers.filter((player) => player.matchFormat == this.Leaderboard.matchFormat)
            // this.getPlayers(leaders, +this.flightRound, 1, "LIV");
            this.getPlayers(leaders, +this.flightRound, 1, this.Leaderboard.matchFormat);
        } else {
            let leaders = this.LeaderboardAllPlayers.filter((player) => player.matchFormat == 'format')
            this.getPlayers(leaders, +this.flightRound, 1, 'format');
        }
    }
    updateCategoryNames() {
        let categoryNames: string[] = [];
        this.eventCategories = [];
        const sortedCategories = [...this.Leaderboard.CategoriesQL].sort(this.sortCategory);
        for (let c of sortedCategories) {
            categoryNames.push(this.getTitle(c, 0));
            if (this.hasLimits(c)) {
                if (this.hasMiddleLimits(c)) {
                    categoryNames.push(this.getTitle(c, 1));
                }
                categoryNames.push(this.getTitle(c, 2));
            }
        }

        return categoryNames;
    }
    getTitle(
        categoryData: any,
        limit: number /* 0: lower, 1: middle, 2: upper */
    ): string {
        let title: string = categoryData.category;
        if (this.hasLimits(categoryData)) {
            if (limit == 2) {
                title +=
                    ' (' +
                    categoryData.handicapLimits.upperLimitStart +
                    ' - ' +
                    categoryData.handicapLimits.upperLimitEnd +
                    ')';

                let eventCat: any = {
                    Text: title,
                    Value: categoryData.category + '#2',
                };

                this.eventCategories.push(eventCat);
            } else if (limit == 1 && this.hasMiddleLimits(categoryData)) {
                title +=
                    ' (' +
                    categoryData.handicapLimits.middleLimitStart +
                    ' - ' +
                    categoryData.handicapLimits.middleLimitEnd +
                    ')';

                let eventCat: any = {
                    Text: title,
                    Value: categoryData.category + '#1',
                    Limit: true,
                };

                this.eventCategories.push(eventCat);
            } else {
                title +=
                    ' (' +
                    categoryData.handicapLimits.lowerLimitStart +
                    ' - ' +
                    categoryData.handicapLimits.lowerLimitEnd +
                    ')';

                let eventCat: any = {
                    Text: title,
                    Value: categoryData.category + '#0',
                    Limit: true,
                };

                this.eventCategories.push(eventCat);
            }
        } else {
            let eventCat: any = {
                Text: title,
                Value: categoryData.category,
                Limit: false,
            };

            this.eventCategories.push(eventCat);
        }

        return title;
    }
    hasLimits(categoryData): boolean {
        if (!categoryData.handicapLimits) return false;
        const l = categoryData.handicapLimits;
        // lowerLimitStart can legitimately be negative (a "plus" handicap), so only the
        // relative ordering of the two ranges is validated here, not a >= 0 floor.
        return (
            l.lowerLimitStart != null &&
            l.lowerLimitEnd != null &&
            l.upperLimitStart != null &&
            l.upperLimitEnd != null &&
            l.lowerLimitEnd > l.lowerLimitStart &&
            l.upperLimitStart > l.lowerLimitEnd &&
            l.upperLimitEnd > l.upperLimitStart
        );
    }

    hasMiddleLimits(categoryData): boolean {
        if (!categoryData.handicapLimits) return false;
        return (
            categoryData.handicapLimits.middleLimitStart >= 0 &&
            categoryData.handicapLimits.middleLimitEnd >
            categoryData.handicapLimits.middleLimitStart
        );
    }

    // Sets categoryLowerLimt (max handicap, inclusive) / categoryUpperLimt (min handicap, inclusive)
    // from the selected category's handicapLimits tier ('0' lower / '1' middle / '2' upper),
    // falling back to the legacy lowerHandicap/higherHandicap columns when no tiers are set.
    applyCategoryLimit(categoryData: any, tier?: string): void {
        if (categoryData && this.hasLimits(categoryData)) {
            const limits = categoryData.handicapLimits;
            if (tier === '2') {
                this.categoryUpperLimt = limits.upperLimitStart;
                this.categoryLowerLimt = limits.upperLimitEnd;
            } else if (tier === '1' && this.hasMiddleLimits(categoryData)) {
                this.categoryUpperLimt = limits.middleLimitStart;
                this.categoryLowerLimt = limits.middleLimitEnd;
            } else {
                this.categoryUpperLimt = limits.lowerLimitStart;
                this.categoryLowerLimt = limits.lowerLimitEnd;
            }
        } else if (categoryData?.lowerHandicap || categoryData?.higherHandicap) {
            this.categoryLowerLimt = categoryData.lowerHandicap ?? 90;
            this.categoryUpperLimt = categoryData.higherHandicap ?? 0;
        } else {
            this.categoryLowerLimt = 90;
            this.categoryUpperLimt = 0;
        }
    }
    filterByQuery(query) {
        if (query.length > 3) {
            this.searchName = true;
            // //console.log(this.allMatchResults);
            if (this.LeaderboardPlayers.length > 0) {
                this.allMatchSearchResults = this.LeaderboardPlayers.filter(
                    (obj) => {
                        return obj.name
                            .toString()
                            .toLowerCase()
                            .includes(query.toString().toLowerCase());
                    }
                );
            } else {
                this.allMatchSearchResults = this.LeaderboardPlayers.filter((obj) => {
                    return obj.name
                        .toString()
                        .toLowerCase()
                        .includes(query.toString().toLowerCase());
                });
            }
        } else {
            this.allMatchSearchResults = [];
            this.searchName = false;
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
    changeCategory(item) {
        //console.log('TAb Changes');

        this.activeRound = this.Leaderboard.activeRound;
        // The tab's visible text label includes the "(range)" suffix for tiered categories, so it
        // can't be split on '#' — look up the underlying eventCategories entry (Value = "Category#tier") by tab index instead.
        const selectedEventCat = this.eventCategories[item.index];
        const value: string = selectedEventCat ? selectedEventCat.Value : item.tab.textLabel;
        let originalCategory: string = value;
        if (value && value.indexOf('#') !== -1) {
            let splitted = value.split('#', 2);
            originalCategory = splitted[0];
            this.categoryLimit = splitted[1];
        } else {
            this.categoryLimit = undefined;
        }

        this.selectedCategory = this.Leaderboard.CategoriesQL.find(
            (c) => c.category === originalCategory
        );
        const fullCategory = this.selectedCategory.category;
        this.applyCategoryLimit(this.selectedCategory, this.categoryLimit);
        const match = fullCategory.match(/^([^(]+)/);
        this.selectedCategoryValue = match ? match[1].trim() : fullCategory;
        if (this.flightRound == 0) {
            this.selectedCategory = null;
            this.allRoundGrossScore = true;
            this.allRoundCutOff = true;

            this.allRoundNetScore = false;
            this.allRoundCutOffNet = false;

            this.isGross = false;
            this.isNet = false;

            if (this.lastActiveTab == 1) {
                this.allRoundGrossScore = true;
                this.allRoundCutOff = true;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
                this.isGross = false;
                this.isNet = false;
            } else if (this.lastActiveTab == 2) {
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = true;
                this.allRoundCutOffNet = true;
                this.isNet = false;
                this.isGross = false;
            } else {
                this.allRoundGrossScore = true;
                this.allRoundCutOff = true;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;

                this.isGross = false;
                this.isNet = false;
            }
            this.getPlayers(this.LeaderboardAllPlayers, 0, this.lastActiveTab, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat);
        } else {
            if (this.lastActiveTab == 1) {
                this.isGross = true;
                this.isNet = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
            } else if (this.lastActiveTab == 2) {
                this.isNet = true;
                this.isGross = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
            } else {
                this.isGross = true;
                this.isNet = false;
                this.allRoundGrossScore = false;
                this.allRoundCutOff = false;

                this.allRoundNetScore = false;
                this.allRoundCutOffNet = false;
            }
            this.getPlayers(this.LeaderboardAllPlayers, +this.flightRound, this.lastActiveTab, this.currentFormat == 2 ? 'format' : this.Leaderboard.matchFormat);
        }
    }
    async viewPlayerScore(
        name: string,
        courseId: string,
        courseHoleSets: string,
        playerId: string,
        playerId2: string,
        holeSetsInverted: string,
        scoreType: string
    ) {
        let playerGrossScore: any[] = [];
        let playerNetScore: any[] = [];
        let playerPerTeam: any[];
        let team: boolean = false;
        let removed: string[] = [];
        let scores: any[];
        let scoresArray: any[] = [];
        let scoreResult: any;
        let ScoreLoader = new PlayersScoreLoader(this.facadeService, this.Leaderboard.id, playerId);
        await ScoreLoader.fetchTournamentScores();
        if (this.Leaderboard.matchFormat == matchFormat.BEST_TWO || this.Leaderboard.matchFormat == matchFormat.BEST_THREE) {
            let teamMembersIds = this.Leaderboard.TeamQL.find(team => team.teamMembers.find(member => member.playerId == playerId)).teamMembers.map(member => member.playerId);
            scoreResult = ScoreLoader.getStrokePlayScore(playerId, this.flightRound, teamMembersIds);
        } else {
            scoreResult = ScoreLoader.getStrokePlayScore(playerId, this.flightRound);
        }
        console.log(scoreResult);

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
                type: this.allRoundNetScore || this.isNet ? 'Net' : 'Gross',
                team: team,
                removed: removed,
            },
            autoFocus: false,
        });
    }
    sortCategory(a, b) {
        if (a['category'] < b['category']) {
            return -1;
        }
        if (a['category'] > b['category']) {
            return 1;
        }
        return 0;
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
    ComparatorScoreG(a, b, flightRound) {
        // let round = +this.flightRound;
        if (a[`underGross${flightRound}`] < b[`underGross${flightRound}`]) return -1;
        if (a[`underGross${flightRound}`] > b[`underGross${flightRound}`]) return 1;
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
    private sortLeadersGross(leaderList: any[], round) {
        this.flightRound = round;

        leaderList = leaderList.map(leader => ({ ...leader }));

        leaderList.sort(this.ComparatorPositionGross(round));
        let pos: number = 1;
        let tied: boolean;

        if (leaderList.length > 0) leaderList[0]['position'] = pos;

        for (let i = 1; i < leaderList.length; i++) {
            let leaderCurrent = leaderList[i];
            let leaderPrevious = leaderList[i - 1];

            let currentHoleScore: number = 0;
            let previousHoleScore: number = 0;

            tied = leaderCurrent[`scoreR${round}`] == leaderPrevious[`scoreR${round}`];

            if (tied) {
                leaderList[i]['tied'] = true;
                leaderList[i - 1]['tied'] = true;
                leaderList[i]['position'] = 'T' + pos;
                leaderList[i - 1]['position'] = 'T' + pos;
            } else {
                pos = i + 1;
                leaderList[i]['position'] = pos;
            }
        }
        return leaderList;
    }
    private sortLeadersNet(leaderList: any[], round) {
        this.flightRound = round;

        leaderList = leaderList.map(leader => ({ ...leader }));

        leaderList.sort(this.ComparatorPositionNet(round));
        let pos: number = 1;
        let tied: boolean;

        if (leaderList.length > 0) leaderList[0]['position'] = pos;
        for (let i = 1; i < leaderList.length; i++) {
            let leaderCurrent = leaderList[i];
            let leaderPrevious = leaderList[i - 1];

            let currentHoleScore: number = 0;
            let previousHoleScore: number = 0;

            tied = leaderCurrent[`netScoreR${round}`] == leaderPrevious[`netScoreR${round}`];

            if (tied) {

                leaderList[i]['tied'] = true;
                leaderList[i - 1]['tied'] = true;
                leaderList[i]['position'] = 'T' + pos;
                leaderList[i - 1]['position'] = 'T' + pos;
            } else {
                pos = i + 1;
                leaderList[i]['position'] = pos;
            }
        }
        return leaderList;

    }
    ComparatorPositionGross(round) {
        return (a, b) => {
            let compare: number;

            // compare = Number(a.status) - Number(b.status);
            // if (compare != 0) {
            //     return compare;
            // }
            // this.flightRound = this.flightRound;
            if (a.status < b.status) {
                return -1;
            }
            if (a.status > b.status) {
                return 1;
            }
            // let round = this.getFlightRound(this.flightRound);
            // //console.log(round);

            let selfHoles: number = a[`holesPlayedR${round}`]
            let leaderHoles: number = b[`holesPlayedR${round}`]

            if (selfHoles != 0 && leaderHoles != 0) {
                compare = a[`underGross${round}`] - b[`underGross${round}`];

                if (compare != 0) {
                    return compare;
                }
                if (a[`completed${round}`] && b[`completed${round}`]) {
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

    }
    ComparatorPositionNet(round) {
        return (a, b) => {
            let compare: number;

            // compare = Number(a.status) - Number(b.status);
            // if (compare != 0) {
            //     return compare;
            // }
            if (a.status < b.status) {
                return -1;
            }
            if (a.status > b.status) {
                return 1;
            }

            let selfHoles: number = a[`holesPlayedR${round}`]
            let leaderHoles: number = b[`holesPlayedR${round}`]

            if (selfHoles != 0 && leaderHoles != 0) {
                compare = a[`underNet${round}`] - b[`underNet${round}`];

                if (compare != 0) {
                    return compare;
                }
                if (a[`completed${round}`] && b[`completed${round}`]) {
                    let noOfHoles: number = 9;
                    while (noOfHoles > 0) {
                        if (noOfHoles == 9)
                            compare = a.holeScoreLast9Net - b.holeScoreLast9Net;
                        else if (noOfHoles == 6)
                            compare = a.holeScoreLast6Net - b.holeScoreLast6Net;
                        else if (noOfHoles == 3)
                            compare = a.holeScoreLast3Net - b.holeScoreLast3Net;
                        else if (noOfHoles < 3)
                            compare = a.holeScoreLast1Net - b.holeScoreLast1Net;

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
    }
    private sortAllGrossLeadersTie(leaderGrossList: any[]) {
        leaderGrossList = leaderGrossList.sort(this.ComparatorAllGrossPosition);
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
    formatHandicap(handicap: number | null | undefined): string {
        if (handicap == null) return '-';
        return handicap < 0 ? `+${Math.abs(handicap)}` : handicap.toString();
    }

    getFlightRound(round): any {
        return round;
    }
    ComparatorAllGrossPosition(a, b) {
        let compare: number;

        // compare = Number(a.status) - Number(b.status);
        // if (compare != 0) {
        //     return compare;
        // }
        if (a.status < b.status) {
            return -1;
        }
        if (a.status > b.status) {
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
            selfHoles = a.holesPlayedR1;
            leaderHoles = b.holesPlayedR1;
            completed = a.completed1 && b.completed1;
        } else if (checkRoundPlayed == 2) {
            selfHoles = a.holesPlayedR2;
            leaderHoles = b.holesPlayedR2;
            completed = a.completed2 && b.completed2;
        } else if (checkRoundPlayed == 3) {
            selfHoles = a.holesPlayedR3;
            leaderHoles = b.holesPlayedR3;
            completed = a.completed3 && b.completed3;
        } else if (checkRoundPlayed == 4) {
            selfHoles = a.holesPlayedR4;
            leaderHoles = b.holesPlayedR4;
            completed = a.completed4 && b.completed4;
        }

        if (selfHoles != 0 && leaderHoles != 0) {
            compare = a.underGross - b.underGross;

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

        // compare = Number(a.status) - Number(b.status);
        // if (compare != 0) {
        //     return compare;
        // }
        if (a.status < b.status) {
            return -1;
        }
        if (a.status > b.status) {
            return 1;
        }

        let selfHoles: number = 0;
        let leaderHoles: number = 0;
        let completed: boolean = false;
        let checkRoundPlayed =
            a.activeRound > a.totalRounds ? a.totalRounds : a.activeRound;

        if (checkRoundPlayed == 1) {
            selfHoles = a.holesPlayedR1;
            leaderHoles = b.holesPlayedR1;
            completed = a.completed1 && b.completed1;
        } else if (checkRoundPlayed == 2) {
            selfHoles = a.holesPlayedR2;
            leaderHoles = b.holesPlayedR2;
            completed = a.completed2 && b.completed2;
        } else if (checkRoundPlayed == 3) {
            selfHoles = a.holesPlayedR3;
            leaderHoles = b.holesPlayedR3;
            completed = a.completed3 && b.completed3;
        } else if (checkRoundPlayed == 4) {
            selfHoles = a.holesPlayedR4;
            leaderHoles = b.holesPlayedR4;
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
                        compare = a.holeScoreLast9Net - b.holeScoreLast9Net;
                    else if (noOfHoles == 6)
                        compare = a.holeScoreLast6Net - b.holeScoreLast6Net;
                    else if (noOfHoles == 3)
                        compare = a.holeScoreLast3Net - b.holeScoreLast3Net;
                    else if (noOfHoles < 3)
                        compare = a.holeScoreLast1Net - b.holeScoreLast1Net;

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
