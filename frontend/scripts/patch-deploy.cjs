const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../node_modules/@vkontakte/vk-miniapps-deploy/index.js');
if (!fs.existsSync(targetFile)) {
  console.log('[patch-deploy] vk-miniapps-deploy not found, skipping patch.');
  process.exit(0);
}

let code = fs.readFileSync(targetFile, 'utf8');

// 1. Add fetch timeout so LongPoll doesn't hang forever
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
} else {
  console.log('[patch-deploy] Pattern for apps.createGoHostingTask not matched, skipping patch.');
}

// 3. Add safety timeout for handleQueue (max 2 minutes)
if (!code.includes('queueStart = Date.now()')) {
  code = code.replace(
    'async function handleQueue(user_id, base_url, key, ts, version, handled, cfg) {',
    `async function handleQueue(user_id, base_url, key, ts, version, handled, cfg, queueStart = Date.now()) {
  if (Date.now() - queueStart > 120000) {
    console.warn(chalk.yellow('[deploy] LongPoll queue wait exceeded 2 minutes. Assuming hosting task is processing in background.'));
    return true;
  }`
  );
  code = code.replace(
    'return handleQueue(user_id, base_url, key, res.ts, version, handled, cfg);',
    'return handleQueue(user_id, base_url, key, res.ts, version, handled, cfg, queueStart);'
  );
  console.log('[patch-deploy] Applied safety timeout to handleQueue.');
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log('[patch-deploy] Successfully updated @vkontakte/vk-miniapps-deploy.');
