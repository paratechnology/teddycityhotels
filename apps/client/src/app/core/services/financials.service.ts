import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
    baseURL,
    CreateOperationalExpenseDto,
    IInvoice,
    CreatePaymentDto,
    CreateInvoiceDto,
    IUnbilledItem,
    IMatterExpense,
    CreateMatterExpenseDto,
    CreateTrustDepositDto,
    ITrustAccountSummary,
    ITrustTransaction,
    IDashboardStats,
    IPayslip,
    IOperationalExpense,
    PaginatedResponse,
    UpdateOperationalExpenseStatusDto, 
    IFinancialsDashboardStats, 
    IProfessionalFeeAgreement, CreateProfessionalFeeAgreementDto,
    IFinancialActivity,
    IPayrollDraft
} from '@teddy-city-hotels/shared-interfaces';
import { Observable, tap, catchError } from 'rxjs';

interface FinancialsState {
    operationalExpenses: IOperationalExpense[];     // Firm-wide expenses (Admin view)
    myOperationalExpenses: IOperationalExpense[];   // Personal expenses (User view)
    invoices: IInvoice[];
    trustAccountSummaries: ITrustAccountSummary[];
    matterInvoices: IInvoice[];
    matterExpenses: IMatterExpense[];
    professionalFeeAgreement: IProfessionalFeeAgreement | null;
    selectedInvoice: IInvoice | null;
    selectedTrustLedger: ITrustTransaction[];
    dashboardStats: IFinancialsDashboardStats | null;
    financialActivities: IFinancialActivity[];
    myPayslips: IPayslip[];
    totalInvoices: number;
    
    // Status flags
    status: 'loading' | 'success' | 'error'; // Firm expenses status
    myOperationalExpensesStatus: 'loading' | 'success' | 'error'; // Personal expenses status
    invoicesStatus: 'loading' | 'success' | 'error';
    matterInvoicesStatus: 'loading' | 'success' | 'error';
    matterLegalFeesStatus: 'loading' | 'success' | 'error';
    matterExpensesStatus: 'loading' | 'success' | 'error';
    professionalFeeAgreementStatus: 'loading' | 'success' | 'error';
    selectedInvoiceStatus: 'loading' | 'success' | 'error';
    trustStatus: 'loading' | 'success' | 'error';
    selectedTrustLedgerStatus: 'loading' | 'success' | 'error';
    dashboardStatus: 'loading' | 'success' | 'error';
    activitiesStatus: 'loading' | 'success' | 'error';
    myPayslipsStatus: 'loading' | 'success' | 'error';
}

@Injectable({
    providedIn: 'root'
})
export class FinancialsService {
    private http = inject(HttpClient);
    private financialsUrl = `${baseURL}financials`;

    #state = signal<FinancialsState>({
        operationalExpenses: [],
        myOperationalExpenses: [],
        invoices: [],
        trustAccountSummaries: [],
        matterInvoices: [],
        matterExpenses: [],
        professionalFeeAgreement: null,
        selectedInvoice: null,
        selectedTrustLedger: [],
        dashboardStats: null,
        financialActivities: [],
        myPayslips: [],
        totalInvoices: 0,
        
