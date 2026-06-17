import gql from 'graphql-tag';
import {
    TournamentQL,
    TournamentRoleManagerQL,
} from '../fragments/tournament.fragment';
import { FlightsQL, FlightManagerTeamQL } from '../fragments/flight.fragment';
import { ScoreQL, ScoreDetailQL, HoleQL } from '../fragments/score.fragment';
import { PlayerQL } from '../fragments/player.fragment';
import { CourseQL } from '../fragments/course.fragment';

export const MatchPlayDataQuery = gql`
    query MatchPlayDataQuery($playerId: String!, $flightId: String!) {
        PlayerQL: player_by_pk(id: $playerId) {
            firstName
            lastName
        }
        TournamentQL: tournament_by_pk(id: $flightId) {
            id
            courseId
            noOfRounds
            activeRound
            clubId
            title
            matchFormat
            pointsFormats
            SubTournamentsQL: sub_tournaments {
                SubTournamentQL: sub_tournament {
                    SubTournamentFlightsQL: flights {
                        id
                        flightRound
                        SubTournamentMembersQL: members {
                            playerId
                        }
                    }
                }
            }
            FlightsQL: flights(
                order_by: [{ flightRound: asc }, { flightNo: asc }]
            ) {
                ...FlightQL
                MembersQL: members {
                    PlayerQL: player {
                        firstName
                        lastName
                        fullName
                        playerCategory
                        membershipNumber
                        handicap
                        id
                    }
                    ScoresQL: scores(order_by: { hole: { holeNo: asc } }) {
                        grossScore
                        netScore
                        holeId
                    }
                }
            }

            pairs {
                id
                tournamentId
                flightId
                pairName
                member1Id
                member2Id
                player1 {
                    id
                    firstName
                    lastName
                }
                player2 {
                    id
                    firstName
                    lastName
                }
            }
            CourseQL: course {
                ...CourseQL
                HolesQL: holes {
                    ...HoleQL
                    HoleMetaQL: meta {
                        hole_id
                        tee_distance
                        tee_id
                    }
                }
            }
            CoursesQL: tournament_round_courses {
                tournamentId
                round
                courseId
                course {
                    ...CourseQL
                    HolesQL: holes {
                        ...HoleQL
                        HoleMetaQL: meta {
                            hole_id
                            tee_distance
                            tee_id
                        }
                    }
                }
            }
            club {
                id
                name
            }

            teams {
                id
                adminId
                tournamentId
                name
                color
                teamMembers {
                    teamId
                    playerId
                    player {
                        id
                        firstName
                        lastName
                        handicap
                        playerCategory
                        membershipNumber
                    }
                }
            }
        }
    }
    ${PlayerQL}
    ${TournamentQL}
    ${FlightsQL}
    ${ScoreQL}
    ${ScoreDetailQL}
    ${CourseQL}
    ${HoleQL}
    ${TournamentRoleManagerQL}
`;
export const MatchPlayDataQueryShort = gql`
    query MatchPlayDataQueryShort($flightId: String!) {
        TournamentQL: tournament_by_pk(id: $flightId) {
            id
            courseId
            noOfRounds
            activeRound
            clubId
            title
            matchFormat
            pointsFormats
            FlightsQL: flights(
                order_by: [{ flightRound: asc }, { flightNo: asc }]
            ) {
                ...FlightQL
                MembersQL: members {
                    PlayerQL: player {
                        firstName
                        lastName
                        fullName
                        playerCategory
                        membershipNumber
                        handicap
                        id
                    }
                    ScoresQL: scores(order_by: { hole: { holeNo: asc } }) {
                        grossScore
                        netScore
                        holeId
                    }
                }
            }
        }
    }
    ${FlightsQL}
    ${CourseQL}
    ${HoleQL}
`;

export const AddMutation = gql`
    mutation SaveScoresMutation($scores: [score_insert_input!]!) {
        ScoreEntryQL: insert_score(
            objects: $scores
            on_conflict: {
                constraint: score_pkey
                update_columns: [
                    playerHandicap
                    grossScore
                    updatedAt
                    updaterId
                    updaterName
                    detailId
                ]
            }
        ) {
            AffectedRowsQL: affected_rows
        }
    }
`;

export const PlayerTournamentScoreQL = gql`
    query LeaderboardSimpleSubscription(
        $tournamentId: String!
        $playerId: String!
    ) {
        TournamentQL: tournament_by_pk(id: $tournamentId) {
            id
            FlightsQL: flights(
                where: { members: { playerId: { _eq: $playerId } } }
                order_by: [{ flightRound: asc }, { flightNo: asc }]
            ) {
                ...FlightQL
                MemberHandicapsQL: member_handicaps {
                    playerId
                    handicap
                }
                MembersQL: members(
                    where: { playerId: { _eq: $playerId } }
                    order_by: [{ playerId: asc }]
                ) {
                    playerId
                    PlayerQL: player {
                        id
                        firstName
                        lastName
                    }
                    ScoresQL: scores(
                        where: {
                            grossScore: { _gt: 0 }
                            playerId: { _eq: $playerId }
                        }
                        order_by: [{ hole: { holeNo: asc } }]
                    ) {
                        ...ScoreQL
                    }
                }
            }
        }
    }
    ${ScoreQL}
    ${FlightsQL}
`;
