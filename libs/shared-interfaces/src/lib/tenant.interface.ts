export interface ITenant {
  id: string;
  firmId: string;
  fullname: string;
  email: string;
  phone: string;
  
  // Fields that ONLY belong to a tenant
  currentAddress?: string; // Where they lived before moving in
  employerName?: string;
  jobTitle?: string;
  
  // Critical for Rentals, useless for Law
  nextOfKin?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  guarantor?: {
    name: string;
    phone: string;
    email?: string;
  };

  status: 'Active' | 'Past' | 'Prospective';
  createdAt: string;
}