        status: 'loading',
        myOperationalExpensesStatus: 'loading',
        invoicesStatus: 'loading',
        matterInvoicesStatus: 'loading',
        matterLegalFeesStatus: 'loading',
        matterExpensesStatus: 'loading',
        professionalFeeAgreementStatus: 'loading',
        selectedInvoiceStatus: 'loading',
        trustStatus: 'loading',
        selectedTrustLedgerStatus: 'loading',
        dashboardStatus: 'loading',
        activitiesStatus: 'loading',
        myPayslipsStatus: 'loading',
    });

    // --- Selectors ---

    // Firm Expenses
    public operationalExpenses = computed(() => this.#state().operationalExpenses);
    public status = computed(() => this.#state().status);

    // Personal Expenses
    public myOperationalExpenses = computed(() => this.#state().myOperationalExpenses);
    public myOperationalExpensesStatus = computed(() => this.#state().myOperationalExpensesStatus);

    public invoices = computed(() => this.#state().invoices);
    public totalInvoices = computed(() => this.#state().totalInvoices);
    public invoicesStatus = computed(() => this.#state().invoicesStatus);

    public matterInvoices = computed(() => this.#state().matterInvoices);
    public matterInvoicesStatus = computed(() => this.#state().matterInvoicesStatus);

    public matterLegalFeesStatus = computed(() => this.#state().matterLegalFeesStatus);

    public matterExpenses = computed(() => this.#state().matterExpenses);
    public matterExpensesStatus = computed(() => this.#state().matterExpensesStatus);

    public professionalFeeAgreement = computed(() => this.#state().professionalFeeAgreement);
    public professionalFeeAgreementStatus = computed(() => this.#state().professionalFeeAgreementStatus);

    public selectedInvoice = computed(() => this.#state().selectedInvoice);
    public selectedInvoiceStatus = computed(() => this.#state().selectedInvoiceStatus);

    public trustAccountSummaries = computed(() => this.#state().trustAccountSummaries);
    public trustStatus = computed(() => this.#state().trustStatus);

    public selectedTrustLedger = computed(() => this.#state().selectedTrustLedger);
    public selectedTrustLedgerStatus = computed(() => this.#state().selectedTrustLedgerStatus);

    public dashboardStats = computed(() => this.#state().dashboardStats);
    public dashboardStatus = computed(() => this.#state().dashboardStatus);

    public financialActivities = computed(() => this.#state().financialActivities);
    public activitiesStatus = computed(() => this.#state().activitiesStatus);

    public myPayslips = computed(() => this.#state().myPayslips);
    public myPayslipsStatus = computed(() => this.#state().myPayslipsStatus);


    // --- Operational Expenses (Firm & Personal) ---

    /**
     * Load ALL firm expenses (For Admins/Financials Page)
     */
    loadOperationalExpenses(): Observable<IOperationalExpense[]> {
        this.#state.update(s => ({ ...s, status: 'loading' }));
        // Explicitly request firm scope
        const params = new HttpParams().set('scope', 'firm');

        return this.http.get<IOperationalExpense[]>(`${this.financialsUrl}/expenses`, { params }).pipe(
            tap({
                next: (expenses) => this.#state.update(s => ({
                    ...s,
                    operationalExpenses: expenses,
                    status: 'success'
                })),
                error: () => this.#state.update(s => ({ ...s, status: 'error' }))
            })
        );
    }

    /**
     * Load ONLY my personal expenses (For User Profile/My Page)
     */
    loadMyOperationalExpenses(): Observable<IOperationalExpense[]> {
        this.#state.update(s => ({ ...s, myOperationalExpensesStatus: 'loading' }));
        // Explicitly request personal scope
        const params = new HttpParams().set('scope', 'personal');

        return this.http.get<IOperationalExpense[]>(`${this.financialsUrl}/expenses`, { params }).pipe(
            tap({
                next: (expenses) => this.#state.update(s => ({
                    ...s,
                    myOperationalExpenses: expenses,
                    myOperationalExpensesStatus: 'success'
                })),
                error: () => this.#state.update(s => ({ ...s, myOperationalExpensesStatus: 'error' }))
            })
        );
    }

    /**
     * Create a new expense request.
     * Updates the 'myOperationalExpenses' list because the user just made a personal request.
     */
    createOperationalExpense(dto: CreateOperationalExpenseDto): Observable<IOperationalExpense> {
        return this.http.post<IOperationalExpense>(`${this.financialsUrl}/expenses`, dto).pipe(
            tap(newExpense => {
                this.#state.update(s => ({ 
                    ...s, 
                    myOperationalExpenses: [newExpense, ...s.myOperationalExpenses] 
                }));
            })
        );
    }

    /**
     * Approve or Reject an expense.
     * Updates the 'operationalExpenses' list because this is an Admin action on the Firm list.
     */
    updateExpenseStatus(expenseId: string, dto: UpdateOperationalExpenseStatusDto): Observable<IOperationalExpense> {
        return this.http.patch<IOperationalExpense>(`${this.financialsUrl}/expenses/${expenseId}/status`, dto).pipe(
            tap(updatedExpense => {
                this.#state.update(s => ({
                    ...s,
                    operationalExpenses: s.operationalExpenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp)
                }));
            })
        );
    }


    // --- Invoices ---

    loadInvoices(filters: { page: number, pageSize: number, status?: string }): Observable<PaginatedResponse<IInvoice>> {
        this.#state.update(s => ({ ...s, invoicesStatus: 'loading' }));
        let params = new HttpParams()
            .set('page', filters.page.toString())
            .set('pageSize', filters.pageSize.toString());
        if (filters.status) {
            params = params.set('status', filters.status);
        }

        return this.http.get<PaginatedResponse<IInvoice>>(`${this.financialsUrl}/invoices`, { params }).pipe(
            tap(response => {
                this.#state.update(s => ({
                    ...s,
                    invoices: filters.page === 1 ? response.data : [...s.invoices, ...response.data],
                    totalInvoices: response.total,
                    invoicesStatus: 'success'
                }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, invoicesStatus: 'error' }));
                throw err;
            })
        );
    }

    getInvoiceById(matterId: string, invoiceId: string): Observable<IInvoice> {
        this.#state.update(s => ({ ...s, selectedInvoiceStatus: 'loading' }));
        return this.http.get<IInvoice>(`${this.financialsUrl}/invoices/${matterId}/${invoiceId}`).pipe(
            tap(invoice => {
                this.#state.update(s => ({
                    ...s,
                    selectedInvoice: invoice,
                    selectedInvoiceStatus: 'success'
                }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, selectedInvoiceStatus: 'error' }));
                throw err;
            })
        );
    }

    createInvoice(dto: CreateInvoiceDto): Observable<IInvoice> {
        return this.http.post<IInvoice>(`${this.financialsUrl}/invoices`, dto).pipe(
            tap(newInvoice => {
                this.#state.update(s => ({
                    ...s,
                    invoices: [newInvoice, ...s.invoices]
                }));
            })
        );
    }

    updateInvoice(matterId: string, invoiceId: string, dto: CreateInvoiceDto): Observable<IInvoice> {
        return this.http.patch<IInvoice>(`${this.financialsUrl}/invoices/${matterId}/${invoiceId}`, dto).pipe(
            tap(updatedInvoice => {
                this.#state.update(s => ({
                    ...s,
                    selectedInvoice: updatedInvoice,
                    invoices: s.invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv)
                }));
            })
        );
    }

    sendInvoice(matterId: string, invoiceId: string): Observable<IInvoice> {
        return this.http.post<IInvoice>(`${this.financialsUrl}/invoices/${matterId}/${invoiceId}/send`, {}).pipe(
            tap(updatedInvoice => {
                this.#state.update(s => ({ ...s, selectedInvoice: updatedInvoice }));
                this.#state.update(s => ({ ...s, invoices: s.invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv) }));
            })
        );
    }

    emailInvoice(matterId: string, invoiceId: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.financialsUrl}/invoices/${matterId}/${invoiceId}/email`, {});
    }

    getUnbilledItemsForMatter(matterId: string): Observable<IUnbilledItem[]> {
        return this.http.get<IUnbilledItem[]>(`${this.financialsUrl}/invoices/unbilled-items/${matterId}`);
    }


    // --- Matter-Specific Financials ---

    loadInvoicesForMatter(matterId: string): Observable<IInvoice[]> {
        this.#state.update(s => ({ ...s, matterInvoicesStatus: 'loading' }));
        return this.http.get<IInvoice[]>(`${this.financialsUrl}/matter/${matterId}/invoices`).pipe(
            tap(invoices => {
                this.#state.update(s => ({ ...s, matterInvoices: invoices, matterInvoicesStatus: 'success' }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, matterInvoicesStatus: 'error' }));
                throw err;
            })
        );
    }

    loadMatterExpenses(matterId: string): Observable<IMatterExpense[]> {
        this.#state.update(s => ({ ...s, matterExpensesStatus: 'loading' }));
        return this.http.get<IMatterExpense[]>(`${this.financialsUrl}/matter/${matterId}/expenses`).pipe(
            tap(expenses => {
                this.#state.update(s => ({ ...s, matterExpenses: expenses, matterExpensesStatus: 'success' }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, matterExpensesStatus: 'error' }));
                throw err;
            })
        );
    }

    // --- Professional Fee Agreement ---

    getProfessionalFeeAgreement(matterId: string): Observable<IProfessionalFeeAgreement | null> {
        this.#state.update(s => ({ ...s, professionalFeeAgreementStatus: 'loading' }));
        return this.http.get<IProfessionalFeeAgreement | null>(`${this.financialsUrl}/matter/${matterId}/professional-agreement`).pipe(
            tap(agreement => {
                this.#state.update(s => ({
                    ...s,
                    professionalFeeAgreement: agreement,
                    professionalFeeAgreementStatus: 'success'
                }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, professionalFeeAgreementStatus: 'error' }));
                throw err;
            })
        );
    }

    saveProfessionalFeeAgreement(matterId: string, dto: CreateProfessionalFeeAgreementDto): Observable<IProfessionalFeeAgreement> {
        return this.http.post<IProfessionalFeeAgreement>(`${this.financialsUrl}/matter/${matterId}/professional-agreement`, dto).pipe(
            tap(newAgreement => {
                this.#state.update(s => ({
                    ...s,
                    professionalFeeAgreement: newAgreement,
                    professionalFeeAgreementStatus: 'success'
                }));
            })
        );
    }

    createMatterExpense(matterId: string, dto: CreateMatterExpenseDto): Observable<IMatterExpense> {
        return this.http.post<IMatterExpense>(`${this.financialsUrl}/matter/${matterId}/expenses`, dto).pipe(
            tap(newExpense => {
                this.#state.update(s => ({
                    ...s,
                    matterExpenses: [newExpense, ...s.matterExpenses]
                }));
            })
        );
    }

    updateMatterExpense(matterId: string, expenseId: string, dto: Partial<IMatterExpense>): Observable<IMatterExpense> {
        return this.http.patch<IMatterExpense>(`${this.financialsUrl}/matter/${matterId}/expenses/${expenseId}`, dto).pipe(
            tap(updatedExpense => {
                this.#state.update(s => ({
                    ...s,
                    matterExpenses: s.matterExpenses.map(e => e.id === updatedExpense.id ? updatedExpense : e)
                }));
            })
        );
    }

    deleteMatterExpense(matterId: string, expenseId: string): Observable<void> {
        return this.http.delete<void>(`${this.financialsUrl}/matter/${matterId}/expenses/${expenseId}`).pipe(
            tap(() => {
                this.#state.update(s => ({
                    ...s,
                    matterExpenses: s.matterExpenses.filter(e => e.id !== expenseId)
                }));
            })
        );
    }


    // --- Payments ---

    recordPayment(dto: Partial<CreatePaymentDto>): Observable<IInvoice> {
        return this.http.post<IInvoice>(`${this.financialsUrl}/payments`, dto).pipe(
            tap(updatedInvoice => {
                this.#state.update(s => ({ ...s, selectedInvoice: updatedInvoice }));
                this.#state.update(s => ({ ...s, invoices: s.invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv) }));
            })
        );
    }

    emailPaymentReceipt(invoiceId: string, paymentId: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.financialsUrl}/payments/${invoiceId}/${paymentId}/email`, {});
    }

    payInvoiceFromTrust(matterId: string, invoiceId: string): Observable<IInvoice> {
        return this.http.post<IInvoice>(`${this.financialsUrl}/trust-accounts/pay-invoice/${matterId}/${invoiceId}`, {}).pipe(
            tap(updatedInvoice => {
                this.#state.update(s => ({ ...s, selectedInvoice: updatedInvoice }));
                this.#state.update(s => ({ ...s, invoices: s.invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv) }));
                this.loadTrustAccountSummaries().subscribe();
            })
        );
    }


    // --- Payroll & Payslips ---

    loadMyPayslips(): Observable<IPayslip[]> {
        this.#state.update(s => ({ ...s, myPayslipsStatus: 'loading' }));
        return this.http.get<IPayslip[]>(`${this.financialsUrl}/my-payslips`).pipe(
            tap(payslips => {
                this.#state.update(s => ({
                    ...s,
                    myPayslips: payslips,
                    myPayslipsStatus: 'success'
                }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, myPayslipsStatus: 'error' }));
                throw err;
            })
        );
    }
    
    getPayslipById(payslipId: string): Observable<IPayslip> {
        return this.http.get<IPayslip>(`${this.financialsUrl}/my-payslips/${payslipId}`);
    }

    emailMyPayslip(payslipId: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.financialsUrl}/my-payslips/${payslipId}/send`, {});
    }

    createPayrollDraft(payPeriod: string): Observable<IPayrollDraft> {
        return this.http.post<IPayrollDraft>(`${this.financialsUrl}/payroll/draft`, { payPeriod });
    }

    getPayrollDraft(draftId: string): Observable<IPayrollDraft> {
        return this.http.get<IPayrollDraft>(`${this.financialsUrl}/payroll/draft/${draftId}`);
    }

    getPayrollHistory(): Observable<{ payPeriod: string, status: 'draft' | 'finalized' }[]> {
        return this.http.get<{ payPeriod: string, status: 'draft' | 'finalized' }[]>(`${this.financialsUrl}/payroll/history`);
    }

    getPayrollDraftByPeriod(payPeriod: string): Observable<IPayrollDraft> {
        return this.http.get<IPayrollDraft>(`${this.financialsUrl}/payroll/draft/by-period/${payPeriod}`);
    }

    updatePayrollDraft(draftId: string, updates: Partial<IPayrollDraft>): Observable<void> {
        return this.http.put<void>(`${this.financialsUrl}/payroll/draft/${draftId}`, updates);
    }

    finalizePayroll(draftId: string): Observable<{ success: boolean, message: string }> {
        return this.http.post<{ success: boolean, message: string }>(`${this.financialsUrl}/payroll/draft/${draftId}/finalize`, {});
    }


    // --- Dashboard & Activities ---

    loadDashboardStats(): Observable<IFinancialsDashboardStats> {
        this.#state.update(s => ({ ...s, dashboardStatus: 'loading' }));
        return this.http.get<IFinancialsDashboardStats>(`${this.financialsUrl}/dashboard-stats`).pipe(
            tap(stats => {
                this.#state.update(s => ({
                    ...s,
                    dashboardStats: stats,
                    dashboardStatus: 'success'
                }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, dashboardStatus: 'error' }));
                throw err;
            })
        );
    }

    loadFinancialActivities(): Observable<IFinancialActivity[]> {
        this.#state.update(s => ({ ...s, activitiesStatus: 'loading' }));
        return this.http.get<IFinancialActivity[]>(`${this.financialsUrl}/activity-feed`).pipe(
            tap(activities => {
                this.#state.update(s => ({
                    ...s,
                    financialActivities: activities,
                    activitiesStatus: 'success'
                }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, activitiesStatus: 'error' }));
                throw err;
            })
        );
    }


    // --- Trust Accounts ---

    loadTrustAccountSummaries(): Observable<ITrustAccountSummary[]> {
        this.#state.update(s => ({ ...s, trustStatus: 'loading' }));
        return this.http.get<ITrustAccountSummary[]>(`${this.financialsUrl}/trust-accounts`).pipe(
            tap(summaries => {
                this.#state.update(s => ({
                    ...s,
                    trustAccountSummaries: summaries,
                    trustStatus: 'success'
                }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, trustStatus: 'error' }));
                throw err;
            })
        );
    }

    getTrustLedgerForMatter(matterId: string): Observable<ITrustTransaction[]> {
        this.#state.update(s => ({ ...s, selectedTrustLedgerStatus: 'loading' }));
        return this.http.get<ITrustTransaction[]>(`${this.financialsUrl}/trust-accounts/${matterId}`).pipe(
            tap(ledger => {
                this.#state.update(s => ({
                    ...s,
                    selectedTrustLedger: ledger,
                    selectedTrustLedgerStatus: 'success'
                }));
            }),
            catchError(err => {
                this.#state.update(s => ({ ...s, selectedTrustLedgerStatus: 'error' }));
                throw err;
            })
        );
    }

    makeTrustDeposit(dto: CreateTrustDepositDto): Observable<ITrustTransaction> {
        return this.http.post<ITrustTransaction>(`${this.financialsUrl}/trust-accounts/deposit`, dto).pipe(
            tap(() => {
                this.loadTrustAccountSummaries().subscribe();
            })
        );
    }
}