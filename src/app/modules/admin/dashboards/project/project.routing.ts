import { inject } from '@angular/core';
import { CanMatchFn, Route } from '@angular/router';
import { ProjectComponent } from 'app/modules/admin/dashboards/project/project.component';
import { ProjectResolver } from 'app/modules/admin/dashboards/project/project.resolvers';
import { LocalStorageService } from 'app/shared/services/localStorage';
import { TourDashboardComponent } from '../tour-dashboard/tour-dashboard.component';

/**
 * Matches for users that only manage tours (Tour Operator). It mirrors the role priority of the
 * ProjectResolver: admins/secretaries/front desk keep their own dashboards, and users that also
 * manage leagues keep the combined tours + leagues dashboard.
 */
const tourOperatorGuard: CanMatchFn = () => {
    const user = inject(LocalStorageService);
    return (
        user.isTourAdmin() &&
        !user.isLeagueAdmin() &&
        !user.isSuperAdmin() &&
        !user.isClubAdmin() &&
        !user.isClubSecretary() &&
        !user.isFrontDesk()
    );
};

export const projectRoutes: Route[] = [
    {
        path: '',
        canMatch: [tourOperatorGuard],
        component: TourDashboardComponent,
        data: { animation: 'projectPage' },
    },
    {
        path     : '',
        component: ProjectComponent,
        data: { animation: 'projectPage' },
        resolve  : {
            data: ProjectResolver
        }
    }
];
