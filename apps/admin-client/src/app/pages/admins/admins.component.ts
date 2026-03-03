import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IAdminUser, PaginatedResponse, defaultAdminModuleAccess } from '@teddy-city-hotels/shared-interfaces';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminSessionService } from '../../core/admin-session.service';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.scss'],
})
export class AdminsComponent implements OnInit {
  admins: IAdminUser[] = [];
  loading = false;
  error = '';
  search = '';
  page = 1;
  pageSize = 10;
  total = 0;
  showCreateModal = false;
  form: FormGroup;

  constructor(
    private adminUsersService: AdminUsersService,
    private session: AdminSessionService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      fullname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
      isSuperAdmin: [false],
      rooms: [true],
      bookings: [true],
      snooker: [true],
      financials: [true],
      revenue: [true],
      kitchen: [true],
      notifications: [true],
      admins: [false],
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get canManageAdmins(): boolean {
    return !!this.session.adminUser?.isSuperAdmin;
  }

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.loading = true;
    this.error = '';

    this.adminUsersService
      .list({
        page: this.page,
        pageSize: this.pageSize,
        search: this.search,
      })
      .subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.admins = response;
            this.total = response.length;
          } else {
            const paged = response as PaginatedResponse<IAdminUser>;
            this.admins = paged.data;
            this.total = paged.total;
            this.page = paged.page;
            this.pageSize = paged.pageSize;
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = error?.error?.message || 'Failed to load admins.';
          this.loading = false;
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadAdmins();
  }

  clearFilters(): void {
    this.search = '';
    this.page = 1;
    this.loadAdmins();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.loadAdmins();
  }

  createAdmin(): void {
    if (this.form.invalid || !this.canManageAdmins) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const adminAccess = {
      ...defaultAdminModuleAccess,
      dashboard: true,
      rooms: !!value['rooms'],
      bookings: !!value['bookings'],
      snooker: !!value['snooker'],
      financials: !!value['financials'],
      revenue: !!value['revenue'],
      kitchen: !!value['kitchen'],
      notifications: !!value['notifications'],
      admins: !!value['admins'],
    };

    this.adminUsersService
      .create({
        fullname: value['fullname'] || '',
        email: value['email'] || '',
        phoneNumber: value['phoneNumber'] || undefined,
        temporaryPassword: value['temporaryPassword'] || '',
        isSuperAdmin: !!value['isSuperAdmin'],
        adminAccess,
      })
      .subscribe({
        next: () => {
          this.showCreateModal = false;
          this.form.reset({
            isSuperAdmin: false,
            rooms: true,
            bookings: true,
            snooker: true,
            financials: true,
            revenue: true,
            kitchen: true,
            notifications: true,
            admins: false,
          });
          this.page = 1;
          this.loadAdmins();
        },
        error: (error) => {
          this.error = error?.error?.message || 'Failed to create admin.';
        },
      });
  }

  toggleActive(admin: IAdminUser): void {
    if (!this.canManageAdmins) return;

    this.adminUsersService.update(admin.id, { active: !admin.active }).subscribe({
      next: () => this.loadAdmins(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to update admin.';
      },
    });
  }

  openCreateModal(): void {
    if (!this.canManageAdmins) return;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }
}
