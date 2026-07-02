import gql from 'graphql-tag';
import { FlightManagerQL } from '../fragments/flight.fragment';

export const GetClubs = gql`
    query PostsGetQuery {
        club {
            id
            name
            address
            phone
            email
            logo
            members{
                clubId
                playerId
            }
                courses{
                id
                name
                }
        }
    }
`;

export const GetPGFClubs = gql`
    query GetPGFClub($where: subclub_bool_exp!) {
        subclub(where: $where) {
            club {
                id
                name
                address
                phone
                email
                logo
            }
        }
    }
`;

export const GetClubByID = gql`
    query PostsGetQuery($where: club_bool_exp!) {
        club(where: $where) {
            id
            name
            address
            phone
            email
            logo
        }
    }
`;

export const GetSchedule = gql`
    query getSchedule($where: club_schedule_bool_exp!) {
        club_schedule(where: $where, order_by: { date: desc }) {
            id
            tournamentTitle
            date
            matchFormat
            description
            course {
                name
            }
        }
    }
`;

export const AddMutation = gql`
    mutation insert_club($objects: [club_insert_input!]!) {
        insert_club(objects: $objects) {
            returning {
                id
                name
                address
                email
                phone
            }
        }
    }
`;

export const addFeedback = gql`
    mutation addFeedback($objects: [feedback_insert_input!]!) {
        insert_feedback(objects: $objects) {
            returning {
                id
            }
        }
    }
`;

export const UpdateMutation = gql`
    mutation updateMutation($where: club_bool_exp!, $set: club_set_input!) {
        update_club(where: $where, _set: $set) {
            affected_rows
            returning {
                name
                address
                email
                phone
            }
        }
    }
`;

export const DeleteClub = gql`
    mutation DeleteClub($where: club_bool_exp!) {
        delete_club(where: $where) {
            affected_rows
            returning {
                id
            }
        }
    }
`;

export const getClubMemberAggregateByCategroy = gql`
    query playersByClub($where: club_bool_exp!) {
        club(where: $where) {
            Amateurs: members_aggregate(
                where: { player: { playerCategory: { _eq: "Amateurs" } } }
            ) {
                aggregate {
                    count
                }
            }
            Senior_Amateurs: members_aggregate(
                where: {
                    player: { playerCategory: { _eq: "Senior Amateurs" } }
                }
            ) {
                aggregate {
                    count
                }
            }

            Veterans: members_aggregate(
                where: { player: { playerCategory: { _eq: "Veterans" } } }
            ) {
                aggregate {
                    count
                }
            }
            Junior_Amateurs: members_aggregate(
                where: {
                    player: { playerCategory: { _eq: "Junior Amateurs" } }
                }
            ) {
                aggregate {
                    count
                }
            }
            Professionals: members_aggregate(
                where: { player: { playerCategory: { _eq: "Professionals" } } }
            ) {
                aggregate {
                    count
                }
            }
            Senior_Professionals: members_aggregate(
                where: {
                    player: { playerCategory: { _eq: "Senior Professionals" } }
                }
            ) {
                aggregate {
                    count
                }
            }
            Junior_Professionals: members_aggregate(
                where: {
                    player: { playerCategory: { _eq: "Junior Professionals" } }
                }
            ) {
                aggregate {
                    count
                }
            }
            Ladies: members_aggregate(
                where: { player: { playerCategory: { _eq: "Ladies" } } }
            ) {
                aggregate {
                    count
                }
            }
        }
    }
`;
export const getClubMemberAggregateByCategroyDashBoard = gql`
    query playersByClub($where: club_bool_exp!) {
        club(where: $where) {
            Amateurs: members_aggregate(
                where: { player: { playerCategory: { _eq: "Amateurs" } } }
            ) {
                aggregate {
                    count
                }
            }
            Senior_Amateurs: members_aggregate(
                where: {
                    player: { playerCategory: { _eq: "Senior Amateurs" } }
                }
            ) {
                aggregate {
                    count
                }
            }

            Veterans: members_aggregate(
                where: { player: { playerCategory: { _eq: "Veterans" } } }
            ) {
                aggregate {
                    count
                }
            }
            Ladies: members_aggregate(
                where: { player: { playerCategory: { _eq: "Ladies" } } }
            ) {
                aggregate {
                    count
                }
            }
        }
    }
`;
export const getClubMemberAggregateByCategroyDashBoardAll = gql`
    query playersByClub {
        club {
            Amateurs: members_aggregate(
                where: { player: { playerCategory: { _eq: "Amateurs" } } }
            ) {
                aggregate {
                    count
                }
            }
            Senior_Amateurs: members_aggregate(
                where: {
                    player: { playerCategory: { _eq: "Senior Amateurs" } }
                }
            ) {
                aggregate {
                    count
                }
            }

            Veterans: members_aggregate(
                where: { player: { playerCategory: { _eq: "Veterans" } } }
            ) {
                aggregate {
                    count
                }
            }
            Ladies: members_aggregate(
                where: { player: { playerCategory: { _eq: "Ladies" } } }
            ) {
                aggregate {
                    count
                }
            }
        }
    }
`;

