/**
 * Tests for popup.js core functions
 */

const {
  PopupState,
  addFilter,
  removeFilterFromList,
  toggleActiveFilter,
  sortFilters,
  validateFilterInput,
  shouldClearActiveFilter
} = require('../popup.js');

describe('NotebookLM Filter - Popup Functions', () => {
  beforeEach(() => {
    // Reset state before each test
    PopupState.setFilters([]);
    PopupState.setActiveFilter(null);
  });

  describe('addFilter()', () => {
    test('adds new filter to list', () => {
      const result = addFilter('Work', []);

      expect(result).toContain('Work');
      expect(result.length).toBe(1);
    });

    test('does not add duplicate filters', () => {
      const currentFilters = ['Family', 'Work'];
      const result = addFilter('Family', currentFilters);

      expect(result.length).toBe(2);
      expect(result).toEqual(['Family', 'Work']);
    });

    test('trims whitespace from filter input', () => {
      const result = addFilter('  Family  ', []);

      expect(result).toContain('Family');
      expect(result).not.toContain('  Family  ');
    });

    test('does not add empty filter after trim', () => {
      const result = addFilter('   ', []);

      expect(result).toEqual([]);
    });

    test('does not mutate original array', () => {
      const original = ['Family', 'Work'];
      const result = addFilter('Personal', original);

      expect(original).toEqual(['Family', 'Work']);
      expect(result).toEqual(['Family', 'Work', 'Personal']);
    });
  });

  describe('removeFilterFromList()', () => {
    test('removes filter from list', () => {
      const filters = ['Family', 'Work', 'Personal'];
      const result = removeFilterFromList('Work', filters);

      expect(result).not.toContain('Work');
      expect(result.length).toBe(2);
      expect(result).toEqual(['Family', 'Personal']);
    });

    test('does not mutate original array', () => {
      const original = ['Family', 'Work', 'Personal'];
      const result = removeFilterFromList('Work', original);

      expect(original).toEqual(['Family', 'Work', 'Personal']);
      expect(result).toEqual(['Family', 'Personal']);
    });

    test('handles removing non-existent filter', () => {
      const filters = ['Family', 'Work'];
      const result = removeFilterFromList('Personal', filters);

      expect(result).toEqual(['Family', 'Work']);
    });
  });

  describe('toggleActiveFilter()', () => {
    test('sets active filter when toggled on', () => {
      const result = toggleActiveFilter('Family', true, null);

      expect(result).toBe('Family');
    });

    test('clears active filter when toggled off', () => {
      const result = toggleActiveFilter('Family', false, 'Family');

      expect(result).toBe(null);
    });

    test('replaces active filter when new filter is activated', () => {
      const result = toggleActiveFilter('Work', true, 'Family');

      expect(result).toBe('Work');
      expect(result).not.toBe('Family');
    });
  });

  describe('sortFilters()', () => {
    test('sorts filters alphabetically', () => {
      const filters = ['Zebra', 'Apple', 'Mango', 'Banana'];
      const result = sortFilters(filters);

      expect(result).toEqual(['Apple', 'Banana', 'Mango', 'Zebra']);
    });

    test('does not mutate original array', () => {
      const original = ['Zebra', 'Apple'];
      const result = sortFilters(original);

      expect(original).toEqual(['Zebra', 'Apple']);
      expect(result).toEqual(['Apple', 'Zebra']);
    });

    test('handles empty array', () => {
      const result = sortFilters([]);

      expect(result).toEqual([]);
    });

    test('handles single item', () => {
      const result = sortFilters(['Family']);

      expect(result).toEqual(['Family']);
    });
  });

  describe('validateFilterInput()', () => {
    test('accepts valid filter', () => {
      const result = validateFilterInput('Work');

      expect(result).toBe(true);
    });

    test('rejects empty string', () => {
      const result = validateFilterInput('');

      expect(result).toBe(false);
    });

    test('rejects whitespace-only string', () => {
      const result = validateFilterInput('   ');

      expect(result).toBe(false);
    });

    test('accepts filter with leading/trailing spaces after trim', () => {
      const result = validateFilterInput('  Family  ');

      expect(result).toBe(true);
    });
  });

  describe('shouldClearActiveFilter()', () => {
    test('returns true when removed filter is active', () => {
      const result = shouldClearActiveFilter('Work', 'Work');

      expect(result).toBe(true);
    });

    test('returns false when removed filter is not active', () => {
      const result = shouldClearActiveFilter('Work', 'Family');

      expect(result).toBe(false);
    });

    test('returns false when no filter is active', () => {
      const result = shouldClearActiveFilter('Work', null);

      expect(result).toBe(false);
    });
  });

  describe('PopupState', () => {
    test('stores and retrieves filters', () => {
      PopupState.setFilters(['Family', 'Work']);

      expect(PopupState.getFilters()).toEqual(['Family', 'Work']);
    });

    test('stores and retrieves active filter', () => {
      PopupState.setActiveFilter('Family');

      expect(PopupState.getActiveFilter()).toBe('Family');
    });

    test('can clear active filter', () => {
      PopupState.setActiveFilter('Family');
      PopupState.setActiveFilter(null);

      expect(PopupState.getActiveFilter()).toBe(null);
    });
  });

  describe('Integration: Filter workflow', () => {
    test('complete add and remove workflow', () => {
      // Add filters
      let filters = [];
      filters = addFilter('Family', filters);
      filters = addFilter('Work', filters);
      filters = addFilter('Personal', filters);

      expect(filters).toEqual(['Family', 'Work', 'Personal']);

      // Sort them
      const sorted = sortFilters(filters);
      expect(sorted).toEqual(['Family', 'Personal', 'Work']);

      // Remove one
      filters = removeFilterFromList('Work', filters);
      expect(filters).toEqual(['Family', 'Personal']);
    });

    test('complete toggle workflow', () => {
      let activeFilter = null;

      // Activate first filter
      activeFilter = toggleActiveFilter('Family', true, activeFilter);
      expect(activeFilter).toBe('Family');

      // Switch to another filter
      activeFilter = toggleActiveFilter('Work', true, activeFilter);
      expect(activeFilter).toBe('Work');

      // Deactivate
      activeFilter = toggleActiveFilter('Work', false, activeFilter);
      expect(activeFilter).toBe(null);
    });

    test('remove active filter clears it', () => {
      const filters = ['Family', 'Work'];
      const activeFilter = 'Work';

      const shouldClear = shouldClearActiveFilter('Work', activeFilter);
      expect(shouldClear).toBe(true);

      const newFilters = removeFilterFromList('Work', filters);
      expect(newFilters).not.toContain('Work');
    });
  });
});
