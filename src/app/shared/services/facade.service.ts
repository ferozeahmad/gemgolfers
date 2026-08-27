import { Injectable, Injector } from "@angular/core";
import { ClubsService } from "../../shared/services/clubs.service";
import { CoursesService } from "../../shared/services/courses.service";
import { PlayersService } from "../../shared/services/players.service";
import { FlightsService } from "../../shared/services/flights.service";
import { MatchplayService } from "../../shared/services/matchplay.service";
import { TournamentsService } from "../../shared/services/tournaments.service";
import { TeamsLeaderboardService } from "../../shared/services/teams-leaderboard.service";
import { TeeTimeService } from "../../shared/services/teetime.service";
import { PlayerHandicapWhsService } from "../../shared/services/player-handicap-whs.service";

import { Club, ClubSchedule } from "../../shared/models/club.model";
import {
  Player,
  PlayerHanidcap,
  Marshal,
  ClubMembership,
  handicap_change_log,
} from "../../shared/models/player.model";
import {
  AddDailyRound,
  Tournament,
  TournamentCategory,
  TournamentMember,
} from "../../shared/models/tournament.model";
import { Score } from "../../shared/models/score.model";
import { Flight, FlightMembers } from "../models/flight.model";
import { TeeTime } from "../models/teetime.model";
import { TournamentOpponentQL } from "../fragments/tournament.fragment";
import { Team } from "../models/team.model";

@Injectable({
  providedIn: "root",
})
export class FacadeService {
  constructor(private injector: Injector) { }

  private _clubService: ClubsService;

  public get clubService(): ClubsService {
    if (!this._clubService) {
      this._clubService = this.injector.get(ClubsService);
    }
    return this._clubService;
  }

  getClubList() {
    return this.clubService.getClubsList();
  }
  getPGFClubList(id: string) {
    return this.clubService.getPGFClubsList(id);
  }
  searchClubsByName(name: string) {
    return this.clubService.searchClubsByName(name);
  }

  AddClub(club: Club) {
    return this.clubService.AddClub(club);
  }
  addFeedback(feedback: any) {
    return this.clubService.addFeedback(feedback);
  }

  AddClubSchedule(schedule: ClubSchedule) {
    return this.clubService.AddClubSchedule(schedule);
  }
  getAllFeedback() {
    return this.clubService.getAllFeedback();
  }
  getAllFeedbackByUserId(userId: string) {
    return this.clubService.getAllFeedbackByUserId(userId);
  }
  updateFeedbackStatus(id: string, status: string) {
    return this.clubService.updateFeedbackStatus(id, status);
  }
  updateAllFeedbackStatus(status: string) {
    return this.clubService.updateAllFeedbackStatus(status);
  }
  getAllCoursesRequest() {
    return this.clubService.getAllCoursesRequest();
  }
  updateClub(club: Club) {
    return this.clubService.updateClub(club);
  }

  updateAccountInFirebase(email: string, password: string) {
    return this.playerService.updateUserInFireBase(email, password);
  }
  sendTransactionalEmail(email: string, name: string, password: string) {
    return this.playerService.sendTransactionalEmail(email, name, password);
  }

  deleteClub(id: string) {
    return this.clubService.deleteClub(id);
  }

  getClubByID(id: string) {
    return this.clubService.getClubByID(id);
  }

  getScheduleList(clubId: string) {
    return this.clubService.getScheduleList(clubId);
  }

  findOne(id: string) {
    return this.clubService.findOne(id);
  }

  getClubMemberAggregateByCategroy(id: string) {
    return this.clubService.getClubMemberAggregateByCategroy(id);
  }
  getClubMemberAggregateByCategroyDashBoard(id: string) {
    return this.clubService.getClubMemberAggregateByCategroyDashBoard(id);
  }
  getClubMemberAggregateByCategroyDashBoardAll() {
    return this.clubService.getClubMemberAggregateByCategroyDashBoardAll();
  }

  // Club Management
  getClubAdmins(clubId: string) {
    return this.clubService.getClubAdmins(clubId);
  }
  getAllRoles() {
    return this.clubService.getAllRoles();
  }
  searchPlayerByEmail(email: string) {
    return this.clubService.searchPlayerByEmail(email);
  }
  setPlayerAdminClub(playerId: string, adminClubId: string | null) {
    return this.clubService.setPlayerAdminClub(playerId, adminClubId);
  }
  insertUserRole(userId: string, roleId: number) {
    return this.clubService.insertUserRole(userId, roleId);
  }
  removeUserRoles(userId: string) {
    return this.clubService.removeUserRoles(userId);
  }

  getClubsPaginated(limit: number, offset: number, search: string) {
    return this.clubService.getClubsPaginated(limit, offset, search);
  }

  getClubStatsByClubId(clubId: string) {
    return this.clubService.getClubStatsByClubId(clubId);
  }

  getClubMembersPaginated(clubId: string, limit: number, offset: number, search?: string) {
    return this.clubService.getClubMembersPaginated(clubId, limit, offset, search);
  }

  getClubTournamentsPaginated(clubId: string, limit: number, offset: number) {
    return this.clubService.getClubTournamentsPaginated(clubId, limit, offset);
  }

  getClubDailyRoundsPaginated(clubId: string, limit: number, offset: number) {
    return this.clubService.getClubDailyRoundsPaginated(clubId, limit, offset);
  }

  private _courseService: CoursesService;

  public get courseService(): CoursesService {
    if (!this._courseService) {
      this._courseService = this.injector.get(CoursesService);
    }
    return this._courseService;
  }

  getCoursesList() {
    return this.courseService.getCoursesList();
  }
  getApprovedCoursesList() {
    return this.courseService.getApprovedCoursesList();
  }
  getCoursesListbyID(id) {
    return this.courseService.getCoursesListbyID(id);
  }

  getCourseByID(id: string) {
    return this.courseService.getCourseByID(id);
  }
  getCourseByIDForForm(id: string) {
    return this.courseService.getCourseByIDForForm(id);
  }

  getCourseByClub(id: string) {
    return this.courseService.getCourseByClub(id);
  }

  getCourseInformation(id: string) {
    return this.courseService.getCourseInformation(id);
  }
  getCourseTeeMeta(id: string) {
    return this.courseService.getCourseTeeMeta(id);
  }

  getCourseInformationForForm(id: string) {
    return this.courseService.getCourseInformationForForm(id);
  }
  getCourseRating(id: string) {
    return this.courseService.getCourseRating(id);
  }

  getCourseHoles(id: string) {
    return this.courseService.getCourseHoles(id);
  }

  getCourseHoleSets(id: string) {
    return this.courseService.getCourseHoleSets(id);
  }
  // getCourseHoleSetsSimple(id: string) {
  //   return this.courseService.getCourseHoleSetsForCourse(id);
  // }
  getCourseHoleSetsForCourse(id: string) {
    return this.courseService.getCourseHoleSetsForCourse(id);
  }
  getCourseHoleSetsForCourseForm(id: string) {
    return this.courseService.getCourseHoleSetsForCourseForm(id);
  }

  AddCourse(course) {
    return this.courseService.AddCourse(course);
  }
  updateCourse(course: any, holesToSave: any) {
    return this.courseService.updateCourse(course, holesToSave);
  }
  updateCourseStatus(id: any) {
    return this.courseService.updateCourseStatus(id);
  }

  saveTeeColor(tee: any[]) {
    return this.courseService.saveTeeColor(tee);
  }
  deleteTeeColor(courseID: any, tee: any[]) {
    return this.courseService.deleteTeeColor(courseID, tee);
  }

  saveCourseHoles(holes: any[], holeSets: any[], holesYardages: any[], holeHazardsToSave: any[]) {
    return this.courseService.saveHolesANDholeSets(holes, holeSets, holesYardages, holeHazardsToSave);
  }
  saveCourseHolesSet(holeSets: any[]) {
    return this.courseService.saveholeSets(holeSets);
  }
  saveCourseMetaSet(holeSets: any[]) {
    return this.courseService.saveCourseMetaSet(holeSets);
  }
  saveCourseRating(holeSets: any[]) {
    return this.courseService.saveCourseRating(holeSets);
  }
  getTeesOfCourse(courseId: any) {
    return this.courseService.getTeesOfCourse(courseId);
  }
  getCourseHole(courseId: any) {
    return this.courseService.getCourseHole(courseId);
  }

  private _playerService: PlayersService;

  public get playerService(): PlayersService {
    if (!this._playerService) {
      this._playerService = this.injector.get(PlayersService);
    }
    return this._playerService;
  }

  getPlayersList() {
    return this.playerService.getPlayersList();
  }
  getPlayersListReport() {
    return this.playerService.getPlayersListReport();
  }
  getPlayersActivityReport(currentDate, lastDate) {
    return this.playerService.getPlayersActivityReport(currentDate, lastDate);
  }
  getPlayersListReportDateWise(currentDate, lastDate) {
    return this.playerService.getPlayersListReportDateWise(currentDate, lastDate);
  }
  getPlayersListByAdminCONGU() {
    return this.playerService.getPlayersListByAdminCONGU();
  }
  getPlayersListMerge() {
    return this.playerService.getPlayersListMerge();
  }

  getPlayersPaginated(where: any, limit: number, offset: number) {
    return this.playerService.getPlayersPaginated(where, limit, offset);
  }

  getPlayersListByClub(id: string) {
    return this.playerService.getPlayersListByClub(id);
  }
  getPlayersListMergeClub(id: string) {
    return this.playerService.getPlayersListMergeClub(id);
  }
  getPlayersListByTour(id: string) {
    return this.playerService.getPlayersListByTour(id);
  }
  getPlayersListByLeague(id: string) {
    return this.playerService.getPlayersListByLeague(id);
  }
  getPlayersListForTournament(id: string) {
    return this.playerService.getPlayersListForTournament(id);
  }
  getPlayersListByTournament(id: string) {
    return this.playerService.getPlayersListByTournament(id);
  }
  getPlayerActivityByUserId(userId: string) {
    return this.playerService.getPlayerActivityByUserId(userId);
  }
  getPlayersListByClubCONGU(id: string) {
    return this.playerService.getPlayersListByClubCONGU(id);
  }
  getPlayersListByClubOnlyWHS(id: string) {
    return this.playerService.getPlayersListByClubOnlyWHS(id);
  }
  getTotalPlayers(id: string) {
    return this.playerService.getTotalPlayers(id);
  }
  getTotalPlayersAll() {
    return this.playerService.getTotalPlayersAll();
  }
  getallPlayersforGGid() {
    return this.playerService.getallPlayersforGGid();
  }

  mergePlayers(oldPlayerId: string, newPlayerId: string) {
    return this.playerService.mergeProfiles(oldPlayerId, newPlayerId)
  }

