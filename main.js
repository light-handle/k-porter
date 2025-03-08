const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const k8s = require('@kubernetes/client-node');
const fs = require('fs');
const yaml = require('js-yaml');
const Store = require('electron-store');
const https = require('https');
const { version } = require('./package.json');
const os = require('os');
const { execSync } = require('child_process');

// Initialize config store
const store = new Store();

let mainWindow;

// URL to check for latest version (replace with your actual repo)
const GITHUB_REPO_API = 'https://api.github.com/repos/yourusername/k-porter/releases/latest';

// Add a function to show a critical error dialog
function showCriticalError(title, message) {
  if (app.isReady()) {
    dialog.showErrorBox(title, message);
  } else {
    // If app is not ready yet, show error when it is
    app.on('ready', () => {
      dialog.showErrorBox(title, message);
    });
  }
  
  console.error(`${title}: ${message}`);
  
  // Log to a file that will persist
  const fs = require('fs');
  const logPath = path.join(os.homedir(), '.k-porter-error.log');
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${title}: ${message}\n`);
}

// Add more detailed debug information
const isDebug = process.argv.includes('--verbose');
if (isDebug) {
  console.log('Running in verbose mode');
  console.log('App location:', app.getAppPath());
  console.log('Process arguments:', process.argv);
  console.log('Process environment:', process.env);
}

// Ensure HOME environment variable is set for .kube/config access
if (!process.env.HOME) {
  process.env.HOME = os.homedir();
  if (isDebug) console.log('Set HOME to:', process.env.HOME);
}

// Add common binary paths to PATH if not already present
function ensurePathsInEnv() {
  const commonPaths = [
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
    path.join(os.homedir(), '.krew/bin'),
    path.join(os.homedir(), 'bin')
  ];
  
  let pathEnv = process.env.PATH || '';
  
  // Add each path if it's not already in PATH
  for (const binPath of commonPaths) {
    if (!pathEnv.split(':').includes(binPath)) {
      pathEnv = binPath + ':' + pathEnv;
    }
  }
  
  process.env.PATH = pathEnv;
  
  // Debug log for troubleshooting
  if (isDebug) {
    console.log('Using PATH:', process.env.PATH);
    console.log('HOME directory:', process.env.HOME);
  
    // Check if kubectl is available
    try {
      const kubectlVersion = execSync('which kubectl').toString().trim();
      console.log('kubectl found at:', kubectlVersion);
    } catch (error) {
      console.error('kubectl not found in PATH');
      showCriticalError(
        'kubectl Not Found', 
        'kubectl command was not found in your PATH. Please install kubectl and ensure it is accessible.'
      );
    }
  }
}

// Call this function early
ensurePathsInEnv();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  
  // Check for updates
  checkForUpdates();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// Simple update checker
function checkForUpdates() {
  // Skip update check if disabled in preferences
  if (store.get('disableUpdateCheck') === true) return;
  
  // Only check once per day
  const lastCheck = store.get('lastUpdateCheck');
  const now = Date.now();
  
  if (lastCheck && (now - lastCheck < 24 * 60 * 60 * 1000)) {
    return;
  }
  
  // Update last check time
  store.set('lastUpdateCheck', now);
  
  const request = https.get(GITHUB_REPO_API, {
    headers: { 'User-Agent': 'K-Porter/' + version }
  }, (response) => {
    if (response.statusCode !== 200) {
      return;
    }
    
    let data = '';
    
    response.on('data', (chunk) => {
      data += chunk;
    });
    
    response.on('end', () => {
      try {
        const release = JSON.parse(data);
        const latestVersion = release.tag_name.replace('v', '');
        
        // Compare versions (simple string comparison)
        if (latestVersion > version) {
          // Notify user about the update
          mainWindow.webContents.send('update-available', {
            version: latestVersion,
            url: release.html_url,
            releaseNotes: release.body
          });
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    });
  });
  
  request.on('error', (error) => {
    console.error('Error checking for updates:', error);
  });
  
  request.end();
}

// Handle opening release URL
ipcMain.handle('open-release-url', (event, url) => {
  shell.openExternal(url);
  return true;
});

// Toggle update check
ipcMain.handle('toggle-update-check', (event, disable) => {
  store.set('disableUpdateCheck', disable);
  return true;
});

// Get current settings
ipcMain.handle('get-settings', () => {
  return {
    disableUpdateCheck: store.get('disableUpdateCheck') || false
  };
});

// Get kubeconfig file path
function getKubeConfigPath() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const configPath = process.env.KUBECONFIG || path.join(homeDir, '.kube', 'config');
  return configPath;
}

// Get kubectl command based on platform
function getKubectlCommand() {
  return process.platform === 'win32' ? 'kubectl.exe' : 'kubectl';
}

// IPC handler for getting all clusters
ipcMain.handle('get-clusters', async () => {
  try {
    const configPath = getKubeConfigPath();
    
    // Check if file exists first
    if (!fs.existsSync(configPath)) {
      return {
        error: `Kubeconfig file not found at ${configPath}. Make sure kubectl is properly configured.`
      };
    }
    
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configFile);
    
    return {
      clusters: config.clusters || [],
      contexts: config.contexts || [],
      currentContext: config['current-context'] || ''
    };
  } catch (error) {
    console.error('Error loading kubeconfig:', error);
    return { error: error.message };
  }
});

// Add a helper to check if kubeconfig is available
function checkKubeConfig() {
  const fs = require('fs');
  const homeDir = os.homedir();
  const defaultKubeConfigPath = path.join(homeDir, '.kube', 'config');
  
  let kubeConfigPath = process.env.KUBECONFIG || defaultKubeConfigPath;
  
  if (isDebug) console.log('Looking for kubeconfig at:', kubeConfigPath);
  
  if (!fs.existsSync(kubeConfigPath)) {
    if (isDebug) console.error('kubeconfig file not found at:', kubeConfigPath);
    
    showCriticalError(
      'Kubernetes Configuration Not Found',
      `Could not find a kubeconfig file at ${kubeConfigPath}. Please ensure your Kubernetes configuration is set up correctly.`
    );
    
    return false;
  }
  
  if (isDebug) console.log('kubeconfig file found at:', kubeConfigPath);
  return true;
}

// IPC handler for getting namespaces
ipcMain.handle('get-namespaces', async (event, context) => {
  try {
    console.log('Getting namespaces for context:', context);
    
    // Check if kubeconfig exists before proceeding
    if (!checkKubeConfig()) {
      return { error: 'Kubernetes configuration file not found. Please ensure your kubeconfig is set up correctly.' };
    }
    
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    
    // Log available contexts for debugging
    console.log('Available contexts:', kc.getContexts().map(c => c.name));
    
    if (context) {
      console.log('Setting current context to:', context);
      kc.setCurrentContext(context);
    }
    
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    console.log('Requesting namespaces...');
    
    const res = await k8sApi.listNamespace();
    
    if (!res || !res.body || !res.body.items) {
      console.error('Invalid response from Kubernetes API:', res);
      return { error: 'Invalid response from Kubernetes API' };
    }
    
    const namespaces = res.body.items.map(ns => ns.metadata.name);
    console.log(`Found ${namespaces.length} namespaces`);
    return namespaces;
  } catch (error) {
    console.error('Error getting namespaces:', error);
    return { error: error.message || 'Unknown error fetching namespaces' };
  }
});

// IPC handler for getting services
ipcMain.handle('get-services', async (event, { context, namespace }) => {
  try {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    
    if (context) {
      kc.setCurrentContext(context);
    }
    
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    const res = await k8sApi.listNamespacedService(namespace);
    return res.body.items.map(svc => ({
      name: svc.metadata.name,
      namespace: svc.metadata.namespace,
      ports: svc.spec.ports,
      clusterIP: svc.spec.clusterIP,
      type: svc.spec.type
    }));
  } catch (error) {
    console.error('Error getting services:', error);
    return { error: error.message };
  }
});

// Active port-forwards
const activePortForwards = new Map();

// Helper function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false);
      }
      server.close();
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is not in use
    });
    
    server.listen(port, '127.0.0.1');
  });
}

// IPC handler for starting port-forward
ipcMain.handle('start-port-forward', async (event, { context, namespace, service, localPort, remotePort }) => {
  try {
    const forwardKey = `${context}-${namespace}-${service}-${localPort}-${remotePort}`;
    
    // Check if already forwarding
    if (activePortForwards.has(forwardKey)) {
      return { 
        success: false, 
        message: 'Port-forward already active for this service and ports' 
      };
    }
    
    // Check if port is already in use
    const portInUse = await isPortInUse(localPort);
    if (portInUse) {
      return {
        success: false,
        message: `Local port ${localPort} is already in use. Please choose a different port.`
      };
    }
    
    // Set current context if provided
    if (context) {
      const kubectlCmd = getKubectlCommand();
      const setContextProcess = spawn(kubectlCmd, ['config', 'use-context', context]);
      
      await new Promise((resolve, reject) => {
        setContextProcess.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Failed to set context with exit code ${code}`));
        });
      });
    }

    // Start port-forward with appropriate kubectl command
    const kubectlCmd = getKubectlCommand();
    const portForwardProcess = spawn(kubectlCmd, [
      'port-forward',
      `service/${service}`,
      `${localPort}:${remotePort}`,
      '-n',
      namespace
    ]);

    let stderr = '';
    let stdout = '';
    let connectionEstablished = false;
    let errorDetected = false;
    let errorMessage = '';

    portForwardProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      
      // Check for success message in kubectl output
      if (output.includes('Forwarding from') && output.includes(`${localPort} -> ${remotePort}`)) {
        connectionEstablished = true;
      }
      
      mainWindow.webContents.send('port-forward-output', { 
        key: forwardKey, 
        data: output,
        type: 'stdout'
      });
    });

    portForwardProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      
      // Check for specific error messages
      if (output.includes('unable to forward') || 
          output.includes('error forwarding') ||
          output.includes('connection refused')) {
        errorDetected = true;
        errorMessage = output.trim();
      }
      
      mainWindow.webContents.send('port-forward-output', { 
        key: forwardKey, 
        data: output,
        type: 'stderr'
      });
    });

    portForwardProcess.on('close', (code) => {
      activePortForwards.delete(forwardKey);
      mainWindow.webContents.send('port-forward-closed', { 
        key: forwardKey, 
        code 
      });
    });

    // Wait for port-forward to establish
    let attempts = 0;
    const maxAttempts = 10;
    
    // Wait for up to 5 seconds (10 attempts, 500ms each) for the port-forward to establish
    while (!connectionEstablished && !errorDetected && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
      
      // If the process has exited, break out of the loop
      if (portForwardProcess.exitCode !== null) {
        break;
      }
      
      // Check if we can connect to the port
      const portActive = await isPortInUse(localPort);
      if (portActive) {
        connectionEstablished = true;
      }
    }

    // Check if the process is still running and if we established a connection
    if (portForwardProcess.exitCode !== null) {
      return { 
        success: false, 
        message: `Port-forward failed: ${stderr || 'Process exited unexpectedly'}` 
      };
    }
    
    if (errorDetected) {
      portForwardProcess.kill();
      return {
        success: false,
        message: `Port-forward error: ${errorMessage || stderr}`
      };
    }
    
    if (!connectionEstablished) {
      portForwardProcess.kill();
      return {
        success: false,
        message: 'Port-forward could not be established within the timeout period. Check your connection to the cluster.'
      };
    }

    // Store the process
    activePortForwards.set(forwardKey, {
      process: portForwardProcess,
      context,
      namespace,
      service,
      localPort,
      remotePort
    });

    return { 
      success: true, 
      key: forwardKey,
      message: `Port-forward successfully established: localhost:${localPort} -> ${service}:${remotePort}`
    };
  } catch (error) {
    console.error('Error starting port-forward:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
});

