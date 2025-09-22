// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyFilter') {
    filterNotebooks(message.filter);
  } else if (message.action === 'clearFilter') {
    showAllNotebooks();
  }

  sendResponse({ success: true, message: 'Content script received the message' });
});

function filterNotebooks(filterKeyword) {
  // Wait for DOM to be ready before trying to filter
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => doFilter(filterKeyword));
  } else {
    doFilter(filterKeyword);
  }
}

function doFilter(filterKeyword) {
  // Based on the HTML structure, notebooks are in table rows
  const tableRows = document.querySelectorAll('tbody tr[mat-row]');

  if (tableRows.length > 0) {
    const keyword = filterKeyword.toLowerCase();

    tableRows.forEach(row => {
      // Get the title cell (first column)
      const titleCell = row.querySelector('td[mat-cell]');

      if (titleCell) {
        const titleText = titleCell.textContent.toLowerCase();

        if (titleText.includes(keyword)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      }
    });
  } else {

    // Fallback: try to find any elements that might contain notebook titles
    const allElements = document.querySelectorAll('*');
    let foundNotebooks = false;

    allElements.forEach(element => {
      const text = element.textContent;
      if (text && text.includes('Kansas: Dust in the Wind') ||
        text.includes('notebook') ||
        element.className.includes('project')) {
        foundNotebooks = true;
      }
    });
  }
}

function showAllNotebooks() {
  // Show all previously hidden elements
  const hiddenElements = document.querySelectorAll('[style*="display: none"]');
  hiddenElements.forEach(element => {
    element.style.display = '';
  });
}
