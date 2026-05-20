async function loadEmails() {
  try {
    const response = await fetch('/api/emails');
    const emails = await response.json();
    const list = document.getElementById('email-list');
    list.innerHTML = '';
    
    emails.forEach(email => {
      const div = document.createElement('div');
      div.className = 'email-item';
      div.innerHTML = `
        <div class="email-from">${email.from || 'Unknown'}</div>
        <div class="email-subject">${email.subject || '(No subject)'}</div>
        <div class="email-date">${new Date(email.date).toLocaleString('ja-JP')}</div>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading emails:', err);
  }
}

document.getElementById('send-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const to = document.getElementById('to').value;
  const subject = document.getElementById('subject').value;
  const message = document.getElementById('message').value;
  
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, message })
    });
    
    if (response.ok) {
      alert('メール送信完了！');
      document.getElementById('send-form').reset();
      loadEmails();
    } else {
      alert('送信に失敗しました');
    }
  } catch (err) {
    console.error('Error sending email:', err);
    alert('エラーが発生しました');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const isAuthenticated = true;
  document.getElementById('auth-section').style.display = isAuthenticated ? 'none' : 'block';
  document.getElementById('app').style.display = isAuthenticated ? 'block' : 'none';
  
  if (isAuthenticated) {
    loadEmails();
    setInterval(loadEmails, 30000);
  }
});
