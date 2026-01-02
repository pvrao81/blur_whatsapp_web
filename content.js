(function () {
  let blurEnabled = true;
  let hoveredRow = null;
  let currentPane = null;
  let observer = null;

  // --- Determine the currently visible pane ---
  function getActivePane() {
    const panes = [
      document.querySelector("#pane-side"),          // Chats
      document.querySelector(".statusList"),         // Status
      document.querySelector(".communityList"),      // Communities/Channels
    ];
    for (let pane of panes) {
      if (pane && pane.offsetParent !== null) return pane;
    }
    return null;
  }

  // --- Get rows/items for the active pane ---
  function getRows() {
    const pane = currentPane;
    if (!pane) return [];

    // Chats
    if (pane.id === "pane-side") {
      return pane.querySelectorAll('[role="row"]');
    }

    // Status
    if (pane.classList.contains("statusList")) {
      return pane.querySelectorAll('[data-focusid="status-row-item"]');
    }

    // Communities / Channels
    if (pane.classList.contains("communityList")) {
      return pane.querySelectorAll('.community-item'); // adjust based on inspection
    }

    return [];
  }

  // --- Check if row is active (selected) ---
  function isRowActive(row) {
    return row.querySelector('[aria-selected="true"]') !== null;
  }

  // --- Apply blur recursively to the visible content of each row ---
  function applyRowBlur() {
    const rows = getRows();
    if (!rows.length) return;

    rows.forEach(row => {
      let filterValue = "blur(0)";
      if (blurEnabled && row !== hoveredRow && !isRowActive(row)) {
        filterValue = "blur(8px)";
      }

      // Apply to all child divs to cover actual content
      row.querySelectorAll('*').forEach(el => {
        el.style.transition = "filter 0.25s ease";
        el.style.filter = filterValue;
      });
    });
  }

  // --- Attach hover listeners to row ---
  function attachHoverListeners(row) {
    if (row.__blurHoverAttached) return;
    row.__blurHoverAttached = true;

    row.addEventListener("mouseenter", () => {
      hoveredRow = row;
      applyRowBlur();
    });
    row.addEventListener("mouseleave", () => {
      hoveredRow = null;
      applyRowBlur();
    });
  }

  // --- Observe the active pane for dynamic content (virtualized rows) ---
  function observePane(pane) {
    if (observer) observer.disconnect();

    observer = new MutationObserver(() => {
      const rows = getRows();
      rows.forEach(attachHoverListeners);
      applyRowBlur();
    });

    observer.observe(pane, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  // --- Detect menu switch and reapply observer ---
  function checkPaneChange() {
    const pane = getActivePane();
    if (pane !== currentPane) {
      currentPane = pane;
      if (currentPane) observePane(currentPane);
      applyRowBlur();
    }
  }

  // --- Initialization ---
  function init() {
    currentPane = getActivePane();
    if (currentPane) observePane(currentPane);
    applyRowBlur();

    // Check for menu changes every 300ms
    setInterval(checkPaneChange, 300);
  }

  // --- Load blur toggle state ---
  chrome.storage.sync.get(["blurEnabled"], (result) => {
    blurEnabled = result.blurEnabled !== false;
    init();
  });

  // --- React to popup toggle changes ---
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.blurEnabled) {
      blurEnabled = changes.blurEnabled.newValue;
      applyRowBlur();
    }
  });
})();
