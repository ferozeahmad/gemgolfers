import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoModule } from '@ngneat/transloco';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'app/shared/shared.module';
import { ProjectComponent } from 'app/modules/admin/dashboards/project/project.component';
import { projectRoutes } from 'app/modules/admin/dashboards/project/project.routing';
import { CommonModule, DatePipe, NgTemplateOutlet } from '@angular/common';
import { ProjectResolver } from './project.resolvers';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DialogAddTourMainComponent } from '../../dialogs/dialog-add-tour-main/dialog-add-tour-main.component';
import { TourDashboardComponent } from '../tour-dashboard/tour-dashboard.component';
import { MatCardActions, MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
    declarations: [ProjectComponent, DialogAddTourMainComponent, TourDashboardComponent],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule.forChild(projectRoutes),
        MatButtonModule,
        MatButtonToggleModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,NgTemplateOutlet,
        MatProgressBarModule,
        MatRippleModule,
        MatSidenavModule,
        MatSortModule,
        MatTableModule,
        MatTabsModule,
        MatNativeDateModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,MatCardModule,
        NgApexchartsModule,
        TranslocoModule,MatDialogModule,
        MatSnackBarModule,
        SharedModule,
        FormsModule,
    ],
    providers: [ProjectResolver, DatePipe],
})
export class ProjectModule {}
