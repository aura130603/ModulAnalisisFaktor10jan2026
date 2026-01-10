const net = require('net');
const { spawn } = require('child_process');

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

async function start() {
  const desiredPort = parseInt(process.env.PORT || '3001', 10);
  
  try {
    const availablePort = await findAvailablePort(desiredPort);
    console.log(`Starting Next.js on port ${availablePort}`);
    
    const nextProcess = spawn('next', ['dev', '-p', availablePort.toString()], {
      stdio: 'inherit',
      shell: true
    });
    
    nextProcess.on('error', (err) => {
      console.error('Failed to start Next.js:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to find available port:', err);
    process.exit(1);
  }
}

start();
