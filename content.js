// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'applyFilter') {
      filterNotebooks(message.filter);
    } else if (message.action === 'clearFilter') {
      showAllNotebooks();
    }

    sendResponse({ success: true, message: 'Content script received the message' });
  });
}

function filterNotebooks(filterKeyword) {
  // Wait for DOM to be ready before trying to filter
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => doFilter(filterKeyword));
  } else {
    doFilter(filterKeyword);
  }
}

function doFilter(filterKeyword) {
  const keyword = filterKeyword.toLowerCase();
  let foundElements = false;

  try {
    // Method 1: Try to filter table rows (original layout)
    const tableRows = document.querySelectorAll('tbody tr[mat-row]');
    if (tableRows.length > 0) {
      foundElements = true;

      tableRows.forEach(row => {
        const titleCell = row.querySelector('td[mat-cell]');
        if (titleCell) {
          const titleText = titleCell.textContent.toLowerCase();
          row.style.display = titleText.includes(keyword) ? '' : 'none';
        }
      });
    }

    // Method 2: Filter card-based layout (new layout) - project buttons
    const projectButtons = document.querySelectorAll('project-button');
    if (projectButtons.length > 0) {
      foundElements = true;

      projectButtons.forEach(button => {
        const titleElement = button.querySelector('.project-button-title, .featured-project-title');
        if (titleElement) {
          const titleText = titleElement.textContent.toLowerCase();
          button.style.display = titleText.includes(keyword) ? '' : 'none';
        }
      });
    }

    // Method 3: Filter mat-card elements directly
    const matCards = document.querySelectorAll('mat-card.project-button-card');
    if (matCards.length > 0) {
      foundElements = true;

      matCards.forEach(card => {
        const titleElement = card.querySelector('.project-button-title, .featured-project-title');
        if (titleElement) {
          const titleText = titleElement.textContent.toLowerCase();
          card.style.display = titleText.includes(keyword) ? '' : 'none';
        }
      });
    }
  } catch (error) {
    console.error('Chrome Extension: Error during filtering:', error);
  }
}

function showAllNotebooks() {
  try {
    // Method 1: Show all table rows
    const tableRows = document.querySelectorAll('tbody tr[mat-row]');
    tableRows.forEach(row => {
      row.style.display = '';
    });

    // Method 2: Show all project buttons
    const projectButtons = document.querySelectorAll('project-button');
    projectButtons.forEach(button => {
      button.style.display = '';
    });

    // Method 3: Show all project cards
    const matCards = document.querySelectorAll('mat-card.project-button-card');
    matCards.forEach(card => {
      card.style.display = '';
    });

    // Method 4: Show all elements that might have been hidden by title-based filtering
    const titleElements = document.querySelectorAll('.project-button-title, .featured-project-title');
    titleElements.forEach(titleElement => {
      const container = titleElement.closest('mat-card') ||
        titleElement.closest('project-button') ||
        titleElement.closest('[class*="project"]');

      if (container) {
        container.style.display = '';
      }
    });

  } catch (error) {
    console.error('Chrome Extension: Error during show all:', error);
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { doFilter, showAllNotebooks, filterNotebooks };
}
