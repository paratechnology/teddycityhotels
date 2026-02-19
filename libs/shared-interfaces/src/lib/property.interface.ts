
// 1. TENANT (Distinct from Client)
export interface ITenant {
    id: string;
    fullname: string;
    email: string;
    phone: string;
    status: 'Active' | 'Past' | 'Evicted';
    guarantor?: {
        name: string;
        phone: string;
        email?: string;
    };
    // Links to identification docs in your file system
    identificationDocIds?: string[];
}

// 2. THE ASSET (Property)
export interface IProperty {
    id: string;
    firmId: string;
    ownerId: string;
    description: string;
    title: string; // e.g., "Sunrise Apartments" or "12 Baker St"
    address: string;
    type: 'Single Unit' | 'Multi-Unit' | 'Land' | 'Commercial';
    status: 'Fully Occupied' | 'Partially Occupied' | 'Vacant' | 'Maintenance';

    // Aggregate Stats (Computed by Backend)
    stats?: {
        totalUnits: number;
        occupiedUnits: number;
        vacantUnits: number;
        totalArrears: number; // Linked to Financials
    };

    imageUrl?: string;
    createdAt: string;
}

// 3. THE UNIT (For Multi-Unit Properties)
export interface IUnit {
    id: string;
    propertyId: string;
    name: string; // "Flat 4B" or "Shop 12"
    type: 'Residential' | 'Commercial' | 'Retail';
    targetRent: number;
    status: 'Occupied' | 'Vacant' | 'Maintenance';
    currentLeaseId?: string | null;
    currentTenantName?: string;
    
}

// 4. THE LEASE (The "Matter" equivalent for Financials)
export interface ILease {
    id: string;
    propertyId: string;
    propertyName: string;
    unitId?: string;
    unitName?: string; // "Flat 4B"

    tenant: ITenant; // Embedded tenant details

    // Terms
    startDate: string;
    endDate: string;
    rentAmount: number;
    frequency: 'Monthly' | 'Quarterly' | 'Annually';
    securityDeposit: number;

    // Status
    status: 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated';
    nextRentDueDate: string;

    // Financial Link
    balance: number; // Positive = Credit (Prepaid), Negative = Arrears
}


export interface IMaintenanceRequest {
    id: string;
    propertyId: string;
    unitId?: string;
    unitIdentifier?: string;
    dateRequested: string; // ISO String
    reportedBy: { id: string, fullname: string };
    description: string;
    category: 'Plumbing' | 'Electrical' | 'Appliance' | 'General' | 'HVAC' | 'Structural';
    status: 'Open' | 'In Progress' | 'Completed';
    assignedTo?: { id: string, fullname: string };
    cost?: number;
}




export type CreatePropertyDto = Pick<IProperty, 'ownerId' | 'title' | 'address' | 'type'>;
export type CreateUnitDto = Pick<IUnit, 'name' | 'type' | 'targetRent'>;