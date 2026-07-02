import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatToolbarModule } from '@angular/material/toolbar';
// import { AmazingTimePickerModule } from 'amazing-time-picker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApolloModule } from 'apollo-angular';
import { LeaguesRoutingModule } from './leagues-routing.module';
import { LeaguesComponent } from './leagues.component';
import { DialogAddLeagueComponent } from '../dialogs/dialog-add-league/dialog-add-league.component';
import { DetailLeagueComponent } from './detail/detail-league.component';
import { LeagueMembersListComponent } from './detail/league-members-list/league-members-list.component';
import { LeagueTournamentsListComponent } from './detail/league-tournaments-list/league-tournaments-list.component';
@NgModule({
    declarations: [
        LeaguesComponent,
        DialogAddLeagueComponent,
        DetailLeagueComponent,
        LeagueMembersListComponent,
        LeagueTournamentsListComponent
    ],
    exports: [
        LeagueMembersListComponent,
        LeagueTournamentsListComponent
    ],
    imports: [
        CommonModule,
        NgApexchartsModule,
        ReactiveFormsModule,
        MatTableModule,
        MatFormFieldModule,
        MatButtonToggleModule,
        MatPaginatorModule,
        MatInputModule,
        LeaguesRoutingModule,
        MatButtonModule,
        MatIconModule,
        MatSortModule,
        MatStepperModule,
        MatMenuModule,
        MatCardModule,
        MatCheckboxModule,
        MatRadioModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatExpansionModule,
        MatTabsModule,
        MatSnackBarModule,
        MatToolbarModule,
        DragDropModule,
        ApolloModule,
        MatDialogModule,
        FormsModule,
        MatAutocompleteModule,
        MatSidenavModule,
        // AmazingTimePickerModule,
    ],
})
export class LeaguesModule {}
