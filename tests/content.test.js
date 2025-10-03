/**
 * Tests for content.js filtering logic
 */

// Mock chrome runtime
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Import functions from content script
const { doFilter, showAllNotebooks, filterNotebooks } = require('../content.js');

describe('NotebookLM Filter - Content Script', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('doFilter() - Table Row Layout (Method 1)', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr mat-row>
              <td mat-cell>Family Vacation Plans</td>
            </tr>
            <tr mat-row>
              <td mat-cell>Finance Budget 2024</td>
            </tr>
            <tr mat-row>
              <td mat-cell>Health Tracking</td>
            </tr>
          </tbody>
        </table>
      `;
    });

    test('filters rows containing keyword', () => {
      doFilter('family');

      const rows = document.querySelectorAll('tbody tr[mat-row]');
      expect(rows[0].style.display).toBe('');
      expect(rows[1].style.display).toBe('none');
      expect(rows[2].style.display).toBe('none');
    });

    test('is case-insensitive', () => {
      doFilter('FINANCE');

      const rows = document.querySelectorAll('tbody tr[mat-row]');
      expect(rows[0].style.display).toBe('none');
      expect(rows[1].style.display).toBe('');
      expect(rows[2].style.display).toBe('none');
    });

    test('shows multiple matching rows', () => {
      doFilter('a'); // matches "Family", "Vacation", "Plans", "Finance", "Tracking"

      const rows = document.querySelectorAll('tbody tr[mat-row]');
      expect(rows[0].style.display).toBe(''); // Family Vacation Plans
      expect(rows[1].style.display).toBe(''); // Finance Budget 2024
      expect(rows[2].style.display).toBe(''); // Health Tracking
    });

    test('handles no matches', () => {
      doFilter('nonexistent');

      const rows = document.querySelectorAll('tbody tr[mat-row]');
      rows.forEach(row => {
        expect(row.style.display).toBe('none');
      });
    });
  });

  describe('doFilter() - Project Button Layout (Method 2)', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <project-button>
          <div class="project-button-title">Shopping List</div>
        </project-button>
        <project-button>
          <div class="project-button-title">Work Projects</div>
        </project-button>
        <project-button>
          <div class="featured-project-title">Personal Goals</div>
        </project-button>
      `;
    });

    test('filters project buttons correctly', () => {
      doFilter('shopping');

      const buttons = document.querySelectorAll('project-button');
      expect(buttons[0].style.display).toBe('');
      expect(buttons[1].style.display).toBe('none');
      expect(buttons[2].style.display).toBe('none');
    });

    test('works with featured-project-title class', () => {
      doFilter('personal');

      const buttons = document.querySelectorAll('project-button');
      expect(buttons[0].style.display).toBe('none');
      expect(buttons[1].style.display).toBe('none');
      expect(buttons[2].style.display).toBe('');
    });

    test('is case-insensitive', () => {
      doFilter('SHOPPING');

      const buttons = document.querySelectorAll('project-button');
      expect(buttons[0].style.display).toBe('');
      expect(buttons[1].style.display).toBe('none');
      expect(buttons[2].style.display).toBe('none');
    });
  });

  describe('doFilter() - Mat Card Layout (Method 3)', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <mat-card class="project-button-card">
          <div class="project-button-title">Research Notes</div>
        </mat-card>
        <mat-card class="project-button-card">
          <div class="project-button-title">Meeting Minutes</div>
        </mat-card>
      `;
    });

    test('filters mat-card elements', () => {
      doFilter('research');

      const cards = document.querySelectorAll('mat-card.project-button-card');
      expect(cards[0].style.display).toBe('');
      expect(cards[1].style.display).toBe('none');
    });

    test('is case-insensitive', () => {
      doFilter('MEETING');

      const cards = document.querySelectorAll('mat-card.project-button-card');
      expect(cards[0].style.display).toBe('none');
      expect(cards[1].style.display).toBe('');
    });
  });

  describe('showAllNotebooks()', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr mat-row style="display: none;">
              <td mat-cell>Hidden Row</td>
            </tr>
          </tbody>
        </table>
        <project-button style="display: none;">
          <div class="project-button-title">Hidden Button</div>
        </project-button>
        <mat-card class="project-button-card" style="display: none;">
          <div class="project-button-title">Hidden Card</div>
        </mat-card>
      `;
    });

    test('shows all hidden table rows', () => {
      showAllNotebooks();

      const row = document.querySelector('tbody tr[mat-row]');
      expect(row.style.display).toBe('');
    });

    test('shows all hidden project buttons', () => {
      showAllNotebooks();

      const button = document.querySelector('project-button');
      expect(button.style.display).toBe('');
    });

    test('shows all hidden mat-cards', () => {
      showAllNotebooks();

      const card = document.querySelector('mat-card.project-button-card');
      expect(card.style.display).toBe('');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty DOM gracefully', () => {
      document.body.innerHTML = '';

      expect(() => doFilter('test')).not.toThrow();
      expect(() => showAllNotebooks()).not.toThrow();
    });

    test('handles missing title elements', () => {
      document.body.innerHTML = `
        <tbody>
          <tr mat-row>
            <td>No mat-cell attribute</td>
          </tr>
        </tbody>
      `;

      expect(() => doFilter('test')).not.toThrow();
    });

    test('handles special characters in filter', () => {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr mat-row>
              <td mat-cell>Project: Test & Dev</td>
            </tr>
          </tbody>
        </table>
      `;

      doFilter('test & dev');

      const row = document.querySelector('tbody tr[mat-row]');
      expect(row.style.display).toBe('');
    });

    test('handles partial word matching', () => {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr mat-row>
              <td mat-cell>JavaScript Development</td>
            </tr>
          </tbody>
        </table>
      `;

      doFilter('script');

      const row = document.querySelector('tbody tr[mat-row]');
      expect(row.style.display).toBe('');
    });
  });
});
