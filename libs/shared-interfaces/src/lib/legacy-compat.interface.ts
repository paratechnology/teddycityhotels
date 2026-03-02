export interface IDesignation {
  id: string;
  name: string;
}

export interface IFirm {
  id: string;
  name?: string;
  microsoftIntegration?: {
    configuredBy?: {
      email?: string;
    };
  };
  [key: string]: unknown;
}

export interface IMatter {
  id: string;
  title?: string;
  fileNo?: string;
  assignedUserIds?: string[];
  assignedDepartmentIds?: string[];
  physicalFile?: {
    currentPossessor?: {
      id: string;
    };
    lastMoved?: string;
  };
  [key: string]: unknown;
}

export interface IGeneralFile {
  id: string;
  fileName: string;
  fileCode: string;
  currentPossessor?: {
    id: string;
  };
}

export interface ILibraryBook {
  id: string;
  title: string;
  isbn: string;
  currentPossessor?: {
    id: string;
  };
}

export interface IinventoryItem {
  id: string;
  type: string;
  name?: string;
  code?: string;
  link?: string;
  lastMoved?: string;
}

export interface IAttendanceUserPunch {
  time: string;
  type: 'in' | 'out' | 'IN' | 'OUT';
}

export interface IAttendanceUserRecord {
  userId?: string;
  fullname?: string;
  picture?: string | null;
  status?: 'IN' | 'OUT' | 'in' | 'out';
  firstIn?: string;
  lastOut?: string;
  punches: IAttendanceUserPunch[];
  [key: string]: unknown;
}

export interface IAttendanceRecord {
  id?: string;
  date?: string;
  users: Record<string, IAttendanceUserRecord>;
}

export interface MatterFilters {
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ISubscriptionPlan {
  id: string;
  name: string;
  price?: number;
  durationInMonths?: number;
  description?: string;
  features?: string[];
}
