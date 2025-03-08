// Import Electron IPC for communication with main process
const { ipcRenderer } = require('electron');

// DOM Elements
const clusterList = document.getElementById('clusterList');
const namespaceList = document.getElementById('namespaceList');
const serviceList = document.getElementById('serviceList');
const activeForwardsList = document.getElementById('activeForwardsList');
const refreshBtn = document.getElementById('refreshBtn');
const notifications = document.getElementById('notifications');
const portForwardModal = document.getElementById('portForwardModal');
const portForwardForm = document.getElementById('portForwardForm');
const modalCloseBtn = document.querySelector('.modal .close');
const cancelPortForwardBtn = document.getElementById('cancelPortForward');
const localPortInput = document.getElementById('localPort');
const remotePortSelect = document.getElementById('remotePort');
const modalContextInput = document.getElementById('modalContext');
const modalNamespaceInput = document.getElementById('modalNamespace');
const modalServiceInput = document.getElementById('modalService');
const themeToggle = document.getElementById('themeToggle');

// App State
let currentContext = '';
let currentNamespace = '';
let clusters = [];
let namespaces = [];
let services = [];
let activeForwards = [];
let currentServicePorts = [];
let currentTheme = localStorage.getItem('theme') || 'light';

// Initialize the app
async function initApp() {
  // Set initial theme
  setTheme(currentTheme);
  
  await loadClusters();
  loadActiveForwards();
  
  // Set up event listeners
  refreshBtn.addEventListener('click', refreshAll);
  modalCloseBtn.addEventListener('click', closeModal);
  cancelPortForwardBtn.addEventListener('click', closeModal);
  portForwardForm.addEventListener('submit', handlePortForwardSubmit);
  themeToggle.addEventListener('click', toggleTheme);
  
  // Set up IPC listeners for events from main process
  ipcRenderer.on('port-forward-output', handlePortForwardOutput);
  ipcRenderer.on('port-forward-closed', handlePortForwardClosed);
  ipcRenderer.on('update-available', (event, updateInfo) => {
    showUpdateNotification(updateInfo);
  });
}

// Load clusters from kubeconfig
async function loadClusters() {
  try {
    clusterList.innerHTML = '<div class="loading">Loading clusters...</div>';
    
    const result = await ipcRenderer.invoke('get-clusters');
    
    if (result.error) {
      clusterList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
      showNotification('Error Loading Clusters', result.error, 'error');
      return;
    }
    
    clusters = result.contexts || [];
    
    if (clusters.length === 0) {
      clusterList.innerHTML = '<div class="empty-message">No clusters found in kubeconfig</div>';
      return;
    }
    
    // Get current context
    const currentContextName = result.currentContext;
    
    // Render cluster list
    clusterList.innerHTML = '';
    clusters.forEach(context => {
      const isSelected = context.name === currentContextName;
      const clusterItem = document.createElement('div');
      clusterItem.className = `list-item${isSelected ? ' selected' : ''}`;
      clusterItem.dataset.context = context.name;
      clusterItem.innerHTML = `
        <div class="cluster-name">${context.name}</div>
        ${isSelected ? '<div class="current-marker"><i class="fas fa-check"></i></div>' : ''}
      `;
      
      clusterItem.addEventListener('click', () => selectCluster(context.name));
      clusterList.appendChild(clusterItem);
      
      if (isSelected) {
        currentContext = context.name;
        loadNamespaces(context.name);
      }
    });
  } catch (error) {
    console.error('Error loading clusters:', error);
    clusterList.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    showNotification('Error Loading Clusters', error.message, 'error');
  }
}

// Load namespaces for a cluster
async function loadNamespaces(context) {
  try {
    namespaceList.innerHTML = '<div class="loading">Loading namespaces...</div>';
    serviceList.innerHTML = '<div class="loading">Select a namespace first</div>';
    
    const namespaceResult = await ipcRenderer.invoke('get-namespaces', context);
    
    // Improved error handling
    if (namespaceResult && namespaceResult.error) {
      namespaceList.innerHTML = `<div class="error">Error: ${namespaceResult.error}</div>`;
      showNotification('Error Loading Namespaces', namespaceResult.error, 'error');
      return;
    }
    
    // Make sure namespaces is an array
    namespaces = Array.isArray(namespaceResult) ? namespaceResult : [];
    
    if (namespaces.length === 0) {
      namespaceList.innerHTML = '<div class="error">No namespaces found. Check your cluster connection.</div>';
      return;
    }
    
    // Render namespace list
    namespaceList.innerHTML = '';
    namespaces.forEach(namespace => {
      const namespaceItem = document.createElement('div');
      namespaceItem.className = 'list-item';
      namespaceItem.dataset.namespace = namespace;
      namespaceItem.textContent = namespace;
      
      namespaceItem.addEventListener('click', () => selectNamespace(namespace));
      namespaceList.appendChild(namespaceItem);
    });
  } catch (error) {
    console.error('Error loading namespaces:', error);
    namespaceList.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    showNotification('Error Loading Namespaces', error.message, 'error');
  }
}

