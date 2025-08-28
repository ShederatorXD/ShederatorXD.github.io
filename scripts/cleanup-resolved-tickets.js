#!/usr/bin/env node

/**
 * Script to clean up resolved support tickets older than 4 hours
 * This can be run as a cron job: 0 */1 * * * * node scripts/cleanup-resolved-tickets.js
 */

const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CLEANUP_ENDPOINT = '/api/admin/cleanup-resolved-tickets';

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, { method }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function cleanupResolvedTickets() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting resolved tickets cleanup...`);
  
  try {
    const url = `${API_URL}${CLEANUP_ENDPOINT}`;
    const response = await makeRequest(url, 'POST');
    
    if (response.status === 200) {
      console.log(`[${timestamp}] ✅ Cleanup successful:`, response.data);
    } else {
      console.error(`[${timestamp}] ❌ Cleanup failed with status ${response.status}:`, response.data);
    }
  } catch (error) {
    console.error(`[${timestamp}] ❌ Cleanup error:`, error.message);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupResolvedTickets()
    .then(() => {
      console.log('Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupResolvedTickets };
