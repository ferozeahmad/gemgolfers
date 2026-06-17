import gql from 'graphql-tag';
import {
    PlayerQL,
    PlayerHandicapQL,
    PlayerHandicapWhsQL,
    PlayerHandicapLogQL,
} from '../fragments/player.fragment';
import { FlightsQL } from '../fragments/flight.fragment';
import { ScoreQL, ScoreDetailQL } from '../fragments/score.fragment';
import { CourseQL } from '../fragments/course.fragment';

export const GetPlayers = gql`
    query PostsGetQuery {
        player(
            where: { firstName: { _neq: "" } }
            order_by: { firstName: asc }
        ) {
            id
            firstName
            lastName
            playerCategory
            handicap
            handicapWhsIndex
            phone
            email
            countryCode
            membershipNumber
            createdAt
            membershipQL: membership {
                suspended
                club {
                    id
                    name
                }
            }
        }
    }
`;
export const getPlayersListReport = gql`
    query PostsGetQuery {
        player(
            where: {
                _and: [
                    { firstName: { _neq: "" } }
                    { firebaseUid: { _is_null: false } }
                ]
            }
            order_by: { createdAt: desc }
            limit: 4000
        ) {
            id
            fullName
            email
            createdAt
            phone
            countryCode
            firebaseUid
            membership {
                club {
                    id
                    name
                }
            }
            subscription {
                playerId
                subscription
            }
        }
        AggregateQL: player_aggregate {
            aggregate {
                totalCount: count
            }
        }
        MobileAggregateQL: player_aggregate(
            where: { firebaseUid: { _is_null: false } }
        ) {
            aggregate {
                count
            }
        }
        ClubAggregateQL: player_aggregate(
            where: { firebaseUid: { _is_null: true } }
        ) {
            aggregate {
                count
            }
        }
        PremiumAggregateQL: player_subscription_aggregate(
            where: { subscription: { _eq: "PREMIUM" } }
        ) {
            aggregate {
                count
            }
        }
        TrialAggregateQL: player_subscription_aggregate(
            where: { subscription: { _eq: "TRIAL" } }
        ) {
            aggregate {
                count
            }
        }
    }
`;
export const getPlayersActivityReportDateWise = gql`
    query getPlayersActivityReportDateWise(
        $fromDate: timestamptz!
        $toDate: timestamptz!
    ) {
        user_activity_log(
            where: {
                _and: [
                    { dateTime: { _gte: $fromDate } }
                    { dateTime: { _lte: $toDate } }
                ]
            }
            order_by: { dateTime: asc }
        ) {
            id
            activityType
            userId
            name
            email
            dateTime
            description
            ipAddress
        }
    }
`;
export const getPlayersListReportDateWise = gql`
    query PostsGetQuery($fromDate: timestamptz!, $toDate: timestamptz!) {
        player(
            where: {
                _and: [
                    { createdAt: { _lte: $fromDate } }
                    { createdAt: { _gt: $toDate } }
                    { firstName: { _neq: "" } }
                ]
            }
            order_by: { createdAt: desc }
        ) {
            id
            fullName
            email
            createdAt
            phone
            countryCode
            membership {
                club {
                    name
                }
            }
        }
        tournament_aggregate(
            where: {
                singleRound: { _eq: false }
                _and: [
                    { createdAt: { _lte: $fromDate } }
                    { createdAt: { _gt: $toDate } }
                ]
            }
        ) {
            aggregate {
                count
            }
        }

        tour_aggregate {
            aggregate {
                count
            }
        }
        league_aggregate {
            aggregate {
                count
            }
        }
    }
`;
export const GetPlayersMerge = gql`
    query PostsGetQuery {
        player {
            id
            firstName
            lastName
            handicap
            phone
            email
            membershipNumber
            membership {
                club {
                    id
                    name
                }
            }
        }
    }
`;
export const getPlayersListMergeClub = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where, order_by: { firstName: asc }) {
            id
            firstName
            lastName
            handicap
            phone
            email
            membershipNumber
            membership {
                club {
                    id
                    name
                }
            }
        }
    }