// Load services for a namespace
async function loadServices(namespace) {
  try {
    // Show skeleton loading UI instead of spinner
    serviceList.innerHTML = `
      <div class="loading">
        <div class="services-skeleton-item">
          <div class="skeleton-header">
            <div class="skeleton-title"></div>
            <div class="skeleton-button"></div>
          </div>
          <div class="skeleton-detail"></div>
          <div class="skeleton-detail"></div>
          <div class="skeleton-ports">
            <div class="skeleton-port"></div>
            <div class="skeleton-port"></div>
          </div>
        </div>
        <div class="services-skeleton-item">
          <div class="skeleton-header">
            <div class="skeleton-title"></div>
            <div class="skeleton-button"></div>
          </div>
          <div class="skeleton-detail"></div>
          <div class="skeleton-detail"></div>
          <div class="skeleton-ports">
            <div class="skeleton-port"></div>
            <div class="skeleton-port"></div>
            <div class="skeleton-port"></div>
          </div>
        </div>
      </div>
    `;
    
    const servicesResult = await ipcRenderer.invoke('get-services', {
      context: currentContext,
      namespace
    });
    
    if (servicesResult.error) {
      serviceList.innerHTML = `<div class="error">Error: ${servicesResult.error}</div>`;
      showNotification('Error Loading Services', servicesResult.error, 'error');
      return;
    }
    
    services = servicesResult || [];
    
    if (services.length === 0) {
      serviceList.innerHTML = '<div class="empty-message">No services found in this namespace</div>';
      return;
    }
    
    // Render service list
    serviceList.innerHTML = '';
    services.forEach(service => {
      const serviceItem = document.createElement('div');
      serviceItem.className = 'service-item';
      
      // Create port tags
      const portTags = (service.ports || []).map(port => {
        return `<div class="port-tag">${port.port}${port.name ? ` (${port.name})` : ''}</div>`;
      }).join('');
      
      serviceItem.innerHTML = `
        <div class="service-header">
          <div class="service-name">${service.name}</div>
          <button class="button primary port-forward-btn" data-service="${service.name}">
            <i class="fas fa-plug"></i> Port Forward
          </button>
        </div>
        <div class="service-details">
          <div>Type: ${service.type}</div>
          <div>Cluster IP: ${service.clusterIP}</div>
          <div class="port-details">Ports: ${portTags}</div>
        </div>
      `;
      
      serviceList.appendChild(serviceItem);
      
      // Add event listener to port forward button
      const portForwardBtn = serviceItem.querySelector('.port-forward-btn');
      portForwardBtn.addEventListener('click', () => showPortForwardModal(service));
    });
  } catch (error) {
    console.error('Error loading services:', error);
    serviceList.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    showNotification('Error Loading Services', error.message, 'error');
  }
}

// Load active port forwards
async function loadActiveForwards() {
  try {
    const result = await ipcRenderer.invoke('get-active-port-forwards');
    activeForwards = result || [];
    
    renderActiveForwards();
  } catch (error) {
    console.error('Error loading active port forwards:', error);
    showNotification('Error Loading Port Forwards', error.message, 'error');
  }
}

