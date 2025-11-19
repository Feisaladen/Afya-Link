// 1️⃣ Initialize Supabase
const SUPABASE_URL = "https://lcwmhgdyuumhmsptiaav.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjd21oZ2R5dXVtaG1zcHRpYWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDYzMzEsImV4cCI6MjA3NTYyMjMzMX0.wUkCBYKeHD7zbPoWFSvMV-vFgFOWUFcAistNdWBGBhw";

if (!window.supabase || !window.supabase.createClient) {
  throw new Error("Supabase JS library failed to load. Check the CDN script tag.");
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================== SIGNUP ========================
async function signupUser(name, email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });

    if (error) throw error;

    alert("Account created! Check your email to confirm.");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Signup error:", err);
    alert(err.message || "Signup failed");
  }
}

// ======================== LOGIN ========================
async function loginUser(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) throw error;

    localStorage.setItem("supabase_session", JSON.stringify(data.session));
    alert("Login successful!");
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Login error:", err);
    alert(err.message || "Login failed");
  }
}

// ======================== FETCH OFFLINE SYMPTOMS ========================
async function getSymptoms(containerId) {
  try {
    const response = await fetch(`${BASE_URL}/symptoms`);
    const symptoms = await response.json();
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    symptoms.forEach(symptom => {
      const div = document.createElement('div');
      div.textContent = symptom.name;
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Fetching symptoms error:", error);
    alert("Could not load symptoms");
  }
}

// ======================== GET AI REMEDY ========================
async function getRemedy(selectedSymptoms, resultContainerId) {
  try {
    const session = JSON.parse(localStorage.getItem("supabase_session"));
    const token = session?.access_token;

    const response = await fetch(`${BASE_URL}/remedy`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ symptoms: selectedSymptoms })
    });

    const data = await response.json();
    const resultDiv = document.getElementById(resultContainerId);
    resultDiv.textContent = data.remedy || "No remedy available";
  } catch (error) {
    console.error("Fetching remedy error:", error);
    alert("Could not fetch remedy");
  }
}

// ======================== FORM HANDLERS ========================
function handleSignupForm(formId) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements['fullName']?.value || form.elements['name']?.value;
    const email = form.elements['email'].value;
    const password = form.elements['password'].value;
    signupUser(name, email, password);
  });
}

function handleLoginForm(formId) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.elements['email'].value;
    const password = form.elements['password'].value;
    loginUser(email, password);
  });
}

// ======================== AUTO-REDIRECT IF LOGGED IN ========================
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) window.location.href = "dashboard.html";
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) window.location.href = "dashboard.html";
});
