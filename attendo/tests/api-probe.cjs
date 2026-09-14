(async () => {
  const base = 'https://attendo-qnq7.vercel.app';
  for (const url of [base + '/api/ai/ask', base + '/', base + '/index.html']) {
    try {
      const res = await fetch(url);
      console.log('=== ' + url);
      console.log('status:', res.status);
      const hdrs = {};
      res.headers.forEach((v, k) => { hdrs[k] = v; });
      const relevant = Object.fromEntries(Object.entries(hdrs).filter(([k]) => /vercel|function|runtime|server|age|cache|content-type|x-/.test(k)));
      console.log(JSON.stringify(relevant, null, 1));
    } catch (e) { console.log(url, 'ERR', e.message); }
  }
})();
