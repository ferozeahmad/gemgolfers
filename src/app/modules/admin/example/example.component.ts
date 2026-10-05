import { Component, ViewEncapsulation } from '@angular/core';
import { Apollo, gql } from 'apollo-angular'
import { FacadeService } from "../../../shared/services/facade.service";
import { Constants, General } from "../../../shared/classes/general";
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector     : 'example',
    templateUrl  : './example.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ExampleComponent
{
    /**
     * Constructor
     */
    constructor(private apollo: Apollo, private facadeService: FacadeService, private logger: LogsService)
    {
        // this.apollo
        // .watchQuery({
        //   query: gql`
        //     {
        //         player {
        //             id
        //             firstName
        //             lastName
        //         }
        //     }
        //   `
        // })
        // .valueChanges.subscribe((result: any) => {
        //     //console.log(result);
        // })
        this.getTournaments();
    }

    async getTournaments() {
        this.logger.log('Getting Tournaments Data', "info");
        let today: Date = new Date();
        var dd = String(today.getDate()).padStart(2, "0");
        var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
        var yyyy = today.getFullYear();

        let todayDate: Date = General.parseToDate(mm + "/" + dd + "/" + yyyy);
        
        let dataTournamentsForCompleted = await this.facadeService.getTournamentsListForCompleted(todayDate);
        let RecentTournaments = dataTournamentsForCompleted.CompletedRecently;
        this.logger.log('Getting Tournaments Data Successful', "info", RecentTournaments?.length);
        //console.log(RecentTournaments);
    }
}