  getPlayerHandicapListByPlayer(
    playerId: string,
    fromDate: string,
    toDate: string
  ) {
    return this.playerService.getPlayerHandicapListByPlayerId(
      playerId,
      fromDate,
      toDate
    );
  }

  getPlayersListByClubAndCategory(id: string, category: string) {
    return this.playerService.getPlayersListByClubAndCategory(id, category);
  }

  getPlayerByID(id: string) {
    return this.playerService.getPlayerByID(id);
  }
  getPlayersByID(id: string) {
    return this.playerService.getPlayersByID(id);
  }
  getPlayerByIDDetailForm(id: string) {
    return this.playerService.getPlayerByIDDetailForm(id);
  }

  getPlayerByGEMID(GEMID: string) {
    return this.playerService.getPlayerByGEMID(GEMID);
  }

  getPlayerByPhone(phone: string) {
    return this.playerService.getPlayerByPhone(phone);
  }

  getPlayerByEmail(email: string) {
    return this.playerService.getPlayerByEmail(email);
  }
  getPlayerByEmailLogin(email: string) {
    return this.playerService.getPlayerByEmailLogin(email);
  }
  verifyUserEmails(emails: string[]) {
    return this.playerService.verifyUserEmails(emails);
  }
  executeSendResetEmailInBulk(emails: any[]) {
    return this.playerService.executeSendResetEmailInBulk(emails);
  }

  getPlayerByMembershipNumberForSearch(
    clubID: string,
    membershipNumber: string
  ) {
    return this.playerService.getPlayerByMembershipNumberForSearch(
      clubID,
      membershipNumber
    );
  }
  getPlayerByMembershipNumber(membershipNumber: any) {
    return this.playerService.getPlayerByMembershipNumber(membershipNumber);
  }

  getPlayerByCategory(category: string) {
    return this.playerService.getPlayerByCategory(category);
  }

  getPlayerByClub(clubId: string) {
    return this.playerService.getPlayerByClub(clubId);
  }
  
  getProfessionalByClub(clubId: string) {
    return this.playerService.getProfessionalByClub(clubId);
  }

  AddPlayer(club: Player) {
    return this.playerService.AddPlayer(club);
  }
  changePlayerTee(id: string, tournamentId: string, tee: string, teeId) {
    return this.playerService.changePlayerTee(id, tournamentId, tee, teeId);
  }
  AddTourPlayer(club: Player, tourMember: any) {
    return this.playerService.AddTourPlayer(club, tourMember);
  }
  AddLeaguePlayer(club: Player, leagueMember: any) {
    return this.playerService.AddLeaguePlayer(club, leagueMember);
  }

  AddHandicapRemarks(handicap_change_log: handicap_change_log) {
    return this.playerService.AddHandicapRemarks(handicap_change_log);
  }

  importPlayerList(players: any[], clubMembers: any[]) {
    return this.playerService.importPlayerList(players, clubMembers);
  }
  importCaddieList(caddies: any[]) {
    return this.playerService.importCaddieList(caddies);
  }
  insertClubMember(clubMembers: any[]) {
    return this.playerService.insertClubMember(clubMembers);
  }

  updatePlayer(club: Player) {
    return this.playerService.updatePlayer(club);
  }
  updatePlayerProfile(player: Player, file: File) {
    return this.playerService.updatePlayerProfile(player, file);
  }
  updateTournamentBanner(banner: any, file: File) {
    return this.tournamentService.updateTournamentBanner(banner, file);
  }
  updateConguHandicap(id: string, newHandicap: any, tournamentId: any) {
    return this.playerService.updateConguHandicap(id, newHandicap, tournamentId);
  }
  freezePlayerHandicap(playerId: string, startDate: string, endDate: string) {
    return this.playerService.freezePlayerHandicap(playerId, startDate, endDate);
  }
  unFreezePlayerHandicap(playerId: string, startDate: string,) {
    return this.playerService.unFreezePlayerHandicap(playerId, startDate);
  }
  getTotalFlightPlayed(club: any, fromDate: string, toDate: string) {
    return this.playerService.getTotalFlightPlayed(club, fromDate, toDate);
  }

  getTotalFlightsPlayedByPlayer(id: string) {
    return this.playerService.getTotalFlightsPlayedByPlayer(id);
  }
  getTotalFlightPlayedAdmin(fromDate: string, toDate: string) {
    return this.playerService.getTotalFlightPlayedAdmin(fromDate, toDate);
  }
  getFlightPlayedAdmin(courseId: string, Date: string) {
    return this.playerService.getFlightPlayedAdmin(courseId, Date);
  }

  createClubMemberSubscription(subscription: any) {
    return this.playerService.createClubMemberSubscription(subscription);
  }

  getClubMemberSubscription(playerId: string, clubId: string, startDate: string) {
    return this.playerService.getClubMemberSubscription(playerId, clubId, startDate);
  }

  updateClubMemberSubscription(id: string, subscription: any) {
    return this.playerService.updateClubMemberSubscription(id, subscription);
  }

  deletePlayer(clubId: string, playerId: string) {
    return this.playerService.deletePlayer(clubId, playerId);
  }

  getPlayerCategories() {
    return this.playerService.getPlayerCategories();
  }
  getPlayerCategoriesKGC() {
    return this.playerService.getPlayerCategoriesKGC();
  }

  getPlayerFlightScores(id: string) {
    return this.playerService.getPlayerFlightScores(id);
  }
  updatePlayerCategory(membershipNumber: string) {
    return this.playerService.updatePlayerCategory(membershipNumber);
  }

