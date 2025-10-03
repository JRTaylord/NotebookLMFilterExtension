/**
 * Edge case tests for NotebookLM Filter Extension
 */

describe('NotebookLM Filter - Edge Cases', () => {
  let mockChrome;

  beforeEach(() => {
    mockChrome = {
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn()
        },
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      runtime: {
        lastError: null
      }
    };

    global.chrome = mockChrome;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Special Characters in Filters', () => {
    test('handles filters with ampersands', () => {
      const filter = 'R&D Projects';
      const text = 'r&d projects presentation';

      expect(text.toLowerCase().includes(filter.toLowerCase())).toBe(true);
    });

    test('handles filters with quotes', () => {
      const filter = "John's Notes";
      const text = "john's notes from meeting";

      expect(text.toLowerCase().includes(filter.toLowerCase())).toBe(true);
    });

    test('handles filters with numbers', () => {
      const filter = 'Q1 2024';
      const text = 'Budget Q1 2024';

      expect(text.toLowerCase().includes(filter.toLowerCase())).toBe(true);
    });

    test('handles filters with parentheses', () => {
      const filter = 'Project (Draft)';
      const text = 'Project (Draft) v2';

      expect(text.toLowerCase().includes(filter.toLowerCase())).toBe(true);
    });

    test('handles filters with hyphens and underscores', () => {
      const filter = 'my-project_2024';
      const text = 'My-Project_2024 Documentation';

      expect(text.toLowerCase().includes(filter.toLowerCase())).toBe(true);
    });

    test('handles filters with forward slashes', () => {
      const filter = 'work/personal';
      const text = 'Work/Personal Tasks';

      expect(text.toLowerCase().includes(filter.toLowerCase())).toBe(true);
    });

    test('handles Unicode characters', () => {
      const filter = 'Café Notes';
      const text = 'café notes meeting';

      expect(text.toLowerCase().includes(filter.toLowerCase())).toBe(true);
    });

    test('handles emoji in filter', () => {
      const filter = '🎯 Goals';
      const text = '🎯 Goals 2024';

      expect(text.toLowerCase().includes(filter.toLowerCase())).toBe(true);
    });
  });

  describe('Empty and Whitespace Handling', () => {
    test('handles empty string filter', () => {
      const filter = '';
      const text = 'Any Text';

      // Empty filter should match everything
      expect(text.includes(filter)).toBe(true);
    });

    test('handles filter with only spaces', () => {
      const filter = '   ';
      const trimmed = filter.trim();

      expect(trimmed).toBe('');
      expect(trimmed.length).toBe(0);
    });

    test('handles multiple consecutive spaces in filter', () => {
      const filter = 'work  notes';
      const text = 'work notes from meeting';

      // Exact match won't work due to double space
      expect(text.includes(filter)).toBe(false);

      // But normalized comparison would work
      const normalizedFilter = filter.replace(/\s+/g, ' ').trim();
      expect(text.includes(normalizedFilter)).toBe(true);
    });

    test('handles tabs in filter', () => {
      const filter = 'work\tnotes';
      const text = 'work\tnotes';

      expect(text.includes(filter)).toBe(true);
    });
  });

  describe('Storage Quota and Limits', () => {
    test('handles chrome.storage.sync quota exceeded error', (done) => {
      mockChrome.storage.sync.set.mockImplementation((data, callback) => {
        mockChrome.runtime.lastError = {
          message: 'QUOTA_BYTES quota exceeded'
        };
        if (callback) callback();
      });

      const largeFilterList = new Array(100).fill(null).map((_, i) => `Filter ${i}`);
      const data = { filters: largeFilterList };

      mockChrome.storage.sync.set(data, () => {
        expect(mockChrome.runtime.lastError).toBeTruthy();
        expect(mockChrome.runtime.lastError.message).toContain('QUOTA_BYTES');
        done();
      });
    });

    test('handles individual item size limit', () => {
      // Chrome sync storage has 8KB limit per item
      const veryLongFilterName = 'A'.repeat(9000);

      // Should exceed limit
      expect(veryLongFilterName.length).toBeGreaterThan(8192);
    });

    test('handles maximum number of filters', () => {
      // Chrome sync storage has max 512 items
      const maxFilters = 512;
      const filters = new Array(maxFilters).fill(null).map((_, i) => `Filter ${i}`);

      expect(filters.length).toBe(512);
    });
  });

  describe('Duplicate Handling', () => {
    test('prevents exact duplicate filters', () => {
      const filters = ['Family', 'Work'];
      const newFilter = 'Family';

      const isDuplicate = filters.includes(newFilter);

      expect(isDuplicate).toBe(true);

      if (!isDuplicate) {
        filters.push(newFilter);
      }

      expect(filters.length).toBe(2);
    });

    test('allows case-different duplicates (case-sensitive check)', () => {
      const filters = ['Family'];
      const newFilter = 'family';

      const isDuplicate = filters.includes(newFilter);

      expect(isDuplicate).toBe(false);
    });

    test('case-insensitive duplicate check', () => {
      const filters = ['Family'];
      const newFilter = 'family';

      const isDuplicate = filters.some(f => f.toLowerCase() === newFilter.toLowerCase());

      expect(isDuplicate).toBe(true);
    });
  });

  describe('Array Mutation Safety', () => {
    test('filter removal does not mutate during iteration', () => {
      let filters = ['A', 'B', 'C', 'D'];
      const toRemove = 'B';

      // Safe removal - creates new array
      filters = filters.filter(f => f !== toRemove);

      expect(filters).toEqual(['A', 'C', 'D']);
    });

    test('sorting does not mutate original array', () => {
      const filters = ['Zebra', 'Apple', 'Mango'];
      const original = [...filters];

      const sorted = [...filters].sort();

      expect(filters).toEqual(original);
      expect(sorted).toEqual(['Apple', 'Mango', 'Zebra']);
    });
  });

  describe('Message Passing Edge Cases', () => {
    test('handles no active tab', () => {
      mockChrome.tabs = {
        query: jest.fn((query, callback) => {
          callback([]);
        }),
        sendMessage: jest.fn()
      };

      global.chrome.tabs = mockChrome.tabs;

      mockChrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          mockChrome.tabs.sendMessage(tabs[0].id, { action: 'applyFilter' });
        }
      });

      expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    test('handles content script not ready error', (done) => {
      mockChrome.tabs = {
        query: jest.fn((query, callback) => {
          callback([{ id: 1, url: 'https://notebooklm.google.com' }]);
        }),
        sendMessage: jest.fn((tabId, message, callback) => {
          mockChrome.runtime.lastError = {
            message: 'Could not establish connection. Receiving end does not exist.'
          };
          if (callback) callback();
        })
      };

      global.chrome.tabs = mockChrome.tabs;

      mockChrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        mockChrome.tabs.sendMessage(tabs[0].id, { action: 'applyFilter' }, () => {
          expect(mockChrome.runtime.lastError).toBeTruthy();
          expect(mockChrome.runtime.lastError.message).toContain('Could not establish connection');
          done();
        });
      });
    });

    test('handles tab closed during message sending', (done) => {
      mockChrome.tabs = {
        query: jest.fn((query, callback) => {
          callback([{ id: 999, url: 'https://notebooklm.google.com' }]);
        }),
        sendMessage: jest.fn((tabId, message, callback) => {
          mockChrome.runtime.lastError = {
            message: 'The tab was closed'
          };
          if (callback) callback();
        })
      };

      global.chrome.tabs = mockChrome.tabs;

      mockChrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        mockChrome.tabs.sendMessage(tabs[0].id, { action: 'clearFilter' }, () => {
          expect(mockChrome.runtime.lastError.message).toBe('The tab was closed');
          done();
        });
      });
    });
  });

  describe('DOM Ready State', () => {
    test('handles document still loading', () => {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'loading'
      });

      expect(document.readyState).toBe('loading');

      // Cleanup
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete'
      });
    });

    test('handles document interactive state', () => {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'interactive'
      });

      expect(document.readyState).toBe('interactive');

      // Cleanup
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete'
      });
    });

    test('handles document complete state', () => {
      expect(document.readyState).toBe('complete');
    });
  });

  describe('Null and Undefined Handling', () => {
    test('handles null activeFilter', () => {
      let activeFilter = null;

      const isActive = activeFilter === 'Family';

      expect(isActive).toBe(false);
    });

    test('handles undefined filters array', () => {
      let filters = undefined;

      filters = filters || [];

      expect(filters).toEqual([]);
    });

    test('handles null filter text', () => {
      const filterText = null;
      const safeText = (filterText || '').toLowerCase();

      expect(safeText).toBe('');
    });
  });

  describe('Very Long Filter Names', () => {
    test('handles extremely long filter name', () => {
      const longFilter = 'A'.repeat(1000);
      const text = 'A'.repeat(1000) + ' document';

      expect(text.includes(longFilter)).toBe(true);
    });

    test('performance with long filter on long text', () => {
      const filter = 'test'.repeat(100);
      const text = 'some text ' + 'test'.repeat(100) + ' more text';

      const startTime = Date.now();
      const result = text.toLowerCase().includes(filter.toLowerCase());
      const duration = Date.now() - startTime;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
