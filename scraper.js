class MarketplaceScraper {
  constructor() {
    this.debugMode = true;
  }

  log(type, message, data = null) {
    if (this.debugMode) {
      const emoji = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        debug: '🔍'
      }[type] || 'ℹ️';

      console.log(`${emoji} [Scraper] ${message}`, data || '');
    }
  }

  logElement(element, label) {
    if (!this.debugMode) return;
    
    this.log('debug', `${label}:`, {
      element,
      text: element?.textContent?.trim(),
      classes: element?.className,
      attributes: Array.from(element?.attributes || []).map(attr => `${attr.name}="${attr.value}"`),
      rect: element?.getBoundingClientRect(),
      html: element?.outerHTML
    });
  }

  async scrapeListingInfo() {
    try {
      this.log('info', 'Starting to scrape listing info...');
      
      // Get all text content first for debugging
      const allText = document.body.textContent;
      this.log('debug', 'All page text:', allText);

      const data = {
        title: this.getTitle(),
        price: this.getPrice(),
        description: this.getDescription(),
        metadata: this.getMetadata(),
        details: this.getStructuredDetails(),
        images: this.getImages(),
        url: window.location.href
      };

      this.log('success', 'Scraping completed', data);
      return data;
    } catch (error) {
      this.log('error', 'Error while scraping', error);
      throw error;
    }
  }

  getTitle() {
    this.log('debug', 'Getting title...');
    const titleElement = document.querySelector('h1');
    this.logElement(titleElement, 'Title element');
    return titleElement?.textContent?.trim() || '';
  }

  getPrice() {
    this.log('debug', 'Getting price...');
    
    // Helper function to check if text contains a price
    const hasPriceFormat = (text) => {
      return /(?:PHP|PKR|₱|P)\s*\d+(?:,\d{3})*(?:\.\d{2})?/.test(text);
    };

    // Helper function to clean and format price
    const cleanPrice = (text) => {
      const match = text.match(/(?:PHP|PKR|₱|P)\s*\d+(?:,\d{3})*(?:\.\d{2})?/);
      return match ? match[0].trim() : '';
    };

    // 1. Try exact class combination from the example
    const exactClassSelector = 'span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x676frb.x1lkfr7t.x1lbecb7.x1s688f.xzsf02u';
    const exactMatch = document.querySelector(exactClassSelector);
    if (exactMatch) {
      const text = exactMatch.textContent.trim();
      if (hasPriceFormat(text)) {
        this.log('debug', 'Found price with exact class match', text);
        return cleanPrice(text);
      }
    }

    // 2. Try partial class combinations
    const partialClassSelectors = [
      'span.x193iq5w.xeuugli.x13faqbe.x1vvkbs',
      'span.x1xmvt09.x1lliihq',
      'span.xzsf02u'
    ];

    for (const selector of partialClassSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent.trim();
        if (hasPriceFormat(text)) {
          this.log('debug', 'Found price with partial class match', text);
          return cleanPrice(text);
        }
      }
    }

    // 3. Try finding by content pattern
    const pricePattern = /^(?:PHP|PKR|₱|P)\s*\d+(?:,\d{3})*(?:\.\d{2})?$/;
    const allSpans = document.querySelectorAll('span');
    for (const span of allSpans) {
      const text = span.textContent.trim();
      if (pricePattern.test(text)) {
        this.log('debug', 'Found price by content pattern', text);
        return cleanPrice(text);
      }
    }

    // 4. Look near the title
    const h1 = document.querySelector('h1');
    if (h1) {
      let element = h1;
      for (let i = 0; i < 5; i++) { // Check 5 levels up
        element = element.parentElement;
        if (!element) break;
        
        const spans = element.querySelectorAll('span');
        for (const span of spans) {
          const text = span.textContent.trim();
          if (hasPriceFormat(text)) {
            this.log('debug', 'Found price near title', text);
            return cleanPrice(text);
          }
        }
      }
    }

    // 5. Try XPath as last resort
    const xpathQuery = "//span[contains(text(), 'PHP') or contains(text(), 'PKR') or contains(text(), '₱')]";
    const xpathResult = document.evaluate(xpathQuery, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    for (let i = 0; i < xpathResult.snapshotLength; i++) {
      const node = xpathResult.snapshotItem(i);
      const text = node.textContent.trim();
      if (hasPriceFormat(text)) {
        this.log('debug', 'Found price with XPath', text);
        return cleanPrice(text);
      }
    }

    return '';
  }

  getDescription() {
    this.log('debug', 'Getting description...');
    
    // Helper function to clean description text
    const cleanDescription = (element) => {
      if (!element) return '';
      
      // Clone the element to avoid modifying the original DOM
      const clone = element.cloneNode(true);
      
      // Remove all buttons (See more/less)
      const buttons = clone.querySelectorAll('div[role="button"]');
      buttons.forEach(button => button.remove());
      
      // Get the text and clean it
      let text = clone.textContent.trim();
      
      // Remove hidden information placeholder and emoji
      text = text.replace(/\[hidden information\][\s\S]*?(?=\n|$)/, '').trim();
      text = text.replace(/📞.*$/, '').trim();
      
      // Clean up extra whitespace and newlines
      text = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.includes('See more') && !line.includes('See less'))
        .join('\n');
      
      return text;
    };

    try {
      // 1. Try the exact container div first
      const containerDiv = document.querySelector('div.xz9dl7a.x4uap5.xsag5q8.xkhd6sd.x126k92a');
      if (containerDiv) {
        const descSpan = containerDiv.querySelector('span[class*="x193iq5w"]');
        if (descSpan) {
          const text = cleanDescription(descSpan);
          if (text) {
            this.log('debug', 'Found description in main container', text);
            return text;
          }
        }
      }

      // 2. Try finding the span directly with the most specific class combination
      const mainSpanSelector = 'span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u[dir="auto"]';
      const mainSpan = document.querySelector(mainSpanSelector);
      if (mainSpan) {
        const text = cleanDescription(mainSpan);
        if (text) {
          this.log('debug', 'Found description with main span selector', text);
          return text;
        }
      }

      // 3. Try finding by content pattern
      const descriptionPattern = /Daihatsu Mira|Grade|model|Import|Condition/;
      const spans = document.querySelectorAll('span[class*="x193iq5w"]');
      for (const span of spans) {
        const text = cleanDescription(span);
        if (text && descriptionPattern.test(text) && text.length > 20) {
          this.log('debug', 'Found description by content pattern', text);
          return text;
        }
      }

      // 4. Try finding the longest text span that's not a button
      let longestText = '';
      document.querySelectorAll('span[class*="x193iq5w"]').forEach(span => {
        // Skip if it's inside a button
        if (span.closest('div[role="button"]')) return;
        
        const text = cleanDescription(span);
        if (text && text.length > longestText.length && text.length > 20) {
          longestText = text;
        }
      });

      if (longestText) {
        this.log('debug', 'Found description by longest text', longestText);
        return longestText;
      }

      // 5. Last resort: Try any span with substantial content
      const allSpans = document.querySelectorAll('span');
      for (const span of allSpans) {
        const text = cleanDescription(span);
        if (text && text.includes('Daihatsu') && text.length > 20) {
          this.log('debug', 'Found description in generic span', text);
          return text;
        }
      }

      this.log('warning', 'No description found with any method');
      return '';
    } catch (error) {
      this.log('error', 'Error getting description', error);
      return '';
    }
  }

  getMetadata() {
    this.log('debug', 'Getting metadata...');
    
    // Use XPath to find elements containing specific text
    const getTextByContent = (searchText) => {
      const element = document.evaluate(
        `//*[contains(text(), '${searchText}')]`,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      return element?.textContent.trim() || '';
    };

    return {
      listingTime: getTextByContent('Listed') || getTextByContent('ago'),
      location: getTextByContent('in'),
      sellerType: getTextByContent('Seller')
    };
  }

  getStructuredDetails() {
    this.log('debug', 'Getting structured details...');
    
    const details = {};
    const description = this.getDescription();

    if (description) {
      const lines = description.split('\n');
      lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          if (key && value) {
            details[key] = value;
          }
        }
      });
    }

    return details;
  }

  getImages() {
    this.log('debug', 'Getting images...');
    
    return Array.from(document.querySelectorAll('img[src*="marketplace"]'))
      .map(img => {
        this.logElement(img, 'Image element');
        const src = img.src.replace(/&oe=.*$/, '');
        return src.includes('?') ? src + '&size=800' : src;
      })
      .filter(src => src && !src.includes('profile'));
  }
}

// Export the scraper
window.MarketplaceScraper = MarketplaceScraper; 