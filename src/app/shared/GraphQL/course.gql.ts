import gql from 'graphql-tag';
import { HoleQL } from '../fragments/score.fragment';
import { CourseQL, CourseHoleSetsQL } from '../fragments/course.fragment';

export const GetCourses = gql`
    query PostsGetQuery {
        course(order_by: { createdAt: desc }) {
            id
            clubId
            name
            noOfHoles
            par
            courseRating
            slopeRating
            teeDistanceUnit
            mapSupported
            country
            countryGeonameId
            city
            cityGeonameId
            nameForHoles1to9
            nameForHoles10to18
            nameForHoles19to27
            nameForHoles28to36
            createdAt
            status
        }
    }
`;

export const getApprovedCoursesList = gql`
    query getApprovedCoursesList {
        course(where: { status: { _eq: "Active" } }, order_by: { name: asc }) {
            id
            clubId
            name
            noOfHoles
            par
            courseRating
            slopeRating
            teeDistanceUnit
            mapSupported
            country
            countryGeonameId
            city
            cityGeonameId
            nameForHoles1to9
            nameForHoles10to18
            nameForHoles19to27
            nameForHoles28to36
            createdAt
            status
        }
    }
`;
export const getCoursesListbyID = gql`
    query PostsGetQuery($where: course_bool_exp!) {
        course(where: $where, order_by: { createdAt: desc }) {
            id
            clubId
            name
            noOfHoles
            par
            courseRating
            slopeRating
            teeDistanceUnit
            mapSupported
            country
            countryGeonameId
            city
            cityGeonameId
            status
            nameForHoles1to9
            nameForHoles10to18
            nameForHoles19to27
            nameForHoles28to36
            holes {
                id
                teeDistances
                par
                index
                courseId
                holeNo
            }
        }
    }
`;

export const GetCourseByID = gql`
    query PostsGetQuery($where: course_bool_exp!) {
        course(where: $where) {
            id
            clubId
            name
            noOfHoles
            par
            courseRating
            slopeRating
            teeDistanceUnit
            mapSupported
            country
            countryGeonameId
            city
            cityGeonameId
            nameForHoles1to9
            nameForHoles10to18
            nameForHoles19to27
            nameForHoles28to36
            holes {
                id
                teeDistances
                par
                index
                courseId
                holeNo
            }
        }
    }
`;
export const getCourseByIDForForm = gql`
    query PostsGetQuery($where: course_bool_exp!) {
        course(where: $where) {
            name
            noOfHoles

            country

            city
        }
    }
`;

export const AddMutation = gql`
    mutation insert_course($objects: [course_insert_input!]!) {
        insert_course(objects: $objects) {
            returning {
                id
            }
        }
    }
`;

export const UpdateMutation = gql`
    mutation updateMutation(
        $course: [course_insert_input!]!
        $holesToSave: [hole_insert_input!]!
    ) {
        courseUpdateQli: insert_course(
            objects: $course
            on_conflict: {
                constraint: course_pkey
                update_columns: [
                    name
                    noOfHoles
                    par
                    courseRating
                    slopeRating
                    country
                    city
                    createdBy
                ]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
        CourseHolesToUpdateQLi: insert_hole(
            objects: $holesToSave
            on_conflict: {
                constraint: hole_pkey
                update_columns: [holeNo, par, index, teeDistances]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
    }
`;
export const UpdateCourseStatus = gql`
    mutation UpdateCourseStatus($id: String!) {
        update_course(where: { id: { _eq: $id } }, _set: { status: "Active" }) {
            affected_rows
        }
    }
`;

export const GetCourseInformation = gql`
    query GetCourseInformation($where: course_bool_exp!) {
        course(where: $where) {
            ...CourseQL

            HolesQL: holes {
                ...HoleQL
                HoleMetaQL: meta {
                    hole_id
                    tee_distance
                    tee_id
                }
            }
            TeesQL: tees {
                name_by_club
                tee_id
            }
        }
    }
    ${CourseQL}
    ${HoleQL}
`;
export const getCourseInformationForForm = gql`
    query GetCourseInformation($where: course_bool_exp!) {
        course(where: $where) {
            HolesQL: holes {
                holeNo
                id
            }
            TeesQL: tees {
                name_by_club
                tee_id
            }
        }
    }
`;
export const getCourseTeeMeta = gql`
    query GetCourseInformation($where: hole_tee_meta_bool_exp!) {
        hole_tee_meta(where: $where) {
            course_id
            hole_id
            created_at
            tee_distance
            tee_long
            tee_lat
            tee_id
        }
    }
`;
export const getCourseRating = gql`
    query GetCourseInformation($where: course_rating_bool_exp!) {
        course_rating(where: $where) {
            courseRating
            slopeRating
            coursePar
            courseHoleSets
            tee_id
            tee
            gender_id
        }
    }
`;

