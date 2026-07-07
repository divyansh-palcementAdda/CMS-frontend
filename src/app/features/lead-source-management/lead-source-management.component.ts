import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { LeadSourceService } from '../../core/services/lead-source.service';
import { LeadSourceDTO } from '../../core/models/lead-source.model';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AddLeadSourceModalComponent } from './components/add-lead-source-modal/add-lead-source-modal.component';

@Component({
  selector: 'app-lead-source-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent, AddLeadSourceModalComponent],
  templateUrl: './lead-source-management.component.html',
  styleUrls: ['./lead-source-management.component.scss']
})
export class LeadSourceManagementComponent implements OnInit {
  
  loading = true;
  leadSources: LeadSourceDTO[] = [];
  filteredLeadSources: LeadSourceDTO[] = [];
  searchTerm = '';
  
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  paginatedLeadSources: LeadSourceDTO[] = [];

  showAddModal = false;
  showDeleteModal = false;
  selectedLeadSource: LeadSourceDTO | null = null;
  editingId: string | null = null;

  constructor(private leadSourceService: LeadSourceService, private location: Location) { }

  ngOnInit() {
    this.fetchData();
  }

  goBack(): void {
    this.location.back();
  }

  fetchData() {
    this.loading = true;
    this.leadSourceService.getAll().subscribe({
      next: (res) => {
        this.leadSources = res.data;
        this.updatePaginatedLeadSources();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching lead sources', err);
        this.loading = false;
      }
    });
  }

  updatePaginatedLeadSources() {
    // Filter
    if (!this.searchTerm.trim()) {
      this.filteredLeadSources = [...this.leadSources];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredLeadSources = this.leadSources.filter(ls =>
        ls.name.toLowerCase().includes(term)
      );
    }

    // Paginate
    this.totalPages = Math.ceil(this.filteredLeadSources.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedLeadSources = this.filteredLeadSources.slice(startIndex, startIndex + this.pageSize);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.updatePaginatedLeadSources();
  }

  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.updatePaginatedLeadSources();
  }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedLeadSources();
    }
  }

  getPaginationRange(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const range: (number | string)[] = [];
    const delta = 1;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }

    range.push(1);
    if (current > delta + 2) range.push('...');

    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);

    for (let i = start; i <= end; i++) range.push(i);

    if (current < total - delta - 1) range.push('...');
    range.push(total);

    return range;
  }

  openAddModal() {
    this.editingId = null;
    this.showAddModal = true;
  }

  onEdit(ls: LeadSourceDTO) {
    this.editingId = ls.id!;
    this.showAddModal = true;
  }

  onDelete(ls: LeadSourceDTO) {
    this.selectedLeadSource = ls;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.selectedLeadSource?.id) {
      this.leadSourceService.delete(this.selectedLeadSource.id).subscribe({
        next: () => {
          this.showDeleteModal = false;
          this.fetchData();
        },
        error: (err) => {
          console.error('Error deleting lead source', err);
          this.showDeleteModal = false;
        }
      });
    }
  }

  onToggleStatus(ls: LeadSourceDTO) {
    const updated = { ...ls, active: !ls.active };
    this.leadSourceService.update(ls.id!, updated).subscribe({
      next: () => {
        this.fetchData();
      },
      error: (err) => {
        console.error('Error toggling lead source status', err);
      }
    });
  }
}