  getPlayerFlights(id: string) {
    return this.playerService.getPlayerFlights(id);
  }

  getAllPlayersByCategory() {
    return this.playerService.getAllPlayersByCategory();
  }

  getPlayerHandicapListByClub(clubId: string) {
    return this.playerService.getPlayerHandicapListByClub(clubId);
  }

  createTournamentMarshals(marshals: Marshal[]) {
    return this.playerService.createTournamentMarshals(marshals);
  }

  playerUpdatedHandicapReport(
    clubId: string,
    fromDate: string,
    toDate: string
  ) {
    return this.playerService.playerUpdatedHandicapReport(
      clubId,
      fromDate,
      toDate
    );
  }
  playerUpdatedHandicapReportAdmin(
    fromDate: string,
    toDate: string
  ) {
    return this.playerService.playerUpdatedHandicapReportAdmin(

      fromDate,
      toDate
    );
  }

  playerUpdatedHandicapWHSReport(
    clubId: string,
    fromDate: string,
    toDate: string
  ) {
    return this.playerService.playerUpdatedHandicapWHSReport(
      clubId,
      fromDate,
      toDate
    );
  }
  playerUpdatedHandicapWHSReportAdmin(

    fromDate: string,
    toDate: string
  ) {
    return this.playerService.playerUpdatedHandicapWHSReportAdmin(

      fromDate,
      toDate
    );
  }

  searchPlayer(
    firstName: string,
    lastName: string,
    category: string,
    lowerHandicap: number,
    upperHandicap: number
  ) {
    return this.playerService.searchPlayer(
      firstName,
      lastName,
      category,
      lowerHandicap,
      upperHandicap
    );
  }
  searchPlayerForTournament(
    fullName: string,
    lowerHandicap: number,
    upperHandicap: number
  ) {
    return this.playerService.searchPlayerForTournament(
      fullName,
      lowerHandicap,
      upperHandicap
    );
  }
  private _tournamentService: TournamentsService;

  public get tournamentService(): TournamentsService {
    if (!this._tournamentService) {
      this._tournamentService = this.injector.get(TournamentsService);
    }
    return this._tournamentService;
  }

  getTournamentsListForCompleted(endDate: Date) {
    return this.tournamentService.getTournamentsListForCompleted(endDate);
  }

  getTournamentsListReport() {
    return this.tournamentService.getTournamentsListReport();
  }
  getTournamentListByDate(fromDate?: any, toDate?: any) {
    return this.tournamentService.getTournamentListByDate(fromDate, toDate);
  }
  deleteTournaments(deletedtournaments: any[]): Promise<boolean> {
    return this.tournamentService.deleteTournaments(deletedtournaments);
  }
  deleteFlight(deletedFlight: string) {
    return this.tournamentService.deleteFlight(deletedFlight);
  }
  deleteLeagues(deleteLeagues: any[]): Promise<boolean> {
    return this.tournamentService.deleteLeagues(deleteLeagues);
  }
  deleteTours(deleteTours: any[]): Promise<boolean> {
    return this.tournamentService.deleteTours(deleteTours);
  }
  deleteScores(deleteScores: any[]): Promise<boolean> {
    return this.tournamentService.deleteScores(deleteScores);
  }
  getLeagues() {
    return this.tournamentService.getLeagues();
  }
  getLeaguesListByDate(fromDate?: any, toDate?: any) {
    return this.tournamentService.getLeaguesListByDate(fromDate, toDate);
  }
  getToursReport() {
    return this.tournamentService.getToursReport();
  }
  getToursListByDate(fromDate?: any, toDate?: any) {
    return this.tournamentService.getToursListByDate(fromDate, toDate);
  }
  searchTournamentsByTitle(title: string) {
    return this.tournamentService.searchTournamentsByTitle(title);
  }
  searchLeaguesByName(name: string) {
    return this.tournamentService.searchLeaguesByName(name);
  }
  searchToursByName(name: string) {
    return this.tournamentService.searchToursByName(name);
  }
  getLeaguesReport() {
    return this.tournamentService.getLeaguesReport();
  }
  getLeaguesByClub(id: string) {
    return this.tournamentService.getLeaguesByClub(id);
  }
  getLeagueById(id: string) {
    return this.tournamentService.getLeagueById(id);
  }
  getLeaguesMembers(id: string) {
    return this.tournamentService.getLeaguesMembers(id);
  }
  getTourMembers(id: string) {
    return this.tournamentService.getTourMembers(id);
  }

  getTournamentsListForLiveByAdmin(endDate: Date) {
    return this.tournamentService.getTournamentsListForLiveByAdmin(endDate);
  }
  getTournamentsListForSheduleByAdmin(endDate: Date) {
    return this.tournamentService.getTournamentsListForSheduleByAdmin(endDate);
  }
  getTournamentsListForIncompleteByAdmin(endDate: Date) {
    return this.tournamentService.getTournamentsListForIncompleteByAdmin(
      endDate
    );
  }
  getTournamentsListByClub(clubId: string) {
    return this.tournamentService.getTournamentsListByClub(clubId);
  }
  getTournamentsListByCourse(courseId: string) {
    return this.tournamentService.getTournamentsListByCourse(courseId);
  }
  getTournamentsListByClubForCompleted(endDate: Date, clubId: string) {
    return this.tournamentService.getTournamentsListByClubForCompleted(
      endDate,
      clubId
    );
  }
  getTournamentsListByAdminForCompleted(endDate: Date, clubId: string) {
    return this.tournamentService.getTournamentsListByAdminForCompleted(
      endDate,
      clubId
    );
  }
  getTournamentsListByTourForCompleted(tourId: string) {
    return this.tournamentService.getTournamentsListByTourForCompleted(
      tourId
    );
  }
  getTournamentsListByLeague(tourId: string) {
    return this.tournamentService.getTournamentsListByLeague(
      tourId
    );
  }

