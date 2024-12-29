document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.userId);
        window.location.href = data.role === 'admin' ? 'admin.html' : 'checklist.html';
      } else {
        throw new Error(data.message || 'Fehler bei der Anmeldung.');
      }
    } catch (error) {
      document.getElementById('error-message').style.display = 'block';
      console.error(error);
    }
  });
  