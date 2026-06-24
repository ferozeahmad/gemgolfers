import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';
import { EmptyLayoutComponent } from './layout/layouts/empty/empty.component';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    // Redirect empty path to '/example'
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    // Redirect signed in user to the '/example'
    //
    // After the user signs in, the sign in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboard' },
    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'confirmation-required',
                loadChildren: () =>
                    import(
                        'app/modules/auth/confirmation-required/confirmation-required.module'
                    ).then((m) => m.AuthConfirmationRequiredModule),
            },
            {
                path: 'forgot-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/forgot-password/forgot-password.module'
                    ).then((m) => m.AuthForgotPasswordModule),
            },
            {
                path: 'reset-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/reset-password/reset-password.module'
                    ).then((m) => m.AuthResetPasswordModule),
            },
            {
                path: 'sign-in',
                loadChildren: () =>
                    import('app/modules/auth/sign-in/sign-in.module').then(
                        (m) => m.AuthSignInModule
                    ),
            },
            {
                path: 'sign-up',
                loadChildren: () =>
                    import('app/modules/auth/sign-up/sign-up.module').then(
                        (m) => m.AuthSignUpModule
                    ),
            },
            {
                path: 'courses',
                loadChildren: () =>
                    import('app/modules/admin/course copy/course.module').then(
                        (m) => m.CourseModule
                    ),
            },
        ],
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'sign-out',
                loadChildren: () =>
                    import('app/modules/auth/sign-out/sign-out.module').then(
                        (m) => m.AuthSignOutModule
                    ),
            },
            {
                path: 'unlock-session',
                loadChildren: () =>
                    import(
                        'app/modules/auth/unlock-session/unlock-session.module'
                    ).then((m) => m.AuthUnlockSessionModule),
            },
        ],
    },
    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'home', loadChildren: () => import('app/modules/landing/home/home.module').then(m => m.LandingHomeModule) },
            { path: 'leaderboard', loadChildren: () => import('app/modules/admin/mainleaderboard/mainleaderboard.module').then((m) => m.MainLeaderboardModule) },
            {
                path: 'leagueTable',
                loadChildren: () =>
                    import(
                        'app/modules/admin/leagueLeaderBoard/league-leaderboard.module'
                    ).then((m) => m.LeagueLeaderboardModule)
            }, {
                path: 'signUpForm',
                loadChildren: () =>
                    import(
                        'app/modules/admin/tournaments/Sign-Up-Form/sign-up-form/sign-up-form.module'
                    ).then((m) => m.SignUpFormModule)
            },
            {
                path: 'addmycourse',
                loadChildren: () =>
                    import(
                        'app/modules/auth/sign-in-course/sign-in.module'
                    ).then((m) => m.AuthSignInCourseModule)
            }
        ]
    },
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
        },
        children: [
            {
                path: 'dashboard',
                loadChildren: () =>
                    import(
                        'app/modules/admin/dashboards/project/project.module'
                    ).then((m) => m.ProjectModule),
            },
            {
                path: 'players',
                loadChildren: () =>
                    import('app/modules/admin/players/players.module').then(
                        (m) => m.PlayersModule
                    ),
            },
            {
                path: 'dailyRounds',
                loadChildren: () =>
                    import(
                        'app/modules/admin/daily-rounds/daily-rounds.module'
                    ).then((m) => m.DailyRoundsModule),
            },
            {
                path: 'handicaps/CONGU',
                loadChildren: () =>
                    import(
                        'app/modules/admin/handicap-CONGU/handicap.module'
                    ).then((m) => m.HandicapModule),
            },
            {
                path: 'handicaps/WHS',
                loadChildren: () =>
                    import(
                        'app/modules/admin/handicap-WHS/handicap.module'
                    ).then((m) => m.HandicapModule),
            },
            {
                path: 'reports/dailyround',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/daily-rounds-stats/daily-rounds-stats.module'
                    ).then((m) => m.DailyRoundsStatsModule),
            },
            {
                path: 'profile', loadChildren: () => import('app/modules/admin/profile/profile.module').then(m => m.ProfileModule),
            },
            {
                path: 'reports/dailycard',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/daily-starter-report/daily-starter-report.module'
                    ).then((m) => m.DailyStarterReportModule),
            },
            {
                path: 'reports/handicap',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/updated-handicap-report/updated-handicap-report.module'
                    ).then((m) => m.UpdatedHandicapReportModule),
            },
            {
                path: 'reports/signUpPlayers',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/signUpReport/signUp-report.module'
                    ).then((m) => m.SignUpReportModule),
            },
            {
                path: 'reports/UserActivity',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/userActivityReport/userActivityReport.module'
                    ).then((m) => m.UserActivityModule),
            },
            {
                path: 'reports/players',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/golf-report/golf-report.module'
                    ).then((m) => m.GolfReportModule),
            },
            {
                path: 'reports/club',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/club-report/club-report/club-report.module'
                    ).then((m) => m.ClubReportModule),
            },
            {
                path: 'feedback',
                loadChildren: () =>
                    import('app/modules/admin/feedback/feedback.module').then(
                        (m) => m.FeedbackModule
                    ),
            },
            {
                path: 'coursesRequest',
                loadChildren: () =>
                    import('app/modules/admin/coursesRequest/coursesRequest.module').then(
                        (m) => m.CoursesRequestModule
                    ),
            },
            {
                path: 'banner',
                loadChildren: () =>
                    import('app/modules/admin/news/news.module').then(
                        (m) => m.NewsModule
                    ),
            },
            {
                path: 'teetimes',
                loadChildren: () =>
                    import('app/modules/admin/tee-times/tee-times.module').then(
                        (m) => m.TeeTimesModule
                    ),
            },
            {
                path: 'tournaments',
                loadChildren: () =>
                    import(
                        'app/modules/admin/tournaments/tournaments.module'
                    ).then((m) => m.TournamentsModule),
            },
            {
                path: 'leagues',
                loadChildren: () =>
                    import('app/modules/admin/leagues/leagues.module').then(
                        (m) => m.LeaguesModule
                    ),
            },
            // {
            //     path: 'tournaments/schedule',
            //     loadChildren: () =>
            //         import(
            //             'app/modules/admin/tournaments/schedule/schedule.module'
            //         ).then((m) => m.ScheduleModule), 
            // },
            {
                path: 'courses1',
                loadChildren: () =>
                    import('app/modules/admin/course/course.module').then(
                        (m) => m.CourseModule
                    ),
            },
            {
                path: 'courses2',
                loadChildren: () =>
                    import('app/modules/admin/course copy/course.module').then(
                        (m) => m.CourseModule
                    ),
            },
            {
                path: 'mergeProfile',
                loadChildren: () =>
                    import(
                        'app/modules/admin/mergeProfile/merge-profiles/merge-profiles.module'
                    ).then((m) => m.MergeProfilesModule),
            },
            {
                path: 'handicapCalculation',
                loadChildren: () =>
                    import(
                        'app/modules/admin/handicap-calculation/handicap-calculation.module'
                    ).then((m) => m.HandicapCalculationModule),
            },
            {
                path: 'clubs',
                loadChildren: () =>
                    import('app/modules/admin/clubs/clubs.module').then(
                        (m) => m.ClubsModule
                    ),
            },
            {
                path: 'tours',
                loadChildren: () =>
                    import(
                        'app/modules/admin/tour/tour.module'
                    ).then((m) => m.TourModule),
            },
            {
                path: 'reports/dailyPlayer',
                data: {
                    expectedRole: 8,
                },
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/daily-players-report/daily-player-report.module'
                    ).then((m) => m.DailyPlayerReportModule),
            },
            {
                path: 'reports/teeTime',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/daily-teeTime-report/daily-starter-report.module'
                    ).then((m) => m.DailyTeeTimeReportModule),
            },
            {
                path: 'reports/tournament',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/tournaments/tournament-report.module'
                    ).then((m) => m.TournamentReportModule),
            },
            {
                path: 'reports/tournaments',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/tournamentsAnalytics/tournaments.module'
                    ).then((m) => m.TournamentsAnalyticsModule),
            },
            {
                path: 'reports/league',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/leagues/league-report.module'
                    ).then((m) => m.LeagueReportModule),
            },
            {
                path: 'reports/tour',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/tours/tour-report.module'
                    ).then((m) => m.TourReportModule),
            },
            {
                path: 'reports/playerRegistration',
                loadChildren: () =>
                    import(
                        'app/modules/admin/reports/player-registration/player-registration.module'
                    ).then((m) => m.PlayerRegistrationModule),
            },
            //{path: 'matchplay', loadChildren: () => import('app/modules/admin/matchplay/matchplay.module').then(m => m.MatchplayModule)},
        ],
    },
];