  getTournamentsListByClubForLive(endDate: Date, clubId: string) {
    return this.tournamentService.getTournamentsListForLive(endDate, clubId);
  }

  getTournamentsListByClubForSchedule(endDate: Date, clubId: string) {
    return this.tournamentService.getTournamentsListByClubForSchedule(
      endDate,
      clubId
    );
  }
  getTournamentsListByClubForIncompelete(endDate: Date, clubId: string) {
    return this.tournamentService.getTournamentsListByClubForIncompelete(
      endDate,
      clubId
    );
  }

  getActiveTournamentsList(todayDate: string) {
    return this.tournamentService.getActiveTournamentsList(todayDate);
  }

  getClubActiveTournamentsList(todayDate: string, clubId: string) {
    return this.tournamentService.getClubActiveTournamentsList(
      todayDate,
      clubId
    );
  }

  getPlayersListByTournamentAndCategory(id: string, category: string) {
    return this.tournamentService.getPlayersListByTournamentAndCategory(
      id,
      category
    );
  }

  LeaderboardSubscription(id: string) {
    return this.tournamentService.LeaderboardSubscription(id);
  }
  tournamentDashBoard(id: string) {
    return this.tournamentService.tournamentDashBoard(id);
  }
  getTourGuide(id: string) {
    return this.tournamentService.getTourGuide(id);
  }

  LeaderboardSubscriptions(id: string, cat: any) {
    return this.tournamentService.LeaderboardSubscriptions(id, cat);
  }

  deleteTournamentMember(tournamentId: string, playerId: string) {
    return this.tournamentService.deleteTournamentMember(
      tournamentId,
      playerId
    );
  }
  updateTournamentMemberHandicap(tournamentId: string, playerId: string, handicap: string) {
    return this.tournamentService.updateTournamentMemberHandicap(
      tournamentId,
      playerId,
      handicap
    );
  }
  deleteTourGuide(id: string) {
    return this.tournamentService.deleteTourGuide(
      id
    );
  }

  tournamentScoreLoader(id: string) {
    return this.tournamentService.tournamentScoreLoader(id);
  }


  savePlayerHandicaps(
    handicap: PlayerHanidcap[],
    player: Player[],
    handicapChange: handicap_change_log[]
  ) {
    return this.tournamentService.savePlayerHandicaps(
      handicap,
      player,
      handicapChange
    );
  }

  getTournamentByID(id: string) {
    return this.tournamentService.getTournamentByID(id);
  }
  getTournamentByIDForSetup(id: string) {
    return this.tournamentService.getTournamentByIDForSetup(id);
  }
  getTournamentByIDForSignUpUsers(id: string) {
    return this.tournamentService.getTournamentByIDForSignUpUsers(id);
  }

  addTournament(tournament: any, flightId: string = '', slotId: string = '', count = 0) {
    return this.tournamentService.addTournament(tournament, flightId, slotId, count);
  }
  addTour(tour: any, file: any) {
    return this.tournamentService.addTour(tour, file);
  }
  addLeague(league: any, file: any) {
    return this.tournamentService.addLeague(league, file);
  }
  addSubTournament(obj: any) {
    return this.tournamentService.addSubTournament(obj);
  }

  updateFlightSettings(
    tournamentId: string,
    category: string,
    flightSettings: JSON
  ) {
    return this.tournamentService.updateFlightSettings(
      tournamentId,
      category,
      flightSettings
    );
  }

  checkPrefix(prefix: string) {
    return this.tournamentService.checkPrefix(prefix);
  }
  editTournament(tournament: any, category: any, marshals: any) {
    return this.tournamentService.editTournament(
      tournament,
      category,
      marshals
    );
  }

  getFlightSettings(tournamentId: string, category: string) {
    return this.tournamentService.getFlightSettings(tournamentId, category);
  }

  UndoTournamentRound(
    tournamentId: string,
    flightRound: number,
    resetRound: number,
    cut: any
  ) {
    return this.tournamentService.UndoTournamentRound(
      tournamentId,
      flightRound,
      resetRound,
      cut
    );
  }

  getTournamentMembers(tournamentId: string) {
    return this.tournamentService.getTournamentMembers(tournamentId);
  }

  markActiveTournamentMembers(
    tournamentId: string,
    tournamentMembers: TournamentMember[]
  ) {
    return this.tournamentService.markActiveTournamentMembers(
      tournamentId,
      tournamentMembers
    );
  }

  insertTournamentMember(tournamentMembers: TournamentMember[]) {
    return this.tournamentService.insertTournamentMember(tournamentMembers);
  }
  insertTourGuide(tourGuide: any[], file: File) {
    return this.tournamentService.insertTourGuide(tourGuide, file);
  }
  insertTournamentTeam(teamsToSave: Team[], tournamentId, teamsMembersToRemove: any[] = []) {
    return this.tournamentService.insertTournamentTeam(teamsToSave, tournamentId, teamsMembersToRemove);
  }
  insertTournamentPairs(pairsToSave: any[], tournamentId, pairsMembersToRemove: any[] = []) {
    return this.tournamentService.insertTournamentPairs(pairsToSave, tournamentId, pairsMembersToRemove);
  }
  insertTournamentMemberStatus(tournamentMemberStatus) {
    return this.tournamentService.insertTournamentMemberStatus(tournamentMemberStatus);
  }

