import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FacadeService } from 'app/shared/services/facade.service';
import { UniqueIdGenerator } from 'app/shared/classes/general';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LogsService } from 'app/shared/services/logs.service';

@Component({
    standalone: false,
    selector: 'app-club-details',
    templateUrl: './club-details.component.html',
})
export class ClubDetailsComponent implements OnInit {

    // ── Club form ─────────────────────────────────────────────────────────────
    clubForm: FormGroup;
    isEditMode: boolean = false;
    isSaving: boolean = false;
    isLoading: boolean = false;
    clubId: string = null;

    // ── Club management (admins) ──────────────────────────────────────────────
    admins: any[] = [];
    adminsLoading: boolean = false;
    availableRoles: any[] = [];

    // Add-admin flow
    showAddAdmin: boolean = false;
    searchControl: UntypedFormControl = new UntypedFormControl('');
    searchResults: any[] = [];
    isSearching: boolean = false;
    selectedPlayer: any = null;
    selectedRoleId: number | null = null;
    isSavingAdmin: boolean = false;

    // Role colour map
    readonly roleColours: Record<string, string> = {
        ClubAdmin:         'bg-blue-100 text-blue-700',
        ClubSecretary:     'bg-purple-100 text-purple-700',
        TournamentManager: 'bg-green-100 text-green-700',
        TourOperator:      'bg-orange-100 text-orange-700',
        LeagueAdmin:       'bg-pink-100 text-pink-700',
        TourLeagueAdmin:   'bg-indigo-100 text-indigo-700',
    };

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private snackBar: MatSnackBar,
        private facadeService: FacadeService,
        private cdr: ChangeDetectorRef,
        private logger: LogsService,
    ) {}

    ngOnInit(): void {
        this.clubForm = this.fb.group({
            name:    ['', [Validators.required, Validators.minLength(2)]],
            email:   ['', [Validators.required, Validators.email]],
            phone:   ['', Validators.required],
            address: ['', Validators.required],
        });

        this.clubId = this.route.snapshot.paramMap.get('id');
        this.logger.log('Admin comes to Club Details Page', "info", this.clubId);
        if (this.clubId) {
            this.isEditMode = true;
            this.loadClub();
            this.loadAdmins();
            this.loadRoles();
        }

        // Live search as user types
        this.searchControl.valueChanges.pipe(
            debounceTime(400),
            distinctUntilChanged(),
        ).subscribe(val => {
            if (val && val.trim().length >= 3) {
                this.doSearch(val.trim());
            } else {
                this.searchResults = [];
            }
        });
    }

    // ── Club form ─────────────────────────────────────────────────────────────

    async loadClub(): Promise<void> {
        this.logger.log('Getting Club Data', "info", this.clubId);
        this.isLoading = true;
        try {
            const result = await this.facadeService.getClubList();
            const clubs: any[] = result?.club || [];
            const club = clubs.find(c => c.id === this.clubId);
            if (club) {
                this.clubForm.patchValue({
                    name:    club.name,
                    email:   club.email,
                    phone:   club.phone,
                    address: club.address,
                });
                this.logger.log('Getting Club Data Successful', "info", this.clubId);
            } else {
                this.logger.log('Club not found in Club Details Page', "warn", this.clubId);
                this.snackBar.open('Club not found.', 'x', { duration: 3000 });
                this.goBack();
            }
        } catch {
            this.logger.log('Getting Club Data Failed', "error", this.clubId);
            this.snackBar.open('Failed to load club details.', 'x', { duration: 3000 });
        } finally {
            this.isLoading = false;
        }
    }

    async save(): Promise<void> {
        this.logger.log('Admin Click on Save in Club Details Page', "info", { id: this.clubId, isEditMode: this.isEditMode });
        if (this.clubForm.invalid) {
            this.logger.log('Club form is invalid, Save not performed', "warn", this.clubId);
            this.clubForm.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        const val = this.clubForm.value;

        try {
            let success: boolean;
            if (this.isEditMode) {
                success = await this.facadeService.updateClub({
                    id:      this.clubId,
                    name:    val.name,
                    email:   val.email,
                    phone:   val.phone,
                    address: val.address,
                });
                if (success) {
                    this.logger.log('Club updated successfully', "info", this.clubId);
                    this.snackBar.open('Club updated successfully.', 'x', { duration: 3000 });
                    this.goBack();
                } else {
                    this.logger.log('Club update Failed', "error", this.clubId);
                    this.snackBar.open('Failed to update club.', 'x', { duration: 3000 });
                }
            } else {
                success = await this.facadeService.AddClub({
                    id:      UniqueIdGenerator.generate(),
                    name:    val.name,
                    email:   val.email,
                    phone:   val.phone,
                    address: val.address,
                });
                if (success) {
                    this.logger.log('Club created successfully', "info", val.name);
                    this.snackBar.open('Club created successfully.', 'x', { duration: 3000 });
                    this.goBack();
                } else {
                    this.logger.log('Club creation Failed', "error", val.name);
                    this.snackBar.open('Failed to create club.', 'x', { duration: 3000 });
                }
            }
        } catch {
            this.logger.log('Saving Club Failed', "error", this.clubId);
            this.snackBar.open('An error occurred. Please try again.', 'x', { duration: 3000 });
        } finally {
            this.isSaving = false;
        }
    }

    // ── Admin management ──────────────────────────────────────────────────────

    async loadAdmins(): Promise<void> {
        this.logger.log('Getting Club Admins Data', "info", this.clubId);
        this.adminsLoading = true;
        try {
            const result = await this.facadeService.getClubAdmins(this.clubId);
            this.admins = (result?.player || []).map((p: any) => ({
                ...p,
                name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || p.fullName || p.email,
                roleList: (p.roles || []).map((r: any) => r.role?.name).filter(Boolean),
            }));
            this.logger.log('Getting Club Admins Data Successful', "info", this.admins.length);
        } catch (err) {
            this.logger.log('Getting Club Admins Data Failed', "error", err);
            console.error(err);
        } finally {
            this.adminsLoading = false;
            this.cdr.detectChanges();
        }
    }

    async loadRoles(): Promise<void> {
        this.logger.log('Getting Roles Data', "info");
        try {
            const result = await this.facadeService.getAllRoles();
            this.availableRoles = result?.role || [];
            this.logger.log('Getting Roles Data Successful', "info", this.availableRoles.length);
        } catch (err) {
            this.logger.log('Getting Roles Data Failed', "error", err);
            console.error(err);
        }
    }

    toggleAddAdmin(): void {
        this.logger.log('Admin Click on Add Admin toggle in Club Details Page', "info", this.clubId);
        this.showAddAdmin = !this.showAddAdmin;
        if (!this.showAddAdmin) {
            this.resetAddAdminForm();
        }
    }

    async doSearch(email: string): Promise<void> {
        this.logger.log('Admin searches Player in Club Details Page', "info", email);
        this.isSearching = true;
        try {
            const result = await this.facadeService.searchPlayerByEmail(email);
            this.searchResults = (result?.player || []).map((p: any) => ({
                ...p,
                name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || p.fullName || p.email,
                roleList: (p.roles || []).map((r: any) => r.role?.name).filter(Boolean),
                isCurrentAdmin: p.adminClubId === this.clubId,
                hasOtherClub: p.adminClubId && p.adminClubId !== this.clubId,
            }));
            this.logger.log('Searching Player Successful', "info", this.searchResults.length);
        } catch {
            this.logger.log('Searching Player Failed', "error", email);
            this.searchResults = [];
        } finally {
            this.isSearching = false;
            this.cdr.detectChanges();
        }
    }

    selectPlayer(player: any): void {
        this.logger.log('Admin selects Player in Club Details Page', "info", player?.id);
        this.selectedPlayer = player;
        this.searchResults = [];
        this.searchControl.setValue(player.email, { emitEvent: false });
        // Pre-select first available role
        if (this.availableRoles.length > 0) {
            this.selectedRoleId = this.availableRoles[0].id;
        }
    }

    async addAdmin(): Promise<void> {
        this.logger.log('Admin Click on Add Admin in Club Details Page', "info", { clubId: this.clubId, playerId: this.selectedPlayer?.id, roleId: this.selectedRoleId });
        if (!this.selectedPlayer || !this.selectedRoleId) {
            this.snackBar.open('Please select a player and a role.', 'x', { duration: 3000 });
            return;
        }

        this.isSavingAdmin = true;
        try {
            // 1. Set adminClubId on the player
            const setClub = await this.facadeService.setPlayerAdminClub(this.selectedPlayer.id, this.clubId);
            if (!setClub) throw new Error('Failed to set adminClubId');

            // 2. Remove any existing roles first, then assign the new one
            await this.facadeService.removeUserRoles(this.selectedPlayer.id);
            const assignRole = await this.facadeService.insertUserRole(this.selectedPlayer.id, this.selectedRoleId);
            if (!assignRole) {
                this.logger.log('Club Admin added but role assignment Failed', "error", this.clubId);
                this.snackBar.open('Admin added but role assignment failed.', 'x', { duration: 4000 });
            } else {
                this.logger.log('Club Admin added successfully', "info", this.clubId);
                this.snackBar.open('Admin added successfully.', 'x', { duration: 3000 });
            }

            this.resetAddAdminForm();
            this.loadAdmins();
        } catch (err) {
            this.logger.log('Adding Club Admin Failed', "error", err);
            console.error(err);
            this.snackBar.open('Failed to add admin. Please try again.', 'x', { duration: 3000 });
        } finally {
            this.isSavingAdmin = false;
            this.cdr.detectChanges();
        }
    }

    async removeAdmin(admin: any): Promise<void> {
        this.logger.log('Admin Click on Remove Admin in Club Details Page', "info", admin?.id);
        if (!confirm(`Remove "${admin.name}" as admin of this club?`)) return;
        this.logger.log('Admin confirmed Remove Admin in Club Details Page', "info", admin.id);

        try {
            await Promise.all([
                this.facadeService.setPlayerAdminClub(admin.id, null),
                this.facadeService.removeUserRoles(admin.id),
            ]);
            this.logger.log('Club Admin removed successfully', "info", admin.id);
            this.snackBar.open('Admin removed successfully.', 'x', { duration: 3000 });
            this.loadAdmins();
        } catch {
            this.logger.log('Removing Club Admin Failed', "error", admin.id);
            this.snackBar.open('Failed to remove admin.', 'x', { duration: 3000 });
        }
    }

    getRoleColour(roleName: string): string {
        return this.roleColours[roleName] || 'bg-gray-100 text-gray-600';
    }

    private resetAddAdminForm(): void {
        this.showAddAdmin = false;
        this.searchControl.setValue('', { emitEvent: false });
        this.searchResults = [];
        this.selectedPlayer = null;
        this.selectedRoleId = null;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    goBack(): void {
        this.logger.log('Navigating back to Clubs Page from Club Details Page', "info");
        this.router.navigate(['/clubs']);
    }

    hasError(field: string, error: string): boolean {
        const ctrl = this.clubForm.get(field);
        return ctrl?.hasError(error) && ctrl?.touched;
    }
}
