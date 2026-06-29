import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_FORMATS, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatLuxonDateModule } from '@angular/material-luxon-adapter';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { CommonModule, DatePipe } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PlayersComponent } from './players.component';
import { playerRoutes } from './players.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { PlayerSubscriptionHistoryDialogComponent } from './player-subscription-history-dialog/player-subscription-history-dialog.component';
import { ImportResultsDialogComponent } from './import-results-dialog/import-results-dialog.component';
import { PlayerResolver } from './players.resolver';

@NgModule({
    declarations: [
        PlayersComponent,
        PlayerSubscriptionHistoryDialogComponent,
        ImportResultsDialogComponent,
    ],
    imports: [
        RouterModule.forChild(playerRoutes),
        MatButtonModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatDividerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTabsModule,
        MatLuxonDateModule,
        MatAutocompleteModule,
        MatSortModule,
        MatSnackBarModule,
        MatMenuModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        FormsModule,
        ReactiveFormsModule,
        MatRadioModule,
        MatRippleModule,
        MatSelectModule,
        NgApexchartsModule,
        MatSidenavModule,
        MatTableModule,
        MatTooltipModule,
        FuseFindByKeyPipeModule,
        MatPaginatorModule,
        CommonModule,
    ],
    providers: [
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'D',
                },
                display: {
                    dateInput: 'DDD',
                    monthYearLabel: 'LLL yyyy',
                    dateA11yLabel: 'DD',
                    monthYearA11yLabel: 'LLLL yyyy',
                },
            },
        },
        DatePipe,PlayerResolver
    ],
})
export class PlayersSubscriptionModule {}