`;

export const MergePlayers = gql`
    mutation MergeProfiles($oldPlayerId: String!, $newPlayerId: String!) {
        update_feedback(
            where: { userId: { _eq: $oldPlayerId } }
            _set: { userId: $newPlayerId }
        ) {
            affected_rows
        }
        update_flight(
            where: { adminId: { _eq: $oldPlayerId } }
            _set: { adminId: $newPlayerId }
        ) {
            affected_rows
        }
        update_flight_member(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        UpdateFriendPlayer: update_friend(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        UpdateFriendFriend: update_friend(
            where: { friendId: { _eq: $oldPlayerId } }
            _set: { friendId: $newPlayerId }
        ) {
            affected_rows
        }
        update_league(
            where: { adminId: { _eq: $oldPlayerId } }
            _set: { adminId: $newPlayerId }
        ) {
            affected_rows
        }
        update_league_member(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_league_role_manager(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_mvp_leaderboard_point(
            where: { entityId: { _eq: $oldPlayerId } }
            _set: { entityId: $newPlayerId }
        ) {
            affected_rows
        }
        update_notification(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_notification_meta(
            where: { friendId: { _eq: $oldPlayerId } }
            _set: { friendId: $newPlayerId }
        ) {
            affected_rows
        }
        update_player_handicap(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_player_handicap_whs(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_player_subscription(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        UpdateScorePlayer: update_score(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        UpdaetScoreUpdater: update_score(
            where: { updaterId: { _eq: $oldPlayerId } }
            _set: { updaterId: $newPlayerId }
        ) {
            affected_rows
        }
        update_team(
            where: { adminId: { _eq: $oldPlayerId } }
            _set: { adminId: $newPlayerId }
        ) {
            affected_rows
        }
        update_team_member(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_tour(
            where: { adminId: { _eq: $oldPlayerId } }
            _set: { adminId: $newPlayerId }
        ) {
            affected_rows
        }
        update_tour_member(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_tournament(
            where: { adminId: { _eq: $oldPlayerId } }
            _set: { adminId: $newPlayerId }
        ) {
            affected_rows
        }
        update_tournament_member(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_tournament_member_status(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_tournament_pair(
            where: { member1Id: { _eq: $oldPlayerId } }
            _set: { member2Id: $newPlayerId }
        ) {
            affected_rows
        }
        update_tournament_role_manager(
            where: { playerId: { _eq: $oldPlayerId } }
            _set: { playerId: $newPlayerId }
        ) {
            affected_rows
        }
        update_tournament_team(
            where: { adminId: { _eq: $oldPlayerId } }
            _set: { adminId: $newPlayerId }
        ) {
            affected_rows
        }
        UpdateTournamentTeam1Opponent: update_tournament_team_opponent(
            where: { team1MemberId: { _eq: $oldPlayerId } }
            _set: { team1MemberId: $newPlayerId }
        ) {
            affected_rows
        }
        UpdateTournamentTeam2Opponent: update_tournament_team_opponent(
            where: { team2MemberId: { _eq: $oldPlayerId } }
            _set: { team2MemberId: $newPlayerId }
        ) {
            affected_rows
        }
        update_user_permission(
            where: { userId: { _eq: $oldPlayerId } }
            _set: { userId: $newPlayerId }
        ) {
            affected_rows
        }
        delete_club_member(where: { playerId: { _eq: $oldPlayerId } }) {
            affected_rows
        }
        delete_player(where: { id: { _eq: $oldPlayerId } }) {
            affected_rows
        }
    }
`;

export const GetPlayersPaginated = gql`
    query GetPlayersPaginated($where: player_bool_exp!, $limit: Int!, $offset: Int!) {
        player_aggregate(where: $where) {
            aggregate { count }
        }
        player(where: $where, order_by: [{ firstName: asc_nulls_last }, { lastName: asc_nulls_last }], limit: $limit, offset: $offset) {
            id
            firstName
            lastName
            playerCategory
            handicap
            createdAt
            handicapWhsIndex
            phone
            email
            membershipNumber
            membershipQL: membership {
                clubId
                playerId
                suspended
                club { id name }
            }
        }
    }
`;

export const GetPlayersByClub = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        AggregateQL: player_aggregate(where: $where) {
            aggregate {
                totalCount: count
            }
        }
        player(where: $where, order_by: { firstName: asc }) {
            id
            firstName
            lastName
            playerCategory
            handicap
            createdAt
            handicapWhsIndex
            phone
            email
            membershipNumber
            membershipQL: membership {
            clubId
            playerId
                suspended
                club {
                    id
                    name
                }
            }
        }
    }
`;
export const GetPlayersByTour = gql`
    query getPlayerListByTour($where: tour_member_bool_exp!) {
        AggregateQL: tour_member_aggregate(where: $where) {
            aggregate {
                totalCount: count
            }
        }
        tour_member(where: $where) {
            tourId
            playerId
            player {
                id
                firstName
                lastName
                playerCategory
                handicap
                createdAt
                handicapWhsIndex
                phone
                email
                membershipNumber
                membershipQL: membership {
                    suspended
                    club {
                        id
                        name
                    }
                }
            }
        }
    }
`;
export const GetPlayersListByLeague = gql`
    query GetPlayersListByLeague($where: league_member_bool_exp!) {
        AggregateQL: league_member_aggregate(where: $where) {
            aggregate {
                totalCount: count
            }
        }
        league_member(where: $where) {
            leagueId
            playerId
            player {
                id
                firstName
                lastName
                playerCategory
                handicap
                createdAt
                handicapWhsIndex
                phone
                email
                membershipNumber
                membershipQL: membership {
                    suspended
                    club {
                        id
                        name
                    }
                }
            }
        }
    }
`;
export const getPlayersList = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where, order_by: { firstName: asc }) {
            id
            firstName
            lastName
            playerCategory
            handicap
            email
            membershipNumber
        }
    }
`;
export const getPlayersListByClubCONGU = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where, order_by: { firstName: asc }) {
            id
            firstName
            lastName
            playerCategory
            handicap
            handicapWhsIndex
            phone
            email
            membershipNumber
            handicapQL: handicap_history(
                order_by: [{ tournament: { startDate: desc } }]
                limit: 1
            ) {
                handicap
                oldHandicap
                updatedAt
            }
        }
    }
`;
export const getPlayersListByAdminCONGU = gql`
    query PostsGetQuery {
        player(
            where: { firstName: { _neq: "" } }
            order_by: { firstName: asc }
        ) {
            id
            firstName
            lastName
            playerCategory
            handicap
            handicapWhsIndex
            phone
            email
            membershipNumber
            handicapQL: handicap_history(
                order_by: [{ tournament: { startDate: desc } }]
            ) {
                handicap
                oldHandicap
                updatedAt
            }
        }
    }
`;
export const getPlayersListByClubOnlyWHS = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where, order_by: { firstName: asc }) {
            id
            firstName
            lastName
            playerCategory
            handicap
            handicapWhsIndex
            handicapIndexFreezeTill
            phone
            email
            membershipNumber
        }
    }
`;
export const getTotalPlayers = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        AggregateQL: player_aggregate(where: $where) {
            aggregate {
                totalCount: count
            }
        }
    }
`;
export const getTotalPlayersAll = gql`
    query PostsGetQuery {
        AggregateQL: player_aggregate {
            aggregate {
                totalCount: count
            }
        }
    }
`;
export const getallPlayersforGGid = gql`
    query PostsGetQuery {
        player {
            gemId
        }
    }
`;
export const GetTotalFLightPlayed = gql`
    query PostsGetQuery($where: player_bool_exp!, $date: date!, $sdate: date!) {
        player(where: $where) {
            id
            firstName
            lastName
            playerCategory
            handicap
            email
            membershipNumber
            membershipQL: membership {
                clubId
                suspended
                club {
                    id
                    name
                }
            }
            DailyRoundAggregateQL: flights_played_aggregate(
                where: {
                    _and: [
                        { flight: { date: { _gte: $sdate } } }
                        { flight: { date: { _lte: $date } } }
                        {
                            flight: {
                                tournament: { singleRound: { _eq: true } }
                            }
                        }
                    ]
                }
            ) {
                aggregate {
                    count
                }
            }
            TournamentAggregateQL: flights_played_aggregate(
                where: {
                    _and: [
                        { flight: { date: { _gte: $sdate } } }
                        { flight: { date: { _lte: $date } } }
                        {
                            flight: {
                                tournament: { singleRound: { _eq: false } }
                            }
                        }
                    ]
                }
            ) {
                aggregate {
                    count
                }
            }
            LeagueAggregateQL: flights_played_aggregate(
                where: {
                    _and: [
                        { flight: { date: { _gte: $sdate } } }
                        { flight: { date: { _lte: $date } } }
                        {
                            flight: {
                                tournament: { leagueId: { _is_null: false } }
                            }
                        }
                    ]
                }
            ) {
                aggregate {
                    count
                }
            }
        }
    }
`;
export const getTotalFlightPlayedAdmin = gql`
    query PostsGetQuery($where: player_bool_exp!, $date: date!, $sdate: date!) {
        player(where: $where) {
            id
            firstName
            lastName
            playerCategory
            handicap
            email
            membershipNumber
            membershipQL: membership {
                suspended
                club {
                    id
                    name
                }
            }
            DailyRoundAggregateQL: flights_played_aggregate(
                where: {
                    _and: [
                        { flight: { date: { _gte: $sdate } } }
                        { flight: { date: { _lte: $date } } }
                        {
                            flight: {
                                tournament: { singleRound: { _eq: true } }
                            }
                        }
                    ]
                }
            ) {
                aggregate {
                    count
                }
            }
            TournamentAggregateQL: flights_played_aggregate(
                where: {
                    _and: [
                        { flight: { date: { _gte: $sdate } } }
                        { flight: { date: { _lte: $date } } }
                        {
                            flight: {
                                tournament: { singleRound: { _eq: false } }
                            }
                        }
                    ]
                }
            ) {
                aggregate {
                    count
                }
            }
            LeagueAggregateQL: flights_played_aggregate(
                where: {
                    _and: [
                        { flight: { date: { _gte: $sdate } } }
                        { flight: { date: { _lte: $date } } }
                        {
                            flight: {
                                tournament: { leagueId: { _is_null: false } }
                            }
                        }
                    ]
                }
            ) {
                aggregate {
                    count
                }
            }
        }
    }
`;
export const getFlightPlayedAdmin = gql`
    query PostsGetQuery($courseId: String!, $date: date!) {
        flight(
            where: {
                _and: [
                    { date: { _eq: $date } }
                    { courseId: { _eq: $courseId } }
                ]
            }
        ) {
            id
            courseHoleSets
            tee
            tee_id
            courseHoleSetsInverted
            time
            date
            members {
                flightId
                playingTee
                playerId
                PlayerQL: player {
                    id
                    firstName
                    lastName
                    fullName
                    membershipNumber
                    playerCategory
                }
            }
        }
    }
`;

export const GetPlayerByID = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where) {
            ...PlayerQL
            subscriptionQL: subscription {
                playerId
                subscription
            }
        }
    }
    ${PlayerQL}
`;

export const CreateAccountQL = gql`
    mutation CreateAccountQL($request: fbadminInput!) {
        CreateFirebaseUsers: firebaseAdminSDK(request: $request) {
            data
            status
        }
    }
`;

export const emailAction = gql`
    query mailChimpIntegrationAction($request: mailChimpInput!) {
        mailChimpIntegration(request: $request) {
            data
        }
    }
`;

export const getPlayersByID = gql`
    query getPlayersByID($where: player_bool_exp!) {
        player(where: $where) {
            ...PlayerQL
            subscriptionQL: subscription {
                playerId
                subscription
            }
        }
    }
    ${PlayerQL}
`;
export const getPlayerByIDDetailForm = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where) {
            id
            firstName
            lastName
            gender
            email
            phone
            picture
            dob
            handicap
            handicapWhsIndex
            playerCategory
            countryCode
            membershipNumber
            firebaseUid
            fcmToken
            gemId
            adminClubId
            membership {
                clubId
                suspended
                club {
                    id
                    name
                }
            }
            handicap_history(order_by: [{ tournament: { startDate: desc } }], limit: 1) {
                tournamentId
            }
        }
    }
`;

export const GetPlayerByFilter = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where) {
            id
            fullName
            firstName
            lastName
            phone
            handicap
            email
            playerCategory
            membershipNumber
            membership {
            playerId
            clubId
            }
        }
    }
`;
export const getPlayerByEmailLogin = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where) {
            id
            adminClubId
            firstName
            email
            firebaseUid
            picture
            lastName
            fullName
            userRole
            membership {
                clubId
                playerId
                club {
                    id
                    name
                    logo
                    courses {
                        id
                        name
                    }
                }
            }
            permissions {
                userId
                qrScanAllowed
                leagueAdmin
                tourAdmin
            }
            roles {
                userId
                roleId
                role {
                    id
                    name
                    access {
                        roleId
                        moduleId
                        module {
                            id
                            name
                        }
                    }
                }
            }
        }
    }
`;

export const GetPlayerByMembershipNumber = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where) {
            id
            fullName
            firstName
            lastName
            handicap
            playerCategory
            membershipNumber
            membership {
                club {
                    name
                }
            }
            subscriptionQL: subscription {
                playerId
                subscription
            }
        }
    }
`;
export const getTotalFlightsPlayedByPlayer = gql`
    query PostsGetQuery($where: flight_member_bool_exp!) {
        flight_member(where: $where) {
            flightId
            flight {
                id
                tournament {
                    id
                    title
                    singleRound
                    league {
                        id
                        name
                    }
                }
            }
        }
    }
`;

export const GetPlayerByFirstName = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where) {
            id
            fullName
            firstName
            lastName
            handicap
            playerCategory
            membershipNumber
            membership {
                club {
                    id
                    name
                }
            }
            subscriptionQL: subscription {
                playerId
                subscription
            }
        }
    }
    ${PlayerQL}
`;

export const verifyUserEmailQL = gql`
    mutation verifyUserEmailsAction($request: SampleInput!) {
        verifyUserEmails(request: $request) {
            email
            status
        }
    }
`;

export const GetPlayerByClub = gql`
    query PostsGetQuery($where: club_member_bool_exp!) {
        AggregateQL: club_member_aggregate(where: $where) {
            aggregate {
                totalCount: count
            }
        }
        club_member(where: $where) {
            player {
                id
                firstName
                lastName
                playerCategory
                handicap
                handicapWhsIndex
                phone
                email
                membershipNumber
            }
        }
    }
    ${PlayerQL}
`;

export const AddMutation = gql`
    mutation insert_player($objects: [player_insert_input!]!) {
        insert_player(objects: $objects) {
            returning {
                id
            }
        }
    }
`;
export const AddTourMemberMutation = gql`
    mutation insert_player(
        $objects: [player_insert_input!]!
        $tourMember: [tour_member_insert_input!]!
    ) {
        insert_player(objects: $objects) {
            returning {
                id
            }
        }
        insert_tour_member(objects: $tourMember) {
            returning {
                playerId
            }
        }
    }
`;
export const AddLeagueMemberMutation = gql`
    mutation insert_player(
        $objects: [player_insert_input!]!
        $leagueMember: [league_member_insert_input!]!
    ) {
        insert_player(objects: $objects) {
            returning {
                id
            }
        }
        insert_league_member(objects: $leagueMember) {
            returning {
                playerId
            }
        }
    }
`;

export const AddMutationHandicapLog = gql`
    mutation insert_handicap_change_log(
        $objects: [handicap_change_log_insert_input!]!
    ) {
        insert_handicap_change_log(objects: $objects) {
            returning {
                id
            }
        }
    }
`;

export const GetPlayerlistbyName = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where) {
            ...PlayerQL
            subscriptionQL: subscription {
                playerId
                subscription
            }
        }
    }
    ${PlayerQL}
`;
export const getPlayerlistbyNameClubWise = gql`
    query PostsGetQuery($where: player_bool_exp!) {
        player(where: $where) {
            ...PlayerQL
            subscriptionQL: subscription {
                playerId
                subscription
            }
        }
    }
    ${PlayerQL}
`;

export const GetPlayerTodayRoundQL = gql`
    query GetPlayerTodayRoundQL($playerId: String!, $toDate: date!) {
        flight(
            where: {
                _and: [
                    { date: { _eq: $toDate } }
                    { members: { playerId: { _eq: $playerId } } }
                ]
            }
        ) {
            id
        }
    }
`;

export const SavePlayersList = gql`
    mutation SavePlayersListMutation(
        $playersToSave: [player_insert_input!]!
        $clubmembers: [club_member_insert_input!]!
    ) {
        PlayerEntryQLi: insert_player(
            objects: $playersToSave
            on_conflict: { constraint: player_pkey, update_columns: [] }
        ) {
            AffectedRowsQLi: affected_rows
        }
        insert_club_member(
            objects: $clubmembers
            on_conflict: { constraint: club_member_pkey, update_columns: [] }
        ) {
            returning {
                playerId
            }
        }
    }
`;
export const insertClubMember = gql`
    mutation insertClubMember($clubmembers: [club_member_insert_input!]!) {
        insert_club_member(
            objects: $clubmembers
            on_conflict: { constraint: club_member_pkey, update_columns: [] }
        ) {
            returning {
                playerId
            }
        }
    }
`;

export const UpdateMutation = gql`
    mutation updateMutation(
        $where: player_bool_exp!
        $set: player_set_input!
        $playerID: String!
        $clubID: String!
        $suspended: Boolean!
    ) {
        update_player(where: $where, _set: $set) {
            affected_rows
            returning {
                id
            }
        }
        delete_club_member(
            where: {
                _and: [
                    { playerId: { _eq: $playerID } }
                    { clubId: { _eq: $clubID } }
                ]
            }
        ) {
            affected_rows
        }
        insert_club_member(
            objects: [
                { clubId: $clubID, playerId: $playerID, suspended: $suspended }
            ]
            on_conflict: {
                constraint: club_member_pkey
                update_columns: [suspended]
            }
        ) {
            returning {
                playerId
            }
        }
    }
`;

export const UpdatePlayerProfileMutation = gql`
    mutation UpdatePlayerProfileMutation(
        $where: player_bool_exp!
        $set: player_set_input!
    ) {
        update_player(where: $where, _set: $set) {
            affected_rows
            returning {
                id
            }
        }
    }
`;
export const UpdateHandicapMutation = gql`
    mutation updateMutation(
        $id: String!
        $handicap: numeric!
        $tournamentId: String!
    ) {
        PlayerUpdateQL: update_player(
            where: { id: { _eq: $id } }
            _set: { handicap: $handicap }
        ) {
            AffectedRowsQL: affected_rows
        }
        handicapUpdateQL: update_player_handicap(
            where: {
                _and: [
                    {
                        playerId: { _eq: $id }
                        tournamentId: { _eq: $tournamentId }
                    }
                ]
            }
            _set: { adjustedPanelty: true }
        ) {
            AffectedRowsQL: affected_rows
        }
    }
`;

export const FreezePlayerHandicapMutation = gql`
    mutation FreezePlayerHandicap(
        $playerId: String!
        $startDate: date!
        $endDate: date!
    ) {
        update_player(
            where: { id: { _eq: $playerId } }
            _set: {
                handicapIndexFreezeStart: $startDate
                handicapIndexFreezeTill: $endDate
            }
        ) {
            affected_rows
        }
    }
`;

export const unFreezePlayerHandicapMutation = gql`
    mutation unFreezePlayerHandicapMutation($playerId: String!) {
        update_player(
            where: { id: { _eq: $playerId } }
            _set: {
                handicapIndexFreezeTill: null
                handicapIndexFreezeStart: null
            }
        ) {
            affected_rows
        }
    }
`;

export const UpdatePlayerTeeMutation = gql`
    mutation updateMutation(
        $id: String!
        $tournamentId: String!
        $tee: String!
        $teeId: Int!
    ) {
        PlayerUpdateQL: update_flight_member(
            where: {
                _and: [
                    { playerId: { _eq: $id } }
                    { flight: { tournamentId: { _eq: $tournamentId } } }
                ]
            }
            _set: { playingTee: $tee, tee_id: $teeId }
        ) {
            AffectedRowsQL: affected_rows
        }
    }
`;

// export const DeletePlayer = gql`
// mutation DeletePlayer($where: player_bool_exp!) {
//     delete_player(
//       where: $where
//     ) {
//       affected_rows
//       returning {
//         id
//       }
//     }
//   }`;

export const DeletePlayer = gql`
    mutation DeletePlayer($where: club_member_bool_exp!) {
        delete_club_member(where: $where) {
            affected_rows
        }
    }
`;

export const PlayerFlightScoresQuery = gql`
    query PlayerFlightScoresQuery($playerId: String!) {
        PlayerQL: player(where: { id: { _eq: $playerId } }) {
            id
            firstName
            membershipNumber
            lastName
            playerCategory
            handicapWhsIndex
            phone
            handicap
            countryCode
            gender
            email
        }
        HandicapQL: player_handicap(
            where: { playerId: { _eq: $playerId } }
            order_by: [{ tournament: { startDate: desc } }, { round: desc }]
            limit: 40
        ) {
            tournamentId
            playerId
            adjustedPanelty
            handicap
            oldHandicap
            score
            round
            updatedAt
            grossScore
            adjustedScore
            panelty
            tournamentQL: tournament {
                title
                startDate
            }
        }

        MemberQL: flight_member(
            where: { playerId: { _eq: $playerId } }
            order_by: { flight: { date: desc } }
            limit: 200
        ) {
            playingTee
            tee_id
            FlightQL: flight {
                date
                tournamentId
                tee
                ScoresQL: scores(where: { playerId: { _eq: $playerId } }) {
                    playerId
                    playerHandicap
                    grossScore
                    hole {
                        holeNo
                        index
                        par
                    }
                    player {
                        id
                        firstName
                        lastName
                    }
                }
                course {
                    id
                    name
                }
            }
        }
        Aggegate: flight_member_aggregate(
            where: { playerId: { _eq: $playerId } }
        ) {
            aggregate {
                totalCount: count
            }
        }
    }
`;
export const getPlayerFlightsQuery = gql`
    query PlayerFlightScoresQuery($playerId: String!) {
        MemberQL: flight_member(
            where: { playerId: { _eq: $playerId } }
            order_by: { flight: { date: desc } }
            limit: 200
        ) {
            playingTee
            tee_id
            FlightQL: flight {
                tournamentId
            }
        }
    }
`;

export const AllPlayersByCategoryQL = gql`
    query playersByCategory {
        Amateurs: player(where: { playerCategory: { _eq: "Amateurs" } }) {
            id
        }
        Seniors: player(where: { playerCategory: { _eq: "Seniors" } }) {
            id
        }
        Veterans: player(where: { playerCategory: { _eq: "Veterans" } }) {
            id
        }
        Juniors: player(where: { playerCategory: { _eq: "Juniors" } }) {
            id
        }
        Professionals: player(
            where: { playerCategory: { _eq: "Professionals" } }
        ) {
            id
        }
        Ladies: player(where: { playerCategory: { _eq: "Ladies" } }) {
            id
        }
    }
`;

export const PlayerHandicapListByClubQL = gql`
    query getPlayerHandi($clubId: String!) {
        player(where: { membership: { clubId: { _eq: $clubId } } }) {
            ...PlayerQL
            handicapQL: handicap_history_log(
                distinct_on: [playerId]
                order_by: [{ playerId: asc }]
            ) {
                ...PlayerHandicapLogQL
            }
        }
    }
    ${PlayerQL}
    ${PlayerHandicapLogQL}
`;

export const PlayerHandicapListByplayerIdQL = gql`
    query getPlayerHandicap($where: flight_bool_exp!, $playerId: String!) {
        flight(where: $where) {
            date
            members(where: { playerId: { _eq: $playerId } }) {
                playingHandicapWhs
                playingHandicap
                playingTee
                player {
                    firstName
                    lastName
                    membershipNumber
                }
            }
        }
    }
    ${PlayerHandicapLogQL}
`;

export const createMarshalQL = gql`
    mutation createMarshalQL($objects: [marshal_insert_input!]!) {
        insert_marshal(objects: $objects) {
            returning {
                id
            }
        }
    }
`;
export const updatePlayerCatQL = gql`
    mutation updatePlayerCategory($membershipNumber: String!) {
        update_player(
            where: { membershipNumber: { _eq: $membershipNumber } }
            _set: { playerCategory: "Veterans" }
        ) {
            AffectedRowsQLi: affected_rows
        }
    }
`;
export const PlayerHandicapQuery = gql`
    query PlayerHandicapQuery($playerId: String!) {
        HandicapHistoryWhsQL: player_handicap_whs(
            where: { playerId: { _eq: $playerId } }
            order_by: { playedAt: desc }
            limit: 40
        ) {
            handicapDifferential
            score
            playedAt
            adjustedScore
            handicapIndex
            Handicap_id
            is_combined
            tee
            panelty
            playerId
            isFreezed
            tournamentId
            adjustmentScore
            adjustedPanelty
            combined_handicap {
                playedAt
                handicapDifferential
                Handicap_id
                isFreezed
                handicapIndex
                score
                tee
                tournamentId
                adjustedScore
                combined_handicap_id
                playerId
                adjustmentScore
                adjustedPanelty
                tournamentQL: tournament {
                    title
                }
            }
            used_handicaps {
                id
                used_handicap_id
                combine_handicap_id
            }
            tournamentQL: tournament {
                title
                id
                tournamentFlight
            }
        }
    }
`;
export const PlayerHandicapAllWHSQuery = gql`
    query PlayerHandicapAllWHSQuery($playerId: String!) {
        HandicapHistoryWhsQL: player_handicap_whs(
            where: { playerId: { _eq: $playerId } }
            order_by: { playedAt: desc }
        ) {
            handicapDifferential
            score
            playedAt
            adjustedScore
            handicapIndex
            Handicap_id
            combined_handicap_id
            is_combined
            isFreezed
            tee
            panelty
            playerId
            tournamentId
            adjustmentScore
            adjustedPanelty
            combined_handicap {
                playedAt
                handicapDifferential
                Handicap_id
                handicapIndex
                score
                tee
                isFreezed
                tournamentId
                adjustedScore
                combined_handicap_id
                playerId
                adjustmentScore
                adjustedPanelty
            }
            used_handicaps {
                id
                used_handicap_id
                combine_handicap_id
            }
            tournament {
                id
                tournamentFlight
            }
        }
    }
`;
export const PlayerHandicapRoundQuery = gql`
    query PlayerHandicapQuery($courseId: String!, $courseHoleSets: Int!) {
        course_rating(
            where: {
                courseId: { _eq: $courseId }
                _and: [{ courseHoleSets: { _eq: $courseHoleSets } }]
            }
        ) {
            courseId
            tee
            courseHoleSets
            courseRating
            slopeRating
            coursePar
            tee_id
            tee_name {
                id
                name
                key
            }
        }
        course_tees(where: { course_id: { _eq: $courseId } }) {
            course_id
            tee_id
            name_by_club
            color
            tee_order
            tee_name {
                id
                name
                key
            }
        }
    }
`;

export const searchPlayerQL = gql`
    query searchPlayerQL(
        $firstName: String!
        $lastName: String!
        $playerCategory: String!
        $handicapLower: numeric!
        $handicapUpper: numeric!
    ) {
        Result11: player(
            where: {
                firstName: { _ilike: $firstName }
                _or: [
                    { firstName: { _ilike: $lastName } }
                    { lastName: { _ilike: $lastName } }
                ]
                playerCategory: { _ilike: $playerCategory }
                handicap: { _gte: $handicapLower, _lte: $handicapUpper }
                firebaseUid: { _neq: "" }
            }
        ) {
            ...PlayerQL
        }
        Result12: player(
            where: {
                firstName: { _ilike: $firstName }
                _or: [
                    { firstName: { _ilike: $lastName } }
                    { lastName: { _ilike: $lastName } }
                ]
                playerCategory: { _ilike: $playerCategory }
                firebaseUid: { _neq: "" }
            }
        ) {
            ...PlayerQL
        }
        Result13: player(
            where: {
                firstName: { _ilike: $firstName }
                _or: [
                    { firstName: { _ilike: $lastName } }
                    { lastName: { _ilike: $lastName } }
                ]
                firebaseUid: { _neq: "" }
            }
        ) {
            ...PlayerQL
        }
        Result21: player(
            where: {
                firstName: { _ilike: $firstName }
                _or: [
                    { firstName: { _ilike: $lastName } }
                    { lastName: { _ilike: $lastName } }
                ]
                playerCategory: { _ilike: $playerCategory }
                handicap: { _gte: $handicapLower, _lte: $handicapUpper }
            }
        ) {
            ...PlayerQL
        }
        Result22: player(
            where: {
                firstName: { _ilike: $firstName }
                _or: [
                    { firstName: { _ilike: $lastName } }
                    { lastName: { _ilike: $lastName } }
                ]
                playerCategory: { _ilike: $playerCategory }
            }
        ) {
            ...PlayerQL
        }
        Result23: player(
            where: {
                firstName: { _ilike: $firstName }
                _or: [
                    { firstName: { _ilike: $lastName } }
                    { lastName: { _ilike: $lastName } }
                ]
            }
        ) {
            ...PlayerQL
        }
        Result31: player(
            where: {
                _or: [
                    { firstName: { _ilike: $firstName } }
                    { lastName: { _ilike: $lastName } }
                ]
                playerCategory: { _ilike: $playerCategory }
                handicap: { _gte: $handicapLower, _lte: $handicapUpper }
                firebaseUid: { _neq: "" }
            }
        ) {
            ...PlayerQL
        }
        Result32: player(
            where: {
                _or: [
                    { firstName: { _ilike: $firstName } }
                    { lastName: { _ilike: $lastName } }
                ]
                playerCategory: { _ilike: $playerCategory }
                firebaseUid: { _neq: "" }
            }
        ) {
            ...PlayerQL
        }
        Result33: player(
            where: {
                _or: [
                    { firstName: { _ilike: $firstName } }
                    { lastName: { _ilike: $lastName } }
                ]
                firebaseUid: { _neq: "" }
            }
        ) {
            ...PlayerQL
        }
        Result41: player(
            where: {
                _or: [
                    { firstName: { _ilike: $firstName } }
                    { lastName: { _ilike: $lastName } }
                ]
                playerCategory: { _ilike: $playerCategory }
                handicap: { _gte: $handicapLower, _lte: $handicapUpper }
            }
        ) {
            ...PlayerQL
        }
        Result42: player(
            where: {
                _or: [
                    { firstName: { _ilike: $firstName } }
                    { lastName: { _ilike: $lastName } }
                ]
                playerCategory: { _ilike: $playerCategory }
            }
        ) {
            ...PlayerQL
        }
        Result43: player(
            where: {
                _or: [
                    { firstName: { _ilike: $firstName } }
                    { lastName: { _ilike: $lastName } }
                ]
            }
        ) {
            ...PlayerQL
        }
    }
    ${PlayerQL}
`;
export const searchPlayerForTournamentQL = gql`
    query searchPlayerQL(
        $fullName: String!
        $handicapLower: numeric!
        $handicapUpper: numeric!
    ) {
        Result: player(
            where: {
                _or: [
                    { fullName: { _ilike: $fullName } }
                    { handicap: { _gte: $handicapLower, _lte: $handicapUpper } }
                ]
            }
        ) {
            id
            fullName
            firstName
            lastName
            handicap
            playerCategory
            membershipNumber
            membership {
                club {
                    id
                    name
                }
            }
        }
    }
    ${PlayerQL}
`;
export const playerUpdatedHandicapReport = gql`
    query playerUpdatedHandicapReport(
        $clubId: String!
        $fromDate: date!
        $toDate: date!
    ) {
        player_handicap(
            where: {
                _and: [
                    { tournament: { clubId: { _eq: $clubId } } }
                    { tournament: { endDate: { _gte: $toDate } } }
                    { tournament: { endDate: { _lte: $fromDate } } }
                ]
            }
            order_by: [{ tournament: { endDate: asc } }]
        ) {
            playerId
            handicap
            oldHandicap
            score
            grossScore
            adjustedScore
            PlayerQL: player {
                fullName
                membershipNumber
            }
            tournament {
                endDate
            }
        }
        player_handicap_whs(
            where: {
                _and: [
                    { tournament: { clubId: { _eq: $clubId } } }
                    { tournament: { endDate: { _gte: $toDate } } }
                    { tournament: { endDate: { _lte: $fromDate } } }
                ]
            }
            order_by: [{ tournament: { endDate: desc } }]
        ) {
            adjustedScore
            handicapDifferential
            handicapIndex
            score
            player {
                fullName
                membershipNumber
            }
            tournament {
                endDate
            }
        }
    }
`;
export const playerUpdatedHandicapReportAdmin = gql`
    query playerUpdatedHandicapReport($fromDate: date!, $toDate: date!) {
        player_handicap(
            where: {
                _and: [
                    { tournament: { endDate: { _gte: $toDate } } }
                    { tournament: { endDate: { _lte: $fromDate } } }
                ]
            }
            order_by: [{ tournament: { endDate: asc } }]
        ) {
            playerId
            handicap
            oldHandicap
            score
            grossScore
            adjustedScore
            PlayerQL: player {
                fullName
                membershipNumber
            }
            tournament {
                endDate
            }
        }
        player_handicap_whs(
            where: {
                _and: [
                    { tournament: { endDate: { _gte: $toDate } } }
                    { tournament: { endDate: { _lte: $fromDate } } }
                ]
            }
            order_by: [{ tournament: { endDate: desc } }]
        ) {
            adjustedScore
            handicapDifferential
            handicapIndex
            score
            player {
                fullName
                membershipNumber
            }
            tournament {
                endDate
            }
        }
    }
`;
export const playerUpdatedHandicapWHSReport = gql`
    query playerUpdatedHandicapReport(
        $clubId: String!
        $fromDate: date!
        $toDate: date!
    ) {
        player_handicap_whs(
            where: {
                _and: [
                    { tournament: { clubId: { _eq: $clubId } } }
                    { updatedAt: { _gte: $toDate } }
                    { updatedAt: { _lte: $fromDate } }
                ]
            }
            order_by: [{ tournament: { endDate: desc } }]
        ) {
            adjustedScore
            handicapDifferential
            handicapIndex
            playedAt
            score
            player {
                firstName
                lastName
                membershipNumber
            }
            tournament {
                endDate
            }
        }
    }
`;
export const playerUpdatedHandicapWHSReportAdmin = gql`
    query playerUpdatedHandicapReport($fromDate: date!, $toDate: date!) {
        player_handicap_whs(
            where: {
                _and: [
                    { tournament: { endDate: { _gte: $toDate } } }
                    { tournament: { endDate: { _lte: $fromDate } } }
                ]
            }
            order_by: [
                { tournament: { endDate: desc } }
                { player: { fullName: asc } }
            ]
        ) {
            adjustedScore
            handicapDifferential
            handicapIndex
            playedAt
            score
            player {
                firstName
                lastName
                membershipNumber
            }
            tournament {
                endDate
            }
        }
    }
    ${PlayerHandicapWhsQL}
`;

export const GetPlayersByTournament = gql`
    query GetPlayersByTournament($where: tournament_member_bool_exp!) {
        tournament_member(where: $where) {
            tournamentId
            playerId
            player {
                id
                firstName
                lastName
                playerCategory
                handicap
                createdAt
                phone
                email
                membershipNumber
                membershipQL: membership {
                    clubId
                    suspended
                    club {
                        id
                        name
                    }
                }
            }
        }
    }
`;


export const GetPlayerActivityByUserId = gql`
    query GetPlayerActivityByUserId($userId: String!) {
        user_activity_log(
            where: { userId: { _eq: $userId } }
            order_by: { dateTime: desc }
        ) {
            id
            activityType
            userId
            name
            email
            dateTime
            description
            ipAddress
        }
    }
`;
