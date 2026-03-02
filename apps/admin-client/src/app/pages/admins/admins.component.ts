import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IAdminUser, defaultAdminModuleAccess } from '@teddy-city-hotels/shared-interfaces';
import { AdminUsersService } from '../../services/admin-users.service';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.scss'],
})
export class AdminsComponent implements OnInit {
  admins: IAdminUser[] = [];
  loading = false;
  error = '';
  form: FormGroup;

  constructor(private adminUsersService: AdminUsersService, private fb: FormBuilder) {
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
      notifications: [true],
      admins: [false],
    });
  }

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.loading = true;
    this.error = '';
    this.adminUsersService.list().subscribe({
      next: (admins) => {
        this.admins = admins;
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load admins.';
        this.loading = false;
      },
    });
  }

  createAdmin(): void {
    if (this.form.invalid) {
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
          this.form.reset({
            isSuperAdmin: false,
            rooms: true,
            bookings: true,
            snooker: true,
            financials: true,
            notifications: true,
            admins: false,
          });
          this.loadAdmins();
        },
        error: (error) => {
          this.error = error?.error?.message || 'Failed to create admin.';
        },
      });
  }

  toggleActive(admin: IAdminUser): void {
    this.adminUsersService.update(admin.id, { active: !admin.active }).subscribe({
      next: () => this.loadAdmins(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to update admin.';
      },
    });
  }
}
