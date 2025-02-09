const API_KEY = 'API_KEY';
const BASE_URL = 'https://openrouter.ai/api/v1';

// Add language handler script to popup.html
const languageHandlerScript = document.createElement('script');
languageHandlerScript.src = 'language-handler.js';
document.head.appendChild(languageHandlerScript);

document.getElementById('gaslight').addEventListener('click', async () => {
  console.log("🟢 Gaslight button clicked");
  
  try {
    // Get selected language
    const selectedLanguage = document.getElementById('languageSelect').value;
    console.log("🌍 Selected language:", selectedLanguage);

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("📑 Active tab:", tab.url);
    
    // Scrape listing info from the page
    const listingInfo = await chrome.tabs.sendMessage(tab.id, { action: "scrapeInfo" });
    console.log("📝 Listing info received:", listingInfo);
    
    // Get language-specific prompt
    const prompt = LanguageHandler.getLanguagePrompt(selectedLanguage, listingInfo);
    console.log("🤖 Sending prompt to AI:", prompt);

    // Log the full API request
    const requestBody = {
      model: "qwen/qwen-2-7b-instruct:free",
      messages: [{ role: "user", content: prompt }]
    };
    console.log("📤 API Request Body:", requestBody);

    console.log("🌐 Sending request to OpenRouter...");
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'chrome-extension://marketplace-negotiator',
        'X-Title': 'Chet'
      },
      body: JSON.stringify(requestBody)
    });

    console.log("📥 Raw Response Status:", response.status);
    console.log("📥 Raw Response Headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log("🤖 AI Response Data:", data);

    if (data.error) {
      console.error("❌ API Error:", data.error);
      throw new Error(data.error.message || 'API Error');
    }

    const negotiationMessage = data.choices[0].message.content
      .trim()
      .replace(/^["']|["']$/g, ''); // Remove any quotes at start/end
    
    console.log("💬 Generated message:", negotiationMessage);
    
    // Insert message into chat without confirmation
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: "insertMessage",
        message: negotiationMessage
      });
    } catch (error) {
      console.error("❌ Error inserting message:", error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('❌ Error Stack:', error.stack);
  }
}); 