// Working content script - no DOM manipulation errors
console.log('🔥 EXTENSION LOADED ON:', window.location.href);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content script received message:', message);
  
  if (message.action === 'applyFilter') {
    console.log('🔍 Applying filter:', message.filter);
    filterNotebooks(message.filter);
  } else if (message.action === 'clearFilter') {
    console.log('🧹 Clearing filter');
    showAllNotebooks();
  }
  
  sendResponse({success: true, message: 'Content script received the message'});
});

function filterNotebooks(filterKeyword) {
  console.log('Filtering notebooks for keyword:', filterKeyword);
  
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
  
  console.log(`Found ${tableRows.length} notebook rows`);
  
  if (tableRows.length > 0) {
    const keyword = filterKeyword.toLowerCase();
    
    tableRows.forEach(row => {
      // Get the title cell (first column)
      const titleCell = row.querySelector('td[mat-cell]');
      
      if (titleCell) {
        const titleText = titleCell.textContent.toLowerCase();
        console.log(`Checking notebook: "${titleText}" against filter: "${keyword}"`);
        
        if (titleText.includes(keyword)) {
          row.style.display = '';
          console.log(`✓ Showing: ${titleText}`);
        } else {
          row.style.display = 'none';
          console.log(`✗ Hiding: ${titleText}`);
        }
      }
    });
  } else {
    console.log('⚠️ No notebook table rows found. Looking for alternative structure...');
    
    // Fallback: try to find any elements that might contain notebook titles
    const allElements = document.querySelectorAll('*');
    let foundNotebooks = false;
    
    allElements.forEach(element => {
      const text = element.textContent;
      if (text && text.includes('Kansas: Dust in the Wind') || 
          text.includes('notebook') || 
          element.className.includes('project')) {
        console.log('Potential notebook element:', element);
        foundNotebooks = true;
      }
    });
    
    if (!foundNotebooks) {
      console.log('No potential notebook elements found in DOM');
    }
  }
}

function showAllNotebooks() {
  console.log('Showing all notebooks');
  
  // Show all previously hidden elements
  const hiddenElements = document.querySelectorAll('[style*="display: none"]');
  hiddenElements.forEach(element => {
    element.style.display = '';
  });
  
  console.log(`Restored ${hiddenElements.length} hidden elements`);
}

// Log that we're ready
console.log('✅ Content script ready and waiting for messages');
