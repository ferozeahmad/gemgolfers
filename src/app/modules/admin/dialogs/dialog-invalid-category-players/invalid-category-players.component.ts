import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PlayerCategory } from 'app/shared/models/player.model';
import { FacadeService } from 'app/shared/services/facade.service';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-invalid-category-players',
    templateUrl: './invalid-category-players.component.html',
})
export class InvalidCategoryPlayersComponent {

    displayedColumns: string[] = [
        'firstName',
        'lastName',
        'email',
        'playerCategory'
    ];
    dataSource = new MatTableDataSource<any>([]);
    playerCategories: PlayerCategory[] = [];
    constructor(
        private dialogRef: MatDialogRef<InvalidCategoryPlayersComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public facadeService: FacadeService,
        private logger: LogsService,
    ) {

        this.logger.log('Invalid Category Players Dialog Opened', "info", { players: data?.players?.length });
        this.playerCategories = this.facadeService.getPlayerCategories();
        console.log(data);
        this.playerCategories = this.playerCategories.filter(category =>
            data.categories.includes(category.name)
        );

        this.dataSource.data = data.players;
    }

    close() {
        this.logger.log('Admin Click on Close in Invalid Category Players Dialog', "info", { players: this.dataSource?.data?.length });
        this.dialogRef.close(this.dataSource.data);
    }

    onCategoryChange(element: any, event: any) {
        this.logger.log('Admin Changes Player Category in Invalid Category Players Dialog', "info", { playerId: element?.id, category: event?.value });
        console.log("Player:", element);
        console.log("Selected Category:", event.value);

        // Example: update backend or trigger further logic
        element.playerCategory = event.value;

        // If you want to save:
        // this.saveCategory(element);
    }
}
