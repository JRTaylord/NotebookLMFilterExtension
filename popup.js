document.addEventListener('DOMContentLoaded', async function() {
  // DOM elements
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
      loadFilters();
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

    filterInput.addEventListener('input', () => {
      const newFilter = filterInput.value.trim();
      const isValid = newFilter.length;
      confirmBtn.disabled = !isValid;
    })
  }

  function loadFilters() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      // Fallback for development/testing
      filters = ['Family', 'Finance', 'Health', 'Personal', 'Shopping'];
      renderFilters();
      return;
    }

    // Try to load from sync storage first (syncs across devices)
    chrome.storage.sync.get(['filters', 'activeFilter'], function(result) {
      if (chrome.runtime.lastError) {
        console.warn('Failed to load from sync storage, trying local:', chrome.runtime.lastError);

        // Fall back to local storage if sync fails
        chrome.storage.local.get(['filters', 'activeFilter'], function(localResult) {
          if (chrome.runtime.lastError) {
            console.error('Failed to load filters from local storage:', chrome.runtime.lastError);
            filters = [];
          } else {
            if (localResult.filters && localResult.filters.length > 0) {
              filters = localResult.filters;
            } else {
              filters = [];
            }
            activeFilter = localResult.activeFilter || null;
          }
          renderFilters();
        });
      } else {
        // Successfully loaded from sync storage
        if (result.filters && result.filters.length > 0) {
          filters = result.filters;
        } else {
          filters = [];
        }
        activeFilter = result.activeFilter || null;
        renderFilters();
      }
    });
  }

  function saveFilters() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return; // Silent fail in development
    }

    const data = {
      filters: filters,
      activeFilter: activeFilter
    };

    // Save to sync storage first (syncs across devices)
    chrome.storage.sync.set(data, function() {
      if (chrome.runtime.lastError) {
        console.warn('Failed to save to sync storage:', chrome.runtime.lastError);
        // Note: Sync storage has limits (100KB total, 8KB per item)
        // If sync fails, local backup below will still work
      }
    });

    // Also save to local storage as backup
    chrome.storage.local.set(data, function() {
      if (chrome.runtime.lastError) {
        console.error('Failed to save to local storage:', chrome.runtime.lastError);
      }
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
    setTimeout(hideFilterListIfEmpty, 0);
  }

  function createFilterItem(filterName) {
    const item = document.createElement('div');
    item.className = 'filter-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'filter-checkbox';
    checkbox.checked = activeFilter === filterName;
    checkbox.addEventListener('change', () => toggleFilter(filterName, checkbox.checked, checkbox));

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

  async function toggleFilter(filterName, isChecked, sourceCheckbox) {
    if (isChecked) {
      const checkboxes = document.querySelectorAll('.filter-checkbox');
      checkboxes.forEach(cb => {
        if (cb !== sourceCheckbox) {
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
      saveFilters();
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  }

  function applyFilter(filterName) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) {
        console.error('No active tab found');
        return;
      }

      const tab = tabs[0];

      // Check if we're on the right domain
      if (!tab.url.includes('notebooklm.google.com')) {
        console.warn('Not on NotebookLM domain');
        return;
      }

      chrome.tabs.sendMessage(tab.id, {
        action: 'applyFilter',
        filter: filterName
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Popup: Message failed:', chrome.runtime.lastError.message);

          // If content script isn't loaded, try to inject it
          if (chrome.runtime.lastError.message.includes('Could not establish connection')) {
            injectContentScript(tab.id, () => {
              // Retry sending the message
              chrome.tabs.sendMessage(tab.id, {
                action: 'applyFilter',
                filter: filterName
              });
            });
          }
        }
      });
    });
  }

  function clearFilter() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) return;

      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'clearFilter'
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Clear filter message failed:', chrome.runtime.lastError.message);
        }
      });
    });
  }

  async function removeFilter(filterName) {
    filters = filters.filter(f => f !== filterName);
    if (activeFilter === filterName) {
      activeFilter = null;
      clearFilter();
    }
    renderFilters();

    try {
      saveFilters();
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  }

  function addNewFilter() {
    const newFilter = filterInput.value.trim();
    if (newFilter && !filters.includes(newFilter)) {
      filters.push(newFilter);
      try {
        saveFilters();
        renderFilters();
      } catch (error) {
        console.error('Failed to save new filter:', error);
      }
    }
    filterInput.value = '';
    confirmBtn.disabled = true;
    showFilterView();
  }

  function showAddFilterView() {
    filterView.classList.add('hidden');
    addFilterView.classList.remove('hidden');
    filterInput.focus();
  }

  function showFilterView() {
    addFilterView.classList.add('hidden');
    filterView.classList.remove('hidden');
  }

  function updateScrollMargin() {
    const filterList = document.getElementById('filterList');
    const canScroll = filterList.scrollHeight > filterList.clientHeight;

    // Add margin when it CAN'T scroll (content fits)
    filterList.classList.toggle('no-scroll', !canScroll);
  }

  function hideFilterListIfEmpty() {
    const filterList = document.getElementById('filterList');
    console.log('hiding', !filters.length);

    console.log('filters', filters);
    filterList.classList.toggle('hidden', !filters.length);
  }
});
