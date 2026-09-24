// Isolated headless Edge integration runner; no browser automation dependencies.
const { spawn } = require('node:child_process');
const { mkdtempSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = mkdtempSync(path.join(tmpdir(), 'table-json-test-'));
const executable = process.env.TABLE_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
  { windowsHide: true, stdio: 'ignore' });
browser.on('error', error => { console.error(error); process.exitCode = 1; });
let ws, send;
(async () => {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; break; } catch { await delay(100); }
  }
  if (!port) throw Error('Headless browser did not start');
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  let serial = 0; const pending = new Map();
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.id) { const call = pending.get(data.id); pending.delete(data.id); if (call) data.error ? call.reject(Error(data.error.message)) : call.resolve(data.result); }
    if (data.method === 'Runtime.exceptionThrown') console.error('Browser exception:', JSON.stringify(data.params.exceptionDetails));
  });
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: process.argv[2] || 'http://127.0.0.1:18766/tests/json-browser-check.html' });
  let last = '';
  for (let i = 0; i < 180; i++) {
    await delay(500);
    const { result } = await send('Runtime.evaluate', { expression: 'document.getElementById("result")?.textContent', returnByValue: true });
    const value = result.value || '';
    if (value !== last) { console.log(value); last = value; }
    if (i === 8 && !/^(PASS:|Успешно:)/.test(value)) {
      const diagnostic = await send('Runtime.evaluate', { expression: 'JSON.stringify({ready:document.readyState,childReady:document.querySelector("iframe")?.contentDocument?.readyState,appReady:typeof document.querySelector("iframe")?.contentWindow?.appReady,status:document.querySelector("iframe")?.contentDocument?.getElementById("status")?.textContent,run:typeof runChecks})', returnByValue: true });
      console.log('Diagnostic:', diagnostic.result.value);
    }
    if (/^(PASS:|Успешно:)/.test(value)) return;
    if (/^(FAIL|ОШИБКА)/.test(value)) throw Error(value);
  }
  throw Error('Browser check timed out');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  if (send && ws?.readyState === WebSocket.OPEN) { await send('Browser.close').catch(() => {}); ws.close(); }
  else browser.kill();
});
