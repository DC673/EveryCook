#!/bin/bash

# Define the sudo password
sudo_password="Classit490!"

# SSH command to check status of rabbitmq-server
ssh_command="sshpass -p '$sudo_password' ssh -t rmqadmin@100.107.212.124 sudo systemctl status rabbitmq-server"

# Execute SSH command and capture the output
status=$(eval "$ssh_command")

# Check if status contains "active (running)"
if [[ $status == *"active (running)"* ]]; then
    echo "RabbitMQ server is already running."
else
    echo "RabbitMQ server is not running. Starting it..."
    # SSH command to start rabbitmq-server
    ssh_start_command="sshpass -p '$sudo_password' ssh -t rmqadmin@100.107.212.124 sudo systemctl start rabbitmq-server"
    # Execute SSH command to start rabbitmq-server
    eval "$ssh_start_command"
fi
