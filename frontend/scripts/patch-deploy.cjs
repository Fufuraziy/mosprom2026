const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../node_modules/@vkontakte/vk-miniapps-deploy/index.js');
if (!fs.existsSync(targetFile)) {
  console.log('[patch-deploy] vk-miniapps-deploy not found, skipping patch.');
  process.exit(0);
}

let code = fs.readFileSync(targetFile, 'utf8');

// 1. Add fetch timeout (30s) so individual requests never hang on dropped sockets
if (!code.includes('timeout: 30000')) {
  code = code.replace(
    'const fetchOptions = { ...options, agent: getProxyAgent() || options?.agent };',
    'const fetchOptions = { timeout: 30000, ...options, agent: getProxyAgent() || options?.agent };'
  );
}

// 2. Add delay & retry for apps.createGoHostingTask
const oldTaskCreation = `    const uploadResponse = await upload(uploadURL, bundleFile);
    const taskData = await api('apps.createGoHostingTask', {
      ...params,
      upload_response: Buffer.from(JSON.stringify(uploadResponse)).toString('base64'),
    });`;

const newTaskCreation = `    const uploadResponse = await upload(uploadURL, bundleFile);
    console.log('[deploy] Upload completed. Response:', JSON.stringify(uploadResponse));
    console.log('[deploy] Waiting 3s for VK storage replication...');
    await delay(3000);

    let taskData;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        console.log(\`[deploy] Creating hosting task (attempt \${attempt}/4)...\`);
        taskData = await api('apps.createGoHostingTask', {
          ...params,
          upload_response: Buffer.from(JSON.stringify(uploadResponse)).toString('base64'),
        });
        if (taskData && taskData.version) {
          console.log('[deploy] apps.createGoHostingTask response:', JSON.stringify(taskData));
          break;
        }
      } catch (err) {
        console.warn(\`[deploy] apps.createGoHostingTask attempt \${attempt}/4 failed: \${err.message}\`);
        if (attempt === 4) throw err;
        console.log('[deploy] Retrying createGoHostingTask in 5s...');
        await delay(5000);
      }
    }`;

if (code.includes(oldTaskCreation)) {
  code = code.replace(oldTaskCreation, newTaskCreation);
  console.log('[patch-deploy] Applied delay & retry patch to apps.createGoHostingTask.');
}

// 3. Add verbose logging and 4-minute timeout to handleQueue
if (!code.includes('queuePollCount')) {
  const oldQueueHeader = 'async function handleQueue(user_id, base_url, key, ts, version, handled, cfg) {';
  const newQueueHeader = `async function handleQueue(user_id, base_url, key, ts, version, handled, cfg, queueStart = Date.now(), queuePollCount = 0) {
  queuePollCount++;
  if (Date.now() - queueStart > 240000) {
    throw new Error('[deploy] Queue wait timed out after 4 minutes without completion events.');
  }`;
  
  if (code.includes(oldQueueHeader)) {
    code = code.replace(oldQueueHeader, newQueueHeader);
  }

  // Log every poll result
  const oldResQuery = `  const query = await fetch(url);
  const res = await query.json();`;
  const newResQuery = `  console.log(\`[queue poll #\${queuePollCount}] URL: \${url}\`);
  const query = await fetch(url);
  const res = await query.json();
  console.log(\`[queue poll #\${queuePollCount} response]\`, JSON.stringify(res));`;

  if (code.includes(oldResQuery)) {
    code = code.replace(oldResQuery, newResQuery);
  }

  // Forward recursion args
  code = code.replace(
    'return handleQueue(user_id, base_url, key, res.ts, version, handled, cfg);',
    'return handleQueue(user_id, base_url, key, res.ts || ts, version, handled, cfg, queueStart, queuePollCount);'
  );

  console.log('[patch-deploy] Applied verbose logging & timeout to handleQueue.');
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log('[patch-deploy] Successfully updated @vkontakte/vk-miniapps-deploy.');