// IPC handler for stopping port-forward
ipcMain.handle('stop-port-forward', async (event, { key }) => {
  try {
    const portForward = activePortForwards.get(key);
    
    if (!portForward) {
      return { 
        success: false, 
        message: 'Port-forward not found' 
      };
    }
    
    // Kill process in a platform-specific way
    if (process.platform === 'win32') {
      // On Windows we need to be more forceful sometimes
      try {
        // First try graceful exit
        portForward.process.kill();
        
        // Check if the process is still running after a short delay
        setTimeout(() => {
          if (portForward.process.exitCode === null) {
            // If still running, try a more forceful approach with taskkill
            const pid = portForward.process.pid;
            spawn('taskkill', ['/F', '/PID', pid.toString()]);
          }
        }, 500);
      } catch (err) {
        console.error('Error killing Windows process:', err);
      }
    } else {
      // macOS and Linux - standard kill is sufficient
      portForward.process.kill();
    }
    
    activePortForwards.delete(key);
    
    return { 
      success: true, 
      message: 'Port-forward stopped' 
    };
  } catch (error) {
    console.error('Error stopping port-forward:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
});

// Get all active port-forwards
ipcMain.handle('get-active-port-forwards', () => {
  const forwards = [];
  
  for (const [key, value] of activePortForwards.entries()) {
    forwards.push({
      key,
      context: value.context,
      namespace: value.namespace,
      service: value.service,
      localPort: value.localPort,
      remotePort: value.remotePort
    });
  }
  
  return forwards;
}); 