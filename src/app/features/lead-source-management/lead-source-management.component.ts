import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  
  showAddModal = false;
  showDeleteModal = false;
  selectedLeadSource: LeadSourceDTO | null = null;
  editingId: string | null = null;

  constructor(private leadSourceService: LeadSourceService) { }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.leadSourceService.getAll().subscribe({
      next: (res) => {
        this.leadSources = res.data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching lead sources', err);
        this.loading = false;
      }
    });
  }

  applyFilter() {
    if (!this.searchTerm.trim()) {
      this.filteredLeadSources = [...this.leadSources];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredLeadSources = this.leadSources.filter(ls =>
        ls.name.toLowerCase().includes(term)
      );
    }
  }

  onSearchChange() {
    this.applyFilter();
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
