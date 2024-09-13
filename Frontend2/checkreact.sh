#!/bin/bash

# Define SSH command to check if React is running

status="ssh -q rmqadmin@100.65.234.21 \"netstat -tuln | grep :7007\""

# Function to check if React is running

check_react_status() {
    # Run the provided SSH command to check if React is running
    eval "$1"
}

# Check if React is running
react_status=$(check_react_status "$status")

# If React is not running, start it
if [ -z "$react_status" ]; then
    # Start React via SSH
    ssh -t rmqadmin@100.65.234.21 "cd /home/rmqadmin/my-react-app/src && PORT=7007 npm start"
    echo "React started successfully on 100.65.234.21."
else
    echo "React is already running on 100.65.234.21."
fi
