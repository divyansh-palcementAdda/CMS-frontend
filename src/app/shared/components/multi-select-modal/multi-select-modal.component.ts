import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-multi-select-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multi-select-modal.component.html',
  styleUrl: './multi-select-modal.component.scss'
})
export class MultiSelectModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() title: string = 'Select Items';
  @Input() placeholder: string = 'Search...';
  @Input() items: any[] = [];
  @Input() loading: boolean = false;
  @Input() totalElements: number = 0;
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() selectedItems: any[] = [];

  // Dynamic label resolvers
  @Input() displayField: string | ((item: any) => string) = 'name';
  @Input() subtitleField?: string | ((item: any) => string);
  @Input() tagField?: string | ((item: any) => string);

  @Output() search = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() apply = new EventEmitter<any[]>();
  @Output() close = new EventEmitter<void>();

  searchText: string = '';
  tempSelectedItems: any[] = [];
  tempSelectedIds: any[] = [];

  // Guard: only seed temp state once per modal open, never on subsequent CD cycles
  private _selectionInitialized = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit() {
    this._selectionInitialized = false;
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.search.emit(term);
    });
    this.initializeSelection();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Only seed the temp selection on the FIRST change (initial open).
    // If we re-initialize on every CD cycle the parent getter (getSelectedUsers()
    // etc.) returns a new array reference each time, which wipes whatever the
    // user has just checked inside the modal.
    if (changes['selectedItems'] && !this._selectionInitialized) {
      this.initializeSelection();
    }
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  initializeSelection() {
    this.tempSelectedItems = this.selectedItems ? [...this.selectedItems] : [];
    this.tempSelectedIds = this.tempSelectedItems.map(item => this.getItemId(item));
    this._selectionInitialized = true;
  }

  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }

  getItemId(item: any): any {
    if (!item) return null;
    if (item.userId !== undefined && item.userId !== null) return item.userId;
    if (item.courseId !== undefined && item.courseId !== null) return item.courseId;
    return item.id;
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

  toggleSelection(item: any) {
    const id = this.getItemId(item);
    const index = this.tempSelectedIds.indexOf(id);
    if (index === -1) {
      this.tempSelectedIds.push(id);
      this.tempSelectedItems.push(item);
    } else {
      this.tempSelectedIds.splice(index, 1);
      const itemIndex = this.tempSelectedItems.findIndex(x => this.getItemId(x) === id);
      if (itemIndex !== -1) {
        this.tempSelectedItems.splice(itemIndex, 1);
      }
    }
  }

  isItemSelected(item: any): boolean {
    const id = this.getItemId(item);
    return this.tempSelectedIds.includes(id);
  }

  selectAllVisible() {
    this.items.forEach(item => {
      const id = this.getItemId(item);
      if (!this.tempSelectedIds.includes(id)) {
        this.tempSelectedIds.push(id);
        this.tempSelectedItems.push(item);
      }
    });
  }

  clearAll() {
    this.tempSelectedIds = [];
    this.tempSelectedItems = [];
  }

  applySelection() {
    console.log('[MultiSelectModal] Applying selection:', this.tempSelectedItems);
    this.apply.emit([...this.tempSelectedItems]);
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
