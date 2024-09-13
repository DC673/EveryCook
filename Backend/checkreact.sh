#!/bin/bash

# Function to check if React is running on port 7007

check_react_status() {
    # Check if React is running on port 7007
    ssh -q rmqadmin@100.65.234.21 "ss -tuln | grep ':7007'"
}

# Check if React is running
react_status=$(check_react_status)

# If React is not running, start it
if [ -z "$react_status" ]; then
    # Start React via SSH
    ssh -t rmqadmin@100.65.234.21 "echo 'Classit490!' | sudo -S PORT=7007 npm start"
    echo "React started successfully on 100.65.234.21."
else
    echo "React is already running on 100.65.234.21."
fi
