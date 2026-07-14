document.getElementById('getJoke').addEventListener('click', fetchJoke);

async function fetchJoke() {
  const jokeEl = document.getElementById('joke');
  const apiSelect = document.getElementById('apiSelect').value;
  jokeEl.textContent = 'Loading...';
  try {
    let res, data, joke;
    if (apiSelect === 'icanhaz') {
      res = await fetch('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      joke = data.joke;
    } else {
      // Official Joke API returns {setup, punchline}
      res = await fetch('https://official-joke-api.appspot.com/random_joke');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      joke = data.setup && data.punchline ? `${data.setup} — ${data.punchline}` : JSON.stringify(data);
    }
    jokeEl.textContent = joke || 'No joke found.';
  } catch (err) {
    jokeEl.textContent = 'Error fetching joke.';
    console.error('fetchJoke error:', err);
  }
}