export const getCourseHoleSets = gql`
    query getCourseHoleSets($where: course_hole_sets_bool_exp!) {
        course_hole_sets(where: $where, order_by: { noOfHoles: asc }) {
            ...CourseHoleSetsQL
        }
    }
    ${CourseHoleSetsQL}
`;

export const getCourseHoleSetsForCourseForm = gql`
    query getCourseHoleSets($where: course_hole_sets_bool_exp!) {
        course_hole_sets(where: $where, order_by: { noOfHoles: asc }) {
            ...CourseHoleSetsQL
        }
    }
    ${CourseHoleSetsQL}
`;
export const getTeesOfCourse = gql`
    query getTeesOfCourse($where: course_tees_bool_exp!) {
        course_tees(where: $where) {
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
export const getCourseHole = gql`
    query getTeesOfCourse($where: course_hole_sets_bool_exp!) {
        HolesQL: course_hole_sets(where: $where) {
            holeSets
            displayName
            noOfHoles
            id
            holes(order_by: { holeNo: asc }) {
                id
                holeNo
                par
                indexWomen
                index
                holeSetId
                greenStartLat
                greenStartLong
                greenCenterLat
                greenCenterLong
                greenEndLat
                greenEndLong
                meta {
                    hole_id
                    tee_distance
                    tee_id
                    tee_lat
                    tee_long
                    tee_name {
                        name
                    }
                }
                hazards {
                    holeId
                    hazardId
                    lat
                    lng
                    hazardNo
                }
            }
        }
    }
`;
export const saveColor = gql`
    mutation addCourseTeeColor($tee: [course_tees_insert_input!]!) {
        CourseHolesToUpdateQLi: insert_course_tees(
            objects: $tee
            on_conflict: {
                constraint: course_tees_pkey
                update_columns: [
                    course_id
                    color
                    tee_id
                    created_at
                    name_by_club
                    tee_order
                ]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
    }
`;

export const deletecolor = gql`
    mutation DeleteTee($deleteTeeExpression: course_tees_bool_exp!) {
        CourseDeleteQL: delete_course_tees(where: $deleteTeeExpression) {
            AffectedRowsQL: affected_rows
        }
    }
`;
export const saveHolesANDholeSets = gql`
    mutation addCourseHoles(
        $holes: [hole_insert_input!]!
        $holeSets: [course_hole_sets_insert_input!]!
        $holesYardages: [hole_tee_meta_insert_input!]!
        $holeHazardsToSave: [hole_hazards_insert_input!]!
    ) {
        CourseHolesToUpdateQLi: insert_hole(
            objects: $holes
            on_conflict: {
                constraint: hole_pkey
                update_columns: [
                    holeNo
                    par
                    index
                    teeDistances
                    indexWomen
                    holeSetId
                    greenStartLat
                    greenStartLong
                    greenCenterLat
                    greenCenterLong
                    greenEndLat
                    greenEndLong
                ]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
        CourseHolesSetToUpdateQLi: insert_course_hole_sets(
            objects: $holeSets
            on_conflict: {
                constraint: course_hole_sets_pkey
                update_columns: [holeSets, noOfHoles, displayName, id]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
        CourseYadageToUpdateQLi: insert_hole_tee_meta(
            objects: $holesYardages
            on_conflict: {
                constraint: hole_tee_meta_pkey
                update_columns: [
                    tee_distance
                    tee_id
                    hole_id
                    tee_lat
                    tee_long
                ]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
        HoleHazardsToUpdateQLi: insert_hole_hazards(
            objects: $holeHazardsToSave
            on_conflict: {
                constraint: hole_hazards_pkey
                update_columns: [lat, lng, hazardNo]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
    }
`;
export const saveholeSets = gql`
    mutation addCourseHoles($holeSets: [course_hole_sets_insert_input!]!) {
        CourseHolesSetToUpdateQLi: insert_course_hole_sets(
            objects: $holeSets
            on_conflict: {
                constraint: course_hole_sets_pkey
                update_columns: [
                    holeSets
                    noOfHoles
                    displayName
                    frontId
                    backId
                ]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
    }
`;
export const saveCourseMetaSet = gql`
    mutation addCourseHoles($holeSets: [hole_tee_meta_insert_input!]!) {
        CourseHolesSetToUpdateQLi: insert_hole_tee_meta(
            objects: $holeSets
            on_conflict: {
                constraint: hole_tee_meta_pkey
                update_columns: [created_at, tee_distance, tee_lat, tee_long]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
    }
`;
export const saveCourseRating = gql`
    mutation addCourseRating($holeSets: [course_rating_insert_input!]!) {
        CourseHolesSetToUpdateQLi: insert_course_rating(
            objects: $holeSets
            on_conflict: {
                constraint: course_rating_pkey
                update_columns: [
                    courseHoleSets
                    courseRating
                    slopeRating
                    coursePar
                    tee_id
                    gender_id
                    tee
                ]
            }
        ) {
            AffectedRowsQLi: affected_rows
        }
    }
`;
