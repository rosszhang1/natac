#!/bin/bash
pkill -f 'node server.js' || true
node server.js > server.log 2>&1 &
echo "Server restarted on port 3000"