  // insertClubMember(clubId: string, playerId: string) {
  //   return this.tournamentService.insertClubMember(clubId, playerId);
  // }
  getLeageLeaderBoards(id: string) {
    return this.tournamentService.getLeageLeaderBoards(id);
  }
  getLeagueName(id: string) {
    return this.tournamentService.getLeagueName(id);
  }

  setScoreUpdateTime(tournamentId: string, date: string) {
    return this.tournamentService.setScoreUpdateTime(tournamentId, date);
  }

  setTournamentStep(tournamentId: string, currentStep: number, isSetupComplete: boolean) {
    return this.tournamentService.setTournamentStep(tournamentId, currentStep, isSetupComplete);
  }

  leaderAllRoundData(tournamentId: string) {
    return this.tournamentService.leaderAllRoundData(tournamentId);
  }

  eliminateRound(oldFlightId: string, newFlightId: string, playerId: string) {
    return this.tournamentService.eliminateRound(
      oldFlightId,
      newFlightId,
      playerId
    );
  }

  private _teamsLeaderboardService: TeamsLeaderboardService;

  public get teamsLeaderboardService(): TeamsLeaderboardService {
    if (!this._teamsLeaderboardService) {
      this._teamsLeaderboardService = this.injector.get(
        TeamsLeaderboardService
      );
    }
    return this._teamsLeaderboardService;
  }

  LeaderboardTeamSubscription(tournamentId: string, playerId: string) {
    return this.teamsLeaderboardService.LeaderboardTeamSubscription(
      tournamentId,
      playerId
    );
  }

  private _matchplayService: MatchplayService;

  public get matchplayService(): MatchplayService {
    if (!this._matchplayService) {
      this._matchplayService = this.injector.get(MatchplayService);
    }
    return this._matchplayService;
  }

  MatchPlayDataQuery(playerId: string, flightId: string) {
    return this.matchplayService.MatchPlayDataQuery(playerId, flightId);
  }
  MatchPlayDataQueryShort(playerId: string, flightId: string) {
    return this.matchplayService.MatchPlayDataQueryShort(playerId, flightId);
  }

  SaveScoresMutation(scores: Score[]) {
    return this.matchplayService.SaveScoresMutation(scores);
  }

  getPlayerTournamentScore(tournamentId: string, playerId: string) {
    return this.matchplayService.getPlayerTournamentScore(
      tournamentId,
      playerId
    );
  }

  private _flightService: FlightsService;

  public get flightsService(): FlightsService {
    if (!this._flightService) {
      this._flightService = this.injector.get(FlightsService);
    }
    return this._flightService;
  }

  SaveTournamentFlights(
    tournamentId: string,
    flightsToSave: any,
    flightMembersToSave: any
  ) {
    return this.flightsService.SaveTournamentFlights(
      tournamentId,
      flightsToSave,
      flightMembersToSave
    );
  }
  SaveTournamentFlightforTaxes(
    tournamentId: string,
    flightName: any,
    flightsToSave: any,
    flightMembersToSave: any
  ) {
    return this.flightsService.SaveTournamentFlightfortaxes(
      tournamentId,
      flightName,
      flightsToSave,
      flightMembersToSave
    );
  }
  insertFlightMembers(
    slotId: string, flightMembersToSave: any, count: any
  ) {
    return this.flightsService.insertFlightMembers(
      slotId,
      flightMembersToSave, count
    );
  }
  insertFlightGuest(
    slotId: string, flightMembersToSave: any, count: any
  ) {
    return this.flightsService.insertFlightGuest(
      slotId,
      flightMembersToSave, count
    );
  }

  SaveTournamentFlight(
    tournamentId: string,
    flightsToSave: any,
    flightMembersToSave: any
  ) {
    return this.flightsService.SaveTournamentFlight(
      tournamentId,
      flightsToSave,
      flightMembersToSave
    );
  }
  SaveRoundFlight(

    flightsToSave: any,

  ) {
    return this.flightsService.SaveRoundFlight(

      flightsToSave
    );
  }
  saveFlightMembers(
    flightId: string,
    flightMembersToSave: any
  ) {
    return this.flightsService.saveFlightMembers(
      flightId,
      flightMembersToSave
    );
  }
  updateflightMember(
    playerId: string,
    handicapAllocation,
  ) {
    return this.flightsService.updateflightMember(
      playerId, handicapAllocation
    );
  }
  createNextRoundFlights(flights: Flight[]) {
    return this.flightsService.createNextRoundFlights(flights);
  }
  addFlightName(flights: any) {
    return this.flightsService.addFlightName(flights);
  }

  copyPlayerScore(playerId: string, fromFlight: string, toFlight: string) {
    return this.flightsService.copyPlayerScore(playerId, fromFlight, toFlight);
  }

  getTotalFlights(clubId: string) {
    return this.flightsService.getTotalFlights(clubId);
  }
  getTotalFlightsAll() {
    return this.flightsService.getTotalFlightsAll();
  }

