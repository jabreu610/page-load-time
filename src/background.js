// Setting a toolbar badge text
browser.runtime.onMessage.addListener((request, sender) => {
  // This cache stores page load time for each tab, so they don't interfere
  browser.storage.local.get(['cache', 'stat']).then(data => {
    if (!data.cache) data.cache = {};
    if (!data.stat) data.stat = {};
    let duration = Math.round(request.timing.duration);
    if (data.stat[sender.url]) {
      let {sum, count, min, max, ...rest} = data.stat[sender.url];
      data.stat[sender.url] = {sum: sum + duration, count: count + 1, min: Math.min(min, duration), max: Math.max(max, duration), ...rest};
    } else {
      data.stat[sender.url] = {sum: duration, count: 1, min: duration, max: duration, since: Date.now()};
    }
    data.cache['tab' + sender.tab.id] = request.timing;
    browser.storage.local.set(data).then(() => {
      browser.browserAction.setBadgeText({text: request.time, tabId: sender.tab.id});
      browser.browserAction.setPopup({tabId: sender.tab.id, popup: "popup.html"})
    });
  });

});

// cache eviction
browser.tabs.onRemoved.addListener(tabId => {
  browser.storage.local.get('cache').then(data => {
    if (data.cache) delete data.cache['tab' + tabId];
    browser.storage.local.set(data);
  });
});
