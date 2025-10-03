// Clear active filter when page loads (prevents confusion on page refresh)
// This runs only on NotebookLM pages as defined in manifest.json
if (typeof FilterState !== 'undefined') {
  FilterState.clearActiveFilter(function() {
    // After clearing, visually clear any applied filters on the page
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showAllNotebooks);
    } else {
      showAllNotebooks();
    }
  });
} else {
  // Fallback if FilterState not loaded yet
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showAllNotebooks);
  } else {
    showAllNotebooks();
  }
}

// Set up MutationObserver to re-apply filters when page content changes
// (e.g., switching between card/list view or all/featured notebooks)
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    // Only respond to structural DOM changes (nodes added/removed), not style changes
    const hasStructuralChanges = mutations.some(mutation => {
      // Ignore our own style attribute changes
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        return false;
      }
      // Only care about nodes being added or removed (view switches, content changes)
      return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
    });

    if (hasStructuralChanges) {
      // Re-apply active filter if one exists
      reapplyActiveFilter();
    }
  });

  // Observe the main content area for changes
  const targetNode = document.body;
  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,      // Watch for nodes being added/removed
      subtree: true         // Watch all descendants
      // Note: NOT watching attributes, so our style changes won't trigger the observer
    });
  }
}

// Re-apply the active filter from storage
function reapplyActiveFilter() {
  if (typeof FilterState === 'undefined') return;

  FilterState.getActiveFilter(function(activeFilter) {
    if (activeFilter) {
      filterNotebooks(activeFilter);
    }
  });
}

// Start observing when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMutationObserver);
} else {
  setupMutationObserver();
}

// Listen for storage changes to sync activeFilter across contexts
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener(function(changes, areaName) {
    // React to activeFilter changes from popup or other sources
    if (changes.activeFilter) {
      const newActiveFilter = changes.activeFilter.newValue;

      if (newActiveFilter) {
        // Filter was activated, apply it
        filterNotebooks(newActiveFilter);
      } else {
        // Filter was cleared, show all notebooks
        showAllNotebooks();
      }
    }
  });
}

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
