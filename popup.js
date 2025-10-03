// State management module
const PopupState = {
  filters: [],
  activeFilter: null,

  getFilters() {
    return this.filters;
  },

  setFilters(newFilters) {
    this.filters = newFilters;
  },

  getActiveFilter() {
    return this.activeFilter;
  },

  setActiveFilter(filter) {
    this.activeFilter = filter;
  }
};

// Core functions (testable)
function addFilter(filterName, currentFilters) {
  const trimmed = filterName.trim();
  if (!trimmed) return currentFilters;
  if (currentFilters.includes(trimmed)) return currentFilters;
  return [...currentFilters, trimmed];
}

function removeFilterFromList(filterName, currentFilters) {
  return currentFilters.filter(f => f !== filterName);
}

function toggleActiveFilter(filterName, isChecked) {
  if (isChecked) {
    return filterName;
  } else {
    return null;
  }
}

function sortFilters(filters) {
  return [...filters].sort();
}

function validateFilterInput(input) {
  const trimmed = input.trim();
  return trimmed.length > 0;
}

function shouldClearActiveFilter(filterToRemove, currentActiveFilter) {
  return currentActiveFilter === filterToRemove;
}

// UI Controller
document.addEventListener('DOMContentLoaded', async function() {
  // DOM elements
  const filterView = document.getElementById('filterView');
  const addFilterView = document.getElementById('addFilterView');
  const addFilterBtn = document.getElementById('addFilterBtn');
  const backBtn = document.getElementById('backBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const filterInput = document.getElementById('filterInput');
  const filterList = document.getElementById('filterList');

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
      const isValid = validateFilterInput(newFilter);
      confirmBtn.disabled = !isValid;
    })
  }

  function loadFilters() {
    if (typeof FilterState === 'undefined') {
      // Fallback for development/testing
      PopupState.setFilters(['Family', 'Finance', 'Health', 'Personal', 'Shopping']);
      renderFilters();
      return;
    }

    // Load filters list
    FilterState.getFilters(function(filters) {
      PopupState.setFilters(filters);

      // Load active filter
      FilterState.getActiveFilter(function(activeFilter) {
        PopupState.setActiveFilter(activeFilter);
        renderFilters();
      });
    });
  }

  function saveFilters() {
    if (typeof FilterState === 'undefined') {
      return; // Silent fail in development
    }

    // Save filters list
    FilterState.setFilters(PopupState.getFilters());

    // Save active filter
    FilterState.setActiveFilter(PopupState.getActiveFilter());
  }

  function renderFilters() {
    filterList.innerHTML = '';

    const sortedFilters = sortFilters(PopupState.getFilters());

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
    checkbox.checked = PopupState.getActiveFilter() === filterName;
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

      const newActiveFilter = toggleActiveFilter(filterName, isChecked, PopupState.getActiveFilter());
      PopupState.setActiveFilter(newActiveFilter);
      applyFilter(filterName);
    } else {
      const newActiveFilter = toggleActiveFilter(filterName, isChecked, PopupState.getActiveFilter());
      PopupState.setActiveFilter(newActiveFilter);
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
    const newFilters = removeFilterFromList(filterName, PopupState.getFilters());
    PopupState.setFilters(newFilters);

    if (shouldClearActiveFilter(filterName, PopupState.getActiveFilter())) {
      PopupState.setActiveFilter(null);
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
    const updatedFilters = addFilter(newFilter, PopupState.getFilters());

    if (updatedFilters !== PopupState.getFilters()) {
      PopupState.setFilters(updatedFilters);
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
    console.log('hiding', !PopupState.getFilters().length);

    console.log('filters', PopupState.getFilters());
    filterList.classList.toggle('hidden', !PopupState.getFilters().length);
  }

  // Listen for storage changes to sync activeFilter from content script or other sources
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function(changes, areaName) {
      // React to activeFilter changes
      if (changes.activeFilter) {
        const newActiveFilter = changes.activeFilter.newValue;
        PopupState.setActiveFilter(newActiveFilter);

        // Update UI checkboxes to reflect the change
        const checkboxes = document.querySelectorAll('.filter-checkbox');
        checkboxes.forEach(cb => {
          const label = cb.nextElementSibling;
          if (label && label.textContent === newActiveFilter) {
            cb.checked = true;
          } else {
            cb.checked = false;
          }
        });
      }
    });
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PopupState,
    addFilter,
    removeFilterFromList,
    toggleActiveFilter,
    sortFilters,
    validateFilterInput,
    shouldClearActiveFilter
  };
}
