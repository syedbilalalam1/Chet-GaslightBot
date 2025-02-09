// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeInfo") {
    console.log("🔍 Starting scraping process...");
    
    // Create and use the scraper
    const scraper = new MarketplaceScraper();
    scraper.scrapeListingInfo()
      .then(listingData => {
        console.log("📝 Scraped data:", listingData);
        sendResponse(listingData);
      })
      .catch(error => {
        console.error("❌ Scraping error:", error);
        sendResponse({
          error: error.message,
          title: '',
          price: '',
          description: ''
        });
      });
  }
  
  if (request.action === "insertMessage") {
    console.log("📝 Attempting to insert message:", request.message);
    
    // Create instance of our input handler
    const inputHandler = new FacebookInputHandler();
    
    // Use the handler to insert the message
    inputHandler.insertMessage(request.message)
      .then(success => {
        console.log(success ? "✅ Message inserted successfully" : "❌ Failed to insert message");
      })
      .catch(error => {
        console.error("❌ Error in message insertion:", error);
      });
  }
  return true;
});

// Log when content script loads
console.log("🚀 Facebook Marketplace Negotiator content script loaded"); 