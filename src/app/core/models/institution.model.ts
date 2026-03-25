export interface InstitutionItem {
  id?: number;
  sNo?: number;
  name: string;
  code: string;
  students: number;
  status: 'Active' | 'Inactive';
  course: string;
}

export interface InstitutionStats {
  totalInstitutions: number;
  activeInstitutions: number;
  totalCourses: number;
  totalStudents: number;
}

export interface InstitutionPageData {
  stats: InstitutionStats;
  institutions: InstitutionItem[];
  totalCount: number;
}