  DeleteFlightsAndMembers(
    flightIdsToRemove: string[],
    membersFromFlightToRemove: string[],
    flightMembersToRemove: string[]
  ) {
    return this.flightsService.DeleteFlightsAndMembers(
      flightIdsToRemove,
      membersFromFlightToRemove,
      flightMembersToRemove
    );
  }
  moveFlightsPlayer(flightMembersToSave: any) {
    return this.flightsService.moveFlightsPlayer(flightMembersToSave);
  }
  DeleteFlightMembers(flightid: any, flightMembersToRemove: any, count = 0) {
    return this.flightsService.DeleteFlightMembers(flightid, flightMembersToRemove, count);
  }
  DeleteGuestMembers(flightid: any, flightMembersToRemove: any, count = 0) {
    return this.flightsService.DeleteGuestMembers(flightid, flightMembersToRemove, count);
  }

  getTournamentsFlights(tournamentId: string) {
    return this.flightsService.getTournamentsFlights(tournamentId);
  }
  getTournamentsTeams(tournamentId: string) {
    return this.flightsService.getTournamentsTeams(tournamentId);
  }

  markPlayerAttendance(flightId: string, playerId: string, status: boolean) {
    return this.flightsService.markPlayerAttendance(flightId, playerId, status);
  }

  closeActiveRound(tournamentId: string, round: number, cutOffCriteria: any, activeRound: number) {
    return this.flightsService.closeActiveRound(
      tournamentId,
      round,
      cutOffCriteria,
      activeRound
    );
  }

  singleRoundFlightsQuery(flightId: string) {
    return this.flightsService.singleRoundFlightsQuery(flightId);
  }
  updatedFlightsQuery(flightId: string) {
    return this.flightsService.updatedFlightsQuery(flightId);
  }

  singleRoundFlightQuery(flightId: string) {
    return this.flightsService.singleRoundFlightQuery(flightId);
  }
  calculateHandicap(tournamentId: string) {
    return this.flightsService.calculateHandicap(tournamentId);
  }
  deletePlayerHandiCal(tournamnetId: string, PlayersIds: any[]) {
    return this.flightsService.deletePlayerHandiCal(tournamnetId, PlayersIds);
  }
  undoFlightHandicap(flightId: string, playerId: string) {
    return this.flightsService.undoFlightHandicap(flightId, playerId);
  }
  UndoSingleFlightHandicap(flightId: string) {
    return this.flightsService.UndoSingleFlightHandicap(flightId);
  }
  undoHandicapPlayer(flightId: string, playerId: string) {
    return this.flightsService.undoHandicapPlayer(flightId, playerId);
  }
  markPlayerPanelty(tournamentId: string, flightId: string, playerId: string) {
    return this.flightsService.markPlayerPanelty(tournamentId, flightId, playerId);
  }
  private _teeTimeService: TeeTimeService;

  public get TeeTimeService(): TeeTimeService {
    if (!this._teeTimeService) {
      this._teeTimeService = this.injector.get(TeeTimeService);
    }
    return this._teeTimeService;
  }

  getClubTeeTimeBooking(clubId: string, offset: number, limit: number) {
    if (clubId) {
      return this.TeeTimeService.getClubTeeTimeBooking(clubId, offset, limit);
    } else {
      return this.TeeTimeService.getClubTeeTimeBookingForSuperAdmin(offset, limit);
    }
  }

  // getClubTeeTimeBookingAggregate(clubId: string) {
  //   if (clubId) {
  //     return this.TeeTimeService.getClubTeeTimeBooking(clubId);
  //   } else {
  //     // For super admin, we might need a separate aggregate query or handle it differently
  //     return this.TeeTimeService.getClubTeeTimeBookingForSuperAdmin(); // This will not return aggregate data, needs to be handled
  //   }
  // }

  deleteTeeTime(teeId: string) {
    return this.TeeTimeService.deleteTeeTime(teeId);
  }

  getPlayerWHS(playerId: string) {
    return this.playerService.getPlayerWHS(playerId);
  }
  getPlayerAllWHS(playerId: string) {
    return this.playerService.getPlayerAllWHS(playerId);
  }
  getPlayerWHSRound(courseRating: string) {
    return this.playerService.getPlayerWHSRound(courseRating);
  }

  getDailyRounds(clubId: string, fromDate: string, toDate: string) {
    return this.tournamentService.getDailyRounds(clubId, fromDate, toDate);
  }
  getDailyRoundsSingle(clubId: string, fromDate: string, toDate: string) {
    return this.tournamentService.getDailyRoundsSingle(
      clubId,
      fromDate,
      toDate
    );
  }
  getDailyRoundsSingleAdmin(fromDate: string, toDate: string) {
    return this.tournamentService.getDailyRoundsSingleAdmin(

      fromDate,
      toDate
    );
  }
  getDailyCardSingle(clubId: string, fromDate: string, toDate: string) {
    return this.tournamentService.getDailyCardSingle(
      clubId,
      fromDate,
      toDate
    );
  }
  getDailyTeeTimeReportClub(clubId: string, fromDate: string, toDate: string) {
    return this.tournamentService.getDailyTeeTimeReportClub(
      clubId,
      fromDate,
      toDate
    );
  }
  getDailyCardSingleAdmin(fromDate: string, toDate: string) {
    return this.tournamentService.getDailyCardSingleAdmin(

      fromDate,
      toDate
    );
  }
  getDailyTeeTimeReportAdmin(fromDate: string, toDate: string) {
    return this.tournamentService.getDailyTeeTimeReportAdmin(

      fromDate,
      toDate
    );
  }
  getDailyRoundsStat(clubId: string, fromDate: string, toDate: string) {
    return this.tournamentService.getDailyRoundsStat(
      clubId,
      fromDate,
      toDate
    );
  }
  getDailyRoundsStatAdmin(fromDate: string, toDate: string) {
    return this.tournamentService.getDailyRoundsStatAdmin(

      fromDate,
      toDate
    );
  }
  getDailyRoundsSingleDashboard(clubId: string, fromDate: string, toDate: string) {
    return this.tournamentService.getDailyRoundsSingleDashboard(
      clubId,
      fromDate,
      toDate
    );
  }


