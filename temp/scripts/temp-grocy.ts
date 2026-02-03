import fetch from 'node-fetch';

const HA_API_URL = 'http://192.168.1.98:8123';
const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI1MzBhMGU5Mjk3M2E0Y2ExYTliYjA2MDEzNjg4MGYyZiIsImlhdCI6MTc2MTU5ODk1MiwiZXhwIjoyMDc2OTU4OTUyfQ.HhQoAnFaU0uopRfMAynxiVmCG0M6aUPCdL-KGuzHR6Y';

async function getGrocyChores() {
  try {
    const response = await fetch(`${HA_API_URL}/api/services/todo/get_items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_id: 'todo.grocy_chores'
      })
    });
    
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

getGrocyChores();