export const AddScheduleMutation = gql`
    mutation insertClubSchedule($objects: [club_schedule_insert_input!]!) {
        insert_club_schedule(objects: $objects) {
            returning {
                id
                clubId
                courseId
                tournamentTitle
                date
                matchFormat
                description
            }
        }
    }
`;

export const GetTeeTimeBookingQL = gql`
    query GetTeeTimeBookingQL($where: tee_time_booking_bool_exp!,$offset: Int
        $limit: Int) {
        tee_time_booking(where: $where, order_by: { bookingDate: desc }, offset: $offset, limit: $limit) {
            id
            bookingDate
            startTime
            endTime
            bookingTime
            interval
            teeDate
            noOfPlayers
            club {
                id
                name
            }
            course {
                id
                name
            }
                slots(order_by: { slotTime: asc }){
                id
                slotTime
                flightId}
        }
    }
`;

export const GetTeeTimeBookingAggregateQL = gql`
    query GetTeeTimeBookingAggregateQL($where: tee_time_booking_bool_exp!) {
        tee_time_booking_aggregate(where: $where) {
            aggregate {
                count
            }
        }
    }
`;
export const GetTeeTimeBookingAggregateSuperAdminQL = gql`
    query GetTeeTimeBookingAggregateSuperAdminQL {
        tee_time_booking_aggregate {
            aggregate {
                count
            }
        }
    }
`;
export const GetTeeTimeBookingSuperAdminQL = gql`
    query GetTeeTimeBookingSuperAdminQL($offset: Int, $limit: Int) {
        tee_time_booking(order_by: { bookingDate: desc }, offset: $offset, limit: $limit) {
            id
            bookingDate
            startTime
            endTime
            interval
            bookingTime
            teeDate
            noOfPlayers
            club {
                id
                name
            }
            course {
                id
                name
            }
            slots(order_by: { slotTime: asc }){
                id
                slotTime
                flightId}
        }
    }
`;

export const DeleteTeeTimeQL = gql`
    mutation DeleteTeeTimeQL($where: tee_time_booking_bool_exp!) {
        delete_tee_time_booking(where: $where) {
            affected_rows
        }
    }
`;

export const AddTeeTimeParentQL = gql`
  mutation AddTeeTimeParentQL($object: tee_time_booking_insert_input!) {
    insert_tee_time_booking_one(object: $object) {
      id
    }
  }
`;

