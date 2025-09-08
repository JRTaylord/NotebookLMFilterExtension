document.addEventListener('DOMContentLoaded', function() {
  const greetBtn = document.getElementById('greetBtn');
  const messageDiv = document.getElementById('message');
  
  const greetings = [
    '🎉 Hello there!',
    '✨ Greetings, friend!',
    '🌟 Hey, awesome person!',
    '🚀 Welcome to the extension world!',
    '💫 You\'re doing great!',
    '🎈 Chrome extensions are fun!',
    '🌈 Keep up the good work!',
    '⭐ You\'re a star developer!'
  ];
  
  greetBtn.addEventListener('click', function() {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    messageDiv.textContent = randomGreeting;
    
    // Add a little animation
    messageDiv.style.transform = 'scale(0.8)';
    messageDiv.style.opacity = '0';
    
    setTimeout(() => {
      messageDiv.style.transform = 'scale(1)';
      messageDiv.style.opacity = '1';
      messageDiv.style.transition = 'all 0.3s ease';
    }, 50);
  });
  
  // Show a welcome message on load
  setTimeout(() => {
    messageDiv.textContent = '🎯 Ready to explore!';
  }, 500);
});
