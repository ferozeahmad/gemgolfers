import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { FacadeService } from 'app/shared/services/facade.service';
import { LogsService } from 'app/shared/services/logs.service';
import { getInitials } from '../../tour/tour-utils';

type SearchState = 'idle' | 'searching' | 'found' | 'notFound' | 'error';

export interface AddTourMemberDialogData {
    tourId: string;
    /** Ids of the players that already belong to the tour (to prevent duplicates). */
    existingPlayerIds: string[];
}

export interface AddTourMemberDialogResult {
    added: boolean;
    players: any[];
}

/**
 * Adds an already registered player to a tour by email address - the same
 * "find the player, then add them" flow that is used when adding players to a tournament.
 */
@Component({
    standalone: false,
    selector: 'app-dialog-add-tour-member',
    templateUrl: './dialog-add-tour-member.component.html',
})
export class DialogAddTourMemberComponent implements OnInit, OnDestroy {
    emailControl = new FormControl('', [Validators.required, Validators.email]);

    state: SearchState = 'idle';
    results: any[] = [];
    selected: any = null;
    searchedEmail = '';
    isSaving = false;
    saveError = '';

    private existingIds: Set<string>;
    private _unsubscribeAll = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: AddTourMemberDialogData,
        public dialogRef: MatDialogRef<DialogAddTourMemberComponent, AddTourMemberDialogResult>,
        private facadeService: FacadeService,
        private logger: LogsService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.logger.log('Add Tour Member Dialog Opened', 'info', { tourId: this.data?.tourId });
        this.existingIds = new Set(this.data?.existingPlayerIds ?? []);
        // Editing the email invalidates the previous search result.
        this.emailControl.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
            if (this.state !== 'idle') {
                this.state = 'idle';
                this.results = [];
                this.selected = null;
                this.saveError = '';
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    isAlreadyMember(player: any): boolean {
        return !!player && this.existingIds.has(player.id);
    }

    displayName(player: any): string {
        return (
            `${player?.firstName ?? ''} ${player?.lastName ?? ''}`.trim() ||
            player?.fullName ||
            player?.email ||
            ''
        );
    }

    initials(player: any): string {
        return getInitials(this.displayName(player));
    }

    get canAdd(): boolean {
        return this.state === 'found' && !!this.selected && !this.isAlreadyMember(this.selected) && !this.isSaving;
    }

    async search(): Promise<void> {
        const email = (this.emailControl.value || '').trim();
        if (this.emailControl.invalid || !email) {
            this.emailControl.markAsTouched();
            return;
        }
        this.logger.log('Admin Search Player by Email in Add Tour Member Dialog', 'info', email);
        this.state = 'searching';
        this.results = [];
        this.selected = null;
        this.saveError = '';
        this.searchedEmail = email;
        try {
            const players = await this.facadeService.findPlayersByEmail(email);
            // The query is a case-insensitive "equals" - keep exact matches only.
            this.results = (players || []).filter(
                (p) => (p.email || '').trim().toLowerCase() === email.toLowerCase()
            );
            if (this.results.length) {
                this.state = 'found';
                // Pre-select the match when there is only one (or the first that can still be added).
                this.selected = this.results.find((p) => !this.isAlreadyMember(p)) ?? this.results[0];
            } else {
                this.state = 'notFound';
            }
            this.logger.log('Search Player by Email in Add Tour Member Dialog Successful', 'info', { found: this.results.length });
        } catch (error) {
            this.state = 'error';
            this.logger.log('Search Player by Email in Add Tour Member Dialog Failed', 'error', error?.toString());
        } finally {
            this.cdr.markForCheck();
        }
    }

    select(player: any): void {
        this.selected = player;
        this.saveError = '';
    }

    async add(): Promise<void> {
        if (!this.canAdd) {
            return;
        }
        this.isSaving = true;
        this.saveError = '';
        const player = this.selected;
        this.logger.log('Admin Click on Add to Tour in Add Tour Member Dialog', 'info', { tourId: this.data.tourId, playerId: player.id });
        const success = await this.facadeService.addTourMembers(this.data.tourId, [player.id]);
        this.isSaving = false;
        if (success) {
            this.logger.log('Tour Member Added Successfully', 'info', { tourId: this.data.tourId, playerId: player.id });
            this.dialogRef.close({ added: true, players: [player] });
        } else {
            this.logger.log('Adding Tour Member Failed', 'error', { tourId: this.data.tourId, playerId: player.id });
            this.saveError = 'We could not add this player to the tour. They may already be a member - please try again.';
            this.cdr.markForCheck();
        }
    }

    close(): void {
        this.logger.log('Admin Click on Cancel in Add Tour Member Dialog', 'info');
        this.dialogRef.close({ added: false, players: [] });
    }
}