export const AddTeeTimeSlotsQL = gql`
  mutation AddTeeTimeSlotsQL($objects: [tee_time_booking_slot_insert_input!]!) {
    insert_tee_time_booking_slot(objects: $objects) {
      affected_rows
    }
  }
`;
export const GetTeeTimeByIdQL = gql`
    query GetTeeTimeByIdQL($id: String!) {
        tee_time_booking(where: { id: { _eq: $id } }) {
            id
            bookingDate
            bookingTime
            startTime
            endTime
            interval
            teeDate
            noOfPlayers
            allowNineHole
            club { id name }
            course { id name }
            slots(order_by: { slotTime: asc }) {
                id
                slotTime
                flightId
                courseHoleSets
                courseHoleSetsInverted
                startingHole
                noOfHoles
            }
        }
    }
`;

export const UpdateTeeTimeParentQL = gql`
    mutation UpdateTeeTimeParentQL($id: String!, $set: tee_time_booking_set_input!) {
        update_tee_time_booking(where: { id: { _eq: $id } }, _set: $set) {
            affected_rows
        }
    }
`;

export const DeleteEmptyTeeSlotsQL = gql`
    mutation DeleteEmptyTeeSlotsQL($bookingId: String!) {
        delete_tee_time_booking_slot(
            where: { bookingId: { _eq: $bookingId }, flightId: { _is_null: true } }
        ) {
            affected_rows
        }
    }
`;

export const Getfeedbacks = gql`
    query PostsGetQuery {
        feedback(order_by: { dateTime: desc }) {
            id
            type
            name
            contact
            message
            dateTime
            status
            player {
                id
                firstName
                lastName
                email
                phone
                homeClub {
                    id
                    name
                    abbr
                }
            }
        }
    }
`;

export const getAllFeedbackByUserId = gql`
    query getAllFeedbackByUserId($where: feedback_bool_exp!) {
        feedback(where: $where, order_by: { dateTime: desc }) {
            id
            type
            name
            contact
            message
            dateTime
            status
            player {
                id
                firstName
                lastName
                email
                phone
                homeClub {
                    id
                    name
                    abbr
                }
            }
        }
    }
`;

export const UpdateFeedbackStatus = gql`
    mutation UpdateFeedbackStatus($id: String!, $status: String!) {
        update_feedback(where: { id: { _eq: $id } }, _set: { status: $status }) {
            affected_rows
        }
    }
`;

export const UpdateAllFeedbackStatus = gql`
    mutation UpdateAllFeedbackStatus($status: String!) {
        update_feedback(where: {}, _set: { status: $status }) {
            affected_rows
        }
    }
`;


// ── Club Management (admins) ────────────────────────────────────────────────

export const GetClubAdmins = gql`
    query GetClubAdmins($clubId: String!) {
        player(
            where: { adminClubId: { _eq: $clubId } }
            order_by: { firstName: asc }
        ) {
            id
            firstName
            lastName
            fullName
            email
            phone
            adminClubId
            roles {
                userId
                roleId
                role { id name }
            }
        }
    }
`;

export const GetAllRoles = gql`
    query GetAllRoles {
        role(
            where: { name: { _nin: ["SuperAdmin", "User"] } }
            order_by: { name: asc }
        ) {
            id
            name
        }
    }
`;

export const SearchPlayerByEmail = gql`
    query SearchPlayerByEmail($email: String!) {
        player(
            where: { email: { _ilike: $email } }
            limit: 5
        ) {
            id
            firstName
            lastName
            fullName
            email
            phone
            adminClubId
            roles {
                userId
                roleId
                role { id name }
            }
        }
    }
`;

export const SetPlayerAdminClub = gql`
    mutation SetPlayerAdminClub($playerId: String!, $adminClubId: String) {
        update_player(
            where: { id: { _eq: $playerId } }
            _set: { adminClubId: $adminClubId }
        ) {
            affected_rows
        }
    }
`;

export const InsertUserRole = gql`
    mutation InsertUserRole($userId: String!, $roleId: Int!) {
        insert_user_roles(objects: [{ userId: $userId, roleId: $roleId }]) {
            affected_rows
        }
    }
`;

