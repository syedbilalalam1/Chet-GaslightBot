// Facebook Marketplace Input Handler
class FacebookInputHandler {
  constructor() {
    this.debugMode = true;
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`🎯 [InputHandler] ${message}`, data || '');
    }
  }

  async findTextArea() {
    // Try multiple selectors to find the correct textarea
    const selectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="private"]',
      'textarea[aria-label*="message"]',
      'textarea.x1i10hfl', // Facebook's class
      'form textarea', // Generic form textarea
      'div[role="main"] textarea', // Main content textarea
    ];

    this.log('Attempting to find textarea with selectors:', selectors);

    // Try each selector
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      this.log(`Found ${elements.length} elements with selector: ${selector}`);
      
      // Log info about each element found
      elements.forEach((el, index) => {
        this.log(`Element ${index + 1}:`, {
          placeholder: el.placeholder,
          value: el.value,
          ariaLabel: el.getAttribute('aria-label'),
          classes: el.className,
          visible: this.isElementVisible(el)
        });
      });

      // Return the first visible textarea that matches
      for (const el of elements) {
        if (this.isElementVisible(el)) {
          return el;
        }
      }
    }

    // If no selectors work, try finding by content
    const allTextareas = document.querySelectorAll('textarea');
    this.log(`Searching through ${allTextareas.length} total textareas on page`);
    
    for (const textarea of allTextareas) {
      if (this.isElementVisible(textarea)) {
        this.log('Found visible textarea:', {
          placeholder: textarea.placeholder,
          value: textarea.value,
          ariaLabel: textarea.getAttribute('aria-label'),
          classes: textarea.className
        });
        return textarea;
      }
    }

    return null;
  }

  isElementVisible(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           rect.width > 0 && 
           rect.height > 0;
  }

  async diagnoseElement(element) {
    this.log('=== Element Diagnosis ===');
    
    // Basic element properties
    this.log('Element tag:', element.tagName);
    this.log('Element classes:', element.className);
    this.log('Element attributes:', Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`));
    this.log('Element value:', element.value);
    this.log('Element placeholder:', element.placeholder);
    this.log('Element dimensions:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      visible: this.isElementVisible(element)
    });
    
    // React-specific properties
    const reactKeys = Object.keys(element).filter(key => key.startsWith('__react'));
    this.log('React-related keys:', reactKeys);
    
    // Find all properties that might be React internals
    const allProps = Object.getOwnPropertyNames(element);
    this.log('All property names:', allProps);
    
    // Check for React event handlers
    const eventHandlers = {};
    for (let key in element) {
      if (key.startsWith('on') && typeof element[key] === 'function') {
        eventHandlers[key] = element[key].toString().slice(0, 100) + '...';
      }
    }
    this.log('Event handlers:', eventHandlers);
    
    // Parent component info
    let parent = element.parentElement;
    let parentInfo = [];
    while (parent && parentInfo.length < 5) {
      parentInfo.push({
        tag: parent.tagName,
        classes: parent.className,
        id: parent.id,
        role: parent.getAttribute('role')
      });
      parent = parent.parentElement;
    }
    this.log('Parent hierarchy:', parentInfo);
    
    // Try to find React root
    let current = element;
    while (current) {
      const reactRoot = Object.keys(current).find(key => key.startsWith('__reactContainer$'));
      if (reactRoot) {
        this.log('Found React root at level:', current.tagName, reactRoot);
        break;
      }
      current = current.parentElement;
    }
    
    return true;
  }

  async insertMessage(message) {
    this.log('Attempting to insert message:', message);
    
    // Find the input element using our new method
    const messageInput = await this.findTextArea();
    if (!messageInput) {
      this.log('❌ Message input not found');
      return false;
    }

    // Run diagnosis first
    await this.diagnoseElement(messageInput);

    try {
      // Focus and clear the input
      messageInput.focus();
      messageInput.value = '';
      await this.sleep(100);

      // Try direct input first
      messageInput.value = message;
      messageInput.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(50);

      // If direct input didn't work, try simulating typing
      if (messageInput.value !== message) {
        this.log('Direct input failed, simulating typing');
        await this.simulateTyping(messageInput, message);
      }

      // Verify the value was set
      if (messageInput.value !== message) {
        this.log('Typing simulation failed, trying React manipulation');
        const fiber = this.getReactFiber(messageInput);
        if (fiber) {
          const instance = this.getReactComponent(fiber);
          if (instance && instance.setState) {
            instance.setState({ value: message });
          }
        }
      }

      // If all else fails, try the fallback
      if (messageInput.value !== message) {
        return this.fallbackInsert(messageInput, message);
      }

      return true;
    } catch (error) {
      this.log('❌ Error inserting message:', error);
      return this.fallbackInsert(messageInput, message);
    }
  }

  async simulateTyping(element, text) {
    // Clear existing value
    element.value = '';
    
    // Create base event properties
    const eventInit = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window
    };

    // Trigger initial focus events
    element.dispatchEvent(new FocusEvent('focus', eventInit));
    element.dispatchEvent(new FocusEvent('focusin', eventInit));

    // Simulate typing each character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const currentText = text.substring(0, i + 1);
      
      // Update value
      element.value = currentText;
      
      // Create and dispatch events
      const inputEvent = new InputEvent('input', {
        ...eventInit,
        data: char,
        inputType: 'insertText',
        isComposing: false
      });

      const keydownEvent = new KeyboardEvent('keydown', {
        ...eventInit,
        key: char,
        code: `Key${char.toUpperCase()}`,
        keyCode: char.charCodeAt(0),
        which: char.charCodeAt(0)
      });

      const keyupEvent = new KeyboardEvent('keyup', {
        ...eventInit,
        key: char,
        code: `Key${char.toUpperCase()}`,
        keyCode: char.charCodeAt(0),
        which: char.charCodeAt(0)
      });

      element.dispatchEvent(keydownEvent);
      element.dispatchEvent(inputEvent);
      element.dispatchEvent(keyupEvent);

      // Small delay between characters
      await this.sleep(10);
    }

    // Final change event
    element.dispatchEvent(new Event('change', eventInit));
  }

  getReactFiber(element) {
    const key = Object.keys(element).find(key => 
      key.startsWith('__reactFiber$') || 
      key.startsWith('__reactInternalInstance$')
    );
    return key ? element[key] : null;
  }

  getReactComponent(fiber) {
    // Try different paths to find the component instance
    if (fiber.stateNode && fiber.stateNode.constructor && fiber.stateNode.constructor.name.includes('Input')) {
      return fiber.stateNode;
    }

    let current = fiber;
    while (current) {
      if (current.stateNode && current.stateNode.constructor && current.stateNode.constructor.name.includes('Input')) {
        return current.stateNode;
      }
      current = current.return;
    }

    return null;
  }

  async fallbackInsert(element, text) {
    this.log('Attempting fallback insertion method');
    
    try {
      // Direct property manipulation
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeInputValueSetter.call(element, text);

      // Trigger React's synthetic events
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
      
      return true;
    } catch (error) {
      this.log('❌ Fallback insertion failed:', error);
      return false;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        this.log('Found element:', selector);
        return element;
      }
      await this.sleep(100);
    }
    
    return null;
  }
}

// Export the handler
window.FacebookInputHandler = FacebookInputHandler; 