export interface UserItem {
  id?: number;
  sNo?: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
}

export interface UserPageData {
  stats: UserStats;
  users: UserItem[];
  totalCount: number;
}
