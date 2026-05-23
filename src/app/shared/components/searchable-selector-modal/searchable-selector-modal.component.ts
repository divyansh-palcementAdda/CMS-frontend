import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-searchable-selector-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-selector-modal.component.html',
  styleUrl: './searchable-selector-modal.component.scss'
})
export class SearchableSelectorModalComponent implements OnInit, OnDestroy {
  @Input() title: string = 'Select Item';
  @Input() placeholder: string = 'Search...';
  @Input() items: any[] = [];
  @Input() loading: boolean = false;
  @Input() totalElements: number = 0;
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() selectedId: number | string | null = null;
  
  // Dynamic label resolvers
  @Input() displayField: string | ((item: any) => string) = 'name';
  @Input() subtitleField?: string | ((item: any) => string);
  @Input() tagField?: string | ((item: any) => string);

  @Output() search = new EventEmitter<string>();
  @Output() select = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() close = new EventEmitter<void>();

  searchText: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.search.emit(term);
    });
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }

  getDisplayText(item: any): string {
    if (typeof this.displayField === 'function') {
      return this.displayField(item);
    }
    return item[this.displayField] || '';
  }

  getSubtitleText(item: any): string {
    if (!this.subtitleField) return '';
    if (typeof this.subtitleField === 'function') {
      return this.subtitleField(item);
    }
    return item[this.subtitleField] || '';
  }

  getTagText(item: any): string {
    if (!this.tagField) return '';
    if (typeof this.tagField === 'function') {
      return this.tagField(item);
    }
    return item[this.tagField] || '';
  }

  selectItem(item: any) {
    this.select.emit(item);
  }

  clearSelection() {
    this.select.emit(null);
  }

  onPrevPage() {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNextPage() {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }
}
