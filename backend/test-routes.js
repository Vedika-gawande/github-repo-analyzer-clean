const http = require('http');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          // If response is empty or not JSON, handle appropriately
          if (!body) {
             return reject(new Error(`Empty response with status ${res.statusCode}`));
          }
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || parsed.details || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse JSON response. Status: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('Starting route tests...\n');
  
  let passedCount = 0;
  let localPath = '';
  let repoName = '';
  
  // 1. POST /api/analyze
  console.log('Testing POST /api/analyze');
  try {
    const res1 = await makeRequest('/api/analyze', { repoUrl: "https://github.com/expressjs/express" });
    console.log('PASS');
    console.log(`- success: ${res1.success}`);
    console.log(`- repoName: ${res1.repoName}`);
    console.log(`- localPath: ${res1.localPath || 'undefined'}`);
    
    if (res1.localPath && res1.repoName) {
      localPath = res1.localPath;
      repoName = res1.repoName;
      passedCount++;
    } else {
      console.log('- error: Missing localPath or repoName in response');
    }
  } catch (err) {
    console.log('FAIL');
    console.log(`- error: ${err.message}`);
  }
  
  console.log('');

  if (!localPath || !repoName) {
    console.log(`${passedCount}/5 routes passing - failed early at /api/analyze`);
    return;
  }

  // 2. POST /api/structure
  console.log('Testing POST /api/structure');
  try {
    const res2 = await makeRequest('/api/structure', { localPath });
    console.log('PASS');
    console.log(`- success: ${res2.success}`);
    if (res2.structure) {
      console.log(`- structure array length: ${Array.isArray(res2.structure) ? res2.structure.length : typeof res2.structure}`);
    } else if (res2.files) {
      console.log(`- files array length: ${Array.isArray(res2.files) ? res2.files.length : 'unknown'}`);
    }
    passedCount++;
  } catch (err) {
    console.log('FAIL');
    console.log(`- error: ${err.message}`);
  }
  
  console.log('');

  // 3. POST /api/entrypoint
  console.log('Testing POST /api/entrypoint');
  try {
    const res3 = await makeRequest('/api/entrypoint', { localPath });
    console.log('PASS');
    console.log(`- success: ${res3.success}`);
    if (res3.entrypoints) {
      console.log(`- entrypoints array length: ${Array.isArray(res3.entrypoints) ? res3.entrypoints.length : 'unknown'}`);
    }
    passedCount++;
  } catch (err) {
    console.log('FAIL');
    console.log(`- error: ${err.message}`);
  }
  
  console.log('');

  // 4. POST /api/dependencies
  console.log('Testing POST /api/dependencies');
  try {
    const res4 = await makeRequest('/api/dependencies', { localPath });
    console.log('PASS');
    console.log(`- success: ${res4.success}`);
    if (res4.dependencies) {
      console.log(`- dependencies keys: ${Object.keys(res4.dependencies).length}`);
    } else if (res4.deps) {
      console.log(`- deps keys: ${Object.keys(res4.deps).length}`);
    }
    passedCount++;
  } catch (err) {
    console.log('FAIL');
    console.log(`- error: ${err.message}`);
  }
  
  console.log('');

  // 5. POST /api/summary
  console.log('Testing POST /api/summary');
  try {
    const res5 = await makeRequest('/api/summary', { localPath, repoName });
    console.log('PASS');
    console.log(`- success: ${res5.success}`);
    if (res5.summary) {
      console.log(`- summary: ${res5.summary.substring(0, 150)}...`);
    }
    if (res5.insights) {
      console.log(`- insights: ${Array.isArray(res5.insights) ? res5.insights.length : 'unknown'} returned`);
    }
    if (res5.techStack) {
      console.log(`- techStack: ${JSON.stringify(res5.techStack)}`);
    }
    passedCount++;
  } catch (err) {
    console.log('FAIL');
    console.log(`- error: ${err.message}`);
  }

  console.log('');

  // Final line
  if (passedCount === 5) {
    console.log('5/5 routes passing - AI layer complete, ready for frontend');
  } else {
    console.log(`${passedCount}/5 routes passing - needs fixing before AI layer`);
  }
}

runTests();
