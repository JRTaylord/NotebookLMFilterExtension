document.addEventListener('DOMContentLoaded', async function() {
  // DOM elements
  const loadingView = document.getElementById('loadingView');
  const filterView = document.getElementById('filterView');
  const addFilterView = document.getElementById('addFilterView');
  const addFilterBtn = document.getElementById('addFilterBtn');
  const backBtn = document.getElementById('backBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const filterInput = document.getElementById('filterInput');
  const filterList = document.getElementById('filterList');
  
  let filters = [];
  let activeFilter = null;
  
  // Initialize the extension
  await init();
  
  async function init() {
    try {
      await loadFilters();
      renderFilters();
      setupEventListeners();
      showFilterView();
    } catch (error) {
      console.error('Failed to initialize:', error);
      // Show error or fallback
      showFilterView();
    }
  }

  function setupEventListeners() {
    addFilterBtn.addEventListener('click', showAddFilterView);
    backBtn.addEventListener('click', showFilterView);
    confirmBtn.addEventListener('click', addNewFilter);
    
    filterInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addNewFilter();
      }
    });
  }
  
  // Promise-based storage functions
  function loadFilters() {
    return new Promise((resolve, reject) => {
      console.log(chrome);
      if (typeof chrome === 'undefined' || !chrome.storage) {
        // Fallback for development/testing
        filters = ['Family', 'Finance', 'Health', 'Personal', 'Shopping'];
        resolve();
        return;
      }
      
      chrome.storage.local.get(['filters', 'activeFilter'], function(result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        if (result.filters && result.filters.length > 0) {
          filters = result.filters;
        } else {
          // Set default filters if none exist
          filters = ['Family', 'Finance', 'Health', 'Personal', 'Shopping'];
        }
        
        activeFilter = result.activeFilter || null;
        resolve();
      });
    });
  }
  
  function saveFilters() {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        resolve(); // Silent fail in development
        return;
      }
      
      chrome.storage.local.set({
        filters: filters,
        activeFilter: activeFilter
      }, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  
  function renderFilters() {
    filterList.innerHTML = '';
    
    const sortedFilters = [...filters].sort();
    
    sortedFilters.forEach(filter => {
      const filterItem = createFilterItem(filter);
      filterList.appendChild(filterItem);
    });

    // Check if margin is needed after rendering
    setTimeout(updateScrollMargin, 0);
  }
  
  function createFilterItem(filterName) {
    const item = document.createElement('div');
    item.className = 'filter-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'filter-checkbox';
    checkbox.checked = activeFilter === filterName;
    checkbox.addEventListener('change', () => toggleFilter(filterName, checkbox.checked));
    
    const label = document.createElement('label');
    label.textContent = filterName;
    label.className = 'filter-label';
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'remove-btn';
    removeBtn.addEventListener('click', () => removeFilter(filterName));
    
    item.appendChild(checkbox);
    item.appendChild(label);
    item.appendChild(removeBtn);
    
    return item;
  }
  
  async function toggleFilter(filterName, isChecked) {
    if (isChecked) {
      const checkboxes = document.querySelectorAll('.filter-checkbox');
      checkboxes.forEach(cb => {
        if (cb !== event.target) {
          cb.checked = false;
        }
      });
      
      activeFilter = filterName;
      applyFilter(filterName);
    } else {
      activeFilter = null;
      clearFilter();
    }
    
    try {
      await saveFilters();
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  }
  
  function applyFilter(filterName) {
    chrome.tabs?.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'applyFilter',
        filter: filterName
      });
    });
  }
  
  function clearFilter() {
    chrome.tabs?.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'clearFilter'
      });
    });
  }
  
  async function clearActiveFilter() {
    activeFilter = null;
    const checkboxes = document.querySelectorAll('.filter-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    clearFilter();
    
    try {
      await saveFilters();
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  }
  
  async function removeFilter(filterName) {
    filters = filters.filter(f => f !== filterName);
    if (activeFilter === filterName) {
      activeFilter = null;
      clearFilter();
    }
    renderFilters();
    
    try {
      await saveFilters();
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  }
  
  async function addNewFilter() {
    const newFilter = filterInput.value.trim();
    if (newFilter && !filters.includes(newFilter)) {
      filters.push(newFilter);
      try {
        await saveFilters();
        renderFilters();
      } catch (error) {
        console.error('Failed to save new filter:', error);
      }
    }
    filterInput.value = '';
    showFilterView();
  }
  
  function showAddFilterView() {
    filterView.classList.add('hidden');
    addFilterView.classList.remove('hidden');
    loadingView.classList.add('hidden');
    filterInput.focus();
  }
  
  function showFilterView() {
    addFilterView.classList.add('hidden');
    filterView.classList.remove('hidden');
    loadingView.classList.add('hidden');
  }

  function updateScrollMargin() {
    const filterList = document.getElementById('filterList');
    const canScroll = filterList.scrollHeight > filterList.clientHeight;
    
    // Add margin when it CAN'T scroll (content fits)
    filterList.classList.toggle('no-scroll', !canScroll);
  }
});