  getDailyRoundsSingleDashboardAll(fromDate: string, toDate: string) {
    return this.tournamentService.getDailyRoundsSingleDashboardAll(

      fromDate,
      toDate
    );
  }
  getSingleDailyRound(clubId: string, Date: string) {
    return this.tournamentService.getSingleDailyRound(clubId, Date);
  }
  getSingleDailyRoundAdmin(Date: string) {
    return this.tournamentService.getSingleDailyRoundAdmin(Date);
  }
  getTeeTimesSlots(clubId: string, Date: string) {
    return this.tournamentService.getTeeTimesSlots(clubId, Date);
  }
  getTeeTimesSlotsAdmin(Date: string) {
    return this.tournamentService.getTeeTimesSlotsAdmin(Date);
  }
  getRoundScore(Id: any) {
    return this.tournamentService.getRoundScore(Id);
  }
  getPlayerScorebyID(Id: any) {
    return this.tournamentService.getPlayerScorebyID(Id);
  }

  isTeeTimeDateExist(clubId: string, selectedDate: Date) {
    return this.TeeTimeService.isTeeTimeDateExist(clubId, selectedDate);
  }

  AddTeeTimeSchedule(teeTime: TeeTime) {
    return this.TeeTimeService.AddTeeTimeSchedule(teeTime);
  }

  getTeeTimeById(id: string) {
    return this.TeeTimeService.getTeeTimeById(id);
  }

  updateTeeTimeSchedule(teeTime: TeeTime, newSlots: any[]) {
    return this.TeeTimeService.updateTeeTimeSchedule(teeTime, newSlots);
  }

  getPlayerlistbyName(FirstName: string, LastName: string) {
    return this.playerService.getPlayerlistbyName(FirstName, LastName);
  }
  getPlayerByMembershipNumberClubwise(
    clubId: string,
    FirstName: string,
    LastName: string
  ) {
    return this.playerService.getPlayerlistbyNameClubWise(
      clubId,
      FirstName,
      LastName
    );
  }

  getPlayerTodayRound(playerId: string, Date: string) {
    return this.playerService.getPlayerTodayRound(playerId, Date);
  }

  private _playerHandicapWhsService: PlayerHandicapWhsService;

  public get playerHandicapWhsService(): PlayerHandicapWhsService {
    if (!this._playerHandicapWhsService) {
      this._playerHandicapWhsService = this.injector.get(
        PlayerHandicapWhsService
      );
    }
    return this._playerHandicapWhsService;
  }

  getTorunamentScoreQuery(tournamentId: string) {
    return this.playerHandicapWhsService.getTorunamentScoreQuery(tournamentId);
  }
  getTorunamentScoreViewQuery(tournamentId: string) {
    return this.playerHandicapWhsService.getTorunamentScoreViewQuery(tournamentId);
  }

  getPlayersHandicapWhsHistory(playerIds: string[], playingDate: Date) {
    return this.playerHandicapWhsService.getPlayersHandicapWhsHistory(
      playerIds,
      playingDate
    );
  }
  getPlayersHandicapWhsHistoryAboveDate(playerIds: string, playingDate: Date) {
    return this.playerHandicapWhsService.getPlayersHandicapWhsHistoryAboveDate(
      playerIds,
      playingDate
    );
  }

  savePlayerWhsHandicapsForRound(handicapWhsInputs) {
    return this.playerHandicapWhsService.savePlayerWhsHandicapsForRound(
      handicapWhsInputs
    );
  }

  savePlayersHandicapWhsIndex(playersList, changeLogs) {
    return this.playerHandicapWhsService.savePlayersHandicapWhsIndex(
      playersList,
      changeLogs
    );
  }

  savePlayerHandicapWhsIndex(handicapWhsInputs) {
    return this.playerHandicapWhsService.savePlayerHandicapWhsIndex(
      handicapWhsInputs
    );
  }
  updatePlayerHandicapWhsDifferential(handicapWhsInputs) {
    return this.playerHandicapWhsService.updatePlayerHandicapWhsDifferential(
      handicapWhsInputs
    );
  }

  updateTournamentFlight(tournamentId: string, flag: boolean) {
    return this.flightsService.updateTournamentFlight(tournamentId, flag);
  }

  updateDailyRoundCourseHoleset(
    tournamentId: string,
    courseHolset: number,
    courseHoleSetsInverted: boolean,
    deleteAndInsertScores: boolean,
    scoreDetailsDelete: string[],
    scoreFlightIdsToRemove: string[],
    scorePlayerIdsToRemove: string[],
    scoresToInsert: any,
    tee: any,
    time: any,
    flightMembers: any[],
    deleteMember: any[],
    flightId: string
  ) {
    return this.flightsService.updateDailyRoundCourseHoleset(
      tournamentId,
      courseHolset,
      courseHoleSetsInverted,
      deleteAndInsertScores,
      scoreDetailsDelete,
      scoreFlightIdsToRemove,
      scorePlayerIdsToRemove,
      scoresToInsert,
      tee,
      time,
      flightMembers,
      deleteMember,
      flightId
    );
  }
}
