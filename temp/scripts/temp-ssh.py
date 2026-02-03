import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.89', username='emile', password='galettesaucisse', timeout=10)

# Read local file
with open('C:/Users/jules/repo/clawdbot/business-ideas/maintenance-bot/bot-llm.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Write to Pi via sftp
sftp = ssh.open_sftp()
with sftp.file('/home/emile/maintenance-bot/bot-llm.ts', 'w') as f:
    f.write(content)
sftp.close()
print('✅ File uploaded')

# Restart service
stdin, stdout, stderr = ssh.exec_command('sudo systemctl restart maintenance-bot', timeout=30)
stdout.read()
print('✅ Service restarted')

# Wait and check status
import time
time.sleep(3)
stdin, stdout, stderr = ssh.exec_command('sudo systemctl status maintenance-bot --no-pager -l', timeout=30)
print(stdout.read().decode())

ssh.close()
