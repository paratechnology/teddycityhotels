import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IFinancialExpense, IFinancialOverview, IPayrollEntry } from '@teddy-city-hotels/shared-interfaces';
import { FinancialsService } from '../../services/financials.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './financials.component.html',
  styleUrls: ['./financials.component.scss'],
})
export class FinancialsComponent implements OnInit {
  overview: IFinancialOverview | null = null;
  loading = false;
  error = '';
  activeTab: 'overview' | 'expenses' | 'payroll' = 'overview';
  showExpenseModal = false;
  showPayrollModal = false;
  expenseForm: FormGroup;
  payrollForm: FormGroup;

  constructor(private financialsService: FinancialsService, private fb: FormBuilder) {
    this.expenseForm = this.fb.group({
      category: ['utilities', Validators.required],
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      incurredOn: [new Date().toISOString().slice(0, 10), Validators.required],
    });

    this.payrollForm = this.fb.group({
      staffName: ['', Validators.required],
      role: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      month: [new Date().toISOString().slice(0, 7), Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading = true;
    this.financialsService.getOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load financials.';
        this.loading = false;
      },
    });
  }

  addExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const value = this.expenseForm.getRawValue();
    const payload: Omit<IFinancialExpense, 'id' | 'createdAt'> = {
      category: value['category'],
      description: value['description'],
      amount: Number(value['amount']),
      incurredOn: value['incurredOn'],
    };

    this.financialsService.addExpense(payload).subscribe({
      next: () => {
        this.showExpenseModal = false;
        this.expenseForm.reset({
          category: 'utilities',
          amount: 0,
          description: '',
          incurredOn: new Date().toISOString().slice(0, 10),
        });
        this.loadOverview();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to save expense.';
      },
    });
  }

  addPayroll(): void {
    if (this.payrollForm.invalid) {
      this.payrollForm.markAllAsTouched();
      return;
    }

    const value = this.payrollForm.getRawValue();
    const payload: Omit<IPayrollEntry, 'id' | 'createdAt' | 'status'> = {
      staffName: value['staffName'],
      role: value['role'],
      amount: Number(value['amount']),
      month: value['month'],
    };

    this.financialsService.addPayroll(payload).subscribe({
      next: () => {
        this.showPayrollModal = false;
        this.payrollForm.reset({
          staffName: '',
          role: '',
          amount: 0,
          month: new Date().toISOString().slice(0, 7),
        });
        this.loadOverview();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to save payroll.';
      },
    });
  }

  markPayrollPaid(payrollId: string): void {
    this.financialsService.markPayrollPaid(payrollId).subscribe({
      next: () => this.loadOverview(),
      error: (error) => {
        this.error = error?.error?.message || 'Failed to update payroll.';
      },
    });
  }

  exportMonth(): void {
    const month = new Date().toISOString().slice(0, 7);
    this.financialsService.getMonthlyExport(month).subscribe({
      next: (csv) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `financial-report-${month}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  openExpenseModal(): void {
    this.showExpenseModal = true;
  }

  closeExpenseModal(): void {
    this.showExpenseModal = false;
  }

  openPayrollModal(): void {
    this.showPayrollModal = true;
  }

  closePayrollModal(): void {
    this.showPayrollModal = false;
  }
}
