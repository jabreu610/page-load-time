var total = 0;

function set(id, start, end, noacc) {
  var length = Math.round(end - start);
  var x = Math.round(start / total * 300);
  document.getElementById(id + 'When').innerHTML = Math.round(start);
  document.getElementById(id).innerHTML = length;
  document.getElementById(id + 'Total').innerHTML = noacc ? '-' : Math.round(end);
  document.getElementById('r-' + id).style.cssText =
    'background-size:' + Math.round(length / total * 300) + 'px 100%;' +
    'background-position-x:' + (x >= 300 ? 299 : x) + 'px;';
}

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
  var tab = tabs[0];
  browser.storage.local.get(['cache', 'stat']).then(data => {
    var t = data.cache['tab' + tab.id];
    total = t.duration;

    if (data.stat[tab.url]) {
      let {sum, count, min, max, since} = data.stat[tab.url];
      let avg = Math.round(sum / count);
      document.getElementById('stat-since').innerHTML = `since ${new Date(since).toLocaleString()}`;
      document.getElementById('stat-count').innerHTML = count;
      document.getElementById('stat-total').innerHTML = sum;
      document.getElementById('stat-avg').innerHTML = avg;
      document.getElementById('stat-low').innerHTML = min;
      document.getElementById('stat-high').innerHTML = max;
    }

    document.getElementById('stat-reset').addEventListener('click', () => {
      delete data.stat[tab.url];
      browser.storage.local.set(data).then(() => {
        document.getElementById('stat-since').innerHTML = '';
        document.getElementById('stat-count').innerHTML = '';
        document.getElementById('stat-total').innerHTML = '';
        document.getElementById('stat-avg').innerHTML = '';
        document.getElementById('stat-low').innerHTML = '';
        document.getElementById('stat-high').innerHTML = '';
      });
    });

    document.getElementById("stat-copy").addEventListener("click", () => {
      // copy to clipboard
      if (navigator.clipboard) {
        let content = [
          `for ${tab.url}`,
          `since ${new Date(data.stat[tab.url].since).toLocaleString()}`,
          `*  ${data.stat[tab.url].count} requests`,
          `*  Total load time: ${formatDuration(data.stat[tab.url].sum)}`,
          `*  Average load time: ${formatDuration(data.stat[tab.url].sum / data.stat[tab.url].count)}`,
          `*  Shortest load time: ${formatDuration(data.stat[tab.url].min)}`,
          `*  Longest load time: ${formatDuration(data.stat[tab.url].max)}`,
        ].join('\n');
        const clipboardItem = new ClipboardItem({
          'text/plain': new Blob([content.trim()], {type: 'text/plain'})
        });
        navigator.clipboard.write([clipboardItem]);
      }
    });
    
    // https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.html#processing-model
    set('redirect', t.redirectStart, t.redirectEnd);
    set('dns', t.domainLookupStart, t.domainLookupEnd);
    set('connect', t.connectStart, t.connectEnd);
    set('request', t.requestStart, t.responseStart);
    set('response', t.responseStart, t.responseEnd);
    set('dom', t.responseEnd, t.domComplete);
    set('domParse', t.responseEnd, t.domInteractive);
    set('domScripts', t.domInteractive, t.domContentLoadedEventStart);
    set('contentLoaded', t.domContentLoadedEventStart, t.domContentLoadedEventEnd);
    set('domSubRes', t.domContentLoadedEventEnd, t.domComplete);
    set('load', t.loadEventStart, t.loadEventEnd);
    document.getElementById("total").innerHTML = Math.round(t.duration);
    document.getElementById("requestStart").innerHTML = new Date(t.start).toString();
  });
});