// Render active port forwards
function renderActiveForwards() {
  if (activeForwards.length === 0) {
    activeForwardsList.innerHTML = '<div class="empty-message">No active port forwards</div>';
    return;
  }
  
  activeForwardsList.innerHTML = '';
  
  activeForwards.forEach(forward => {
    const forwardItem = document.createElement('div');
    forwardItem.className = 'forward-item';
    
    // Test if the connection is active by checking if we can connect to the port
    testConnection(forward.localPort).then(isConnected => {
      const statusClass = isConnected ? 'connection-active' : 'connection-inactive';
      const statusText = isConnected ? 'Active' : 'Inactive';
      const statusIcon = isConnected ? 'check-circle' : 'exclamation-triangle';
      
      forwardItem.innerHTML = `
        <div class="forward-details">
          <div class="forward-service">${forward.service}</div>
          <div class="forward-ports">localhost:${forward.localPort} → ${forward.service}:${forward.remotePort}</div>
          <div class="forward-context">${forward.context} / ${forward.namespace}</div>
        </div>
        <div class="forward-status ${statusClass}">
          <i class="fas fa-${statusIcon}"></i> ${statusText}
        </div>
        <div class="forward-actions">
          <button class="button secondary open-browser-btn" data-port="${forward.localPort}" title="Open in browser">
            <i class="fas fa-external-link-alt"></i>
          </button>
          <button class="button secondary copy-url-btn" data-port="${forward.localPort}" title="Copy URL">
            <i class="fas fa-copy"></i>
          </button>
          <button class="button danger stop-forward-btn" data-key="${forward.key}" title="Stop port forward">
            <i class="fas fa-stop"></i> Stop
          </button>
        </div>
      `;
      
      // Add event listeners
      const openBrowserBtn = forwardItem.querySelector('.open-browser-btn');
      const copyUrlBtn = forwardItem.querySelector('.copy-url-btn');
      const stopForwardBtn = forwardItem.querySelector('.stop-forward-btn');
      
      openBrowserBtn.addEventListener('click', () => {
        if (!isConnected) {
          showNotification('Connection Issue', 'The port forward appears to be inactive. The browser may not be able to connect.', 'warning');
        }
        // Open browser to localhost with the port
        window.open(`http://localhost:${forward.localPort}`);
      });
      
      copyUrlBtn.addEventListener('click', () => {
        // Copy URL to clipboard
        copyToClipboard(`http://localhost:${forward.localPort}`);
        showNotification('URL Copied', `http://localhost:${forward.localPort} copied to clipboard`, 'success');
      });
      
      stopForwardBtn.addEventListener('click', () => stopPortForward(forward.key));
    });
    
    activeForwardsList.appendChild(forwardItem);
  });
}

// Test if a connection to localhost:port is possible
async function testConnection(port) {
  return new Promise((resolve) => {
    // We use fetch with a short timeout to test the connection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout
    
    fetch(`http://localhost:${port}`, { 
      method: 'HEAD',
      signal: controller.signal
    })
    .then(response => {
      clearTimeout(timeoutId);
      resolve(true); // Connection successful
    })
    .catch(error => {
      clearTimeout(timeoutId);
      resolve(false); // Connection failed
    });
  });
}

// Copy text to clipboard
function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed'; // Avoid scrolling to bottom
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  
  document.body.removeChild(textarea);
}

// Select a cluster
function selectCluster(context) {
  // Update UI
  const clusterItems = clusterList.querySelectorAll('.list-item');
  clusterItems.forEach(item => {
    // Update selected class
    if (item.dataset.context === context) {
      item.classList.add('selected');
      // Add check mark if not already present
      if (!item.querySelector('.current-marker')) {
        const clusterName = item.querySelector('.cluster-name');
        const currentMarker = document.createElement('div');
        currentMarker.className = 'current-marker';
        currentMarker.innerHTML = '<i class="fas fa-check"></i>';
        item.appendChild(currentMarker);
      }
    } else {
      item.classList.remove('selected');
      // Remove check mark if present
      const marker = item.querySelector('.current-marker');
      if (marker) {
        marker.remove();
      }
    }
  });
  
  currentContext = context;
  currentNamespace = '';
  
  loadNamespaces(context);
}

