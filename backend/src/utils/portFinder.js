const net = require('net');

/**
 * Check if a port is in use
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} - True if port is in use, false otherwise
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

/**
 * Find an available port starting from the given port
 * @param {number} startPort - The port to start checking from
 * @param {number} maxPort - The maximum port to check (optional, defaults to startPort + 50)
 * @returns {Promise<number>} - An available port
 */
async function findAvailablePort(startPort, maxPort = startPort + 50) {
  for (let port = startPort; port <= maxPort; port++) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${maxPort}`);
}

module.exports = { findAvailablePort, isPortInUse };