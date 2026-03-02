import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IFinancialExpense,
  IFinancialOverview,
  IPayrollEntry,
  baseURL,
} from '@teddy-city-hotels/shared-interfaces';

@Injectable({ providedIn: 'root' })
export class FinancialsService {
  private financialUrl = `${baseURL}financials`;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<IFinancialOverview> {
    return this.http.get<IFinancialOverview>(`${this.financialUrl}/overview`);
  }

  getExpenses(): Observable<IFinancialExpense[]> {
    return this.http.get<IFinancialExpense[]>(`${this.financialUrl}/expenses`);
  }

  addExpense(expense: Omit<IFinancialExpense, 'id' | 'createdAt'>): Observable<IFinancialExpense> {
    return this.http.post<IFinancialExpense>(`${this.financialUrl}/expenses`, expense);
  }

  getPayroll(): Observable<IPayrollEntry[]> {
    return this.http.get<IPayrollEntry[]>(`${this.financialUrl}/payroll`);
  }

  addPayroll(entry: Omit<IPayrollEntry, 'id' | 'createdAt' | 'status'>): Observable<IPayrollEntry> {
    return this.http.post<IPayrollEntry>(`${this.financialUrl}/payroll`, entry);
  }

  markPayrollPaid(payrollId: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.financialUrl}/payroll/${payrollId}/pay`, {});
  }

  getMonthlyExport(month: string): Observable<string> {
    return this.http.get(`${this.financialUrl}/exports/monthly?month=${month}`, {
      responseType: 'text',
    });
  }
}