export const RemoveUserRoles = gql`
    mutation RemoveUserRoles($userId: String!) {
        delete_user_roles(where: { userId: { _eq: $userId } }) {
            affected_rows
        }
    }
`;

export const GetClubsPaginated = gql`
    query GetClubsPaginated($limit: Int!, $offset: Int!, $search: String!) {
        club_aggregate(where: {
            _or: [
                { name: { _ilike: $search } }
                { email: { _ilike: $search } }
                { address: { _ilike: $search } }
            ]
        }) {
            aggregate { count }
        }
        club(
            where: {
                _or: [
                    { name: { _ilike: $search } }
                    { email: { _ilike: $search } }
                    { address: { _ilike: $search } }
                ]
            }
            order_by: { name: asc }
            limit: $limit
            offset: $offset
        ) {
            id
            name
            address
            phone
            email
            logo
            members_aggregate { aggregate { count } }
            courses_aggregate { aggregate { count } }
        }
    }
`;

// ── Club Stats & Pagination ─────────────────────────────────────────────────

export const GetClubStatsByClubId = gql`
    query GetClubStatsByClubId($clubId: String!) {
        tournament_aggregate(
            where: { clubId: { _eq: $clubId }, singleRound: { _eq: false } }
        ) {
            aggregate {
                count
                sum {
                    noOfRounds
                }
            }
            nodes {
                activeRound
                noOfRounds
            }
        }
        single_rounds: tournament_aggregate(
            where: { clubId: { _eq: $clubId }, singleRound: { _eq: true } }
        ) {
            aggregate {
                count
            }
        }
    }
`;

export const GetClubTournamentsPaginated = gql`
    query GetClubTournamentsPaginated($clubId: String!, $limit: Int!, $offset: Int!) {
        tournament_aggregate(
            where: { clubId: { _eq: $clubId }, singleRound: { _eq: false } }
        ) {
            aggregate { count }
        }
        tournament(
            where: { clubId: { _eq: $clubId }, singleRound: { _eq: false } }
            order_by: { startDate: desc }
            limit: $limit
            offset: $offset
        ) {
            id
            title
            matchFormat
            noOfRounds
            activeRound
            startDate
            endDate
            started
            course { name }
        }
    }
`;

export const GetClubDailyRoundsPaginated = gql`
    query GetClubDailyRoundsPaginated($clubId: String!, $limit: Int!, $offset: Int!) {
        tournament_aggregate(
            where: { clubId: { _eq: $clubId }, singleRound: { _eq: true } }
        ) {
            aggregate { count }
        }
        tournament(
            where: { clubId: { _eq: $clubId }, singleRound: { _eq: true } }
            order_by: { startDate: desc }
            limit: $limit
            offset: $offset
        ) {
            id
            title
            matchFormat
            startDate
            endDate
            started
            activeRound
            noOfRounds
            course { name }
        }
    }
`;

export const GetClubMembersPaginated = gql`
    query GetClubMembersPaginated(
        $where: player_bool_exp!
        $limit: Int!
        $offset: Int!
    ) {
        player_aggregate(where: $where) {
            aggregate {
                count
            }
        }
        player(where: $where, order_by: { firstName: asc }, limit: $limit, offset: $offset) {
            id
            firstName
            lastName
            playerCategory
            handicap
            handicapWhsIndex
            email
            phone
            membershipNumber
        }
    }
`;

export const getAllCoursesRequest = gql`
    query getAllCoursesRequest {
        course_request(order_by: { createdAt: desc }) {
            id
            country
            state
            city
            name
            createdAt
            admin {
                id
                fullName
                phone
                email
            }
        }
    }
`;

export const SearchClubsByName = gql`
    query SearchClubsByName($name: String!) {
        club(where: { name: { _ilike: $name } }, order_by: { name: asc }, limit: 10) {
            id
            name
        }
    }
`;
