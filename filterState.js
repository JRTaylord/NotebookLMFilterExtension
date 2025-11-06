// Shared state management for filter data
// Used by both popup.js and content.js to ensure consistency

// Todo: refactor this so 2 versions of this are not running at once to ensure that there is one source of truth. Or refactor it in a way that works with Chrome extensions better

const FilterState = {
  /**
   * Get the active filter from storage
   * @param {function} callback - Called with (activeFilter) where activeFilter is string or null
   */
  getActiveFilter(callback) {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      callback(null);
      return;
    }
    // Try sync storage first
    chrome.storage.sync.get(['activeFilter'], function (result) {
      if (chrome.runtime.lastError) {
        console.warn(
          'Failed to load activeFilter from sync storage, trying local:',
          chrome.runtime.lastError
        );

        // Fall back to local storage
        chrome.storage.local.get(['activeFilter'], function (localResult) {
          if (chrome.runtime.lastError) {
            console.error(
              'Failed to load activeFilter from local storage:',
              chrome.runtime.lastError
            );
            callback(null);
          } else {
            callback(localResult.activeFilter || null);
          }
        });
      } else {
        callback(result.activeFilter || null);
      }
    });
  },

  /**
   * Set the active filter in storage
   * @param {string|null} filter - The filter to set, or null to clear
   * @param {function} callback - Optional callback when complete
   */
  setActiveFilter(filter, callback) {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      if (callback) callback();
      return;
    }

    const data = { activeFilter: filter };

    // Save to sync storage first
    chrome.storage.sync.set(data, function () {
      if (chrome.runtime.lastError) {
        console.warn(
          'Failed to save activeFilter to sync storage:',
          chrome.runtime.lastError
        );
      }
    });

    // Also save to local storage as backup
    chrome.storage.local.set(data, function () {
      if (chrome.runtime.lastError) {
        console.error(
          'Failed to save activeFilter to local storage:',
          chrome.runtime.lastError
        );
      }
      if (callback) callback();
    });
  },

  /**
   * Clear the active filter from storage
   * @param {function} callback - Optional callback when complete
   */
  clearActiveFilter(callback) {
    this.setActiveFilter(null, callback);
  },

  /**
   * Get filters list from storage
   * @param {function} callback - Called with (filters) where filters is an array
   */
  getFilters(callback) {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      callback([]);
      return;
    }

    // Try sync storage first
    chrome.storage.sync.get(['filters'], function (result) {
      if (chrome.runtime.lastError) {
        console.warn(
          'Failed to load filters from sync storage, trying local:',
          chrome.runtime.lastError
        );

        // Fall back to local storage
        chrome.storage.local.get(['filters'], function (localResult) {
          if (chrome.runtime.lastError) {
            console.error(
              'Failed to load filters from local storage:',
              chrome.runtime.lastError
            );
            callback([]);
          } else {
            callback(localResult.filters || []);
          }
        });
      } else {
        callback(result.filters || []);
      }
    });
  },

  /**
   * Set the filters list in storage
   * @param {array} filters - The filters array to save
   * @param {function} callback - Optional callback when complete
   */
  setFilters(filters, callback) {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      if (callback) callback();
      return;
    }

    const data = { filters: filters };

    // Save to sync storage first
    chrome.storage.sync.set(data, function () {
      if (chrome.runtime.lastError) {
        console.warn(
          'Failed to save filters to sync storage:',
          chrome.runtime.lastError
        );
      }
    });

    // Also save to local storage as backup
    chrome.storage.local.set(data, function () {
      if (chrome.runtime.lastError) {
        console.error(
          'Failed to save filters to local storage:',
          chrome.runtime.lastError
        );
      }
      if (callback) callback();
    });
  },

  /**
   * Get the hideFeatured setting from storage
   * @param {function} callback - Called with (hideFeatured) where hideFeatured is boolean
   */
  getHideFeatured(callback) {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      callback(true);
      return;
    }

    // Try sync storage first
    chrome.storage.sync.get(['hideFeatured'], function (result) {
      if (chrome.runtime.lastError) {
        console.warn(
          'Failed to load hideFeatured from sync storage, trying local:',
          chrome.runtime.lastError
        );

        // Fall back to local storage
        chrome.storage.local.get(['hideFeatured'], function (localResult) {
          if (chrome.runtime.lastError) {
            console.error(
              'Failed to load hideFeatured from local storage:',
              chrome.runtime.lastError
            );
            callback(true);
          } else {
            callback(localResult.hideFeatured !== undefined ? localResult.hideFeatured : true);
          }
        });
      } else {
        callback(result.hideFeatured !== undefined ? result.hideFeatured : true);
      }
    });
  },

  /**
   * Set the hideFeatured setting in storage
   * @param {boolean} hideFeatured - Whether to hide featured notebooks
   * @param {function} callback - Optional callback when complete
   */
  setHideFeatured(hideFeatured, callback) {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      if (callback) callback();
      return;
    }

    const data = { hideFeatured: hideFeatured };

    // Save to sync storage first
    chrome.storage.sync.set(data, function () {
      if (chrome.runtime.lastError) {
        console.warn(
          'Failed to save hideFeatured to sync storage:',
          chrome.runtime.lastError
        );
      }
    });

    // Also save to local storage as backup
    chrome.storage.local.set(data, function () {
      if (chrome.runtime.lastError) {
        console.error(
          'Failed to save hideFeatured to local storage:',
          chrome.runtime.lastError
        );
      }
      if (callback) callback();
    });
  },
};