// Select a namespace
function selectNamespace(namespace) {
  // Update UI
  const namespaceItems = namespaceList.querySelectorAll('.list-item');
  namespaceItems.forEach(item => {
    if (item.dataset.namespace === namespace) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
  
  currentNamespace = namespace;
  
  loadServices(namespace);
}

// Show the port forward modal
function showPortForwardModal(service) {
  modalContextInput.value = currentContext;
  modalNamespaceInput.value = currentNamespace;
  modalServiceInput.value = service.name;
  
  // Populate remote port select
  remotePortSelect.innerHTML = '';
  currentServicePorts = service.ports || [];
  
  if (currentServicePorts.length === 0) {
    remotePortSelect.innerHTML = '<option>No ports available</option>';
    return;
  }
  
  currentServicePorts.forEach(port => {
    const option = document.createElement('option');
    option.value = port.port;
    option.textContent = `${port.port}${port.name ? ` (${port.name})` : ''}`;
    remotePortSelect.appendChild(option);
  });
  
  // Set default local port to match the first remote port
  if (currentServicePorts.length > 0) {
    localPortInput.value = currentServicePorts[0].port;
  }
  
  // Show the modal
  portForwardModal.style.display = 'block';
}

// Close the port forward modal
function closeModal() {
  portForwardModal.style.display = 'none';
}

// Handle port forward form submission
async function handlePortForwardSubmit(event) {
  event.preventDefault();
  
  const context = modalContextInput.value;
  const namespace = modalNamespaceInput.value;
  const service = modalServiceInput.value;
  const localPort = parseInt(localPortInput.value, 10);
  const remotePort = parseInt(remotePortSelect.value, 10);
  
  // Validate input
  if (!localPort || localPort < 1 || localPort > 65535) {
    showNotification('Invalid Port', 'Please enter a valid local port number (1-65535)', 'error');
    return;
  }
  
  // Close modal
  closeModal();
  
  // Show pending notification
  const notificationId = `port-forward-${Date.now()}`;
  showPendingNotification('Starting Port Forward', `Attempting to connect localhost:${localPort} to ${service}:${remotePort}...`, notificationId);
  
  try {
    const result = await ipcRenderer.invoke('start-port-forward', {
      context,
      namespace,
      service,
      localPort,
      remotePort
    });
    
    // Remove the pending notification
    removePendingNotification(notificationId);
    
    if (result.success) {
      showNotification('Port Forward Started', result.message, 'success');
      
      // Add option to quickly test connection
      // For web services (port 80, 443, 8080, etc)
      const commonWebPorts = [80, 443, 3000, 8000, 8080, 8443];
      if (commonWebPorts.includes(remotePort)) {
        // Create a clickable notification to open browser
        showClickableNotification(
          'Test Connection',
          `Click here to open http://localhost:${localPort} in your browser`,
          'info',
          () => { window.open(`http://localhost:${localPort}`); }
        );
      }
      
      loadActiveForwards();
    } else {
      console.error('Port forwarding failed:', result.message);
      showNotification('Port Forward Failed', result.message, 'error');
      
      // Provide specific guidance based on error
      if (result.message.includes('already in use')) {
        showNotification('Port Conflict', `Try a different local port than ${localPort}`, 'info');
      } else if (result.message.includes('connection refused') || result.message.includes('unable to forward')) {
        showNotification('Connection Issue', 'The service might not be accepting connections on this port. Check if the service is running properly.', 'info');
      }
    }
  } catch (error) {
    // Remove the pending notification
    removePendingNotification(notificationId);
    
    console.error('Error starting port forward:', error);
    showNotification('Port Forward Error', error.message, 'error');
  }
}

// Stop a port forward
async function stopPortForward(key) {
  try {
    // Show pending notification
    const notificationId = `stop-forward-${Date.now()}`;
    showPendingNotification('Stopping Port Forward', 'Terminating connection...', notificationId);
    
    const result = await ipcRenderer.invoke('stop-port-forward', { key });
    
    // Remove the pending notification
    removePendingNotification(notificationId);
    
    if (result.success) {
      showNotification('Port Forward Stopped', result.message, 'success');
      loadActiveForwards();
    } else {
      showNotification('Error Stopping Port Forward', result.message, 'error');
    }
  } catch (error) {
    console.error('Error stopping port forward:', error);
    showNotification('Error Stopping Port Forward', error.message, 'error');
  }
}

// Handle port forward output from main process
function handlePortForwardOutput(event, data) {
  // Could add a console/log view in the UI to show this output
  console.log('Port forward output:', data);
}

// Handle port forward closed from main process
function handlePortForwardClosed(event, data) {
  console.log('Port forward closed:', data);
  loadActiveForwards();
  
  if (data.code !== 0) {
    showNotification('Port Forward Closed', `The port forward stopped with code ${data.code}`, 'error');
  }
}

// Refresh all data
async function refreshAll() {
  await loadClusters();
  if (currentContext) {
    await loadNamespaces(currentContext);
    if (currentNamespace) {
      await loadServices(currentNamespace);
    }
  }
  await loadActiveForwards();
  
  showNotification('Refreshed', 'All data has been refreshed', 'info');
}

// Show a notification
function showNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.id = `notification-${Date.now()}`;
  
  let icon;
  switch (type) {
    case 'success':
      icon = 'check-circle';
      break;
    case 'error':
      icon = 'exclamation-circle';
      break;
    default:
      icon = 'info-circle';
  }
  
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <div class="notification-close">
      <i class="fas fa-times"></i>
    </div>
  `;
  
  notifications.appendChild(notification);
  
  // Add event listener to close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Show a notification with a pending/loading state
function showPendingNotification(title, message, id) {
  const notification = document.createElement('div');
  notification.className = 'notification notification-info';
  notification.id = id;
  
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
  `;
  
  notifications.appendChild(notification);
  return notification;
}

// Remove a pending notification by ID
function removePendingNotification(id) {
  const notification = document.getElementById(id);
  if (notification) {
    notification.remove();
  }
}

// Show a clickable notification
function showClickableNotification(title, message, type, onClick) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.id = `notification-clickable-${Date.now()}`;
  notification.style.cursor = 'pointer';
  
  let icon;
  switch (type) {
    case 'success':
      icon = 'check-circle';
      break;
    case 'error':
      icon = 'exclamation-circle';
      break;
    default:
      icon = 'info-circle';
  }
  
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <div class="notification-close">
      <i class="fas fa-times"></i>
    </div>
  `;
  
  notification.addEventListener('click', (event) => {
    // Don't trigger the click if the close button was clicked
    if (!event.target.closest('.notification-close')) {
      onClick();
      notification.remove();
    }
  });
  
  // Add event listener to close button
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    notification.remove();
  });
  
  notifications.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Theme handling functions
function setTheme(theme) {
  currentTheme = theme;
  
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }
}

function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  
  // Show notification about theme change
  const themeName = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
  showNotification(`${themeName} Mode`, `Switched to ${newTheme} theme`, 'info');
  
  // Add a small animation effect to the toggle button
  themeToggle.classList.add('animate-toggle');
  setTimeout(() => {
    themeToggle.classList.remove('animate-toggle');
  }, 300);
}

// Show update notification
function showUpdateNotification(updateInfo) {
  const { version, url, releaseNotes } = updateInfo;
  
  const notification = document.createElement('div');
  notification.className = 'notification notification-info update-notification';
  notification.id = `notification-update-${Date.now()}`;
  
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-download"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">Update Available</div>
      <div class="notification-message">
        Version ${version} is now available. 
        <a href="#" class="download-link">Download now</a> or 
        <a href="#" class="view-release-notes">view release notes</a>.
      </div>
    </div>
    <div class="notification-close">
      <i class="fas fa-times"></i>
    </div>
  `;
  
  notifications.appendChild(notification);
  
  // Add event listeners
  const downloadLink = notification.querySelector('.download-link');
  const releaseNotesLink = notification.querySelector('.view-release-notes');
  const closeBtn = notification.querySelector('.notification-close');
  
  downloadLink.addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.invoke('open-release-url', url);
    notification.remove();
  });
  
  releaseNotesLink.addEventListener('click', (e) => {
    e.preventDefault();
    showReleaseNotes(version, releaseNotes, url);
    notification.remove();
  });
  
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
  
  // Don't auto-remove update notifications
}

// Show release notes in a modal
function showReleaseNotes(version, notes, url) {
  const modal = document.createElement('div');
  modal.className = 'modal release-notes-modal';
  modal.style.display = 'block';
  
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Release Notes - v${version}</h2>
      <div class="release-notes-content">
        ${notes.replace(/\n/g, '<br>')}
      </div>
      <div class="form-actions">
        <button class="button primary download-btn">
          <i class="fas fa-download"></i> Download Update
        </button>
        <button class="button secondary close-btn">
          <i class="fas fa-times"></i> Close
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.close');
  const downloadBtn = modal.querySelector('.download-btn');
  const secondaryCloseBtn = modal.querySelector('.close-btn');
  
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });
  
  downloadBtn.addEventListener('click', () => {
    ipcRenderer.invoke('open-release-url', url);
    modal.remove();
  });
  
  secondaryCloseBtn.addEventListener('click', () => {
    modal.remove();
  });
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', initApp); 