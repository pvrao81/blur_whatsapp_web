const toggle = document.getElementById("toggleBlur");

chrome.storage.sync.get(["blurEnabled"], (result) => {
  toggle.checked = result.blurEnabled !== false;
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({
    blurEnabled: toggle.checked
  });
});
