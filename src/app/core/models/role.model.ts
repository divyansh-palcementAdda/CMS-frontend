export interface RoleDTO {
  id: number;
  name: string;
  userCount: number;
}

export interface RoleItem {
  id: number;
  sNo: number;
  name: string;
  description: string;
  users: number;
  status: 'Active' | 'Inactive';
}

export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  totalUsers: number;
}

export interface RolePageData {
  stats: RoleStats;
  roles: RoleItem[];
  totalCount: number;
}
