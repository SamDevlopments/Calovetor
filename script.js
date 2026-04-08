class Calculator {
  constructor() {
    this.currentInput = '0';
    this.previousInput = '';
    this.operation = null;
    this.waitingForNewInput = false;
    this.pookieMode = false;
    this.soundEnabled = localStorage.getItem('calculatorSound') !== 'false';
    this.vibrationEnabled = localStorage.getItem('calculatorVibration') !== 'false';
    this.uiSoundsEnabled = localStorage.getItem('calculatorUISounds') || 'all';
    this.gesturesEnabled = localStorage.getItem('calculatorGestures') !== 'false';
    this.useRadians = true;
    this.secondMode = false;
    this.sounds = {
      default: {},
      pookie: {}
    };

    // Initialize history array and load from localStorage
    this.history = JSON.parse(localStorage.getItem('calculatorHistory') || '[]');

    // Initialize theme after DOM is ready
    setTimeout(() => {
      this.loadTheme();
      this.loadSounds();
      this.applyInputMode();
      if (this.gesturesEnabled) {
        this.enableGestures();
      }
    }, 50);
  }

  applyInputMode() {
    const mode = localStorage.getItem('calculatorInputMode') || 'mixed';
    const calculator = document.querySelector('.calculator');
    if (!calculator) return;
    
    const buttons = calculator.querySelectorAll('.btn');
    
    // Reset all input methods first
    buttons.forEach(btn => {
      btn.style.pointerEvents = 'auto'; // Enable mouse/touch
      btn.tabIndex = '0'; // Enable keyboard
    });
    
    // Apply mode-specific restrictions
    switch(mode) {
      case 'mixed':
        // All inputs work - nothing to disable
        break;
        
      case 'keyboard':
        // Disable mouse/touch
        buttons.forEach(btn => {
          btn.style.pointerEvents = 'none';
        });
        break;
        
      case 'mouse':
        // Disable keyboard
        buttons.forEach(btn => {
          btn.tabIndex = '-1';
        });
        break;
        
      case 'touch':
        // Check if in landscape mode
        const isLandscape = window.innerWidth > window.innerHeight;
        if (isLandscape) {
          // Disable keyboard and mouse in landscape mode
          buttons.forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.tabIndex = '-1';
          });
        }
        break;
    }
  }

  loadSounds() {
    // Load default mode sounds
    this.loadSoundFiles('default', [
      'numbers.mp3',
      'operators.mp3',
      'functions.mp3',
      'memory.mp3',
      'equals.mp3',
      'clear.mp3',
      'gestures.mp3',
      'error.mp3'
    ]);

    // Load pookie mode sounds (including activation sound)
    this.loadSoundFiles('pookie', [
      'numbers.mp3',
      'operators.mp3',
      'functions.mp3',
      'memory.mp3',
      'equals.mp3',
      'clear.mp3',
      'gestures.mp3',
      'pookie-activation.mp3',
      'error.mp3'
    ]);
  }

  loadSoundFiles(mode, fileNames) {
    fileNames.forEach(fileName => {
      const audio = new Audio(`sounds/${mode}/${fileName}`);
      audio.preload = 'auto';
      this.sounds[mode][fileName] = audio;

      // Handle loading errors
      audio.addEventListener('error', () => {
        console.warn(`Failed to load sound: sounds/${mode}/${fileName}`);
      });
    });
  }

  playSound(soundType = 'button') {
    if (!this.soundEnabled) return;

    // Check UI sounds setting
    if (this.uiSoundsEnabled === 'none') return;

    const mode = this.pookieMode ? 'pookie' : 'default';
    const soundFile = `${soundType}.mp3`;

    if (this.sounds[mode] && this.sounds[mode][soundFile]) {
      const audio = this.sounds[mode][soundFile];







      // Reset audio to beginning for multiple rapid clicks
      audio.currentTime = 0;
      audio.play().catch(e => {
        console.warn('Audio playback failed:', e);
      });
    } else {
      // Fallback to simple beep if custom sound fails
      this.playFallbackBeep();
    }
  }

  enableGestures() {
    // Enable touch gestures like swipe to delete, long press for copy, etc.
    const calculator = document.querySelector('.calculator');
    let longPressTimer;

    calculator.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        longPressTimer = setTimeout(() => {
          // Long press detected - play gesture sound and trigger action
          this.playSound('gestures');
          console.log('Long press gesture triggered on:', e.target);
          // You can add custom gesture actions here
        }, 500);
      }
    });

    calculator.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
    });

    calculator.addEventListener('touchmove', (e) => {
      clearTimeout(longPressTimer);
    });
  }

  disableGestures() {
    // Disable touch gestures
    const calculator = document.querySelector('.calculator');
    calculator.replaceWith(calculator.cloneNode(true)); // Simple way to remove event listeners
  }

  playPookieActivationSound() {
    if (!this.soundEnabled) return;

    const activationSound = this.sounds.pookie['pookie-activation.mp3'];
    if (activationSound) {
      activationSound.currentTime = 0;
      activationSound.play().catch(e => {
        console.warn('Pookie activation sound playback failed:', e);
      });
    } else {
      // Fallback beep for activation
      this.playFallbackBeep();
    }
  }

  playErrorSound() {
    if (!this.soundEnabled) return;

    const mode = this.pookieMode ? 'pookie' : 'default';
    const errorSound = this.sounds[mode]['error.mp3'];

    if (errorSound) {
      errorSound.currentTime = 0;
      errorSound.play().catch(e => {
        console.warn('Error sound playback failed:', e);
        this.playFallbackBeep();
      });
    } else {
      // Fallback beep if error sound fails
      this.playFallbackBeep();
    }
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('calculatorTheme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else if (savedTheme === 'pookie') {
      this.pookieMode = true;
      const calculator = document.querySelector('.calculator');
      if (calculator) {
        // Apply the fixed dreamy palette first
        document.documentElement.style.setProperty('--pookie-bg', pookiePalette.background);
        document.documentElement.style.setProperty('--pookie-display-bg', pookiePalette.displayBg);
        document.documentElement.style.setProperty('--pookie-button-bg', pookiePalette.buttonBg);
        document.documentElement.style.setProperty('--pookie-button-hover', pookiePalette.buttonHover);
        document.documentElement.style.setProperty('--pookie-accent', pookiePalette.accent);
        document.documentElement.style.setProperty('--pookie-text', pookiePalette.text);
        
        // Remove any existing theme classes that might interfere
        document.body.classList.remove('dark-mode');
        
        // Apply pookie mode
        calculator.classList.add('pookie-mode');
      }
    }
    // Light theme is default, no action needed
  }

  applyTheme(theme) {
    const body = document.body;
    const calculator = document.querySelector('.calculator');

    // Remove existing theme classes
    body.classList.remove('dark-mode');
    if (calculator) {
      calculator.classList.remove('pookie-mode');
      this.pookieMode = false;
    }

    // Apply new theme
    switch (theme) {
      case 'dark':
        body.classList.add('dark-mode');
        break;
      case 'pookie':
        if (calculator) {
          // Apply the fixed dreamy palette first
          document.documentElement.style.setProperty('--pookie-bg', pookiePalette.background);
          document.documentElement.style.setProperty('--pookie-display-bg', pookiePalette.displayBg);
          document.documentElement.style.setProperty('--pookie-button-bg', pookiePalette.buttonBg);
          document.documentElement.style.setProperty('--pookie-button-hover', pookiePalette.buttonHover);
          document.documentElement.style.setProperty('--pookie-accent', pookiePalette.accent);
          document.documentElement.style.setProperty('--pookie-text', pookiePalette.text);
          
          // Remove any existing theme classes that might interfere
          document.body.classList.remove('dark-mode');
          
          // Apply pookie mode
          calculator.classList.add('pookie-mode');
          this.pookieMode = true;
        }
        break;
      default:
        // Light theme
        break;
    }

    localStorage.setItem('calculatorTheme', theme);
  }

  clear() {
    this.initialize();
  }

  appendNumber(number) {
    if (this.resetOnNextInput) {
      this.currentInput = '0';
      this.resetOnNextInput = false;
    }

    if (number === '.' && this.currentInput.includes('.')) return;

    if (this.currentInput === '0' && number !== '.') {
      this.currentInput = number;
    } else {
      this.currentInput += number;
    }

    // Remove leading zeros
    this.currentInput = this.currentInput.replace(/^0+(\d)/, '$1');
  }

  chooseOperation(operation) {
    if (this.currentInput === '') return;

    if (this.previousInput !== '') {
      this.compute();
    }

    this.operation = operation;
    this.previousInput = this.currentInput;
    this.resetOnNextInput = true;
  }

  compute() {
    // Handle case where there's no operation (just pressing = with a number)
    if (!this.operation) {
      if (this.pookieMode) {
        this.showPookieFlirt(this.currentInput);
      }
      return;
    }

    const prev = parseFloat(this.previousInput);
    const current = parseFloat(this.currentInput);

    let computation;
    if (isNaN(prev) || isNaN(current)) {
      // For invalid inputs, use 0 for flirty message
      computation = 0;
    } else {
      switch (this.operation) {
        case '+':
          computation = prev + current;
          break;
        case '−':
          computation = prev - current;
          break;
        case '×':
          computation = prev * current;
          break;
        case '÷':
          computation = prev / current;
          break;
        case '^':
          computation = Math.pow(prev, current);
          break;
        case 'EXP':
          computation = prev * Math.pow(10, current);
          break;
        default:
          return;
      }
    }

    // Format number to handle floating point precision
    const result = parseFloat(computation.toFixed(10)).toString();

    // Save to history (only in default mode)
    if (!this.pookieMode) {
      this.saveToHistory(prev, current, this.operation, result);

      // Update display with result in default mode
      this.currentInput = result;

      // Capture operation before resetting
      const op = this.operation;
      this.operation = null;
      this.previousInput = '';
      this.resetOnNextInput = true;

      // Update history display
      this.updateHistoryDisplay(prev, current, op, result);
    } else {
      // In pookie mode, show flirty message instead of result
      this.showPookieFlirt(result);

      // Reset calculator state after showing flirty message (keep currentInput as flirty message)
      this.previousInput = '';
      this.operation = null;
      this.resetOnNextInput = true;
    }
  }

  saveToHistory(prev, current, operation, result) {
    const historyEntry = {
      id: Date.now(),
      calculation: `${prev} ${operation} ${current} = ${result}`,
      timestamp: new Date().toISOString()
    };

    // Add to beginning of history array
    this.history.unshift(historyEntry);

    // Keep only last 10 entries
    if (this.history.length > 10) {
      this.history = this.history.slice(0, 10);
    }

    // Save to localStorage
    localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
  }

  updateHistoryDisplay(prev, current, operation, result) {
    const historyElement = document.querySelector('.history');
    if (historyElement) {
      historyElement.textContent = `${prev} ${operation} ${current} =`;
    }
  }

  toggleSign() {
    this.currentInput = (parseFloat(this.currentInput) * -1).toString();
  }

  percentage() {
    this.currentInput = (parseFloat(this.currentInput) / 100).toString();
  }

  memoryAdd() {
    this.memory += parseFloat(this.currentInput);
  }

  memorySubtract() {
    this.memory -= parseFloat(this.currentInput);
  }

  memoryRecall() {
    this.currentInput = this.memory.toString();
  }

  togglePookieMode() {
    // Add camera shake effect
    document.body.classList.add('camera-shake');
    setTimeout(() => {
      document.body.classList.remove('camera-shake');
    }, 500);

    // Clear recent calculation from display
    this.currentInput = '0';
    this.previousInput = '';
    this.operation = null;
    this.resetOnNextInput = false;

    this.pookieMode = !this.pookieMode;
    const calculator = document.querySelector('.calculator');

    if (this.pookieMode) {
      // Apply the fixed dreamy palette first
      document.documentElement.style.setProperty('--pookie-bg', pookiePalette.background);
      document.documentElement.style.setProperty('--pookie-display-bg', pookiePalette.displayBg);
      document.documentElement.style.setProperty('--pookie-button-bg', pookiePalette.buttonBg);
      document.documentElement.style.setProperty('--pookie-button-hover', pookiePalette.buttonHover);
      document.documentElement.style.setProperty('--pookie-accent', pookiePalette.accent);
      document.documentElement.style.setProperty('--pookie-text', pookiePalette.text);

      // Remove any existing theme classes that might interfere
      document.body.classList.remove('dark-mode');

      // Apply pookie mode
      calculator.classList.add('pookie-mode');

      // Play pookie activation sound
      this.playPookieActivationSound();

      // Show notification
      if (typeof showIOSNotification === 'function') {
        const desktopMode = window.innerWidth >= 760 && window.matchMedia('(orientation: landscape)').matches;
        showIOSNotification('', 'ios-notification-welcome', 'notifications/pookie mode on.png', !desktopMode);
      }

      // Update theme in localStorage and settings menu
      localStorage.setItem('calculatorTheme', 'pookie');
      this.updateSettingsThemeSelection('pookie');

      console.log(`Pookie mode activated with ${pookiePalette.name} theme`);
    } else {
      calculator.classList.remove('pookie-mode');

      // Show notification
      if (typeof showIOSNotification === 'function') {
        const desktopMode = window.innerWidth >= 760 && window.matchMedia('(orientation: landscape)').matches;
        showIOSNotification('', 'ios-notification-welcome', 'notifications/pookie mode off.png', !desktopMode);
      }

      // Restore previous theme if not pookie
      const savedTheme = localStorage.getItem('calculatorTheme');
      if (savedTheme && savedTheme !== 'pookie') {
        if (savedTheme === 'dark') {
          document.body.classList.add('dark-mode');
        }
        this.updateSettingsThemeSelection(savedTheme);
      } else {
        this.updateSettingsThemeSelection('light');
      }
      console.log('Pookie mode deactivated');
    }
  }

  updateSettingsThemeSelection(theme) {
    // Update localStorage
    localStorage.setItem('calculatorTheme', theme);

    // If settings menu is open, update the dropdown
    const settingsOverlay = document.querySelector('.settings-overlay');
    if (settingsOverlay && settingsOverlay.classList.contains('active')) {
      const themeSelect = settingsOverlay.querySelector('.theme-select');
      if (themeSelect) {
        themeSelect.value = theme;
        // Trigger change event to update the UI
        themeSelect.dispatchEvent(new Event('change'));
      }
    }
  }

  showPookieFlirt(result) {
    try {
      // Try to load from file first
      const sections = this.loadPookieSections();

      // Classify the result using AI logic
      const category = this.classifyNumberAI(result, sections);
      const messages = sections[category] || [];

      console.log('Pookie flirt - Result:', result, 'Category:', category, 'Messages count:', messages.length);

      if (messages.length > 0) {
        let randomMessage;

        // For numbers 1-10, select the message that matches the specific number
        if (category === 'Answers For Numbers 1-10 (Specific Puns)') {
          const num = parseInt(result);
          const matchingMessage = messages.find(msg => msg.startsWith(`(${num}):`));
          randomMessage = matchingMessage || messages[Math.floor(Math.random() * messages.length)];
        } else {
          randomMessage = messages[Math.floor(Math.random() * messages.length)];
        }

        const customizedMessage = randomMessage.replace(/\{answer\}/g, result);

        console.log('Selected message:', customizedMessage);

        // Update display
        const display = document.querySelector('.current-input');
        if (display) {
          display.textContent = customizedMessage;

          // Dynamic font size based on message length
          const messageLength = customizedMessage.length;
          if (messageLength > 50) {
            display.style.fontSize = '20px';
          } else if (messageLength > 30) {
            display.style.fontSize = '24px';
          } else {
            display.style.fontSize = '28px';
          }
        }

        // Update history
        const historyElement = document.querySelector('.history');
        if (historyElement) {
          historyElement.textContent = customizedMessage;
          // Blur the history display in pookie mode to emphasize the flirty message
          if (this.pookieMode) {
            historyElement.style.filter = 'blur(2px)';
          }
        }

        // Set currentInput to the flirty message so updateDisplay handles it correctly
        this.currentInput = customizedMessage;
        this.updateDisplay();

        return;
      }

      // If no messages in specific category, use fallback
      console.log('No messages in category, using fallback');
      throw new Error('No messages for category');

    } catch (error) {
      console.error('Error in showPookieFlirt:', error);

      // Use hardcoded fallback
      const fallbackSections = this.getFallbackPookieSections();
      const category = this.classifyNumberAI(result, fallbackSections);
      const messages = fallbackSections[category] || fallbackSections['Answers For Any Number'] || [];

      if (messages.length > 0) {
        let randomMessage;

        // For numbers 1-10, select the message that matches the specific number
        if (category === 'Answers For Numbers 1-10 (Specific Puns)') {
          const num = parseInt(result);
          const matchingMessage = messages.find(msg => msg.startsWith(`(${num}):`));
          randomMessage = matchingMessage || messages[Math.floor(Math.random() * messages.length)];
        } else {
          randomMessage = messages[Math.floor(Math.random() * messages.length)];
        }

        const customizedMessage = randomMessage.replace(/\{answer\}/g, result);

        console.log('Fallback selected message:', customizedMessage);

        const display = document.querySelector('.current-input');
        if (display) {
          display.textContent = customizedMessage;

          // Dynamic font size based on message length
          const messageLength = customizedMessage.length;
          if (messageLength > 50) {
            display.style.fontSize = '20px';
          } else if (messageLength > 30) {
            display.style.fontSize = '24px';
          } else {
            display.style.fontSize = '28px';
          }
        }

        // Update history
        const historyElement = document.querySelector('.history');
        if (historyElement) {
          historyElement.textContent = customizedMessage;
          if (this.pookieMode) {
            historyElement.style.filter = 'blur(2px)';
          }
        }

        this.currentInput = customizedMessage;
        this.updateDisplay();

        return;
      }

      // Ultimate fallback - always show a flirty message
      console.log('Ultimate fallback for result:', result);
      const display = document.querySelector('.current-input');
      if (display) {
        const fallbackMessage = `You're my favorite calculation: ${result}! `;
        display.textContent = fallbackMessage;

        const messageLength = fallbackMessage.length;
        if (messageLength > 50) {
          display.style.fontSize = '20px';
        } else if (messageLength > 30) {
          display.style.fontSize = '24px';
        } else {
          display.style.fontSize = '28px';
        }
      }

      const historyElement = document.querySelector('.history');
      if (historyElement) {
        historyElement.textContent = fallbackMessage;
        if (this.pookieMode) {
          historyElement.style.filter = 'blur(2px)';
        }
      }

      this.currentInput = fallbackMessage;
      this.updateDisplay();
    }
  }

  loadPookieSections() {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'answers.txt', false); // Synchronous
      xhr.send();

      if (xhr.status === 200) {
        const sections = this.parsePookieLines(xhr.responseText);
        console.log('Loaded sections:', Object.keys(sections));
        console.log('Sample section 45:', sections['45'] ? sections['45'].length + ' messages' : 'No 45 section');
        return sections;
      } else {
        throw new Error('Failed to load file');
      }
    } catch (error) {
      console.error('Error loading pookie sections:', error);
      // Use fallback
      return this.getFallbackPookieSections();
    }
  }

  parsePookieLines(text) {
    const sections = {};
    const lines = text.split('\n');
    let currentSection = '';

    console.log('Parsing', lines.length, 'lines');

    lines.forEach((line, index) => {
      line = line.trim();

      // Check if line is a number (potential section header)
      if (/^\d+$/.test(line) && !currentSection) {
        currentSection = line;
        sections[currentSection] = [];
        console.log('New section:', currentSection, 'at line', index);
      } else if (line.startsWith('Answers For') && line.includes(':')) {
        currentSection = line.replace(':', '').trim();
        sections[currentSection] = [];
        console.log('New section:', currentSection, 'at line', index);
      } else if (line.startsWith('//') || line === '') {
        // Skip comments and empty lines
      } else if (currentSection && line) {
        sections[currentSection].push(line);
        if (currentSection === '45' && sections[currentSection].length <= 5) {
          console.log('Added to 45:', line);
        }
      }
    });

    console.log('Parsed sections:', Object.keys(sections));
    return sections;
  }

  classifyNumberAI(result, sections) {
    const num = parseFloat(result);

    // Handle invalid results - always show a flirty message
    if (isNaN(num)) {
      console.log('Classified as invalid/error:', result);
      return 'Answers For Calculation Errors';
    }

    // Check for specific categories in order of specificity
    if (num === 0 && sections['0']) {
      console.log('Classified as 0:', result);
      return '0';
    }

    if (num === 1 && sections['1']) {
      console.log('Classified as 1:', result);
      return '1';
    }

    if (num < 0 && sections['Answers For Negative Numbers']) {
      console.log('Classified as negative:', result);
      return 'Answers For Negative Numbers';
    }

    // Handle decimal numbers
    if (num % 1 !== 0 && sections['Answers For Decimal Answers']) {
      console.log('Classified as decimal:', result);
      return 'Answers For Decimal Answers';
    }

    // Handle specific numbers 1-100
    if (num >= 1 && num <= 100 && sections[num.toString()]) {
      console.log('Classified as specific number:', result);
      return num.toString();
    }

    // Handle large numbers
    if (num > 1000 && sections['Answers For Large Numbers']) {
      console.log('Classified as large number:', result);
      return 'Answers For Large Numbers';
    }

    // Handle very large numbers
    if (num > 1000000 && sections['Answers For Very Large Numbers']) {
      console.log('Classified as very large number:', result);
      return 'Answers For Very Large Numbers';
    }

    // Handle specific milestone numbers
    if (num === 365 && sections['Answers For 365']) {
      console.log('Classified as 365:', result);
      return 'Answers For 365';
    }

    if (num === 1000 && sections['Answers For 1000']) {
      console.log('Classified as 1000:', result);
      return 'Answers For 1000';
    }

    if (num === 10000 && sections['Answers For 10000']) {
      console.log('Classified as 10000:', result);
      return 'Answers For 10000';
    }

    if (num === 100000 && sections['Answers For 100000']) {
      console.log('Classified as 100000:', result);
      return 'Answers For 100000';
    }

    if (num === 1000000 && sections['Answers For 1000000']) {
      console.log('Classified as 1000000:', result);
      return 'Answers For 1000000';
    }

    // Handle numbers between 101-1000 that don't have specific entries
    if (num > 100 && num <= 1000 && sections['Answers For Medium Numbers']) {
      console.log('Classified as medium number:', result);
      return 'Answers For Medium Numbers';
    }

    // Handle numbers between 1001-1000000 that don't have specific entries
    if (num > 1000 && num <= 1000000 && sections['Answers For Large Numbers']) {
      console.log('Classified as large number (101-1M):', result);
      return 'Answers For Large Numbers';
    }

    // Handle numbers > 1M that don't have specific entries
    if (num > 1000000 && sections['Answers For Very Large Numbers']) {
      console.log('Classified as very large number (>1M):', result);
      return 'Answers For Very Large Numbers';
    }

    // Handle zero (special case)
    if (num === 0 && sections['0']) {
      console.log('Classified as zero:', result);
      return '0';
    }

    // Always fallback to general category if nothing matches
    if (sections['Answers For Any Number']) {
      console.log('Classified as any number (final fallback):', result);
      return 'Answers For Any Number';
    }

    // Ultimate fallback to errors
    console.log('Ultimate fallback to errors:', result);
    return 'Answers For Calculation Errors';
  }

  isPrime(num) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  isPerfectSquare(num) {
    if (num < 0) return false;
    const sqrt = Math.sqrt(num);
    return sqrt === Math.floor(sqrt);
  }

  isDoubleNumber(num) {
    const str = num.toString();
    if (str.length < 2) return false;
    return str[0] === str[1] && str.length === 2;
  }

  getFallbackPookieSections() {
    return {
      'Answers For Any Number': [
        "That's how many times I've thought about you today.",
        "Our connection? It's a perfect {answer}.",
        "My love for you? Over {answer} percent.",
        "That's our compatibility score. Not bad, huh?",
        "You + Me = {answer}ever.",
        "You have {answer}% of my heart. (The rest is yours too, silly).",
        "That's the number of reasons you're amazing. (I'm still counting).",
        "My heart does {answer} beats per minute just for you.",
        "Our future? I give it a {answer} out of 10.",
        "That's how many kisses I owe you.",
        "The answer is {answer}, but my love for you is immeasurable.",
        "You're more than {answer} to me.",
        "I'd rather be with you than have {answer} dollars.",
        "If I had {answer} wishes, I'd wish for you every time.",
        "You're the {answer}th reason I smile every day.",
        "My heart skips {answer} beats every time I see you.",
        "We've got {answer} reasons to stay together forever.",
        "You're the answer to my {answer} prayers.",
        "I love you {answer} times more than chocolate.",
        "You're {answer} times hotter than the sun.",
        "I'd walk {answer} miles just to see you.",
        "You're one in {answer}.",
        "I've fallen for you {answer} times and I'd do it again.",
        "You're the {answer}th wonder of my world.",
        "My love for you is {answer} light years long.",
        "You're the {answer}th note in my symphony of love.",
        "I'd spend {answer} lifetimes with you.",
        "You're the {answer}th piece of my heart.",
        "I've got {answer} reasons to kiss you right now.",
        "You're the {answer}th star in my sky.",
        "The answer is {answer}, but the real solution is cuddles.",
        "Error 404: Answer not found, too distracted by you.",
        "The only math that matters is Us + Forever.",
        "You're my favorite calculation!",
        "Math was never this fun until I met you!",
        "You're the reason I love math!",
        "Our love equation is always balanced!",
        "You + Me = Perfect Match!",
        "That's how many times I've replayed our first kiss in my head today.",
        "My heart just did {answer} backflips. Your fault.",
        "Our love story? Rated {answer} stars.",
        "That's the atomic weight of \"How Much I Want You.\"",
        "You're the {answer}th reason I believe in magic.",
        "My love for you has a {answer}% battery, and it's never draining.",
        "That's not a number, it's the amount of butterflies you give me.",
        "You occupy {answer} terabytes of my mind. Rent-free.",
        "That's the score for \"How Perfect Your Smile Is.\"",
        "My heart emits {answer} lumens of pure love for you.",
        "You've been the main character in my dreams for {answer} nights straight.",
        "That's the number of cuddles I require. Immediately.",
        "My love for you is a {answer}-step program, and I'm happily addicted.",
        "That's how many galaxies I'd rearrange just to see you.",
        "My heart runs at {answer} GHz when you're near.",
        "That's the number of times I've almost texted you \"I miss you\" today.",
        "You're my favorite equation: complicated, beautiful, and the answer is always love.",
        "That's how many love notes I've written you in my mind."
      ],
      'Answers For Decimal Answers': [
        "A little decimal, just like the little space left in my heart before I met you.",
        "Not a whole number, but you make me feel whole.",
        "Our love isn't basic; it has depth, just like this decimal.",
        "You're the decimal point that makes my life complete.",
        "Love with you is never round; it's perfectly decimal."
      ],
      'Answers For Medium Numbers': [
        "A number as unique as our love story.",
        "That's how many butterflies you give me every day.",
        "My love for you grows by {answer} percent daily.",
        "You're one in {answer} - absolutely irreplaceable."
      ],
      'Answers For Large Numbers': [
        "That's approximately how many neurons you short-circuit in my brain!",
        "A number as infinite as my crush on you!",
        "That's how many seconds I'd wait for you!",
        "My love for you is in the {answer} digits!",
        "A big number? That's how many times I've thought about you!",
        "Even with a number this large, my love is still bigger!",
        "A large result? That's how many miles I'd travel for you.",
        "A huge number? That's how many seconds I'll love you.",
        "A giant number? That's how many kisses I owe you.",
        "A massive number? That's how much I love you.",
        "That's the atomic number of 'How Much I Adore You'.",
        "My heart has {answer} chambers, all beating for you."
      ],
      'Answers For Very Large Numbers': [
        "That's how many neurons you short-circuit in my brain",
        "A number as infinite as my love for you",
        "That's how many seconds I'd wait for you",
        "My love for you has more digits than this number",
        "That's approximately how many times I've smiled because of you"
      ],
      'Answers For 365': [
        "365 days a year, I'm yours.",
        "Every day of the year, I love you!",
        "365 reasons to wake up next to you!"
      ],
      'Answers For 1000': [
        "A thousand words? I only need three: I love you.",
        "1000 hearts couldn't hold my love for you!",
        "A thousand miles? I'd walk them for you!"
      ],
      'Answers For 10000': [
        "10,000 hours? I'd spend them all with you."
      ],
      'Answers For 100000': [
        "100,000 reasons to love you? I'm still counting."
      ],
      'Answers For 1000000': [
        "A million miles away? I'd still find you."
      ],
      'Answers For Calculation Errors': [
        "Error 404: My heart can't compute when you're this close",
        "Syntax Error: Too much beauty in one person",
        "Overflow Error: My heart can't handle this much love",
        "Divide by Zero: You've broken all my defenses",
        "Memory Full: Of thoughts about you",
        "Error 404: My heart not found. You stole it.",
        "Overflow Error: My capacity to adore you has been exceeded.",
        "Syntax Error: Too much cute in one person. Cannot compute.",
        "Divide by Zero: You've broken the fundamental laws of my heart.",
        "Memory Full: Of your beautiful face. Please kiss to reset.",
        "Connection Lost: To my brain. All systems redirected to you.",
        "Invalid Input: Me trying to resist you. It's impossible.",
        "Calculation Timeout: Still figuring out how someone so perfect exists.",
        "Stack Overflow: Of my affection for you!",
        "Low Battery: Just kidding! My love for you is eternally charged.",
        "Runtime Error: My heart stopped for a second when you smiled.",
        "File Not Found: My diary entry for \"A Day I Didn't Love You.\"",
        "Network Error: In my brain. All signals are pointing to you.",
        "System Crash: You caused it by being too attractive.",
        "Blue Screen of Love: You've overwhelmed all my processing units.",
        "Error 404: My heart not found - you stole it",
        "Overflow Error: My capacity to love you has been exceeded",
        "Syntax Error: Too much cute in one person",
        "Divide by Zero: You've broken all my defenses",
        "Memory Full: Of thoughts about you"
      ],
      // Specific numbers 0-100
      '0': [
        "Zero doubts, you're the one for me.",
        "My love for you is zero percent conditional.",
        "The chance of me leaving? Zero.",
        "Zero reasons to ever let you go.",
        "Zero doubts about us",
        "Zero is how many people I love as much as you",
        "My love for you has zero conditions"
      ],
      '1': [
        "You're my #1 always and forever",
        "One look from you makes my heart race",
        "You're the one I've been searching for",
        "My heart beats in one rhythm - yours",
        "You're my one and only thought",
        "You're my number one. Always.",
        "The one and only person for me.",
        "One look from you and I'm done for.",
        "You are my one in a million.",
        "You're the one and only.",
        "One look from you and I'm yours."
      ],
      '2': [
        "Two hearts beating as one - ours",
        "It takes two to make magic happen",
        "You're my perfect pair",
        "Two souls destined to be together",
        "You complete my two-piece puzzle",
        "It takes two to tango, and I want to tango with you.",
        "Two hearts, one rhythm: ours."
      ],
      '3': [
        "Three little words: I'm yours forever",
        "You, me, and endless love",
        "Three wishes: you, you, and you",
        "Our love triangle: you, me, and happiness",
        "Three cheers for being mine!",
        "Three words: I. Love. You.",
        "You, me, and our love: the perfect trio."
      ],
      '4': [
        "I love you 4-ever and always",
        "You're my 4-leaf clover of luck",
        "Four seasons, one love: you",
        "You're my fourth dimension of joy",
        "Four corners of my heart? All yours",
        "I love you 4-ever and always.",
        "You're the 4th dimension of my life."
      ],
      '5': [
        "Give me 5? I'll give you my heart",
        "High five for being so perfect!",
        "Five senses, all obsessed with you",
        "You're my favorite 5-star rating",
        "Five minutes with you feels like heaven",
        "Give me 5 minutes of your time and I'll make you smile.",
        "You're my high 5, every day."
      ],
      '6': [
        "You're my perfect 6/6",
        "Six strings on my heart - all playing for you",
        "You make me feel like a million bucks on a $6 budget",
        "Six directions? I'd follow you in all of them",
        "You're my lucky number 6",
        "You're my 6, because you make me feel like a 10.",
        "Six strings on my guitar, but only one you."
      ],
      '7': [
        "You're my lucky number 7",
        "Seven wonders? You're the 8th",
        "Seven days a week I'm yours",
        "You're my 7th heaven",
        "Seven seas couldn't separate us",
        "You're my lucky number 7.",
        "Seven days a week, I'm thinking of you."
      ],
      '8': [
        "My love for you is 8-dimensional",
        "You're the one I 8-ly think about",
        "Infinity turned sideways is 8 - like our love",
        "Eight days a week wouldn't be enough with you",
        "You're my great 8",
        "You're the one I 8-ly think about.",
        "I'd wait 8 days a week for you."
      ],
      '9': [
        "I'd choose you 9 times out of 10",
        "You're my cloud 9 resident",
        "Nine lives? I'd spend them all with you",
        "You're my 9th wonder of the world",
        "Nine planets? You're my entire universe",
        "I'd choose you 9 times out of 10. (The 10th time I was thinking about how much I love you).",
        "You're the 9th wonder of my world."
      ],
      '10': [
        "You're a perfect 10 in my eyes",
        "I love you 10 times more today than yesterday",
        "Ten out of ten times I'd choose you",
        "You score 10/10 in my heart",
        "Ten reasons to love you? I have millions",
        "You're a perfect 10.",
        "I love you 10 times more than yesterday."
      ],
      '11': [
        "You're my number 11 - one better than perfect",
        "My love for you goes to 11",
        "Eleven out of ten dentists recommend kissing you",
        "You're my favorite 11th hour rescue",
        "My heart does 11 flips when you smile",
        "You're my 11th commandment: thou shalt love me."
      ],
      '12': [
        "Twelve roses? I'd give you 12 gardens",
        "Twelve months of year, endless love for you",
        "You're my favorite dozen",
        "Twelve hours of daylight? I dream of you 24",
        "You're my perfect 12",
        "12 hours a day I think of you, the other 12 I dream of you."
      ],
      '13': [
        "You're my lucky 13",
        "Thirteen's unlucky? Not when I'm with you",
        "Friday the 13th? More like Lucky Me Day",
        "You make every 13 feel like 31",
        "Thirteen reasons why? You're all of them",
        "You're my lucky 13."
      ],
      '14': [
        "I'll love you for 14 lifetimes",
        "You're my Valentine 14/7",
        "Fourteen karat? You're pure gold",
        "Fourteen days without you? Impossible",
        "You're my favorite 14th of any month",
        "I'll love you for 14 lifetimes."
      ],
      '15': [
        "Fifteen minutes of fame? I want forever with you",
        "You make me feel like I'm 15 again",
        "Fifteen flavors of amazing? You're all of them",
        "My love for you grows 15% daily",
        "You're my sweet 15",
        "15 minutes of your love is all I need."
      ],
      '16': [
        "Sweet 16? You're sweet 365",
        "Sixteen candles? I'd light them all for you",
        "You're my favorite 16th note",
        "Sixteen going on forever with you",
        "You're the 16th note in my heart's melody.",
        "You make 16 feel like the perfect age"
      ],
      '17': [
        "At 17, I found my forever in you",
        "You're my favorite 17th summer",
        "Seventeen dreams? All about you",
        "You make me feel 17 and in love",
        "My heart beats 17 times faster for you",
        "At 17, I didn't know love, but now I do with you."
      ],
      '18': [
        "Eighteen and over? Over the moon for you",
        "You're my favorite 18th birthday wish",
        "Eighteen holes? I'd golf them all with you",
        "You make 18 feel magical",
        "My love for you is 18+ levels of intense",
        "18 years old? No, but my love for you is adult-sized."
      ],
      '19': [
        "Nineteen years from now, I'll still be this crazy about you",
        "You're my 19th reason to smile today",
        "Nineteen eighty-four? More like nineteen eighty-yours",
        "You make 19 feel like the new 21",
        "My love for you is 19 streets ahead",
        "19 times I've tried to write the perfect love note, but you're the 20th."
      ],
      '20': [
        "20/20 vision couldn't see anyone more perfect",
        "Twenty questions? My answer is always you",
        "You're my favorite 20-something",
        "Twenty years from now? Still yours",
        "20/20 vision couldn't see someone as perfect as you.",
        "You make 20 feel like the new forever"
      ],
      '21': [
        "Twenty-one guns salute to the one I love",
        "You're my winning 21",
        "Twenty-one reasons? You're all of them",
        "You make 21 feel lucky",
        "My love for you is 21+ approved",
        "21 guns salute to the one I love."
      ],
      '22': [
        "You're my double trouble 22",
        "Twenty-two karat? You're pure perfection",
        "You're my favorite 22nd surprise",
        "Twenty-two years young with you",
        "My heart skips 22 beats for you"
      ],
      '23': [
        "You're my Michael Jordan 23",
        "Twenty-three and me? Just us forever",
        "You're my lucky 23",
        "Twenty-three hours a day? Still not enough with you",
        "You make 23 feel legendary"
      ],
      '24': [
        "24 hours in a day? Not enough to love you",
        "You're my favorite 24/7",
        "Twenty-four karat golden heart",
        "You're my round-the-clock crush",
        "My love for you works 24/7 shifts"
      ],
      '25': [
        "Silver anniversary? Our love is platinum",
        "You're my quarter-century miracle",
        "Twenty-five years young with you",
        "You make 25 feel like the new 18",
        "25 years from now, I'll still love you.",
        "My love for you is 25/8"
      ],
      '26': [
        "Twenty-six miles? I'd run them for you",
        "You're my favorite 26th element",
        "Twenty-six letters can't describe you",
        "You make 26 feel extraordinary",
        "My heart has 26 chambers all for you"
      ],
      '27': [
        "Twenty-seven dresses? I'd rather have you",
        "You're my favorite 27th chapter",
        "Twenty-seven club? More like forever club with you",
        "You make 27 feel magical",
        "My love for you is 27 degrees perfect"
      ],
      '28': [
        "Twenty-eight days later? Still obsessed with you",
        "You're my favorite 28th day",
        "Twenty-eight grams of pure awesome",
        "You make February 28th feel special",
        "My love for you is 28/7"
      ],
      '29': [
        "Twenty-nine and fine? You're divine",
        "You're my leap year miracle",
        "Twenty-nine palms? I'd hold both of yours",
        "You make 29 feel rare and precious",
        "My love for you has 29 dimensions"
      ],
      '30': [
        "Thirty, flirty, and thriving with you",
        "You're my dirty 30 dream come true",
        "Thirty days hath September, my love for you lasts forever",
        "You make 30 feel fabulous",
        "My love for you is 30 levels deep",
        "30 days have September, but my love for you has no end."
      ],
      '31': [
        "Thirty-one flavors? You're my favorite",
        "You're my 31st day of happiness",
        "Thirty-one days in my favorite month with you",
        "You make every month feel like 31 days long",
        "My love for you is 31 kinds of wonderful"
      ],
      '32': [
        "Thirty-two degrees? You're freezing me with your beauty",
        "You're my perfect 32-bit system",
        "Thirty-two teeth in this gorgeous smile just for you",
        "You make 32 feel like the new 25",
        "My love for you has 32 points of perfection"
      ],
      '33': [
        "Thirty-three and me? Eternally yours",
        "You're my Jesus year blessing",
        "Thirty-three revolutions around the sun? Just warming up with you",
        "You make 33 feel sacred",
        "My love for you is 33 RPM smooth"
      ],
      '34': [
        "Thirty-four and more? More in love with you",
        "You're my favorite 34th parallel",
        "Thirty-four ways to love you? I know millions",
        "You make 34 feel fantastic",
        "My love for you is 34 streets long"
      ],
      '35': [
        "Thirty-five and alive with you by my side",
        "You're my mid-thirties masterpiece",
        "Thirty-five millimeters of pure focus on you",
        "You make 35 feel sexy",
        "My love for you is 35mm perfect"
      ],
      '36': [
        "Thirty-six views? You're my favorite",
        "You're my perfect 360 degree view",
        "Thirty-six questions to fall in love? I only needed one look at you",
        "You make 36 feel incredible",
        "My love for you is 36 inches around my heart"
      ],
      '37': [
        "Thirty-seven degrees? My normal temperature when I'm with you",
        "You're my perfect human temperature",
        "Thirty-seven seconds? That's how fast I fell for you",
        "You make 37 feel just right",
        "My love for you is 37 flavors delicious"
      ],
      '38': [
        "Thirty-eight special? You're extra special",
        "You're my favorite 38th element",
        "Thirty-eight years young with you",
        "You make 38 feel amazing",
        "My love for you is 38 proof strong"
      ],
      '39': [
        "Thirty-nine and feeling fine with you",
        "You're my almost-40 fantasy",
        "Thirty-nine steps to your heart? I'll take them all",
        "You make 39 feel magnificent",
        "My love for you is 39 clues deep"
      ],
      '40': [
        "Forty and fabulous with you",
        "You're my life-begins-at-40 beginning",
        "Forty acres and a mule? I'd trade it for you",
        "You make 40 feel like 20",
        "My love for you is 40 days and nights long",
        "40 acres and a mule? I'd trade it all for you."
      ],
      '41': [
        "Forty-one and fun with you",
        "You're my +1 for life",
        "Forty-one reasons to smile? You're all of them",
        "You make 41 feel fantastic",
        "My love for you is 41 flavors sweet"
      ],
      '42': [
        "Forty-two: the answer to life, the universe, and everything... plus you",
        "You're my hitchhiker's guide to love",
        "Forty-two kilometers? I'd walk them for you",
        "You make 42 feel meaningful",
        "My love for you is 42 levels deep"
      ],
      '43': [
        "Forty-three and free with you",
        "You're my favorite 43rd surprise",
        "Forty-three years young in your arms",
        "You make 43 feel courageous",
        "My love for you is 43 lightyears long"
      ],
      '44': [
        "Forty-four and more? More yours every day",
        "You're my double double 44",
        "Forty-four magnets pulling me to you",
        "You make 44 feel powerful",
        "My love for you is 44 carats pure"
      ],
      '45': [
        "Forty-five and alive with you",
        "You're my favorite 45 RPM record",
        "Forty-five degrees? The perfect angle to admire you",
        "You make 45 feel revolutionary",
        "My love for you is 45% of my every thought"
      ],
      '46': [
        "Forty-six and sexy with you",
        "You're my chromosomes' favorite number",
        "Forty-six ways to your heart? I'll learn them all",
        "You make 46 feel extraordinary",
        "My love for you has 46 dimensions"
      ],
      '47': [
        "Forty-seven and heaven with you",
        "You're my favorite 47th element",
        "Forty-seven seconds? That's how long I can last without thinking of you",
        "You make 47 feel precious",
        "My love for you is 47 meters deep"
      ],
      '48': [
        "Forty-eight and great with you",
        "You're my favorite 48 laws of attraction",
        "Forty-eight hours of pure bliss with you",
        "You make 48 feel incredible",
        "My love for you is 48-bit precise"
      ],
      '49': [
        "Forty-nine and divine with you",
        "You're my gold rush 49er",
        "Forty-nine reasons? You're worth 49 million",
        "You make 49 feel golden",
        "My love for you is 49 proof strong"
      ],
      '50': [
        "Fifty and nifty with you",
        "You're my golden anniversary dream",
        "Fifty shades of love? All for you",
        "You make 50 feel fabulous",
        "My love for you is 50/50 - all me loving all you",
        "50 ways to leave your lover? I only need one: stay with me."
      ],
      '51': [
        "Fifty-one and fun with you",
        "You're my Area 51 mystery I want to solve forever",
        "Fifty-one ways to leave your lover? I only need one way: to yours",
        "You make 51 feel mysterious",
        "My love for you is 51% of my soul"
      ],
      '52': [
        "Fifty-two and true with you",
        "You're my deck of cards - the only one I need",
        "Fifty-two weeks of year? All yours",
        "You make 52 feel complete",
        "My love for you is 52 pickup - I always pick you"
      ],
      '53': [
        "Fifty-three and free with you",
        "You're my favorite 53rd state of mind",
        "Fifty-three miles per hour? The speed I'd drive to you",
        "You make 53 feel wild",
        "My love for you is 53 varieties delicious"
      ],
      '54': [
        "Fifty-four and more with you",
        "You're my perfect 54-40 or fight",
        "Fifty-four cards? You're my wild card",
        "You make 54 feel adventurous",
        "My love for you is 54 degrees warm"
      ],
      '55': [
        "Fifty-five and alive with you",
        "You're my double nickel delight",
        "Fifty-five mph? The speed limit of my heart for you",
        "You make 55 feel fast and furious",
        "My love for you is 55 gallons deep"
      ],
      '56': [
        "Fifty-six and sweet with you",
        "You're my favorite 56k modem - connecting straight to my heart",
        "Fifty-six days of summer? All with you",
        "You make 56 feel nostalgic",
        "My love for you is 56-bit encrypted - only you have the key"
      ],
      '57': [
        "Fifty-seven and heaven with you",
        "You're my Heinz 57 varieties of perfect",
        "Fifty-seven channels? I only watch the one with you",
        "You make 57 feel saucy",
        "My love for you is 57 flavors tasty"
      ],
      '58': [
        "Fifty-eight and great with you",
        "You're my favorite 58th element",
        "Fifty-eight minutes? Not enough time with you",
        "You make 58 feel precious",
        "My love for you is 58 proof intoxicating"
      ],
      '59': [
        "Fifty-nine and fine with you",
        "You're my almost-60 amazing",
        "Fifty-nine seconds? How fast you stole my heart",
        "You make 59 feel urgent",
        "My love for you is 59 minutes an hour"
      ],
      '60': [
        "Sixty and sexy with you",
        "You're my diamond anniversary dream",
        "Sixty seconds in a minute? Sixty ways I love you",
        "You make 60 feel sensational",
        "My love for you is 60 cycles per second constant"
      ],
      '61': [
        "Sixty-one and fun with you",
        "You're my Route 61 adventure",
        "Sixty-one minutes in an hour? I need 61 more with you",
        "You make 61 feel rebellious",
        "My love for you is 61 highways long"
      ],
      '62': [
        "Sixty-two and true with you",
        "You're my favorite 62nd surprise",
        "Sixty-two days? That's how long I can pretend I'm not crazy about you",
        "You make 62 feel special",
        "My love for you is 62 flavors sweet"
      ],
      '63': [
        "Sixty-three and free with you",
        "You're my 63rd reason to live",
        "Sixty-three years? Just the beginning with you",
        "You make 63 feel magical",
        "My love for you is 63 dimensions deep"
      ],
      '64': [
        "Sixty-four and more with you",
        "You're my perfect 64-bit system",
        "Sixty-four squares? You're my queen",
        "You make 64 feel classic",
        "My love for you is 64 thousand dollars rich"
      ],
      '65': [
        "Sixty-five and alive with you",
        "You're my retirement plan",
        "Sixty-five miles per hour? The speed my heart races for you",
        "You make 65 feel golden",
        "My love for you is 65 years young"
      ],
      '66': [
        "Sixty-six and sweet with you",
        "You're my Route 66 ride or die",
        "Sixty-six trombones? Playing our love song",
        "You make 66 feel legendary",
        "My love for you is 66 proof strong"
      ],
      '67': [
        "Sixty-seven and heaven with you",
        "You're my favorite 67th element",
        "Sixty-seven minutes? Not enough with you",
        "You make 67 feel precious",
        "My love for you is 67 degrees warm"
      ],
      '68': [
        "Sixty-eight and great with you",
        "You're my almost-69 amazing",
        "Sixty-eight ways to love you? I know 68 more",
        "You make 68 feel exciting",
        "My love for you is 68 flavors delicious"
      ],
      '69': [
        "Sixty-nine times the fun with you",
        "You're my favorite position - by my side",
        "Sixty-nine is just us facing each other forever",
        "You make 69 feel naughty and nice",
        "My love for you is 69 ways wonderful",
        "69 is a fun number, but you're more fun.",
        "Our love is 69 times more exciting!",
        "69? That's how many ways I love you!"
      ],
      '70': [
        "Seventy and sexy with you",
        "You're my platinum anniversary dream",
        "Seventy times seven? That's how many times I'd forgive you",
        "You make 70 feel fabulous",
        "My love for you is 70 years strong"
      ],
      '71': [
        "Seventy-one and divine with you",
        "You're my favorite 71st surprise",
        "Seventy-one degrees? The perfect temperature for cuddling you",
        "You make 71 feel warm",
        "My love for you is 71 proof authentic"
      ],
      '72': [
        "Seventy-two and true with you",
        "You're my perfect 72-hour date",
        "Seventy-two hours? Not enough with you",
        "You make 72 feel complete",
        "My love for you is 72 virgins pure"
      ],
      '73': [
        "Seventy-three and free with you",
        "You're my favorite 73rd element",
        "Seventy-three seconds? How long I can hold my breath thinking of you",
        "You make 73 feel precious",
        "My love for you is 73 degrees perfect"
      ],
      '74': [
        "Seventy-four and more with you",
        "You're my favorite Boeing 747 - flying high with you",
        "Seventy-four reasons? You're worth 74 million",
        "You make 74 feel grand",
        "My love for you is 74 yards long"
      ],
      '75': [
        "Seventy-five and alive with you",
        "You're my diamond anniversary plus",
        "Seventy-five percent of my heart? You have 100",
        "You make 75 feel precious",
        "My love for you is 75 years young"
      ],
      '76': [
        "Seventy-six and sweet with you",
        "You're my 76 trombones leading the parade",
        "Seventy-six days of summer? All yours",
        "You make 76 feel musical",
        "My love for you is 76 proof strong"
      ],
      '77': [
        "Seventy-seven and heaven with you",
        "You're my double lucky 7s",
        "Seventy-seven times I'd choose you",
        "You make 77 feel blessed",
        "My love for you is 77 degrees warm"
      ],
      '78': [
        "Seventy-eight and great with you",
        "You're my favorite 78 RPM record",
        "Seventy-eight minutes of pure bliss with you",
        "You make 78 feel nostalgic",
        "My love for you is 78 proof intoxicating"
      ],
      '79': [
        "Seventy-nine and fine with you",
        "You're my almost-80 amazing",
        "Seventy-nine reasons to smile? You're all of them",
        "You make 79 feel precious",
        "My love for you is 79 flavors sweet"
      ],
      '80': [
        "Eighty and sexy with you",
        "You're my oak anniversary strong",
        "Eighty days around the world? I'd do it with you",
        "You make 80 feel eternal",
        "My love for you is 80 years deep"
      ],
      '81': [
        "Eighty-one and fun with you",
        "You're my perfect 9x9",
        "Eighty-one ways to love you? I know 81 more",
        "You make 81 feel complete",
        "My love for you is 81 proof strong"
      ],
      '82': [
        "Eighty-two and true with you",
        "You're my favorite 82nd element",
        "Eighty-two years young with you",
        "You make 82 feel precious",
        "My love for you is 82 degrees warm"
      ],
      '83': [
        "Eighty-three and free with you",
        "You're my favorite 83rd surprise",
        "Eighty-three seconds? How fast I fell for you",
        "You make 83 feel magical",
        "My love for you is 83 flavors delicious"
      ],
      '84': [
        "Eighty-four and more with you",
        "You're my Orwellian dream come true",
        "Eighty-four years? Just warming up with you",
        "You make 84 feel revolutionary",
        "My love for you is 84 proof authentic"
      ],
      '85': [
        "Eighty-five and alive with you",
        "You're my favorite Interstate 85 - taking me to you",
        "Eighty-five miles per hour? The speed I'd drive to you",
        "You make 85 feel fast",
        "My love for you is 85 years strong"
      ],
      '86': [
        "Eighty-six and sweet with you",
        "You're my don't-86-me-from-your-heart",
        "Eighty-six reasons to stay? You're all of them",
        "You make 86 feel essential",
        "My love for you is 86 proof strong"
      ],
      '87': [
        "Eighty-seven and heaven with you",
        "You're my favorite 87th element",
        "Eighty-seven minutes of pure joy with you",
        "You make 87 feel precious",
        "My love for you is 87 degrees perfect"
      ],
      '88': [
        "Eighty-eight and great with you",
        "You're my double infinity 88",
        "Eighty-eight keys on my heart - all playing for you",
        "You make 88 feel infinite",
        "My love for you is 88 mph fast"
      ],
      '89': [
        "Eighty-nine and fine with you",
        "You're my almost-90 amazing",
        "Eighty-nine ways to your heart? I'll find them all",
        "You make 89 feel urgent",
        "My love for you is 89 proof intoxicating"
      ],
      '90': [
        "Ninety and sexy with you",
        "You're my 90-year fantasy",
        "Ninety degrees? The right angle for our love",
        "You make 90 feel sharp",
        "My love for you is 90% of my dreams"
      ],
      '91': [
        "Ninety-one and fun with you",
        "You're my favorite 91st surprise",
        "Ninety-one reasons to live? You're all of them",
        "You make 91 feel precious",
        "My love for you is 91 proof strong"
      ],
      '92': [
        "Ninety-two and true with you",
        "You're my favorite 92nd element",
        "Ninety-two years young with you",
        "You make 92 feel eternal",
        "My love for you is 92 degrees warm"
      ],
      '93': [
        "Ninety-three and free with you",
        "You're my favorite 93rd minute goal",
        "Ninety-three million miles to the sun? You're brighter",
        "You make 93 feel victorious",
        "My love for you is 93 million miles long"
      ],
      '94': [
        "Ninety-four and more with you",
        "You're my favorite 94th element",
        "Ninety-four reasons to smile? You're worth 94 million",
        "You make 94 feel precious",
        "My love for you is 94 proof authentic"
      ],
      '95': [
        "Ninety-five and alive with you",
        "You're my favorite 95th thesis",
        "Ninety-five percent of my thoughts? All you",
        "You make 95 feel revolutionary",
        "My love for you is 95 degrees hot"
      ],
      '96': [
        "Ninety-six and sweet with you",
        "You're my favorite 96 Tears",
        "Ninety-six ways to love you? I know 96 more",
        "You make 96 feel nostalgic",
        "My love for you is 96 proof strong"
      ],
      '97': [
        "Ninety-seven and heaven with you",
        "You're my favorite 97th element",
        "Ninety-seven minutes of bliss with you",
        "You make 97 feel precious",
        "My love for you is 97 degrees perfect"
      ],
      '98': [
        "Ninety-eight and great with you",
        "You're my almost-100 amazing",
        "Ninety-eight degrees? My temperature when I'm with you",
        "You make 98 feel warm",
        "My love for you is 98 proof intoxicating"
      ],
      '99': [
        "Ninety-nine and fine with you",
        "You're my 99 problems but you ain't one",
        "Ninety-nine luftballons? I'd give you 99 more",
        "You make 99 feel complete",
        "My love for you is 99% pure"
      ],
      '100': [
        "One hundred percent yours forever",
        "You're my century of love",
        "One hundred reasons to stay? You're all of them",
        "You make 100 feel complete",
        "My love for you is 100 proof perfect",
        "100 percent of my love is for you.",
        "I'd give you 100 reasons why I love you, but I only need one: you're you."
      ]
    };
  }

  updateDisplay() {
    const display = document.querySelector('.current-input');
    if (display) {
      // In pookie mode, if currentInput contains flirty indicators or is a flirty message, show it as is
      if (this.pookieMode && (this.currentInput.includes('💕') || this.currentInput.includes('❤️') || this.currentInput.includes('✨') || this.currentInput.includes('{answer}') || this.currentInput.length > 10)) {
        display.textContent = this.currentInput;
      } else {
        // Format number with commas for default mode
        const num = parseFloat(this.currentInput);
        if (!isNaN(num)) {
          display.textContent = num.toLocaleString('en-US', {
            maximumFractionDigits: 8,
            useGrouping: true
          });
        } else {
          display.textContent = this.currentInput;
        }
      }
    }

    // Update AC to C when there's input
    const clearButton = document.querySelector('[data-action="clear"]');
    if (clearButton) {
      clearButton.textContent = (this.currentInput === '0' && !this.previousInput) ? 'AC' : 'C';
    }
  }

  handleButtonClick(button) {
    const action = button.dataset.action;
    const number = button.dataset.number;
    const operator = button.dataset.operator;

    // Play sound based on button type
    if (this.soundEnabled) {
      if (number) {
        this.playSound('numbers');
      } else if (operator && operator !== '=') {
        this.playSound('operators');
      } else if (operator === '=') {
        this.playSound('equals');
      } else if (action) {
        if (['memory-add', 'memory-subtract', 'memory-recall', 'memory-clear'].includes(action)) {
          this.playSound('memory');
        } else if (action === 'clear') {
          this.playSound('clear');
        } else {
          this.playSound('functions');
        }
      }
    }

    // Trigger vibration if enabled
    if (this.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    if (number) {
      this.appendNumber(number);
      this.updateDisplay();
    } else if (operator) {
      if (operator === '=') {
        this.compute();
        // Show flirty message in pookie mode (handled in compute method)
      } else {
        this.chooseOperation(operator);
      }
      this.updateDisplay();
    } else if (action) {
      if (action === 'clear') {
        if (button.textContent === 'C') {
          this.currentInput = '0';
          button.textContent = 'AC';
        } else {
          this.clear();
        }
      } else if (action === 'toggle') {
        this.toggleSign();
      } else if (action === 'percent') {
        this.percentage();
      } else if (action === 'memory-add') {
        this.memoryAdd();
      } else if (action === 'memory-subtract') {
        this.memorySubtract();
      } else if (action === 'memory-recall') {
        this.memoryRecall();
      } else if (action === 'memory-clear') {
        this.memoryClear();
      }
      // ── Scientific operations ──
      else if (action === 'sin') {
        const val = parseFloat(this.currentInput);
        const angle = this.useRadians ? val : (val * Math.PI / 180);
        this.currentInput = (this.secondMode ? Math.asin(val) : Math.sin(angle)).toString();
      } else if (action === 'cos') {
        const val = parseFloat(this.currentInput);
        const angle = this.useRadians ? val : (val * Math.PI / 180);
        this.currentInput = (this.secondMode ? Math.acos(val) : Math.cos(angle)).toString();
      } else if (action === 'tan') {
        const val = parseFloat(this.currentInput);
        const angle = this.useRadians ? val : (val * Math.PI / 180);
        this.currentInput = (this.secondMode ? Math.atan(val) : Math.tan(angle)).toString();
      } else if (action === 'ln') {
        this.currentInput = Math.log(parseFloat(this.currentInput)).toString();
      } else if (action === 'log') {
        this.currentInput = Math.log10(parseFloat(this.currentInput)).toString();
      } else if (action === 'sqrt') {
        this.currentInput = Math.sqrt(parseFloat(this.currentInput)).toString();
      } else if (action === 'square') {
        const val = parseFloat(this.currentInput);
        this.currentInput = (val * val).toString();
      } else if (action === 'reciprocal') {
        this.currentInput = (1 / parseFloat(this.currentInput)).toString();
      } else if (action === 'factorial') {
        let n = parseInt(this.currentInput);
        if (n < 0 || n > 170) { this.currentInput = 'Error'; }
        else {
          let result = 1;
          for (let i = 2; i <= n; i++) result *= i;
          this.currentInput = result.toString();
        }
      } else if (action === 'abs') {
        this.currentInput = Math.abs(parseFloat(this.currentInput)).toString();
      } else if (action === 'pi') {
        this.currentInput = Math.PI.toString();
      } else if (action === 'euler') {
        this.currentInput = Math.E.toString();
      } else if (action === 'exp') {
        this.chooseOperation('EXP');
      } else if (action === 'power') {
        this.chooseOperation('^');
      } else if (action === 'rad') {
        this.useRadians = !this.useRadians;
        const radBtn = document.querySelector('[data-action="rad"]');
        if (radBtn) radBtn.textContent = this.useRadians ? 'Rad' : 'Deg';
      } else if (action === 'second') {
        this.secondMode = !this.secondMode;
        const sinBtn = document.querySelector('[data-action="sin"]');
        const cosBtn = document.querySelector('[data-action="cos"]');
        const tanBtn = document.querySelector('[data-action="tan"]');
        if (sinBtn) sinBtn.textContent = this.secondMode ? 'sin⁻¹' : 'sin';
        if (cosBtn) cosBtn.textContent = this.secondMode ? 'cos⁻¹' : 'cos';
        if (tanBtn) tanBtn.textContent = this.secondMode ? 'tan⁻¹' : 'tan';
      } else if (action === 'open-paren') {
        this.currentInput += '(';
      } else if (action === 'close-paren') {
        this.currentInput += ')';
      }
      this.updateDisplay();
    }
  }

  playSound(soundType = 'button') {
    if (!this.soundEnabled) return;

    // Check UI sounds setting
    if (this.uiSoundsEnabled === 'none') return;

    const mode = this.pookieMode ? 'pookie' : 'default';
    const soundFile = `${soundType}.mp3`;

    if (this.sounds[mode] && this.sounds[mode][soundFile]) {
      const audio = this.sounds[mode][soundFile];

      // Reset audio to beginning for multiple rapid clicks
      audio.currentTime = 0;
      audio.play().catch(e => {
        console.warn('Audio playback failed:', e);
      });
    } else {
      // Fallback to simple beep if custom sound fails
      this.playFallbackBeep();
    }
  }
}

// Fixed color palette for pookie mode (only light baby pink and white)
const pookiePalette = {
  name: 'dreamy',
  background: 'linear-gradient(135deg, #fce4ec 0%, #fce4ec 50%, #ffffff 100%)',
  displayBg: 'rgba(252, 228, 236, 0.9)',
  buttonBg: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
  buttonHover: 'linear-gradient(135deg, #f8bbd9, #fce4ec)',
  accent: '#e91e63',
  text: '#c2185b'
};

// Cloud PNG files for transition (place these in /images/clouds/ folder)
// You'll need to add these files:
// - cloud1.png
// - cloud2.png  
// - cloud3.png
// - cloud4.png
// - cloud5.png
// These should be transparent PNG images of white/light clouds

// Function to create button shattering transition
function shatterButtons() {
  console.log('Shattering buttons for transition');
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach((button, index) => {
    // Create 6-8 shattering pieces for each button
    const pieceCount = Math.floor(Math.random() * 3) + 6;

    for (let i = 0; i < pieceCount; i++) {
      const piece = document.createElement('div');
      piece.classList.add('shatter-piece');

      // Get button position and size
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Random position within button
      const angle = (Math.PI * 2 * i) / pieceCount;
      const distance = Math.random() * (Math.min(rect.width, rect.height) / 3);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.width = `${Math.random() * 15 + 8}px`;
      piece.style.height = `${Math.random() * 15 + 8}px`;

      // Random rotation
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;

      // Add to body
      document.body.appendChild(piece);

      // Animate pieces flying outward
      const delay = index * 100 + Math.random() * 200;
      const duration = 800 + Math.random() * 400;

      setTimeout(() => {
        const moveX = (Math.random() - 0.5) * 300;
        const moveY = (Math.random() - 0.5) * 300;
        const rotation = Math.random() * 720;

        piece.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        piece.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${rotation}deg) scale(0)`;
        piece.style.opacity = '0';

        setTimeout(() => piece.remove(), duration);
      }, delay);
    }

    // Hide original button after pieces start flying
    setTimeout(() => {
      button.style.opacity = '0';
      button.style.transform = 'scale(0)';
    }, index * 100 + 100);
  });
}

// Function to create particle effects
function createParticles(button, event) {
  console.log('Creating dreamy white stars for button:', button.textContent);
  const rect = button.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Function to trigger dreamy fade-in effect
  function triggerDreamyFadeIn() {
    console.log('Triggering dreamy fade-in effect');

    // Add dreamy overlay that fades in
    const calculator = document.querySelector('.calculator');
    const dreamyOverlay = document.createElement('div');
    dreamyOverlay.classList.add('dreamy-fade-overlay');
    calculator.appendChild(dreamyOverlay);

    // Remove overlay after animation
    setTimeout(() => {
      dreamyOverlay.remove();
    }, 1500);
  }

  // Create 8-12 dreamy white stars
  const particleCount = Math.floor(Math.random() * 5) + 8;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('dreamy-star');

    // Random dreamy position around the button
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 40;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    // Random size for variety
    const size = 6 + Math.random() * 10;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Add to body
    document.body.appendChild(particle);

    // Dreamy animation with random delay and duration
    const delay = Math.random() * 300;
    const duration = 1500 + Math.random() * 500;

    setTimeout(() => {
      const moveX = (Math.random() - 0.5) * 100;
      const moveY = (Math.random() - 0.5) * 100;
      particle.style.transform = `translate(${moveX}px, ${moveY}px) scale(0) rotate(${Math.random() * 720}deg)`;
      particle.style.opacity = '0';
      setTimeout(() => particle.remove(), duration);
    }, delay);
  }
}

// Function to show iOS-style notification
function showIOSNotification(message, className = 'ios-notification', imageUrl = null, blurBackground = true) {
  // Find all existing iOS notifications
  const existingNotifications = Array.from(document.querySelectorAll('.ios-notification'));

  const notification = document.createElement('div');
  notification.className = `ios-notification ${className}`;
  notification.dataset.stackY = 0;
  notification.dataset.blur = blurBackground;

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Notification';
    img.style.maxWidth = 'min(90vw, 500px)';
    img.style.maxHeight = '80vh';
    img.style.borderRadius = '24px';
    img.style.boxShadow = '0 15px 50px rgba(0, 0, 0, 0.4)';
    notification.style.pointerEvents = 'auto';
    notification.style.cursor = 'pointer';
    notification.appendChild(img);
  } else {
    notification.textContent = message;
  }

  document.body.appendChild(notification);

  // Add blur filter to the main content when notification is shown
  const mainContent = document.querySelector('.calculator') || document.body;

  // Initial state (hidden with offset/blur)
  notification.style.transform = 'var(--notif-transform-start, translateX(-50%) translateY(-100%)) translateY(var(--stack-y, 0px))';
  notification.style.opacity = '0';
  notification.style.filter = blurBackground ? 'blur(4px)' : 'none';
  notification.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), ' +
    'opacity 0.6s ease, ' +
    'filter 0.6s ease';

  if (blurBackground) {
    // Add blur to main content
    mainContent.style.transition = 'filter 0.6s ease';
    mainContent.style.filter = 'blur(0)';
  }

  // Animate in
  requestAnimationFrame(() => {
    setTimeout(() => {
      notification.style.filter = blurBackground ? 'blur(0)' : 'none';
      if (blurBackground) {
        mainContent.style.filter = 'blur(4px)';
      }
      notification.style.transform = 'var(--notif-transform-end, translateX(-50%) translateY(0)) translateY(var(--stack-y, 0px))';
      notification.style.opacity = '1';

      // Shift existing ones up
      const height = notification.offsetHeight || 100;
      const gap = 15;
      const shift = height + gap;

      existingNotifications.forEach(notif => {
        let currentY = parseFloat(notif.dataset.stackY || 0);
        currentY -= shift;
        notif.dataset.stackY = currentY;
        notif.style.setProperty('--stack-y', `${currentY}px`);

        // Refresh transform to apply the new stack-y
        const baseEnd = getComputedStyle(notif).getPropertyValue('--notif-transform-end') || 'translateX(-50%) translateY(0)';
        notif.style.transform = `${baseEnd} translateY(${currentY}px)`;

        // Reset the timer as requested so it "stays a bit" after moving
        if (typeof notif.resetStackTimer === 'function') {
          notif.resetStackTimer();
        }
      });
    }, 10);
  });

  let globalClickListener;

  const removeNotification = () => {
    if (globalClickListener) {
      document.removeEventListener('click', globalClickListener);
    }

    // Manage background blur: only remove if no other blurry notifications exist
    const otherNotifs = Array.from(document.querySelectorAll('.ios-notification')).filter(n => n !== notification);
    const remainingBlurry = otherNotifs.some(n => n.dataset.blur === 'true');

    if (!remainingBlurry) {
      // Completely remove blur and transition to prevent lingering effects
      mainContent.style.filter = 'none';
      mainContent.style.transition = 'none';
      
      // Reset transition after a brief delay to allow for future animations
      setTimeout(() => {
        mainContent.style.transition = '';
      }, 50);
    }

    notification.style.filter = blurBackground ? 'blur(4px)' : 'none';
    notification.style.opacity = '0';

    // Get current offset to keep it during exit animation
    const currentY = notification.dataset.stackY || 0;
    notification.style.transform = `var(--notif-transform-start, translateX(-50%) translateY(-100%)) translateY(${currentY}px)`;

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 600);
  };

  notification.removeNotif = removeNotification;

  notification.resetStackTimer = () => {
    if (notification.autoRemoveTimer) {
      clearTimeout(notification.autoRemoveTimer);
    }
    notification.autoRemoveTimer = setTimeout(notification.removeNotif, 7000);
  };

  globalClickListener = () => {
    if (notification.autoRemoveTimer) clearTimeout(notification.autoRemoveTimer);
    notification.removeNotif();
  };

  // Start initial timer (now 7 seconds)
  notification.resetStackTimer();

  setTimeout(() => {
    document.addEventListener('click', globalClickListener);
  }, 100);
}

// Initialize calculator globally
const calculator = new Calculator();

function openInAppBrowser(url) {
  const browserOverlay = document.createElement('div');
  browserOverlay.classList.add('browser-overlay');

  const browserContainer = document.createElement('div');
  browserContainer.classList.add('browser-container');

  // Browser Header (iOS / macOS Hybrid style)
  const browserHeader = document.createElement('div');
  browserHeader.classList.add('browser-header');

  // Header Left: Close Button
  const closeBtn = document.createElement('button');
  closeBtn.classList.add('browser-close-btn');
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';

  // Header Center: URL Display
  const titleField = document.createElement('div');
  titleField.classList.add('browser-title');
  titleField.innerHTML = `
    <i class="fas fa-lock"></i>
    <span>dub.sh/samfolio</span>
  `;

  // Header Right: Open in Chrome/External
  const openExternalBtn = document.createElement('button');
  openExternalBtn.classList.add('browser-external-btn');
  openExternalBtn.title = "Open in Chrome";
  openExternalBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';

  browserHeader.appendChild(closeBtn);
  browserHeader.appendChild(titleField);
  browserHeader.appendChild(openExternalBtn);

  // Iframe Content
  const browserFrame = document.createElement('iframe');
  browserFrame.classList.add('browser-iframe');
  browserFrame.src = url;
  browserFrame.setAttribute('allowfullscreen', '');
  browserFrame.setAttribute('loading', 'lazy');

  browserContainer.appendChild(browserHeader);
  browserContainer.appendChild(browserFrame);
  browserOverlay.appendChild(browserContainer);
  document.body.appendChild(browserOverlay);

  // Close logic
  const closeBrowser = () => {
    browserOverlay.classList.remove('active');
    setTimeout(() => browserOverlay.remove(), 450);
  };

  closeBtn.addEventListener('click', closeBrowser);
  openExternalBtn.addEventListener('click', () => {
    window.open(url, '_blank');
  });

  browserOverlay.addEventListener('click', (e) => {
    if (e.target === browserOverlay) closeBrowser();
  });

  // Animate in
  setTimeout(() => browserOverlay.classList.add('active'), 10);
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme immediately on page load
  const savedTheme = localStorage.getItem('aestheticTheme') || 'Default';
  const savedDarkMode = localStorage.getItem('aestheticDarkMode') === 'true';
  
  // Apply theme immediately without waiting for theme section to open
  if (savedTheme && typeof applyFigmaTheme === 'function') {
    applyFigmaTheme(savedTheme, savedDarkMode);
  }
  
  // Set dark mode class if needed
  if (savedDarkMode) {
    document.body.classList.add('dark-mode');
  }

  // Show welcome notification with image
  setTimeout(() => {
    const desktopMode = window.innerWidth >= 760 && window.matchMedia('(orientation: landscape)').matches;
    showIOSNotification('', 'ios-notification-welcome', 'notifications/welcome.png', !desktopMode);
  }, 1000);

  // Auto-discover random notifications count
  let totalRandomNotifications = 0;
  function findMaxNotificationFiles(idx) {
    const img = new Image();
    img.onload = () => {
      totalRandomNotifications = idx;
      findMaxNotificationFiles(idx + 1);
    };
    img.onerror = () => { };
    img.src = `notifications/random/${idx}.png`;
  }
  findMaxNotificationFiles(1);

  // Show a random notification every 2 minutes
  setInterval(() => {
    if (totalRandomNotifications > 0) {
      const randomNum = Math.floor(Math.random() * totalRandomNotifications) + 1;
      showIOSNotification('', 'ios-notification-welcome', `notifications/random/${randomNum}.png`, false);
    } else {
      // Fallback
      const randomNum = Math.floor(Math.random() * 3) + 1;
      showIOSNotification('', 'ios-notification-welcome', `notifications/random/${randomNum}.png`, false);
    }
  }, 120000);

  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(button => {
    button.addEventListener('click', (event) => {
      // Handle button click
      calculator.handleButtonClick(button);
    });
  });

  // Add keyboard input functionality
  document.addEventListener('keydown', (event) => {
    const key = event.key;
    
    // Prevent default for calculator keys to avoid browser interference
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '-', '*', '/', '=', 'Enter', 'Escape', 'Backspace'].includes(key)) {
      event.preventDefault();
    }
    
    // Handle number keys and decimal point
    if (key >= '0' && key <= '9') {
      const numberButton = document.querySelector(`[data-number="${key}"]`);
      if (numberButton) {
        calculator.handleButtonClick(numberButton);
        // Add visual feedback
        numberButton.classList.add('active');
        setTimeout(() => numberButton.classList.remove('active'), 100);
      }
    } else if (key === '.') {
      const decimalButton = document.querySelector(`[data-number="."]`);
      if (decimalButton) {
        calculator.handleButtonClick(decimalButton);
        // Add visual feedback
        decimalButton.classList.add('active');
        setTimeout(() => decimalButton.classList.remove('active'), 100);
      }
    }
    
    // Handle operator keys
    else if (key === '+') {
      const plusButton = document.querySelector(`[data-operator="+"]`);
      if (plusButton) {
        calculator.handleButtonClick(plusButton);
        plusButton.classList.add('active');
        setTimeout(() => plusButton.classList.remove('active'), 100);
      }
    } else if (key === '-') {
      const minusButton = document.querySelector(`[data-operator="−"]`);
      if (minusButton) {
        calculator.handleButtonClick(minusButton);
        minusButton.classList.add('active');
        setTimeout(() => minusButton.classList.remove('active'), 100);
      }
    } else if (key === '*' || key === 'x') {
      const multiplyButton = document.querySelector(`[data-operator="×"]`);
      if (multiplyButton) {
        calculator.handleButtonClick(multiplyButton);
        multiplyButton.classList.add('active');
        setTimeout(() => multiplyButton.classList.remove('active'), 100);
      }
    } else if (key === '/') {
      const divideButton = document.querySelector(`[data-operator="÷"]`);
      if (divideButton) {
        calculator.handleButtonClick(divideButton);
        divideButton.classList.add('active');
        setTimeout(() => divideButton.classList.remove('active'), 100);
      }
    }
    
    // Handle equals key (both = and Enter)
    else if (key === '=' || key === 'Enter') {
      const equalsButton = document.querySelector(`[data-operator="="]`);
      if (equalsButton) {
        calculator.handleButtonClick(equalsButton);
        equalsButton.classList.add('active');
        setTimeout(() => equalsButton.classList.remove('active'), 100);
      }
    }
    
    // Handle escape and backspace for clear
    else if (key === 'Escape' || key === 'Backspace') {
      const clearButton = document.querySelector(`[data-action="clear"]`);
      if (clearButton) {
        calculator.handleButtonClick(clearButton);
        clearButton.classList.add('active');
        setTimeout(() => clearButton.classList.remove('active'), 100);
      }
    }
  });

  // Add corner button functionality
  const menuBtn = document.getElementById('menu-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const ribbonBtn = document.getElementById('ribbon-btn');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      showIOSMenu();
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      showSettingsMenu();
    });
  }

  // Load Appearance on Setup
  loadAppearanceSettings();

  function loadAppearanceSettings() {
    const props = ['btn-roundness', 'btn-size', 'btn-text-size', 'accent', 'text-main', 'accent-contrast', 'accent-tint', 'accent-temp', 'accent-glow'];
    props.forEach(prop => {
      const saved = localStorage.getItem(`calc-${prop}`);
      if (saved) {
        document.documentElement.style.setProperty(`--${prop}`, saved);
      }
    });
  }

  // ── KEYBOARD SHORTCUTS ──
  document.addEventListener('keydown', (e) => {
    // ESC key - window management
    if (e.key === 'Escape') {
      if (e.repeat) {
        // Holding ESC - close all windows one by one
        const windows = Array.from(openWindows).reverse(); // Close from top to bottom
        if (windows.length > 0) {
          const topWindow = windows[0];
          const overlay = topWindow.closest('.settings-overlay, .about-overlay, .history-overlay, .ios-menu-overlay, .ios-error-overlay');
          if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            openWindows.delete(topWindow);
          }
        }
      } else {
        // Single ESC press - close current top window
        const windows = Array.from(openWindows).reverse();
        if (windows.length > 0) {
          const topWindow = windows[0];
          const overlay = topWindow.closest('.settings-overlay, .about-overlay, .history-overlay, .ios-menu-overlay, .ios-error-overlay');
          if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            openWindows.delete(topWindow);
          }
        }
      }
    }
    
    // Tab key - toggle main sidebar
    if (e.key === 'Tab') {
      e.preventDefault();
      const menuOverlay = document.querySelector('.ios-menu-overlay');
      if (menuOverlay && menuOverlay.classList.contains('active')) {
        // Close sidebar if open
        menuOverlay.classList.remove('active');
        setTimeout(() => {
          if (menuOverlay.parentNode) {
            menuOverlay.remove();
          }
        }, 350);
      } else {
        // Open sidebar if closed
        if (menuOverlay) {
          menuOverlay.classList.add('active');
        } else {
          showIOSMenu();
        }
      }
    }
    
    // Window shortcuts
    if (e.key.toLowerCase() === 'h') {
      e.preventDefault();
      showHistory(); // Open History window
    }
    if (e.key.toLowerCase() === 'c') {
      e.preventDefault();
      showSettingsMenu(); // Open Settings window
    }
    if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      showAestheticMenu(); // Open Aesthetics window
    }
    if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      showSoundsMenu(); // Open Sounds window
    }
    if (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'x') {
      e.preventDefault();
      showAboutWindow(); // Open About window
    }
    
    // P key - toggle pookie mode
    if (e.key.toLowerCase() === 'p') {
      calculator.togglePookieMode();
    }
    
    // Space long press - toggle pookie mode (handled separately)
    
    // Calculator number keys
    if (e.key >= '0' && e.key <= '9') {
      calculator.handleNumberInput(e.key);
    }
    
    // Calculator operations
    if (e.key === '+') calculator.handleOperator('+');
    if (e.key === '-') calculator.handleOperator('-');
    if (e.key === '*') calculator.handleOperator('*');
    if (e.key === '/') calculator.handleOperator('/');
    if (e.key === '%') calculator.handleOperator('%');
    if (e.key === '.') calculator.handleNumberInput('.');
    
    // Enter key for equals
    if (e.key === 'Enter') {
      calculator.handleEquals();
    }
    
    // Backspace for delete
    if (e.key === 'Backspace') {
      calculator.handleDelete();
    }
    
    // Arrow keys for navigation
    if (e.key === 'ArrowUp') {
      // Navigate up in history or menu
      e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
      // Navigate down in history or menu
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft') {
      // Navigate left or back
      e.preventDefault();
    }
    if (e.key === 'ArrowRight') {
      // Navigate right or forward (also works as equals)
      e.preventDefault();
      calculator.handleEquals();
    }
  });
  
  // Close sidebar when clicking calculator
  document.addEventListener('click', (e) => {
    const menuOverlay = document.querySelector('.ios-menu-overlay');
    const calculator = document.querySelector('.calculator');
    
    if (menuOverlay && menuOverlay.classList.contains('active') && 
        calculator && calculator.contains(e.target) && 
        !e.target.closest('.ios-menu-container')) {
      // Click on calculator while sidebar is open - close sidebar
      menuOverlay.classList.remove('active');
      setTimeout(() => {
        if (menuOverlay.parentNode) {
          menuOverlay.remove();
        }
      }, 350);
    }
  });
  
  // Space long press for pookie mode
  let spacePressTimer;
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !e.repeat) {
      spacePressTimer = setTimeout(() => {
        calculator.togglePookieMode();
      }, 500); // 500ms long press
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
      clearTimeout(spacePressTimer);
    }
  });

  // ── REUSABLE MACOS WINDOW LOGIC ──
  // Global window management
  let highestZIndex = 10000;
  const openWindows = new Set();
  let windowCascadeOffset = { x: 0, y: 0 }; // Track cascading position

  function initMacOSWindow(windowContainer, windowOverlay, titleBar, onClose, bubbleIconSVG, customConfig = {}) {
    windowContainer.classList.add('macos-window');
    
    // Window management - assign highest z-index and track window
    highestZIndex++;
    windowContainer.style.zIndex = highestZIndex;
    windowOverlay.style.zIndex = highestZIndex - 1; // Overlay slightly below container
    openWindows.add(windowContainer);
    
    // Bring to front on click
    const bringToFront = () => {
      if (!windowContainer.classList.contains('minimized')) {
        highestZIndex++;
        windowContainer.style.zIndex = highestZIndex;
        windowOverlay.style.zIndex = highestZIndex - 1; // Keep overlay below container
      }
    };
    
    // Add click listeners to entire window container and titlebar
    windowContainer.addEventListener('mousedown', bringToFront);
    titleBar.addEventListener('mousedown', bringToFront);

    // Add Revert Button for Maximized Mode
    const revertBtn = document.createElement('button');
    revertBtn.classList.add('revert-maximize-btn');
    revertBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
    windowOverlay.appendChild(revertBtn);

    // Initial positioning (Centered) - Default size with responsive scaling for small screens
    const defaultWidth = 1056; // Default width (1.5 inches less than 1200px)
    const defaultHeight = 594; // Default height (16:9 ratio of 960px)
    
    const maxWidth = Math.min(defaultWidth, window.innerWidth * 0.85); // Use default or 85% of screen
    const maxHeight = Math.min(defaultHeight, window.innerHeight * 0.80); // Use default or 80% of screen
    
    const initialWidth = customConfig.width || maxWidth;
    const initialHeight = customConfig.height || (initialWidth * 9 / 16); // 16:9 ratio
    
    // Calculate cascading position
    const centerX = (window.innerWidth - initialWidth) / 2;
    const centerY = (window.innerHeight - initialHeight) / 2;
    
    // Apply cascading offset (30px down, 30px left for each new window)
    const finalX = centerX - windowCascadeOffset.x;
    const finalY = centerY + windowCascadeOffset.y;
    
    // Update cascade offset for next window
    windowCascadeOffset.x += 30;
    windowCascadeOffset.y += 30;
    
    // Reset offset if it goes too far
    if (windowCascadeOffset.x > 150 || windowCascadeOffset.y > 150) {
      windowCascadeOffset.x = 0;
      windowCascadeOffset.y = 0;
    }
    
    windowContainer.style.width = `${initialWidth}px`;
    windowContainer.style.height = `${initialHeight}px`;
    windowContainer.style.top = `${finalY}px`;
    windowContainer.style.left = `${finalX}px`;

    // Resize Handles
    const handles = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    handles.forEach(dir => {
      const h = document.createElement('div');
      h.classList.add('resize-handle', dir);
      h.dataset.direction = dir;
      windowContainer.appendChild(h);
      h.addEventListener('mousedown', (e) => startResizing(e, dir));
      h.addEventListener('touchstart', (e) => startResizing(e, dir), { passive: false });
    });

    let isMoving = false, isResizing = false, resizeDir = '', offset = { x: 0, y: 0 };
    let startRect = null, startPos = { x: 0, y: 0 }, savedRect = null;
    let bubblePhysicsId = null, bubbleData = { x: 20, y: 20, vx: 2, vy: 2 };
    let lastDragPos = { x: 0, y: 0 }, dragStartTime = 0, lastMoveTime = 0;

    const startMoving = (e) => {
      if (windowContainer.classList.contains('maximized')) return;
      if (e.target.closest('.traffic-light')) return;
      isMoving = true;
      dragStartTime = Date.now();
      windowContainer.classList.add('window-moving');
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      const rect = windowContainer.getBoundingClientRect();
      offset.x = clientX - rect.left;
      offset.y = clientY - rect.top;
      lastDragPos = { x: clientX, y: clientY };
      document.body.style.userSelect = 'none';
    };

    const startResizing = (e, dir) => {
      if (windowContainer.classList.contains('maximized') || windowContainer.classList.contains('minimized')) return;
      isResizing = true;
      resizeDir = dir;
      windowContainer.classList.add('window-resizing');
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      const rect = windowContainer.getBoundingClientRect();
      startRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      startPos = { x: clientX, y: clientY };
      e.stopPropagation();
      if (!e.type.includes('touch')) e.preventDefault();
      document.body.style.userSelect = 'none';
      document.body.style.cursor = window.getComputedStyle(e.target).cursor;
    };

    const onMove = (e) => {
      if (!isMoving && !isResizing) return;
      const clientX = e.type.includes('touch') ? (e.touches[0] ? e.touches[0].clientX : 0) : e.clientX;
      const clientY = e.type.includes('touch') ? (e.touches[0] ? e.touches[0].clientY : 0) : e.clientY;

      if (isMoving) {
        if (windowContainer.classList.contains('minimized')) {
          const now = Date.now();
          const dt = (now - lastMoveTime) || 16;
          bubbleData.vx = (clientX - lastDragPos.x) / (dt / 16);
          bubbleData.vy = (clientY - lastDragPos.y) / (dt / 16);
          lastMoveTime = now;
          lastDragPos = { x: clientX, y: clientY };
          bubbleData.x = clientX - offset.x;
          bubbleData.y = clientY - offset.y;
          windowContainer.style.left = `${bubbleData.x}px`;
          windowContainer.style.top = `${bubbleData.y}px`;
        } else {
          windowContainer.style.left = `${clientX - offset.x}px`;
          windowContainer.style.top = `${clientY - offset.y}px`;
        }
      } else if (isResizing) {
        const dx = clientX - startPos.x, dy = clientY - startPos.y;
        let newWidth = startRect.width, newHeight = startRect.height, newLeft = startRect.left, newTop = startRect.top;
        if (resizeDir.includes('right')) newWidth = Math.max(400, startRect.width + dx);
        if (resizeDir.includes('bottom')) newHeight = Math.max(300, startRect.height + dy);
        if (resizeDir.includes('left')) { newWidth = Math.max(400, startRect.width - dx); if (newWidth > 400) newLeft = startRect.left + dx; }
        if (resizeDir.includes('top')) { newHeight = Math.max(300, startRect.height - dy); if (newHeight > 300) newTop = startRect.top + dy; }
        windowContainer.style.width = `${newWidth}px`; windowContainer.style.height = `${newHeight}px`;
        windowContainer.style.left = `${newLeft}px`; windowContainer.style.top = `${newTop}px`;
      }
    };

    const stopMove = () => {
      if (isMoving && windowContainer.classList.contains('minimized')) {
        bubbleData.vx = Math.max(-15, Math.min(15, bubbleData.vx));
        bubbleData.vy = Math.max(-15, Math.min(15, bubbleData.vy));
      }
      isMoving = false; isResizing = false;
      windowContainer.classList.remove('window-moving', 'window-resizing');
      document.body.style.userSelect = ''; document.body.style.cursor = '';
    };

    // Double-click titlebar to maximize
    titleBar.addEventListener('dblclick', (e) => {
      if (!e.target.closest('.traffic-light')) {
        toggleMaximize();
      }
    });
    
    titleBar.addEventListener('mousedown', startMoving);
    titleBar.addEventListener('touchstart', startMoving, { passive: true });
    windowContainer.addEventListener('mousedown', (e) => { if (windowContainer.classList.contains('minimized')) startMoving(e); });
    windowContainer.addEventListener('touchstart', (e) => { if (windowContainer.classList.contains('minimized')) startMoving(e); }, { passive: true });

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', stopMove);

    const toggleMaximize = () => {
      if (windowContainer.classList.contains('maximized')) {
        windowContainer.classList.remove('maximized');
        if (savedRect) {
          windowContainer.style.width = `${savedRect.w}px`; windowContainer.style.height = `${savedRect.h}px`;
          windowContainer.style.top = `${savedRect.t}px`; windowContainer.style.left = `${savedRect.l}px`;
        }
      } else {
        const rect = windowContainer.getBoundingClientRect();
        savedRect = { w: rect.width, h: rect.height, t: rect.top, l: rect.left };
        windowContainer.classList.add('maximized');
      }
    };

    const startBubblePhysics = () => {
      if (bubblePhysicsId) return;
      const size = 65;
      const updateBubble = () => {
        if (!windowContainer.classList.contains('minimized')) { bubblePhysicsId = null; return; }
        if (isMoving) { bubblePhysicsId = requestAnimationFrame(updateBubble); return; }
        bubbleData.x += bubbleData.vx; bubbleData.y += bubbleData.vy;
        const maxX = window.innerWidth - size, maxY = window.innerHeight - size;
        if (bubbleData.x <= 0) { bubbleData.x = 0; bubbleData.vx = Math.abs(bubbleData.vx) * 0.95; }
        if (bubbleData.x >= maxX) { bubbleData.x = maxX; bubbleData.vx = -Math.abs(bubbleData.vx) * 0.95; }
        if (bubbleData.y <= 0) { bubbleData.y = 0; bubbleData.vy = Math.abs(bubbleData.vy) * 0.95; }
        if (bubbleData.y >= maxY) { bubbleData.y = maxY; bubbleData.vy = -Math.abs(bubbleData.vy) * 0.95; }
        bubbleData.vx *= 0.998; bubbleData.vy *= 0.998;
        if (Math.abs(bubbleData.vx) < 0.2) bubbleData.vx = (Math.random() - 0.5) * 2;
        if (Math.abs(bubbleData.vy) < 0.2) bubbleData.vy = (Math.random() - 0.5) * 2;
        windowContainer.style.left = `${bubbleData.x}px`; windowContainer.style.top = `${bubbleData.y}px`;
        bubblePhysicsId = requestAnimationFrame(updateBubble);
      };
      bubblePhysicsId = requestAnimationFrame(updateBubble);
    };

    const toggleMinimize = () => {
      if (windowContainer.classList.contains('minimized')) {
        if (bubblePhysicsId) cancelAnimationFrame(bubblePhysicsId);
        bubblePhysicsId = null;
        windowContainer.classList.remove('minimized');
        windowOverlay.classList.remove('minimized-active');
        const icon = windowContainer.querySelector('.bubble-icon'); if (icon) icon.remove();
        if (savedRect) {
          windowContainer.style.width = `${savedRect.w}px`; windowContainer.style.height = `${savedRect.h}px`;
          windowContainer.style.top = `${savedRect.t}px`; windowContainer.style.left = `${savedRect.l}px`;
        }
      } else {
        const rect = windowContainer.getBoundingClientRect();
        savedRect = { w: rect.width, h: rect.height, t: rect.top, l: rect.left };
        bubbleData.x = 20; bubbleData.y = 20; bubbleData.vx = 2.5; bubbleData.vy = 2.5;
        windowContainer.classList.add('minimized');
        windowOverlay.classList.add('minimized-active');
        if (!windowContainer.querySelector('.bubble-icon')) {
          const svgContainer = document.createElement('div');
          svgContainer.className = 'bubble-icon';
          svgContainer.innerHTML = bubbleIconSVG;
          windowContainer.appendChild(svgContainer);
        }
        startBubblePhysics();
      }
    };

    const lights = titleBar.querySelector('.macos-traffic-lights');
    if (lights) {
      lights.querySelector('.red').addEventListener('click', onClose);
      lights.querySelector('.yellow').addEventListener('click', toggleMinimize);
      lights.querySelector('.green').addEventListener('click', toggleMaximize);
    }
    revertBtn.addEventListener('click', toggleMaximize);
    windowContainer.addEventListener('click', (e) => {
      if (windowContainer.classList.contains('minimized') && Date.now() - dragStartTime < 200) toggleMinimize();
    });

    return { 
      toggleMinimize, 
      toggleMaximize, 
      stopPhysics: () => { 
        if (bubblePhysicsId) cancelAnimationFrame(bubblePhysicsId); 
      },
      cleanup: () => {
        openWindows.delete(windowContainer);
      }
    };
  }

  // Define functions first
  // Define functions first
  
  // Function to add resizer functionality to any sidebar
  function addSidebarResizer(sidebar, storageKey = 'sidebarWidth') {
    // Add resizer element
    const resizer = document.createElement('div');
    resizer.classList.add('settings-sidebar-resizer');
    sidebar.appendChild(resizer);

    // Resizer functionality
    let isResizing = false;
    let resizeStartX = 0;
    let startWidth = 0;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizeStartX = e.clientX;
      startWidth = sidebar.offsetWidth;
      resizer.classList.add('dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - resizeStartX;
      const newWidth = startWidth + deltaX;
      
      // Constrain to min/max width
      if (newWidth >= 150 && newWidth <= 250) {
        sidebar.style.width = newWidth + 'px';
        localStorage.setItem(storageKey, newWidth + 'px');
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('dragging');
      }
    });

    // Load saved width
    const savedWidth = localStorage.getItem(storageKey);
    if (savedWidth) {
      sidebar.style.width = savedWidth;
    }
  }

  function showIOSMenu() {
    // Create iOS-style menu overlay
    const menuOverlay = document.createElement('div');
    menuOverlay.classList.add('ios-menu-overlay');

    const menuContainer = document.createElement('div');
    menuContainer.classList.add('ios-menu-container');

    // Add resizer element
    const menuResizer = document.createElement('div');
    menuResizer.classList.add('ios-menu-resizer');

    // Build header
    const header = document.createElement('div');
    header.classList.add('ios-menu-header');
    header.innerHTML = `
      <div class="ios-menu-app-icon"><img src="icons/app_icon.png" alt="Calovetor" style="width:100%;height:100%;object-fit:contain;border-radius:10px;"></div>
      <div class="ios-menu-app-info">
        <div class="ios-menu-app-name">Calovetor</div>
        <div class="ios-menu-app-version">Sam Devlopments</div>
      </div>
    `;
    menuContainer.appendChild(header);

    // Section 1: Main
    const mainSection = document.createElement('div');
    mainSection.classList.add('ios-menu-section');
    mainSection.innerHTML = `<div class="ios-menu-section-label">Menu</div>`;

    const mainItems = [
      { text: 'History', action: 'history', icon: 'fa-clock-rotate-left', color: 'var(--accent)' },
      { text: 'Config', action: 'settings', icon: 'fa-sliders', color: '#636366' },
      { text: 'Aesthetic', action: 'aesthetic', icon: 'fa-palette', color: '#ff69b4' },
      { text: 'Sounds', action: 'sounds', icon: 'fa-volume-up', color: '#007AFF' },
      { text: 'Keys', action: 'keys', icon: 'fa-keyboard', color: '#ff9500' },
    ];

    mainItems.forEach(option => {
      const item = document.createElement('div');
      item.classList.add('ios-menu-item');
      item.innerHTML = `
        <div class="ios-menu-item-icon"><i class="fas ${option.icon}"></i></div>
        <span class="ios-menu-item-label">${option.text}</span>
        <i class="fas fa-chevron-right ios-menu-item-chevron"></i>
      `;
      item.addEventListener('click', () => {
        handleMenuSelection(option.action);
        closeIOSMenu();
      });
      mainSection.appendChild(item);
    });
    menuContainer.appendChild(mainSection);

    // Separator
    const sep = document.createElement('div');
    sep.classList.add('ios-menu-separator');
    menuContainer.appendChild(sep);

    // Section 2: More
    const moreSection = document.createElement('div');
    moreSection.classList.add('ios-menu-section');
    moreSection.innerHTML = `<div class="ios-menu-section-label">More</div>`;

    const moreItems = [
      { text: 'Developer', action: 'about', icon: 'fa-circle-info', color: '#34c759' },
    ];

    moreItems.forEach(option => {
      const item = document.createElement('div');
      item.classList.add('ios-menu-item');
      item.innerHTML = `
        <div class="ios-menu-item-icon" style="background:${option.color}"><i class="fas ${option.icon}"></i></div>
        <span class="ios-menu-item-label">${option.text}</span>
        <i class="fas fa-chevron-right ios-menu-item-chevron"></i>
      `;
      item.addEventListener('click', () => {
        handleMenuSelection(option.action);
        closeIOSMenu();
      });
      moreSection.appendChild(item);
    });
    menuContainer.appendChild(moreSection);

    // Footer
    const footer = document.createElement('div');
    footer.classList.add('ios-menu-footer');
    footer.innerHTML = `<div class="ios-menu-footer-text">Calovetor • By Samad Khan</div>`;
    menuContainer.appendChild(footer);

    // Append resizer to menu container
    menuContainer.appendChild(menuResizer);

    // Resizer functionality
    let isResizing = false;
    let resizeStartX = 0;
    let startWidth = 0;

    menuResizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizeStartX = e.clientX;
      startWidth = menuContainer.offsetWidth;
      menuResizer.classList.add('dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - resizeStartX;
      const newWidth = startWidth + deltaX;
      
      // Constrain to min/max width
      if (newWidth >= 200 && newWidth <= 400) {
        menuContainer.style.width = newWidth + 'px';
        localStorage.setItem('menuWidth', newWidth + 'px');
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        menuResizer.classList.remove('dragging');
      }
    });

    // Load saved width
    const savedWidth = localStorage.getItem('menuWidth');
    if (savedWidth) {
      menuContainer.style.width = savedWidth;
    }

    // Swipe-to-close (touch)
    let isDragging = false, swipeStartX = 0, currentX = 0;
    menuContainer.addEventListener('touchstart', (e) => {
      isDragging = true;
      swipeStartX = e.touches[0].clientX;
      currentX = 0;
      menuContainer.style.transition = 'none';
    });
    menuContainer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const delta = e.touches[0].clientX - swipeStartX;
      currentX = Math.min(0, delta);
      menuContainer.style.transform = `translateX(${currentX}px)`;
    });
    menuContainer.addEventListener('touchend', () => {
      isDragging = false;
      menuContainer.style.transition = '';
      if (currentX < -80) closeIOSMenu();
      else menuContainer.style.transform = 'translateX(0)';
    });

    // Removed click outside to close - only close button works

    menuOverlay.appendChild(menuContainer);
    document.body.appendChild(menuOverlay);

    // Animate in
    setTimeout(() => menuOverlay.classList.add('active'), 10);
  }

  function closeIOSMenu() {
    const menuOverlay = document.querySelector('.ios-menu-overlay');
    if (menuOverlay) {
      menuOverlay.classList.remove('active');
      setTimeout(() => {
        menuOverlay.remove();
      }, 300);
    }
  }

  function handleMenuSelection(action) {
    switch (action) {
      case 'settings':
        showSettingsMenu();
        break;
      case 'history':
        showHistory();
        break;
      case 'about':
        showPookieBox();
        break;
      case 'aesthetic':
        showAestheticMenu();
        break;
      case 'sounds':
        showSoundsMenu();
        break;
      case 'keys':
        showKeysMenu();
        break;
    }
  }

  async function showHistory() {
    try {
      const [historyLinesResponse, errorMessagesResponse] = await Promise.all([
        fetch('history_lines.txt'),
        fetch('error_messages.txt')
      ]);

      const historyLinesText = await historyLinesResponse.text();
      const errorMessagesText = await errorMessagesResponse.text();

      const historyLines = historyLinesText.split('\n').filter(line => line.trim() !== '');
      const errorMessages = errorMessagesText.split('\n').filter(line => line.trim() !== '');

      createHistoryUI(historyLines, errorMessages);
    } catch (error) {
      console.error('History data fetch failed, using fallback.', error);
      showHistoryFallback();
    }
  }

  function showHistoryFallback() {
    const historyLines = [
      'Magical calculation completed!',
      'Numbers danced together perfectly',
      'Mathematical magic happened here',
      'Stars aligned for this result',
      'Pookie power activated',
      'Dreamy digits computed',
      'Calculation completed with love',
      'Numbers whispered their secret',
      'Mathematical poetry in motion',
      'Pookie mode enhanced result'
    ];

    const errorMessages = [
      'Oops! That calculation got lost in the clouds ☁️',
      'Hmm, that number seems to have floated away...',
      'Calculation vanished into thin air! ✨',
      'That result decided to take a vacation 🏖️',
      'Numbers are playing hide and seek! 🙈',
      'Calculation took a magical detour...',
      'That answer is hiding in the pookie realm',
      'Mathematical mystery unsolved! 🔮',
      'Calculation evaporated like morning dew',
      'Numbers went on a coffee break ☕'
    ];

    createHistoryUI(historyLines, errorMessages);
  }

  function createHistoryUI(historyLines, errorMessages) {
    const historyOverlay = document.createElement('div');
    historyOverlay.classList.add('history-overlay');
    if (calculator.pookieMode) historyOverlay.classList.add('pookie-active');

    // Layout State
    let currentView = 'list';
    let bubblePhysicsId = null;
    let bubbles = [];

    // Physics Engine for Bubble View
    const startBubblePhysics = () => {
      const container = historyItemsContainer;
      const rect = container.getBoundingClientRect();
      const width = rect.width || 600;
      const height = 450;
      const bubbleSize = 145;

      bubbles.forEach(b => {
        b.x = Math.random() * (width - bubbleSize);
        b.y = Math.random() * (height - bubbleSize);
        b.vx = (Math.random() - 0.5) * 1.5;
        b.vy = (Math.random() - 0.5) * 1.5;
      });

      const update = () => {
        bubbles.forEach(b => {
          if (b.isDragging) return;
          b.x += b.vx;
          b.y += b.vy;
          if (b.x <= 0) { b.x = 0; b.vx *= -1; }
          if (b.x >= width - bubbleSize) { b.x = width - bubbleSize; b.vx *= -1; }
          if (b.y <= 0) { b.y = 0; b.vy *= -1; }
          if (b.y >= height - bubbleSize) { b.y = height - bubbleSize; b.vy *= -1; }
          b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
        });
        bubblePhysicsId = requestAnimationFrame(update);
      };
      update();
    };

    const stopBubblePhysics = () => {
      if (bubblePhysicsId) cancelAnimationFrame(bubblePhysicsId);
    };

    const historyContainer = document.createElement('div');
    historyContainer.classList.add('history-container');

    // MacOS / iOS Title Bar
    const titleBar = document.createElement('div');
    titleBar.classList.add('macos-title-bar');

    // Traffic lights for Mac
    const trafficLights = document.createElement('div');
    trafficLights.classList.add('macos-traffic-lights');
    trafficLights.innerHTML = `
      <div class="traffic-light red"></div>
      <div class="traffic-light yellow" title="Minimize"></div>
      <div class="traffic-light green" title="Maximize"></div>
    `;

    const closeHistory = () => {
    stopBubblePhysics(); // Stop item bubbles
    winLogic.stopPhysics(); // Stop window minimize physics
    winLogic.cleanup(); // Clean up window tracking
    historyOverlay.classList.remove('active');
    setTimeout(() => historyOverlay.remove(), 350);
  };

  const title = document.createElement('div');
    title.classList.add('macos-title');
    title.textContent = 'Calculation History';

    // Done button for iOS mobile
    const doneBtn = document.createElement('div');
    doneBtn.classList.add('ios-done-btn');
    doneBtn.addEventListener('click', closeHistory);

    titleBar.appendChild(trafficLights);
    titleBar.appendChild(title);
    titleBar.appendChild(doneBtn);

    const historyIconSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    `;

    const winLogic = initMacOSWindow(historyContainer, historyOverlay, titleBar, closeHistory, historyIconSVG);

    historyContainer.appendChild(titleBar);

    // Window Body
    const windowBody = document.createElement('div');
    windowBody.classList.add('settings-window-body');

    // Content area
    const content = document.createElement('div');
    content.classList.add('settings-content');

    let recentSort = 'newest';

    const historyTop = document.createElement('div');
    historyTop.innerHTML = `

      
      <!-- Layout Switcher (Visible in All) -->
      <div class="macos-settings-row view-switcher-tabs-navigation">
        <div class="tabs-nav">
          <div class="tab active" data-tab="themes">Themes</div>
          <div class="tab" data-tab="documentation">Documentation</div>
        </div>
        <div class="row-info">
          <div class="row-title">History Feed</div>
          <div class="row-subtitle">Choose how you see your history.</div>
        </div>
        <div class="segmented-control">
          <button class="segment active" data-view="list" title="List View"><i class="fas fa-list"></i></button>
          <button class="segment" data-view="grid" title="Grid View"><i class="fas fa-th-large"></i></button>
          <button class="segment" data-view="bubble" title="Bubble Physics Mode"><i class="fas fa-circle"></i></button>
        </div>
      </div>

      <!-- Recent Toolbar (Visible in Recent) -->
      <div class="macos-settings-row recent-toolbar" style="display: none;">
        <div class="row-info">
          <div class="row-title">Recent Activity</div>
          <div class="row-subtitle">Showing your last 10 actions.</div>
        </div>
        <button class="ios-sort-toggle-btn" title="Toggle Sort Order">
          <i class="fas fa-sort"></i>
        </button>
      </div>

      <div class="macos-settings-row sorting-toolbar" style="display: none;">
        <div class="row-info">
          <div class="row-title">Advanced Sorting</div>
          <div class="row-subtitle">Organize your past equations.</div>
        </div>
        <select class="ios-select history-sort-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="value-high">Highest Result</option>
          <option value="value-low">Lowest Result</option>
          <option value="longest">Longest Equation</option>
          <option value="shortest">Shortest Equation</option>
          <option value="complexity-high">Most Complex</option>
          <option value="complexity-low">Simplest</option>
        </select>
      </div>
    `;

    const historyItemsContainer = document.createElement('div');
    historyItemsContainer.classList.add('history-items');

    const renderHistory = (sortBy = 'newest', limit = 30) => {
      stopBubblePhysics();
      historyItemsContainer.innerHTML = '';
      historyItemsContainer.className = `history-items ${currentView}-view`;

      let list = [...calculator.history];
      bubbles = [];

      const getResult = (calc) => parseFloat(calc.split('=')[1]) || 0;
      const getOpCount = (calc) => (calc.split('=')[0].match(/[+−×÷^√]/g) || []).length;

      if (sortBy === 'oldest') {
        list.reverse();
      } else if (sortBy === 'longest') {
        list.sort((a, b) => b.calculation.length - a.calculation.length);
      } else if (sortBy === 'shortest') {
        list.sort((a, b) => a.calculation.length - b.calculation.length);
      } else if (sortBy === 'value-high') {
        list.sort((a, b) => getResult(b.calculation) - getResult(a.calculation));
      } else if (sortBy === 'value-low') {
        list.sort((a, b) => getResult(a.calculation) - getResult(b.calculation));
      } else if (sortBy === 'complexity-high') {
        list.sort((a, b) => getOpCount(b.calculation) - getOpCount(a.calculation));
      } else if (sortBy === 'complexity-low') {
        list.sort((a, b) => getOpCount(a.calculation) - getOpCount(b.calculation));
      }

      const itemsToShow = Math.min(list.length, limit);
      for (let i = 0; i < itemsToShow; i++) {
        const item = list[i];
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        if (currentView === 'bubble') historyItem.classList.add('bubble');

        const lineIndex = i % historyLines.length;
        const description = historyLines[lineIndex];

        historyItem.innerHTML = `
          <div class="history-calculation">${item.calculation}</div>
          <div class="history-description">${description}</div>
        `;

        historyItem.addEventListener('click', () => {
          if (historyItem.dataset.isDragging === 'true') return;
          const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
          showIOSError(randomError);
        });

        if (currentView === 'bubble') {
          const bObj = { el: historyItem, x: 0, y: 0, vx: 0, vy: 0, isDragging: false };
          bubbles.push(bObj);

          let startX, startY;
          const startDrag = (clientX, clientY) => {
            bObj.isDragging = true;
            historyItem.dataset.isDragging = 'false';
            startX = clientX - bObj.x;
            startY = clientY - bObj.y;
          };
          const moveDrag = (clientX, clientY) => {
            bObj.x = clientX - startX;
            bObj.y = clientY - startY;
            historyItem.style.transform = `translate3d(${bObj.x}px, ${bObj.y}px, 0)`;
            historyItem.dataset.isDragging = 'true';
          };

          historyItem.addEventListener('mousedown', (e) => {
            startDrag(e.clientX, e.clientY);
            const mm = (ev) => moveDrag(ev.clientX, ev.clientY);
            const mu = () => {
              bObj.isDragging = false;
              document.removeEventListener('mousemove', mm);
              document.removeEventListener('mouseup', mu);
            };
            document.addEventListener('mousemove', mm);
            document.addEventListener('mouseup', mu);
          });

          historyItem.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            startDrag(t.clientX, t.clientY);
            const tm = (ev) => moveDrag(ev.touches[0].clientX, ev.touches[0].clientY);
            const te = () => {
              bObj.isDragging = false;
              document.removeEventListener('touchmove', tm);
              document.removeEventListener('touchend', te);
            };
            document.addEventListener('touchmove', tm);
            document.addEventListener('touchend', te);
          });
        }

        historyItemsContainer.appendChild(historyItem);
      }

      if (itemsToShow === 0) {
        historyItemsContainer.innerHTML = '<div class="no-history">No calculations yet! ✨</div>';
      }

      if (currentView === 'bubble' && itemsToShow > 0) startBubblePhysics();
    };

    renderHistory();

    content.appendChild(historyTop);
    content.appendChild(historyItemsContainer);

    const sortSelect = historyTop.querySelector('.history-sort-select');
    sortSelect.addEventListener('change', (e) => renderHistory(e.target.value));

    const recentSortBtn = historyTop.querySelector('.ios-sort-toggle-btn');
    recentSortBtn.addEventListener('click', () => {
      recentSort = (recentSort === 'newest') ? 'oldest' : 'newest';
      renderHistory(recentSort, 10);
    });

    const viewButtons = historyTop.querySelectorAll('.segment');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        renderHistory();
      });
    });

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.classList.add('settings-sidebar');

    const sidebarItems = [
      { id: 'all', icon: 'fa-list', label: 'All' },
      { id: 'recent', icon: 'fa-clock', label: 'Recent' },
      { id: 'sort', icon: 'fa-sort-amount-down', label: 'Sort' }
    ];

    sidebarItems.forEach((item, index) => {
      const sbItem = document.createElement('div');
      sbItem.classList.add('sidebar-item');
      if (index === 0) sbItem.classList.add('active');
      sbItem.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;

      sbItem.addEventListener('click', () => {
        sidebar.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        sbItem.classList.add('active');

        const toolbarSort = content.querySelector('.sorting-toolbar');
        const toolbarView = content.querySelector('.view-switcher-toolbar');
        const toolbarRecent = content.querySelector('.recent-toolbar');

        if (item.id === 'sort') {
          toolbarSort.style.display = 'flex';
          toolbarView.style.display = 'none';
          toolbarRecent.style.display = 'none';
          renderHistory(sortSelect.value);
        } else if (item.id === 'recent') {
          toolbarSort.style.display = 'none';
          toolbarView.style.display = 'none';
          toolbarRecent.style.display = 'flex';
          renderHistory(recentSort, 10);
        } else {
          toolbarSort.style.display = 'none';
          toolbarView.style.display = 'flex';
          toolbarRecent.style.display = 'none';
          renderHistory('newest', 30);
        }
      });
      sidebar.appendChild(sbItem);
    });

    // Add resizer to History sidebar
    addSidebarResizer(sidebar, 'historySidebarWidth');

    windowBody.appendChild(sidebar);
    windowBody.appendChild(content);

    historyContainer.appendChild(windowBody);
    historyOverlay.appendChild(historyContainer);
    document.body.appendChild(historyOverlay);

    setTimeout(() => historyOverlay.classList.add('active'), 10);
    // Removed click outside to close - only close button works
  }

  function showIOSError(message) {
    // Play error sound
    calculator.playErrorSound();
    
    const errorOverlay = document.createElement('div');
    errorOverlay.classList.add('error-alert-overlay');

    const errorContainer = document.createElement('div');
    errorContainer.classList.add('error-alert-container');
    
    // Make error container draggable
    errorContainer.style.cursor = 'move';
    errorContainer.draggable = true;

    // MacOS Traffic Lights (Header)
    const macosHeader = document.createElement('div');
    macosHeader.classList.add('error-macos-header');
    macosHeader.innerHTML = `
      <div class="macos-traffic-lights">
        <div class="traffic-light red"></div>
        <div class="traffic-light yellow"></div>
        <div class="traffic-light green"></div>
      </div>
    `;

    // Content body
    const bodyContainer = document.createElement('div');
    bodyContainer.classList.add('error-alert-body');

    const titleEl = document.createElement('div');
    titleEl.classList.add('error-alert-title');
    titleEl.innerHTML = `
      <img src="icons/pookie_mode_button.png" class="error-alert-title-icon" alt="" draggable="false">
      <span>Calovetor</span>
    `;

    const messageEl = document.createElement('div');
    messageEl.classList.add('error-alert-message');
    messageEl.textContent = message;

    const actionContainer = document.createElement('div');
    actionContainer.classList.add('error-alert-actions');

    const errorButton = document.createElement('button');
    errorButton.classList.add('error-alert-btn');
    errorButton.textContent = 'okey';

    // Close logic
    const closeAlert = () => {
      errorOverlay.classList.remove('active');
      setTimeout(() => errorOverlay.remove(), 350);
    };

    errorButton.addEventListener('click', closeAlert);
    // Removed click outside to close - only close button works

    actionContainer.appendChild(errorButton);
    bodyContainer.appendChild(titleEl);
    bodyContainer.appendChild(messageEl);
    errorContainer.appendChild(bodyContainer);
    errorContainer.appendChild(actionContainer);
    errorOverlay.appendChild(errorContainer);
    document.body.appendChild(errorOverlay);

    // Add drag functionality
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    function dragStart(e) {
      if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }

      if (e.target === errorContainer || e.target.closest('.error-alert-body')) {
        isDragging = true;
        errorContainer.style.transition = 'none';
      }
    }

    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      errorContainer.style.transition = '';
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        
        if (e.type === "touchmove") {
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;
        } else {
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        errorContainer.style.transform = `translate(${currentX}px, ${currentY}px) scale(1)`;
      }
    }

    // Add event listeners for dragging
    errorContainer.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);
    
    // Touch events for mobile
    errorContainer.addEventListener('touchstart', dragStart);
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('touchmove', drag);

    // Prevent button from triggering drag
    errorButton.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    errorButton.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    });

    // Prevent image from being draggable
    const errorImage = errorContainer.querySelector('img');
    if (errorImage) {
      errorImage.addEventListener('dragstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      errorImage.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      errorImage.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      });
    }

    // Animate in
    setTimeout(() => errorOverlay.classList.add('active'), 10);

    // Add click event to overlay for bounce animation and sound
    errorOverlay.addEventListener('click', (e) => {
      // Only trigger if clicking on the overlay background, not the error container
      if (e.target === errorOverlay) {
        // Play error sound again
        calculator.playErrorSound();
        
        // Add bounce animation
        errorContainer.style.transition = 'transform 0.1s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        errorContainer.style.transform = `translate(${currentX || 0}px, ${currentY || 0}px) scale(1.1)`;
        
        setTimeout(() => {
          errorContainer.style.transform = `translate(${currentX || 0}px, ${currentY || 0}px) scale(1)`;
        }, 100);
      }
    });

    // Add keyboard support for Enter key and Space bar
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' || e.key === 'Return' || e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        closeAlert();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    // Clean up event listener when error is closed
    const originalCloseAlert = closeAlert;
    closeAlert = () => {
      document.removeEventListener('keydown', handleKeyPress);
      originalCloseAlert();
    };
  }

  function showPookieBox() {
    // Create about overlay
    const aboutOverlay = document.createElement('div');
    aboutOverlay.classList.add('about-overlay');

    const aboutContainer = document.createElement('div');
    aboutContainer.classList.add('about-container');

    // macOS Title Bar (Hidden in portrait via CSS)
    const macosHeader = document.createElement('div');
    macosHeader.classList.add('about-macos-header');
    macosHeader.innerHTML = `
      <div class="macos-traffic-lights" style="z-index: 100;">
        <div class="traffic-light red"></div>
        <div class="traffic-light yellow" title="Minimize"></div>
        <div class="traffic-light green" title="Maximize"></div>
      </div>
      <div class="macos-title">Sam Devlopments by Samad Khan</div>
    `;

    // iOS Header (Visible in portrait via CSS)
    const iosHeader = document.createElement('div');
    iosHeader.classList.add('about-ios-header');
    iosHeader.innerHTML = `
      <div class="about-ios-title">About</div>
      <button class="about-ios-close">Done</button>
    `;

    // Content area
    const contentArea = document.createElement('div');
    contentArea.classList.add('about-content');

    // Developer Profile Content HTML
    const getDevContent = () => `
      <div class="about-scroll-container">
        <div class="dev-profile-hero">
          <div class="dev-avatar">
            <img src="icons/dev.jpg" alt="SK">
          </div>
          <h2 class="dev-name">SAMAD KHAN</h2>
          <p class="dev-roles">Artist | Editor | Designer | Developer</p>
        </div>

        <div class="dev-cards-container">
          <div class="dev-card">
            <div class="dev-card-header">
              <i class="fas fa-user"></i>
              <span>Introduction</span>
            </div>
            <p class="dev-card-text">Hi, My name is Abdul Samad Khan. I'm 18 years old.</p>
          </div>

          <div class="dev-card">
            <div class="dev-card-header">
              <i class="fas fa-tools"></i>
              <span>Skills</span>
            </div>
            <div class="dev-skills-grid">
              <span class="skill-tag">Graphics Design</span>
              <span class="skill-tag">Video Editing</span>
              <span class="skill-tag">VFX</span>
              <span class="skill-tag">3D & 2D Animation</span>
              <span class="skill-tag">Motion Graphics</span>
              <span class="skill-tag">Concept Art</span>
              <span class="skill-tag">Sketch Art</span>
              <span class="skill-tag">Web Design</span>
              <span class="skill-tag">Game Development</span>
            </div>
          </div>

          <div class="dev-card">
            <div class="dev-card-header">
              <i class="fas fa-briefcase"></i>
              <span>Experience</span>
            </div>
            <p class="dev-card-text">I started learning skills from 2020. I'm giving Freelance Services from 2022. Already worked for influencers with more than 100k followers.</p>
          </div>

          <div class="dev-card resume-card-link" style="cursor: pointer; border: 1px solid rgba(var(--accent-rgb), 0.3); background: rgba(var(--accent-rgb), 0.05);" onclick="openInAppBrowser('https://dub.sh/samfolio')">
            <div class="dev-card-header" style="color: var(--accent);">
              <i class="fas fa-file-pdf"></i>
              <span>Resume ↗</span>
            </div>
            <p class="dev-card-text">View my full professional resume and creative portfolio in the in-app browser.</p>
          </div>
        </div>
      </div>
    `;

    // Explorer Data & Logic (Simplified copy-paste from original)
    const explorerData = {
      socials: {
        title: "Socials",
        folders: [
          {
            id: "youtube", name: "YouTube", icon: "fas fa-folder",
            items: [
              { name: "SAMAD KHAN", url: "https://www.youtube.com/@SamadPOV", icon: "fab fa-youtube color-red", tags: ["Documentries", "Long Form"] },
              { name: "Samdoit", url: "https://www.youtube.com/@samdoit", icon: "fab fa-youtube color-red", tags: ["Designing", "Editing", "Dev", "Short+Long"] },
              { name: "SAM", url: null, icon: "fab fa-youtube color-gray", tags: ["Improvement", "Unfiltered"], disabled: true }
            ]
          },
          {
            id: "instagram", name: "Instagram", icon: "fas fa-folder",
            items: [
              { name: "Samad.jpg", url: "https://www.instagram.com/samad.jpg/", icon: "fab fa-instagram color-insta", tags: ["AI", "VFX", "Dev", "Chat"] },
              { name: "Samad.pov", url: "https://www.instagram.com/samad.pov/", icon: "fab fa-instagram color-insta", tags: ["Poetry", "Story", "Chat"] },
              { name: "Samad.wav", url: "https://www.instagram.com/samad.wav/", icon: "fab fa-instagram color-insta", tags: ["Voice", "Dubbing", "Chat"] }
            ]
          },
          {
            id: "connections", name: "Others", icon: "fas fa-folder",
            items: [
              { name: "Snapchat", url: "http://snapchat.com/add/samad.pov", icon: "fab fa-snapchat color-yellow", tags: ["Snaps", "Chat"] },
              { name: "Discord", url: "copy:samad.pov", icon: "fab fa-discord color-blurple", tags: ["Community", "Chat"], code: "samad.pov" },
              { name: "X (Twitter)", url: "https://x.com/SamadPOV", icon: "fab fa-twitter-square color-black", tags: ["Politics", "Tweets"] },
              { name: "TikTok", url: "https://www.tiktok.com/@samad.pov", icon: "fab fa-tiktok color-black", tags: ["Shorts", "Chat"] }
            ]
          }
        ]
      },
      portfolio: {
        title: "Portfolio",
        folders: [
          {
            id: "designs", name: "Designs", icon: "fas fa-folder",
            items: [
              { name: "Behance", url: "https://www.behance.net/SamadPOV/", icon: "fab fa-behance", iconStyle: "color:#1769ff", tags: ["Portfolio", "Designs", "Web", "Editing", "Art"] },
              { name: "Pinterest", url: "https://www.pinterest.com/SamadPOV/", icon: "fab fa-pinterest", iconStyle: "color:#bd081c", tags: ["Designs", "Editing", "Pins", "Product", "Art"] },
              { name: "ArtStation", url: "https://www.artstation.com/samadpov/profile", icon: "fab fa-artstation", iconStyle: "color:#13aff0", tags: ["3D Art", "2D Art", "Animation", "Anime"] }
            ]
          },
          {
            id: "photography", name: "Photography", icon: "fas fa-folder",
            items: [
              { name: "Cosmos", url: "https://www.cosmos.so/samad.pov", icon: "fas fa-star color-black", tags: ["Portfolio", "Designs", "Editing", "Photography", "Typography"] },
              { name: "Layers", url: "https://layers.to/samad", icon: "fas fa-layer-group color-black", tags: ["Portfolio", "Designs", "Web", "Editing", "Anime"] }
            ]
          }
        ]
      }
    };

    let navigationStack = [];

    const renderExplorer = (type, folderId = null) => {
      const data = explorerData[type];
      let html = "";
      const showBack = navigationStack.length > 0;
      const currentLabel = folderId ? data.folders.find(f => f.id === folderId).name : data.title;

      html += `
        <div class="explorer-toolbar">
          <button class="explorer-back-btn ${showBack ? 'visible' : ''}" id="explorer-back">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="explorer-path">
            <span class="path-root">${data.title}</span>
            ${folderId ? `<i class="fas fa-chevron-right separator"></i> <span class="path-current">${currentLabel}</span>` : ""}
          </div>
        </div>
        <div class="about-scroll-container">
      `;

      if (!folderId) {
        html += `<div class="explorer-grid">`;
        data.folders.forEach(folder => {
          html += `
            <div class="explorer-box-folder" data-folder-id="${folder.id}">
              <div class="box-icon">
                <i class="fas fa-folder"></i>
              </div>
              <span class="box-name">${folder.name}</span>
            </div>
          `;
        });
        html += `</div>`;
      } else {
        const folder = data.folders.find(f => f.id === folderId);
        html += `<div class="explorer-list">`;
        folder.items.forEach(item => {
          const isCopy = item.url && item.url.startsWith("copy:");
          const clickAction = item.disabled ? "" :
            isCopy ? `onclick="navigator.clipboard.writeText('${item.code}'); alert('Copied: ${item.code} ✨')"` :
              `onclick="window.open('${item.url}', '_blank')"`;

          html += `
            <div class="explorer-item ${item.disabled ? 'disabled' : ''}" ${clickAction}>
              <div class="item-main">
                <i class="${item.icon}" style="${item.iconStyle || ''}"></i>
                <span class="item-name">${item.name}</span>
              </div>
              <div class="item-tags">
                ${item.tags.map(tag => `<span class="universal-tag">${tag}</span>`).join('')}
              </div>
              ${item.code ? `<div class="discord-copy-area"><code>${item.code}</code><i class="fas fa-copy"></i></div>` : ""}
            </div>
          `;
        });
        html += `</div>`;
      }
      html += `</div>`;
      contentArea.innerHTML = html;

      const backBtn = contentArea.querySelector("#explorer-back");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          navigationStack.pop();
          renderExplorer(type, navigationStack.length > 0 ? navigationStack[navigationStack.length - 1] : null);
        });
      }

      contentArea.querySelectorAll(".explorer-box-folder").forEach(box => {
        box.addEventListener("click", () => {
          navigationStack.push(box.dataset.folderId);
          renderExplorer(type, box.dataset.folderId);
        });
      });
    };

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.classList.add('about-sidebar');
    sidebar.innerHTML = `
      <div class="about-sidebar-item active" data-tab="developer">
        <i class="fas fa-user-circle"></i>
        <span>Developer</span>
      </div>
      <div class="about-sidebar-item" data-tab="socials">
        <i class="fas fa-globe"></i>
        <span>Socials</span>
      </div>
      <div class="about-sidebar-item" data-tab="portfolio">
        <i class="fas fa-briefcase"></i>
        <span>Portfolio</span>
      </div>
      <div class="about-sidebar-item" data-tab="resume">
        <i class="fas fa-file-alt"></i>
        <span>Resume ↗</span>
      </div>
    `;

    contentArea.innerHTML = getDevContent();

    const mainLayout = document.createElement('div');
    mainLayout.classList.add('about-main-layout');
    mainLayout.appendChild(sidebar);
    mainLayout.appendChild(contentArea);

    // Add resizer to About sidebar
    addSidebarResizer(sidebar, 'aboutSidebarWidth');

    aboutContainer.appendChild(macosHeader);
    aboutContainer.appendChild(iosHeader);
    aboutContainer.appendChild(mainLayout);

    aboutOverlay.appendChild(aboutContainer);
    document.body.appendChild(aboutOverlay);

    const closeAbout = () => {
      winLogic.stopPhysics();
      winLogic.cleanup(); // Clean up window tracking
      aboutOverlay.classList.remove('active');
      setTimeout(() => aboutOverlay.remove(), 350);
    };

    const devIconSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `;

    const winLogic = initMacOSWindow(aboutContainer, aboutOverlay, macosHeader, closeAbout, devIconSVG);

    // Sidebar Tab Switching
    sidebar.querySelectorAll('.about-sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        if (tab === 'resume') {
          showResumeWindow();
          return;
        }
        sidebar.querySelectorAll('.about-sidebar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        navigationStack = [];
        if (tab === 'developer') contentArea.innerHTML = getDevContent();
        else renderExplorer(tab);
      });
    });

    // Removed click outside to close - only close button works

    setTimeout(() => aboutOverlay.classList.add('active'), 10);
  }

  function showResumeWindow() {
    // Create resume overlay with higher z-index
    const resumeOverlay = document.createElement('div');
    resumeOverlay.classList.add('settings-overlay');
    if (calculator.pookieMode) resumeOverlay.classList.add('pookie-active');
    
    // Ensure resume window is always on top
    highestZIndex++;
    resumeOverlay.style.zIndex = highestZIndex;

    const resumeContainer = document.createElement('div');
    resumeContainer.classList.add('settings-container');

    // MacOS Title Bar
    const titleBar = document.createElement('div');
    titleBar.classList.add('macos-title-bar');

    const trafficLights = document.createElement('div');
    trafficLights.classList.add('macos-traffic-lights');
    trafficLights.innerHTML = `
      <div class="traffic-light red"></div>
      <div class="traffic-light yellow"></div>
      <div class="traffic-light green"></div>
    `;

    const title = document.createElement('div');
    title.classList.add('macos-title');
    title.style.cssText = 'display: none;'; // Hide title since we have address bar

    // Browser address bar in titlebar
    const addressBar = document.createElement('div');
    addressBar.style.cssText = `
      flex: 1;
      margin: 0 80px;
      display: flex;
      align-items: center;
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      font-size: 12px;
      color: #666;
      height: 24px;
    `;
    addressBar.innerHTML = `
      <i class="fas fa-lock" style="margin-right: 8px; color: #4caf50; font-size: 10px;"></i>
      <span>https://dub.sh/samfolio</span>
    `;

    titleBar.appendChild(trafficLights);
    titleBar.appendChild(addressBar);

    const closeResumeWindow = () => {
      winLogic.stopPhysics();
      resumeOverlay.classList.remove('active');
      setTimeout(() => resumeOverlay.remove(), 300);
    };

    const resumeIconSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
      </svg>
    `;

    const winLogic = initMacOSWindow(resumeContainer, resumeOverlay, titleBar, closeResumeWindow, resumeIconSVG);

    // Resume Window Body
    const windowBody = document.createElement('div');
    windowBody.classList.add('settings-window-body');

    // Browser-like content area
    const contentArea = document.createElement('div');
    contentArea.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    `;

    // Resume content iframe
    const resumeFrame = document.createElement('iframe');
    resumeFrame.src = 'https://dub.sh/samfolio';
    resumeFrame.style.cssText = `
      flex: 1;
      width: 100%;
      border: none;
      background: white;
    `;

    contentArea.appendChild(resumeFrame);

    windowBody.appendChild(contentArea);

    resumeContainer.appendChild(titleBar);
    resumeContainer.appendChild(windowBody);
    resumeOverlay.appendChild(resumeContainer);
    document.body.appendChild(resumeOverlay);

    // Animate in
    setTimeout(() => {
      resumeOverlay.classList.add('active');
    }, 10);

    // Removed click outside to close - only close button works
  }

  function showSettingsMenu() {
    // Create settings overlay
    const settingsOverlay = document.createElement('div');
    settingsOverlay.classList.add('settings-overlay');
    if (calculator.pookieMode) settingsOverlay.classList.add('pookie-active');

    const settingsContainer = document.createElement('div');
    settingsContainer.classList.add('settings-container');

    // MacOS Title Bar
    const titleBar = document.createElement('div');
    titleBar.classList.add('macos-title-bar');

    const trafficLights = document.createElement('div');
    trafficLights.classList.add('macos-traffic-lights');
    trafficLights.innerHTML = `
      <div class="traffic-light red"></div>
      <div class="traffic-light yellow"></div>
      <div class="traffic-light green"></div>
    `;

    const closeSettingsMenu = () => {
      winLogic.stopPhysics();
      winLogic.cleanup(); // Clean up window tracking
      settingsOverlay.classList.remove('active');
      setTimeout(() => settingsOverlay.remove(), 300);
    };

    const title = document.createElement('div');
    title.classList.add('macos-title');
    title.textContent = 'System Configuration';

    // Done button for iOS mobile
    const doneBtn = document.createElement('div');
    doneBtn.classList.add('ios-done-btn');

    titleBar.appendChild(trafficLights);
    titleBar.appendChild(title);
    titleBar.appendChild(doneBtn);

    doneBtn.addEventListener('click', closeSettingsMenu);

    const settingsIconSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;

    const winLogic = initMacOSWindow(settingsContainer, settingsOverlay, titleBar, closeSettingsMenu, settingsIconSVG);

    // Settings Window Body
    const windowBody = document.createElement('div');
    windowBody.classList.add('settings-window-body');

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.classList.add('settings-sidebar');

    const sidebarItems = [
      { id: 'input', icon: 'fa-keyboard', label: 'Input' },
      { id: 'menubar', icon: 'fa-bars', label: 'Menubar' }
    ];

    // Content Area
    const content = document.createElement('div');
    content.classList.add('settings-content');

    sidebarItems.forEach((item, index) => {
      const sbItem = document.createElement('div');
      sbItem.classList.add('sidebar-item');
      if (index === 0) sbItem.classList.add('active');
      sbItem.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;

      sbItem.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        sbItem.classList.add('active');
        document.getElementById(`section-${item.id}`).classList.add('active');
      });

      sidebar.appendChild(sbItem);
    });

    // Add resizer to Settings sidebar
    addSidebarResizer(sidebar, 'settingsSidebarWidth');

    // Content sections
    const currentTheme = localStorage.getItem('calculatorTheme') || 'light';
    const currentInputMode = localStorage.getItem('calculatorInputMode') || 'mixed';

    content.innerHTML = `
      <!-- Input Section -->
      <div class="settings-section active" id="section-input">
        <div class="settings-section-title">Input</div>
        <div class="macos-settings-row">
          <div class="row-info">
            <div class="row-title">Mixed</div>
            <div class="row-subtitle">All inputs will be acceptable</div>
          </div>
          <div class="ios-toggle ${currentInputMode === 'mixed' ? 'active' : ''}" data-input-mode="mixed">
            <div class="ios-toggle-slider"></div>
          </div>
        </div>
        <div class="macos-settings-row">
          <div class="row-info">
            <div class="row-title">Keyboard</div>
            <div class="row-subtitle">Use calculator buttons from keyboard only</div>
          </div>
          <div class="ios-toggle ${currentInputMode === 'keyboard' ? 'active' : ''}" data-input-mode="keyboard">
            <div class="ios-toggle-slider"></div>
          </div>
        </div>
        <div class="macos-settings-row">
          <div class="row-info">
            <div class="row-title">Mouse</div>
            <div class="row-subtitle">Use calculator buttons from mouse only</div>
          </div>
          <div class="ios-toggle ${currentInputMode === 'mouse' ? 'active' : ''}" data-input-mode="mouse">
            <div class="ios-toggle-slider"></div>
          </div>
        </div>
        <div class="macos-settings-row">
          <div class="row-info">
            <div class="row-title">Touch</div>
            <div class="row-subtitle">Use calculator buttons from touch only [Android]</div>
          </div>
          <div class="ios-toggle ${currentInputMode === 'touch' ? 'active' : ''}" data-input-mode="touch">
            <div class="ios-toggle-slider"></div>
          </div>
        </div>
        <div class="macos-settings-row">
          <div class="row-info">
            <div class="row-title">Voice Command</div>
            <div class="row-subtitle">Voice command [coming soon]</div>
          </div>
          <div class="ios-toggle disabled" disabled>
            <div class="ios-toggle-slider"></div>
          </div>
        </div>
      </div>

      <!-- Menubar Section -->
      <div class="settings-section" id="section-menubar">
        <div class="settings-section-title">Menubar</div>
        <div class="macos-settings-row">
          <div class="row-info">
            <div class="row-title">Enable Menubar</div>
            <div class="row-subtitle">Toggle main menu sidebar visibility</div>
          </div>
          <div class="ios-toggle ${localStorage.getItem('menubarEnabled') !== 'false' ? 'active' : ''}" data-menubar-setting="enabled">
            <div class="ios-toggle-slider"></div>
          </div>
        </div>
        <div class="macos-settings-row">
          <div class="row-info">
            <div class="row-title">Compact Mode</div>
            <div class="row-subtitle">Reduce menubar height for more screen space</div>
          </div>
          <div class="ios-toggle ${localStorage.getItem('menubarCompact') === 'true' ? 'active' : ''}" data-menubar-setting="compact">
            <div class="ios-toggle-slider"></div>
          </div>
        </div>
        <div class="macos-settings-row">
          <div class="row-info">
            <div class="row-title">Position</div>
            <div class="row-subtitle">Choose menubar placement</div>
          </div>
          <div class="position-selector">
            <div class="position-option ${(!localStorage.getItem('menubarPosition') || localStorage.getItem('menubarPosition') === 'top') ? 'active' : ''}" data-position="top">
              <div class="position-icon">⬆</div>
              <span>Top</span>
            </div>
            <div class="position-option ${localStorage.getItem('menubarPosition') === 'bottom' ? 'active' : ''}" data-position="bottom">
              <div class="position-icon">⬇</div>
              <span>Bottom</span>
            </div>
            <div class="position-option ${localStorage.getItem('menubarPosition') === 'left' ? 'active' : ''}" data-position="left">
              <div class="position-icon">⬅</div>
              <span>Left</span>
            </div>
            <div class="position-option ${localStorage.getItem('menubarPosition') === 'right' ? 'active' : ''}" data-position="right">
              <div class="position-icon">➡</div>
              <span>Right</span>
            </div>
          </div>
        </div>
      </div>
    `;

    windowBody.appendChild(sidebar);
    windowBody.appendChild(content);

    settingsContainer.appendChild(titleBar);
    settingsContainer.appendChild(windowBody);
    settingsOverlay.appendChild(settingsContainer);
    document.body.appendChild(settingsOverlay);

    // Animate in
    setTimeout(() => {
      settingsOverlay.classList.add('active');
    }, 10);

    // Event Listeners for controls
    // Input mode toggle event listeners
    const inputToggles = content.querySelectorAll('[data-input-mode]');
    inputToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        const mode = this.getAttribute('data-input-mode');
        
        // If clicking mixed, enable it and disable all others
        if (mode === 'mixed') {
          inputToggles.forEach(t => {
            if (t.getAttribute('data-input-mode') !== 'mixed') {
              t.classList.remove('active');
            }
          });
          this.classList.add('active');
          localStorage.setItem('calculatorInputMode', 'mixed');
          applyInputMode('mixed');
        } else {
          // If clicking any other mode, disable mixed and enable this one
          inputToggles.forEach(t => {
            if (t.getAttribute('data-input-mode') === 'mixed') {
              t.classList.remove('active');
            }
          });
          
          // Toggle this mode on/off
          if (this.classList.contains('active')) {
            this.classList.remove('active');
            // If no active mode, revert to mixed
            const hasActiveMode = Array.from(inputToggles).some(t => 
              t.classList.contains('active') && t.getAttribute('data-input-mode') !== 'mixed'
            );
            if (!hasActiveMode) {
              inputToggles.find(t => t.getAttribute('data-input-mode') === 'mixed').classList.add('active');
              localStorage.setItem('calculatorInputMode', 'mixed');
              applyInputMode('mixed');
            }
          } else {
            this.classList.add('active');
            localStorage.setItem('calculatorInputMode', mode);
            applyInputMode(mode);
          }
        }
      });
    });

    // Menubar settings event listeners
    const menubarToggles = content.querySelectorAll('[data-menubar-setting]');
    menubarToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        const setting = this.getAttribute('data-menubar-setting');
        const isActive = this.classList.contains('active');
        
        // Toggle the setting
        if (isActive) {
          this.classList.remove('active');
          localStorage.setItem('menubar' + setting.charAt(0).toUpperCase() + setting.slice(1), 'false');
        } else {
          this.classList.add('active');
          localStorage.setItem('menubar' + setting.charAt(0).toUpperCase() + setting.slice(1), 'true');
        }
        
        // Apply menubar settings
        applyMenubarSettings();
      });
    });

    // Position selector event listeners
    const positionOptions = content.querySelectorAll('[data-position]');
    positionOptions.forEach(option => {
      option.addEventListener('click', function() {
        const position = this.getAttribute('data-position');
        
        // Remove active class from all options
        positionOptions.forEach(opt => opt.classList.remove('active'));
        
        // Add active class to clicked option
        this.classList.add('active');
        
        // Save position to localStorage
        localStorage.setItem('menubarPosition', position);
        
        // Apply menubar settings
        applyMenubarSettings();
      });
    });

    // Apply input mode function
    function applyInputMode(mode) {
      const calculator = document.querySelector('.calculator');
      const buttons = calculator.querySelectorAll('.btn');
      
      // Reset all input methods first
      buttons.forEach(btn => {
        btn.style.pointerEvents = 'auto'; // Enable mouse/touch
        btn.tabIndex = '0'; // Enable keyboard
      });
      
      // Apply mode-specific restrictions
      switch(mode) {
        case 'mixed':
          // All inputs work - nothing to disable
          break;
          
        case 'keyboard':
          // Disable mouse/touch
          buttons.forEach(btn => {
            btn.style.pointerEvents = 'none';
          });
          break;
          
        case 'mouse':
          // Disable keyboard
          buttons.forEach(btn => {
            btn.tabIndex = '-1';
          });
          break;
          
        case 'touch':
          // Check if in landscape mode
          const isLandscape = window.innerWidth > window.innerHeight;
          if (isLandscape) {
            // Disable keyboard and mouse in landscape mode
            buttons.forEach(btn => {
              btn.style.pointerEvents = 'none';
              btn.tabIndex = '-1';
            });
          }
          break;
      }
    }

    // Apply current input mode on settings open
    applyInputMode(currentInputMode);
    
    // Apply menubar settings on settings open
    applyMenubarSettings();

    // Add window resize listener for touch mode landscape behavior
    window.addEventListener('resize', () => {
      const currentMode = localStorage.getItem('calculatorInputMode') || 'mixed';
      if (currentMode === 'touch') {
        applyInputMode('touch');
      }
      
      // Also apply menubar settings on resize for auto-hide behavior
      applyMenubarSettings();
    });

    // Removed click outside to close - only close button works
  }

  // Apply menubar settings function (global)
  function applyMenubarSettings() {
    const menuBar = document.getElementById('mac-menu-bar');
    if (!menuBar) return;

    const menubarEnabled = localStorage.getItem('menubarEnabled') !== 'false';
    const menubarCompact = localStorage.getItem('menubarCompact') === 'true';
    const menubarPosition = localStorage.getItem('menubarPosition') || 'top';

    // Apply enabled setting - show in landscape, hide in portrait
    const isLandscape = window.innerWidth > window.innerHeight;
    if (menubarEnabled && isLandscape) {
      menuBar.style.display = 'flex';
    } else {
      menuBar.style.display = 'none';
    }

    // Apply position
    // Remove all position classes first
    menuBar.classList.remove('position-top', 'position-bottom', 'position-left', 'position-right');
    // Add the current position class
    menuBar.classList.add(`position-${menubarPosition}`);

    // Enhanced compact mode
    if (menubarCompact) {
      // Reduce menubar height/width based on position
      if (menubarPosition === 'left' || menubarPosition === 'right') {
        menuBar.style.width = '40px';
        menuBar.style.minWidth = '40px';
      } else {
        menuBar.style.height = '24px';
        menuBar.style.minHeight = '24px';
      }
      
      // Smaller font sizes
      menuBar.style.fontSize = '11px';
      
      // Reduce padding in menu bar content
      const menuBarContent = menuBar.querySelector('.menu-bar-content');
      if (menuBarContent) {
        if (menubarPosition === 'left' || menubarPosition === 'right') {
          menuBarContent.style.padding = '4px 0';
        } else {
          menuBarContent.style.padding = '0 8px';
          menuBarContent.style.height = '24px';
        }
      }
      
      // Smaller menu items
      const menuItems = menuBar.querySelectorAll('.menu-item');
      menuItems.forEach(item => {
        item.style.fontSize = '11px';
        if (menubarPosition === 'left' || menubarPosition === 'right') {
          item.style.padding = '6px 4px';
          item.style.writingMode = 'vertical-rl';
        } else {
          item.style.padding = '4px 6px';
        }
      });
      
      // Compact status icons
      const statusIcons = menuBar.querySelectorAll('.status-icon');
      statusIcons.forEach(icon => {
        icon.style.transform = 'scale(0.8)';
        icon.style.margin = menubarPosition === 'left' || menubarPosition === 'right' ? '2px 0' : '0 2px';
      });
      
      // Smaller app logo
      const appLogo = menuBar.querySelector('.app-logo img');
      if (appLogo) {
        appLogo.style.width = '12px';
        appLogo.style.height = '12px';
      }
      
      // Compact clock
      const menuClock = menuBar.querySelector('.menu-clock');
      if (menuClock) {
        menuClock.style.fontSize = '10px';
        if (menubarPosition === 'left' || menubarPosition === 'right') {
          menuClock.style.writingMode = 'vertical-rl';
          menuClock.style.margin = '4px 0';
        } else {
          menuClock.style.margin = '0 4px';
        }
      }
      
      // Add compact mode class for CSS targeting
      menuBar.classList.add('compact-mode');
      
    } else {
      // Reset to normal size
      menuBar.style.height = '';
      menuBar.style.minHeight = '';
      menuBar.style.width = '';
      menuBar.style.minWidth = '';
      menuBar.style.fontSize = '';
      
      const menuBarContent = menuBar.querySelector('.menu-bar-content');
      if (menuBarContent) {
        menuBarContent.style.padding = '';
        menuBarContent.style.height = '';
      }
      
      // Reset menu items
      const menuItems = menuBar.querySelectorAll('.menu-item');
      menuItems.forEach(item => {
        item.style.fontSize = '';
        item.style.padding = '';
        item.style.writingMode = '';
      });
      
      // Reset status icons
      const statusIcons = menuBar.querySelectorAll('.status-icon');
      statusIcons.forEach(icon => {
        icon.style.transform = '';
        icon.style.margin = '';
      });
      
      // Reset app logo
      const appLogo = menuBar.querySelector('.app-logo img');
      if (appLogo) {
        appLogo.style.width = '';
        appLogo.style.height = '';
      }
      
      // Reset clock
      const menuClock = menuBar.querySelector('.menu-clock');
      if (menuClock) {
        menuClock.style.fontSize = '';
        menuClock.style.margin = '';
        menuClock.style.writingMode = '';
      }
      
      // Remove compact mode class
      menuBar.classList.remove('compact-mode');
    }

    // Clean up any remaining event listeners
    removeAutoHideScroll(menuBar);
    removeHideOnClick(menuBar);
  }

  // Auto-hide on scroll functionality
  function setupAutoHideScroll(menuBar) {
    let scrollTimeout;
    let lastScrollY = 0;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down - hide menubar
        menuBar.style.transform = 'translateY(-100%)';
        menuBar.style.transition = 'transform 0.3s ease';
      } else {
        // Scrolling up or at top - show menubar
        menuBar.style.transform = 'translateY(0)';
      }
      
      lastScrollY = currentScrollY;
      
      // Clear existing timeout
      clearTimeout(scrollTimeout);
      // Show menubar after scrolling stops
      scrollTimeout = setTimeout(() => {
        menuBar.style.transform = 'translateY(0)';
      }, 1000);
    };

    // Remove existing listener if any
    removeAutoHideScroll(menuBar);
    
    // Add new listener
    menuBar._scrollHandler = handleScroll;
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  function removeAutoHideScroll(menuBar) {
    if (menuBar._scrollHandler) {
      window.removeEventListener('scroll', menuBar._scrollHandler);
      menuBar._scrollHandler = null;
    }
    menuBar.style.transform = '';
    menuBar.style.transition = '';
  }

  // Hide on click outside functionality
  function setupHideOnClick(menuBar) {
    const handleClickOutside = (e) => {
      if (!menuBar.contains(e.target) && !e.target.closest('.menu-dropdown, .menu-submenu')) {
        // Close any open dropdowns
        const dropdown = document.getElementById('menu-dropdown');
        const submenus = document.querySelectorAll('.menu-submenu');
        
        if (dropdown) dropdown.style.display = 'none';
        submenus.forEach(submenu => submenu.remove());
      }
    };

    // Remove existing listener if any
    removeHideOnClick(menuBar);
    
    // Add new listener
    menuBar._clickHandler = handleClickOutside;
    document.addEventListener('click', handleClickOutside);
  }

  function removeHideOnClick(menuBar) {
    if (menuBar._clickHandler) {
      document.removeEventListener('click', menuBar._clickHandler);
      menuBar._clickHandler = null;
    }
  }

  function showDocumentationWindow() {
  showMacOSWindow('Documentation', `
    <div class="documentation-container">
      <div class="documentation-grid">
        <!-- Color Palettes Section -->
        <div class="documentation-card" data-action="color-palettes">
          <div class="doc-icon">🎨</div>
          <div class="doc-title">Color Palettes</div>
          <div class="doc-subtitle">Preview</div>
        </div>
        
        <!-- Color Codes Section -->
        <div class="documentation-card" data-action="color-codes">
          <div class="doc-icon">📋</div>
          <div class="doc-title">Color Codes</div>
          <div class="doc-subtitle">Palette Codes</div>
        </div>
        
        <!-- Source Section -->
        <div class="documentation-card" data-action="source">
          <div class="doc-icon">🌐</div>
          <div class="doc-title">Source</div>
          <div class="doc-subtitle">Original Webpage</div>
        </div>
      </div>
    </div>
  `);
  
  // Add click handlers to the documentation cards
  setTimeout(() => {
    const docCards = document.querySelectorAll('.documentation-card');
    docCards.forEach(card => {
      card.addEventListener('click', function() {
        const action = this.dataset.action;
        handleDocumentationAction(action);
      });
    });
  }, 100);
}

function handleDocumentationAction(action) {
  switch(action) {
    case 'color-palettes':
      showColorPalettes();
      break;
    case 'color-codes':
      showColorCodes();
      break;
    case 'source':
      showSource();
      break;
  }
}

function showColorPalettes() {
  showMacOSWindow('Color Palettes', `
    <div class="color-palettes-container">
      <div class="palettes-grid" id="palettesGrid">
        <!-- Images will be loaded here -->
      </div>
    </div>
  `);
  
  // Load preview images
  const palettesGrid = document.getElementById('palettesGrid');
  const previewPath = 'App Data/Features/Aesthetic Settings/Themes [Powered by Figma]/Color Combinations/Preview/';
  
  // Load common image formats
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
  let loadedImages = 0;
  
  imageExtensions.forEach(ext => {
    for (let i = 1; i <= 20; i++) {
      const img = document.createElement('img');
      img.src = previewPath + i + ext;
      img.className = 'palette-preview';
      img.onerror = () => {}; // Skip if not found
      img.onload = () => {
        palettesGrid.appendChild(img);
        loadedImages++;
      };
    }
  });
}

function showColorCodes() {
  showMacOSWindow('Color Codes', `
    <div class="color-codes-container">
      <div class="codes-list" id="codesList">
        <!-- TXT files will be loaded here -->
      </div>
    </div>
  `);
  
  // Load palette codes
  const codesList = document.getElementById('codesList');
  const codesPath = 'App Data/Features/Aesthetic Settings/Themes [Powered by Figma]/Color Combinations/Palette Codes/';
  
  // Common theme names to load
  const themeNames = [
    'Alchemical Reaction', 'Autumn Leaves', 'Autumn Orchard', 'Beachfront Views',
    'Blooming Romance', 'Blue Eclipse', 'Burgundy Elegance', 'Cherry Blossom',
    'Cobalt Dreams', 'Coral Sunset', 'Crystal Clear', 'Cyber Neon',
    'Deep Ocean', 'Desert Mirage', 'Emerald Forest', 'Enchanted Purple',
    'Forest Rain', 'Frozen Tundra', 'Golden Hour', 'Graphite Professional',
    'Halloween Night', 'Hollow', 'Lavender Dreams', 'Mint Fresh',
    'Monochrome', 'Neon Lights', 'Northern Lights', 'Ocean Breeze',
    'Peach Parfait', 'Pixel Art', 'Purple Rain', 'Rainbow Spectrum',
    'Rose Gold', 'Ruby Red', 'Sage Green', 'Sky Blue',
    'Solar Flare', 'Space Black', 'Spring Meadow', 'Steel Gray',
    'Summer Citrus', 'Sunset Orange', 'Thunder Purple', 'Tropical Paradise',
    'Twilight Zone', 'Urban Gray', 'Violet Mist', 'Winter Frost'
  ];
  
  themeNames.forEach(themeName => {
    const codeItem = document.createElement('div');
    codeItem.className = 'code-item';
    codeItem.innerHTML = `
      <div class="code-title">${themeName}</div>
      <div class="code-content">Loading...</div>
    `;
    codesList.appendChild(codeItem);
    
    // Try to load the corresponding text file
    fetch(codesPath + themeName.replace(/\s+/g, '_') + '.txt')
      .then(response => response.text())
      .then(content => {
        codeItem.querySelector('.code-content').textContent = content;
      })
      .catch(() => {
        codeItem.querySelector('.code-content').textContent = 'File not found';
      });
  });
}

function showSource() {
  showMacOSWindow('Source', `
    <div class="source-container">
      <div class="source-webpage" id="sourceWebpage">
        <!-- MHTML content will be loaded here -->
      </div>
      <div class="source-actions">
        <button class="macos-btn primary" id="openInBrowser">
          <i class="fas fa-external-link-alt"></i>
          Open in Browser
        </button>
      </div>
    </div>
  `);
  
  // Load the original webpage
  const sourceWebpage = document.getElementById('sourceWebpage');
  const webpagePath = 'App Data/Features/Aesthetic Settings/Themes [Powered by Figma]/Source/Original Webpage.mhtml';
  
  // Try to load the MHTML file
  fetch(webpagePath)
    .then(response => response.text())
    .then(content => {
      sourceWebpage.innerHTML = `
        <iframe src="data:text/html;charset=utf-8,${encodeURIComponent(content)}" 
                style="width: 100%; height: 400px; border: none; border-radius: 8px;">
        </iframe>
      `;
    })
    .catch(() => {
      sourceWebpage.innerHTML = '<div class="error-message">Source webpage not found</div>';
    });
  
  // Handle open in browser button
  document.getElementById('openInBrowser').addEventListener('click', () => {
    const urlPath = 'App Data/Features/Aesthetic Settings/Themes [Powered by Figma]/Source/URL.txt';
    
    fetch(urlPath)
      .then(response => response.text())
      .then(url => {
        window.open(url.trim(), '_blank');
      })
      .catch(() => {
        alert('URL not found');
      });
  });
}

  function closeSettingsMenu() {
    const settingsOverlay = document.querySelector('.settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.classList.remove('active');
      setTimeout(() => {
        settingsOverlay.remove();
        // Reset any blur effects
        const calculator = document.querySelector('.calculator');
        if (calculator) {
          calculator.style.filter = 'none';
          calculator.style.transition = 'none';
        }
      }, 300);
    }
  }

  function changeTheme(theme) {
    calculator.applyTheme(theme);
  }

  function initializeThemeSystem(content) {
    // Get current theme and dark mode state
    const currentTheme = localStorage.getItem('aestheticTheme') || 'Default';
    const currentDarkMode = localStorage.getItem('aestheticDarkMode') === 'true';

    // Set initial state
    const darkModeToggle = content.querySelector('#darkModeToggle');
    if (currentDarkMode) {
      darkModeToggle.classList.add('active');
      document.body.classList.add('dark-mode');
    }

    // Initialize search and categories
    initializeThemeSearch(content);
    initializeThemeCategories(content);
    
    // Generate theme cards for all 100 Figma themes
    generateThemeCards(content, currentTheme);

    // Set active theme card
    const themeCards = content.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
      if (card.dataset.theme === currentTheme) {
        card.classList.add('active');
      }
    });

    // Dark mode toggle event listener
    darkModeToggle.addEventListener('click', function() {
      const isActive = this.classList.toggle('active');
      const isDarkMode = isActive;
      
      localStorage.setItem('aestheticDarkMode', isDarkMode.toString());
      
      if (isDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      
      // Reapply current theme with new dark mode state
      const activeTheme = content.querySelector('.theme-card.active');
      if (activeTheme) {
        applyFigmaTheme(activeTheme.dataset.theme, isDarkMode);
      }
    });

    // Theme card click event listeners
    themeCards.forEach(card => {
      card.addEventListener('click', function() {
        // Remove active class from all cards
        themeCards.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked card
        this.classList.add('active');
        
        // Apply theme
        const themeName = this.dataset.theme;
        const isDarkMode = darkModeToggle.classList.contains('active');
        
        localStorage.setItem('aestheticTheme', themeName);
        applyFigmaTheme(themeName, isDarkMode);
      });
    });

    // Apply initial theme immediately
    applyFigmaTheme(currentTheme, currentDarkMode);
    
    // Ensure theme persists after page load
    setTimeout(() => {
      const activeTheme = content.querySelector('.theme-card.active');
      if (activeTheme) {
        const isDarkMode = darkModeToggle.classList.contains('active');
        applyFigmaTheme(activeTheme.dataset.theme, isDarkMode);
      }
    }, 100);

    // Tab switching functionality
    const tabs = content.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs and sections
        tabs.forEach(t => t.classList.remove('active'));
        content.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Show corresponding section
        const tabName = this.dataset.tab;
        document.getElementById(`section-${tabName}`).classList.add('active');
      });
    });

    // Documentation card click handlers
    const docCards = content.querySelectorAll('.documentation-card');
    docCards.forEach(card => {
      card.addEventListener('click', function() {
        const action = this.dataset.action;
        handleDocumentationAction(action);
      });
    });

    // Documentation button handler
    const documentationBtn = content.querySelector('#documentationBtn');
    if (documentationBtn) {
      documentationBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        // Show documentation window
        showDocumentationWindow();
      });
    }

    // Add window resize listener to handle orientation changes
    const handleResize = () => {
      const activeTheme = content.querySelector('.theme-card.active');
      if (activeTheme) {
        const isDarkMode = darkModeToggle.classList.contains('active');
        applyFigmaTheme(activeTheme.dataset.theme, isDarkMode);
      }
    };

    // Add window load listener to ensure theme persistence
    window.addEventListener('load', () => {
      setTimeout(() => {
        const savedTheme = localStorage.getItem('aestheticTheme') || 'Default';
        const savedDarkMode = localStorage.getItem('aestheticDarkMode') === 'true';
        applyFigmaTheme(savedTheme, savedDarkMode);
      }, 50);
    });

    window.addEventListener('resize', handleResize);
    
    // Clean up listener when window is closed
    const originalCloseAestheticMenu = closeAestheticMenu;
    window.closeAestheticMenu = () => {
      window.removeEventListener('resize', handleResize);
      originalCloseAestheticMenu();
    };
  }

  function initializeThemeSearch(content) {
    const searchInput = content.querySelector('#themeSearchInput');
    const themesGrid = content.querySelector('#themesGrid');
    
    // Debounce search for better performance
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      const searchTerm = this.value.toLowerCase();
      
      searchTimeout = setTimeout(() => {
        const themeCards = themesGrid.querySelectorAll('.theme-card');
        
        // Use requestAnimationFrame for smooth DOM updates
        requestAnimationFrame(() => {
          themeCards.forEach(card => {
            const themeName = card.dataset.theme.toLowerCase();
            card.style.display = themeName.includes(searchTerm) ? '' : 'none';
          });
        });
      }, 100); // 100ms debounce
    });
  }

  function initializeThemeCategories(content) {
    const categories = content.querySelectorAll('.theme-category');
    const themesGrid = content.querySelector('#themesGrid');
    
    // Use event delegation for better performance
    categories.forEach(category => {
      category.addEventListener('click', function() {
        // Remove active class from all categories
        categories.forEach(c => c.classList.remove('active'));
        // Add active class to clicked category
        this.classList.add('active');
        
        const selectedCategory = this.dataset.category;
        const themeCards = themesGrid.querySelectorAll('.theme-card');
        
        // Use requestAnimationFrame for smooth DOM updates
        requestAnimationFrame(() => {
          themeCards.forEach(card => {
            card.style.display = selectedCategory === 'all' ? '' : 
              (card.dataset.category || 'all') === selectedCategory ? '' : 'none';
          });
        });
      });
    });
  }

  function generateThemeCards(content, currentTheme) {
    const themesGrid = content.querySelector('#themesGrid');
    if (themesGrid) {
      // Use document fragment for better performance
      const fragment = document.createDocumentFragment();
      
      Object.keys(figmaThemes).forEach(themeName => {
        const colors = figmaThemes[themeName].colors;
        const themeCard = document.createElement('div');
        themeCard.className = 'theme-card';
        themeCard.dataset.theme = themeName;
        
        // Determine category based on theme name and colors
        const category = determineThemeCategory(themeName, colors);
        themeCard.dataset.category = category;
        
        // Create color preview
        const colorPreview = document.createElement('div');
        colorPreview.className = 'theme-colors';
        colorPreview.style.background = `linear-gradient(135deg, ${colors.join(', ')})`;
        
        // Create theme info
        const themeInfo = document.createElement('div');
        themeInfo.className = 'theme-info';
        
        const themeNameEl = document.createElement('div');
        themeNameEl.className = 'theme-name';
        themeNameEl.textContent = themeName;
        
        const colorCountEl = document.createElement('div');
        colorCountEl.className = 'theme-colors-count';
        colorCountEl.textContent = `${colors.length} colors`;
        
        themeInfo.appendChild(themeNameEl);
        themeInfo.appendChild(colorCountEl);
        
        themeCard.appendChild(colorPreview);
        themeCard.appendChild(themeInfo);
        
        if (themeName === currentTheme) {
          themeCard.classList.add('active');
        }
        
        fragment.appendChild(themeCard);
      });
      
      // Single DOM operation to append all cards
      themesGrid.appendChild(fragment);
    }
  }

  function determineThemeCategory(themeName, colors) {
    const name = themeName.toLowerCase();
    
    // Dark themes
    if (name.includes('dark') || name.includes('midnight') || name.includes('night') || 
        name.includes('shadow') || name.includes('black')) {
      return 'dark';
    }
    
    // Light themes
    if (name.includes('light') || name.includes('day') || name.includes('sun') || 
        name.includes('bright') || name.includes('white')) {
      return 'light';
    }
    
    // Colorful themes
    if (colors.length > 4 || name.includes('rainbow') || name.includes('colorful') || 
        name.includes('vibrant') || name.includes('neon')) {
      return 'colorful';
    }
    
    // Minimal themes
    if (colors.length <= 3 || name.includes('minimal') || name.includes('simple') || 
        name.includes('clean') || name.includes('mono')) {
      return 'minimal';
    }
    
    return 'all';
  }

  function applyDefaultTheme(isDarkMode) {
    const root = document.documentElement;
    
    // Clear all custom CSS properties to revert to default
    const customProps = [
      '--theme-primary', '--theme-secondary', '--theme-accent',
      '--calculator-bg', '--display-bg', '--display-text',
      '--button-bg', '--button-hover', '--button-text',
      '--operator-bg', '--operator-hover'
    ];
    
    customProps.forEach(prop => root.style.removeProperty(prop));
    
    // Apply default iOS calculator styling
    const calculator = document.querySelector('.calculator');
    const display = document.querySelector('.display');
    const buttons = document.querySelectorAll('.btn:not(.operator)');
    const operators = document.querySelectorAll('.btn.operator');
    
    if (calculator) {
      calculator.style.background = '';
      calculator.style.borderColor = '';
    }
    
    if (display) {
      display.style.background = '';
      display.style.color = '';
    }
    
    buttons.forEach(btn => {
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    });
    
    operators.forEach(btn => {
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    });
    
    document.body.style.background = '';
  }

  function applyFigmaTheme(themeName, isDarkMode) {
    // Handle Default theme - revert to original calculator styling
    if (themeName === 'Default') {
      applyDefaultTheme(isDarkMode);
      return;
    }

    const theme = figmaThemes[themeName];
    if (!theme) return;

    const colors = theme.colors;
    const root = document.documentElement;

    // Check if in portrait mode
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // Generate CSS variables from theme colors
    const cssVars = generateThemeCSS(themeName, colors);
    
    // Apply CSS custom properties
    Object.keys(cssVars).forEach(varName => {
      root.style.setProperty(varName, cssVars[varName]);
    });

    // Apply to calculator elements
    const calculator = document.querySelector('.calculator');
    if (calculator) {
      calculator.style.background = cssVars['--calculator-bg'] || colors[0];
      calculator.style.borderColor = cssVars['--button-hover'] || colors[1] || colors[0];
    }

    const display = document.querySelector('.display');
    if (display) {
      // Apply theme colors to display (result area)
      display.style.background = cssVars['--display-bg'] || colors[1] || colors[0];
      display.style.color = cssVars['--display-text'] || getContrastColor(colors[1] || colors[0]);
    }

    const buttons = document.querySelectorAll('.btn:not(.operator)');
    buttons.forEach(btn => {
      btn.style.background = cssVars['--button-bg'] || colors[0];
      btn.style.color = cssVars['--button-text'] || getContrastColor(colors[0]);
      btn.style.borderColor = cssVars['--button-hover'] || colors[1] || colors[0];
    });

    const operators = document.querySelectorAll('.btn.operator');
    operators.forEach(btn => {
      // Use a different color from the theme for operators if available
      const operatorColor = colors[2] || colors[1] || colors[0];
      btn.style.background = operatorColor;
      btn.style.color = getContrastColor(operatorColor);
      btn.style.borderColor = colors[3] || colors[2] || colors[1] || colors[0];
    });

    // Apply body background
    document.body.style.background = cssVars['--calculator-bg'] || colors[0];
  }

  function showAestheticMenu() {
    // Create aesthetic overlay
    const aestheticOverlay = document.createElement('div');
    aestheticOverlay.classList.add('settings-overlay');
    if (calculator.pookieMode) aestheticOverlay.classList.add('pookie-active');

    const aestheticContainer = document.createElement('div');
    aestheticContainer.classList.add('settings-container');

    // MacOS Title Bar
    const titleBar = document.createElement('div');
    titleBar.classList.add('macos-title-bar');

    const trafficLights = document.createElement('div');
    trafficLights.classList.add('macos-traffic-lights');
    trafficLights.innerHTML = `
      <div class="traffic-light red"></div>
      <div class="traffic-light yellow"></div>
      <div class="traffic-light green"></div>
    `;

    const closeAestheticMenu = () => {
      winLogic.stopPhysics();
      winLogic.cleanup(); // Clean up window tracking
      aestheticOverlay.classList.remove('active');
      setTimeout(() => aestheticOverlay.remove(), 300);
    };

    const title = document.createElement('div');
    title.classList.add('macos-title');
    title.textContent = 'Aesthetic Settings';

    // Done button for iOS mobile
    const doneBtn = document.createElement('div');
    doneBtn.classList.add('ios-done-btn');

    titleBar.appendChild(trafficLights);
    titleBar.appendChild(title);
    titleBar.appendChild(doneBtn);

    doneBtn.addEventListener('click', closeAestheticMenu);

    const aestheticIconSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7L12 12L22 7L12 2Z"></path>
        <path d="M2 17L12 22L22 17"></path>
        <path d="M2 12L12 17L22 12"></path>
      </svg>
    `;

    const winLogic = initMacOSWindow(aestheticContainer, aestheticOverlay, titleBar, closeAestheticMenu, aestheticIconSVG);

    // Aesthetic Window Body
    const windowBody = document.createElement('div');
    windowBody.classList.add('settings-window-body');

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.classList.add('settings-sidebar');

    const sidebarItems = [
      { id: 'themes', icon: 'fa-swatchbook', label: 'Themes' },
      { id: 'layout', icon: 'fa-layer-group', label: 'Layout' },
      { id: 'colors', icon: 'fa-palette', label: 'Colors' },
      { id: 'buttons', icon: 'fa-square', label: 'Buttons' },
      { id: 'typography', icon: 'fa-font', label: 'Typography' },
      { id: 'effects', icon: 'fa-magic', label: 'Effects' },
      { id: 'advanced', icon: 'fa-cog', label: 'Advanced' }
    ];

    // Content Area
    const content = document.createElement('div');
    content.classList.add('settings-content');

    sidebarItems.forEach((item, index) => {
      const sbItem = document.createElement('div');
      sbItem.classList.add('sidebar-item');
      if (index === 0) sbItem.classList.add('active');
      sbItem.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;

      sbItem.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        sbItem.classList.add('active');
        document.getElementById(`section-${item.id}`).classList.add('active');
      });

      sidebar.appendChild(sbItem);
    });

    // Add resizer to Aesthetic sidebar
    addSidebarResizer(sidebar, 'aestheticSidebarWidth');

    // Content sections
    content.innerHTML = `
      <!-- Themes Section -->
      <div class="settings-section active" id="section-themes">
        <div class="settings-section-title">Themes</div>
        <div class="aesthetic-subsection">
          <div class="themes-section">
            <!-- Dark Mode Toggle and Documentation Strip -->
            <div class="theme-controls-row">
              <div class="theme-dark-mode-toggle">
                <div class="toggle-info">
                  <div class="toggle-title">Dark Mode</div>
                  <div class="toggle-subtitle">Apply dark theme to selected theme</div>
                </div>
                <div class="ios-toggle" id="darkModeToggle">
                  <div class="ios-toggle-slider"></div>
                </div>
              </div>
              <div class="theme-documentation-toggle" data-action="open-documentation">
                <div class="toggle-info">
                  <div class="toggle-title">Documentation</div>
                  <div class="toggle-subtitle">View color palettes and codes</div>
                </div>
                <button class="documentation-btn" id="documentationBtn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Themes Header -->
            <div class="themes-header">
              <h3 class="themes-title">Themes <span class="themes-tag">Powered by Figma</span></h3>
              <div class="themes-count">102 Themes</div>
            </div>
            
            <!-- Search Bar -->
            <div class="themes-search">
              <i class="fas fa-search themes-search-icon"></i>
              <input type="text" placeholder="Search themes..." id="themeSearchInput">
            </div>
            
            <!-- Theme Categories -->
            <div class="themes-categories">
              <div class="theme-category active" data-category="all">All</div>
              <div class="theme-category" data-category="dark">Dark</div>
              <div class="theme-category" data-category="light">Light</div>
              <div class="theme-category" data-category="colorful">Colorful</div>
              <div class="theme-category" data-category="minimal">Minimal</div>
            </div>
            
            <!-- Theme Grid -->
            <div class="themes-grid" id="themesGrid">
              <!-- Theme cards will be dynamically generated here -->
            </div>
          </div>
        </div>
      </div>

      <!-- Documentation Section -->
      <div class="settings-section" id="section-documentation">
        <div class="settings-section-title">Documentation</div>
        <div class="aesthetic-subsection">
          <div class="documentation-grid">
            <!-- Color Palettes Section -->
            <div class="documentation-card" data-action="color-palettes">
              <div class="doc-icon">🎨</div>
              <div class="doc-title">Color Palettes</div>
              <div class="doc-subtitle">Preview</div>
            </div>
            
            <!-- Color Codes Section -->
            <div class="documentation-card" data-action="color-codes">
              <div class="doc-icon">📋</div>
              <div class="doc-title">Color Codes</div>
              <div class="doc-subtitle">Palette Codes</div>
            </div>
            
            <!-- Source Section -->
            <div class="documentation-card" data-action="source">
              <div class="doc-icon">🌐</div>
              <div class="doc-title">Source</div>
              <div class="doc-subtitle">Original Webpage</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Layout Section -->
      <div class="settings-section" id="section-layout">
        <div class="settings-section-title">Layout</div>
        <div class="aesthetic-subsection">
          <p style="color: #8e8e93; text-align: center; padding: 40px;">Coming soon...</p>
        </div>
      </div>

      <!-- Colors Section -->
      <div class="settings-section" id="section-colors">
        <div class="settings-section-title">Colors</div>
        <div class="aesthetic-subsection">
          <p style="color: #8e8e93; text-align: center; padding: 40px;">Coming soon...</p>
        </div>
      </div>

      <!-- Buttons Section -->
      <div class="settings-section" id="section-buttons">
        <div class="settings-section-title">Buttons</div>
        <div class="aesthetic-subsection">
          <p style="color: #8e8e93; text-align: center; padding: 40px;">Coming soon...</p>
        </div>
      </div>

      <!-- Typography Section -->
      <div class="settings-section" id="section-typography">
        <div class="settings-section-title">Typography</div>
        <div class="aesthetic-subsection">
          <p style="color: #8e8e93; text-align: center; padding: 40px;">Coming soon...</p>
        </div>
      </div>

      <!-- Effects Section -->
      <div class="settings-section" id="section-effects">
        <div class="settings-section-title">Effects</div>
        <div class="aesthetic-subsection">
          <p style="color: #8e8e93; text-align: center; padding: 40px;">Coming soon...</p>
        </div>
      </div>

      <!-- Advanced Section -->
      <div class="settings-section" id="section-advanced">
        <div class="settings-section-title">Advanced</div>
        <div class="aesthetic-subsection">
          <p style="color: #8e8e93; text-align: center; padding: 40px;">Coming soon...</p>
        </div>
      </div>
    `;

    windowBody.appendChild(sidebar);
    windowBody.appendChild(content);

    aestheticContainer.appendChild(titleBar);
    aestheticContainer.appendChild(windowBody);
    aestheticOverlay.appendChild(aestheticContainer);
    document.body.appendChild(aestheticOverlay);

    // Animate in
    setTimeout(() => {
      aestheticOverlay.classList.add('active');
    }, 10);

    // Initialize theme system
    initializeThemeSystem(content);

    // Removed click outside to close - only close button works
  }

  function showSoundsMenu() {
    // Create sounds overlay
    const soundsOverlay = document.createElement('div');
    soundsOverlay.classList.add('settings-overlay');
    if (calculator.pookieMode) soundsOverlay.classList.add('pookie-active');

    const soundsContainer = document.createElement('div');
    soundsContainer.classList.add('settings-container');

    // MacOS Title Bar
    const titleBar = document.createElement('div');
    titleBar.classList.add('macos-title-bar');

    const trafficLights = document.createElement('div');
    trafficLights.classList.add('macos-traffic-lights');
    trafficLights.innerHTML = `
      <div class="traffic-light red"></div>
      <div class="traffic-light yellow"></div>
      <div class="traffic-light green"></div>
    `;

    const closeSoundsMenu = () => {
      winLogic.stopPhysics();
      winLogic.cleanup(); // Clean up window tracking
      soundsOverlay.classList.remove('active');
      setTimeout(() => soundsOverlay.remove(), 300);
    };

    const title = document.createElement('div');
    title.classList.add('macos-title');
    title.textContent = 'Sounds';

    titleBar.appendChild(trafficLights);
    titleBar.appendChild(title);

    const soundsIconSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    `;

    const winLogic = initMacOSWindow(soundsContainer, soundsOverlay, titleBar, closeSoundsMenu, soundsIconSVG);

    // Sounds Window Body
    const windowBody = document.createElement('div');
    windowBody.classList.add('settings-window-body');

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.classList.add('settings-sidebar');

    const sidebarItems = [
      { id: 'sounds', icon: 'fa-volume-up', label: 'Sounds' },
      { id: 'gestures', icon: 'fa-hand-pointer', label: 'Gestures' }
    ];

    // Content Area
    const content = document.createElement('div');
    content.classList.add('settings-content');

    sidebarItems.forEach((item, index) => {
      const sbItem = document.createElement('div');
      sbItem.classList.add('sidebar-item');
      if (index === 0) sbItem.classList.add('active');
      sbItem.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;

      sbItem.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        sbItem.classList.add('active');
        document.getElementById(`section-${item.id}`).classList.add('active');
      });

      sidebar.appendChild(sbItem);
    });

    // Add resizer to Sounds sidebar
    addSidebarResizer(sidebar, 'soundsSidebarWidth');

    // Content sections
    content.innerHTML = `
      <!-- Sounds Section -->
      <div class="settings-section active" id="section-sounds">
        <div class="settings-section-title">Sounds</div>
        <div class="aesthetic-subsection">
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Sound Effects</div>
              <div class="row-subtitle">Play sounds when pressing buttons.</div>
            </div>
            <label class="macos-switch">
              <input type="checkbox" class="sound-toggle" ${calculator.soundEnabled ? 'checked' : ''}>
              <span class="macos-slider"></span>
            </label>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">UI Animations & Sounds</div>
              <div class="row-subtitle">Enable specialized interface audio.</div>
            </div>
            <label class="macos-switch">
              <input type="checkbox" class="ui-sounds-toggle" ${calculator.uiSoundsEnabled !== 'none' ? 'checked' : ''}>
              <span class="macos-slider"></span>
            </label>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Haptic Feedback</div>
              <div class="row-subtitle">Vibrate on button presses.</div>
            </div>
            <label class="macos-switch">
              <input type="checkbox" class="vibration-toggle" ${calculator.vibrationEnabled ? 'checked' : ''}>
              <span class="macos-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Gestures Section -->
      <div class="settings-section" id="section-gestures">
        <div class="settings-section-title">Gestures</div>
        <div class="aesthetic-subsection">
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Touch Gestures</div>
              <div class="row-subtitle">Swipe on display to delete digits.</div>
            </div>
            <label class="macos-switch">
              <input type="checkbox" class="gestures-toggle" ${calculator.gesturesEnabled ? 'checked' : ''}>
              <span class="macos-slider"></span>
            </label>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for toggles
    const soundToggle = content.querySelector('.sound-toggle');
    soundToggle.addEventListener('change', (e) => {
      calculator.soundEnabled = e.target.checked;
      localStorage.setItem('calculatorSound', calculator.soundEnabled);
    });

    const uiSoundsToggle = content.querySelector('.ui-sounds-toggle');
    uiSoundsToggle.addEventListener('change', (e) => {
      calculator.uiSoundsEnabled = e.target.checked ? 'all' : 'none';
      localStorage.setItem('calculatorUISounds', calculator.uiSoundsEnabled);
    });

    const vibrationToggle = content.querySelector('.vibration-toggle');
    vibrationToggle.addEventListener('change', (e) => {
      calculator.vibrationEnabled = e.target.checked;
      localStorage.setItem('calculatorVibration', calculator.vibrationEnabled);
    });

    const gesturesToggle = content.querySelector('.gestures-toggle');
    gesturesToggle.addEventListener('change', (e) => {
      calculator.gesturesEnabled = e.target.checked;
      localStorage.setItem('calculatorGestures', calculator.gesturesEnabled);
      if (calculator.gesturesEnabled) calculator.enableGestures();
      else calculator.disableGestures();
    });

    windowBody.appendChild(sidebar);
    windowBody.appendChild(content);

    soundsContainer.appendChild(titleBar);
    soundsContainer.appendChild(windowBody);
    soundsOverlay.appendChild(soundsContainer);
    document.body.appendChild(soundsOverlay);

    // Animate in
    setTimeout(() => {
      soundsOverlay.classList.add('active');
    }, 10);

    // Removed click outside to close - only close button works
  }

  function showKeysMenu() {
    const keysOverlay = document.createElement('div');
    keysOverlay.classList.add('settings-overlay');
    if (calculator.pookieMode) keysOverlay.classList.add('pookie-active');

    const keysContainer = document.createElement('div');
    keysContainer.classList.add('settings-container');

    // MacOS Title Bar
    const titleBar = document.createElement('div');
    titleBar.classList.add('macos-title-bar');

    const trafficLights = document.createElement('div');
    trafficLights.classList.add('macos-traffic-lights');
    trafficLights.innerHTML = `
      <div class="traffic-light red"></div>
      <div class="traffic-light yellow"></div>
      <div class="traffic-light green"></div>
    `;

    const closeKeysMenu = () => {
      winLogic.stopPhysics();
      winLogic.cleanup();
      keysOverlay.classList.remove('active');
      setTimeout(() => keysOverlay.remove(), 300);
    };

    const title = document.createElement('div');
    title.classList.add('macos-title');
    title.textContent = 'Key(board) Binding';

    titleBar.appendChild(trafficLights);
    titleBar.appendChild(title);

    const keysIconSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01"></path>
      </svg>
    `;

    const winLogic = initMacOSWindow(keysContainer, keysOverlay, titleBar, closeKeysMenu, keysIconSVG);

    // Keys Window Body
    const windowBody = document.createElement('div');
    windowBody.classList.add('settings-window-body');

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.classList.add('settings-sidebar');

    const sidebarItems = [
      { id: 'calc', icon: 'fa-calculator', label: 'Calculator' },
      { id: 'system', icon: 'fa-desktop', label: 'System' }
    ];

    // Content Area
    const content = document.createElement('div');
    content.classList.add('settings-content');

    sidebarItems.forEach((item, index) => {
      const sbItem = document.createElement('div');
      sbItem.classList.add('sidebar-item');
      if (index === 0) sbItem.classList.add('active');
      sbItem.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;

      sbItem.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        sbItem.classList.add('active');
        document.getElementById(`section-${item.id}`).classList.add('active');
      });

      sidebar.appendChild(sbItem);
    });

    // Content sections
    content.innerHTML = `
      <!-- Calc Section -->
      <div class="settings-section active" id="section-calc">
        <div class="settings-section-title">Calculator Key Bindings</div>
        <div class="aesthetic-subsection">
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Numbers (0-9)</div>
              <div class="row-subtitle">Press number keys to input digits</div>
            </div>
            <div class="key-binding-display">
              <kbd>0</kbd> <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> <kbd>5</kbd> <kbd>6</kbd> <kbd>7</kbd> <kbd>8</kbd> <kbd>9</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Decimal Point</div>
              <div class="row-subtitle">Insert decimal point</div>
            </div>
            <div class="key-binding-display">
              <kbd>.</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Basic Operations</div>
              <div class="row-subtitle">Addition, subtraction, multiplication, division</div>
            </div>
            <div class="key-binding-display">
              <kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Equals / Calculate</div>
              <div class="row-subtitle">Perform calculation</div>
            </div>
            <div class="key-binding-display">
              <kbd>=</kbd> <kbd>Enter</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Clear</div>
              <div class="row-subtitle">Clear calculator display</div>
            </div>
            <div class="key-binding-display">
              <kbd>Escape</kbd> <kbd>Backspace</kbd>
            </div>
          </div>
        </div>
      </div>

      <!-- System Section -->
      <div class="settings-section" id="section-system">
        <div class="settings-section-title">System Key Bindings</div>
        <div class="aesthetic-subsection">
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Menu Bar</div>
              <div class="row-subtitle">Toggle main menu sidebar</div>
            </div>
            <div class="key-binding-display">
              <kbd>TAB</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Confirm</div>
              <div class="row-subtitle">Confirm button for popups and options</div>
            </div>
            <div class="key-binding-display">
              <kbd>Enter</kbd> <kbd>Spacebar</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Config</div>
              <div class="row-subtitle">Open System Config window</div>
            </div>
            <div class="key-binding-display">
              <kbd>C</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">History</div>
              <div class="row-subtitle">View calculation history</div>
            </div>
            <div class="key-binding-display">
              <kbd>H</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Sounds</div>
              <div class="row-subtitle">Open sounds settings</div>
            </div>
            <div class="key-binding-display">
              <kbd>S</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Keys</div>
              <div class="row-subtitle">Open keyboard bindings</div>
            </div>
            <div class="key-binding-display">
              <kbd>K</kbd>
            </div>
          </div>
          <div class="macos-settings-row">
            <div class="row-info">
              <div class="row-title">Toggle Pookie Mode</div>
              <div class="row-subtitle">Activate/deactivate pookie mode</div>
            </div>
            <div class="key-binding-display">
              <kbd>P</kbd>
            </div>
          </div>
        </div>
      </div>
    `;

    windowBody.appendChild(sidebar);
    windowBody.appendChild(content);

    keysContainer.appendChild(titleBar);
    keysContainer.appendChild(windowBody);
    keysOverlay.appendChild(keysContainer);
    document.body.appendChild(keysOverlay);

    setTimeout(() => {
      keysOverlay.classList.add('active');
    }, 10);
  }

  if (ribbonBtn) {
    ribbonBtn.addEventListener('click', () => {
      calculator.togglePookieMode();
    });
  }

  // Panel Resizer Logic
  const resizer = document.getElementById('panel-resizer');
  const displayPanel = document.querySelector('.display-panel');
  let isResizing = false;

  if (resizer && displayPanel) {
    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection
      resizer.classList.add('resizing');
    });

    const handleResize = (clientX) => {
      if (!isResizing) return;

      const buttonsPanel = document.querySelector('.buttons-panel');
      const sciGrid = document.querySelector('.scientific-buttons');
      const regGrid = document.querySelector('.buttons');

      if (!buttonsPanel || !sciGrid || !regGrid) return;

      // Calculate minimum width required by buttons (content + gap + padding)
      // We use getBoundingClientRect or offsetWidth to see how wide they are currently
      const sciWidth = sciGrid.offsetWidth;
      const regWidth = regGrid.offsetWidth;
      const minButtonsSpace = sciWidth + regWidth + 20 + 32 + 10; // grids + middle gap + padding + safety margin

      const containerWidth = window.innerWidth;
      const resizerWidth = resizer.offsetWidth;
      const maxDisplayPx = containerWidth - minButtonsSpace - resizerWidth;

      let newPx = clientX;

      // Constraints (min 15% width, max depends on buttons)
      if (newPx < containerWidth * 0.15) newPx = containerWidth * 0.15;
      if (newPx > maxDisplayPx) newPx = maxDisplayPx;

      let newWidthPercent = (newPx / containerWidth) * 100;
      displayPanel.style.flex = `0 0 ${newWidthPercent}%`;
    };

    document.addEventListener('mousemove', (e) => handleResize(e.clientX));

    document.addEventListener('touchmove', (e) => {
      if (isResizing) {
        handleResize(e.touches[0].clientX);
      }
    }, { passive: false });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizer.classList.remove('resizing');
      }
    });

    // Touch support for resizing
    resizer.addEventListener('touchstart', (e) => {
      isResizing = true;
      resizer.classList.add('resizing');
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('resizing');
      }
    });
  }
});

// Initialize macOS Menu Bar and integrate with landscape mode
let macMenuBar = null;

function initializeMacMenuBar() {
  if (typeof MacOSMenuBar !== 'undefined') {
    macMenuBar = new MacOSMenuBar({
      appName: 'Calovetor',
      onMenuAction: (action) => {
        handleMenuAction(action);
      }
    });
    
    // Check for landscape mode and apply appropriate styling
    checkLandscapeMode();
  }
}

function handleMenuAction(action) {
  console.log('Menu action:', action);
  
  // Handle specific menu actions using existing calculator functions
  switch (action) {
    // Apple Menu
    case 'about':
      // Use existing about function
      if (typeof showAbout === 'function') {
        showAbout();
      } else {
        showMacOSWindow('About Calovetor', `
          <div style="text-align: center; padding: 20px;">
            <h2>Calovetor</h2>
            <p>Advanced Calculator Application</p>
            <p>Version 1.0.0</p>
            <p>By Samad Khan</p>
          </div>
        `);
      }
      break;
      
    case 'settings':
      // Open existing settings
      if (typeof showSettingsMenu === 'function') {
        showSettingsMenu();
      }
      break;
      
    // File Menu  
    case 'clear':
      // Clear calculator
      const currentInput = document.querySelector('.current-input');
      if (currentInput) {
        currentInput.textContent = '0';
      }
      break;
      
    case 'take-snapshot':
      // Take a snapshot of the calculator
      html2canvas(document.querySelector('.calculator')).then(canvas => {
        const link = document.createElement('a');
        link.download = `calculator-snapshot-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
      break;
      
    // Edit Menu
    case 'copy-all':
      // Copy all values from display
      const displayText = document.querySelector('.current-input').textContent;
      navigator.clipboard.writeText(displayText);
      break;
      
    case 'copy-answer':
      // Copy just the answer
      const answer = document.querySelector('.current-input').textContent;
      navigator.clipboard.writeText(answer);
      break;
      
    case 'paste-all':
      // Paste values
      navigator.clipboard.readText().then(text => {
        const currentInput = document.querySelector('.current-input');
        if (currentInput) {
          currentInput.textContent = text;
        }
      });
      break;
      
    case 'paste-answer':
      // Paste as answer
      navigator.clipboard.readText().then(text => {
        const currentInput = document.querySelector('.current-input');
        if (currentInput) {
          currentInput.textContent = text;
        }
      });
      break;
      
    // View Menu
    case 'toggle-dark':
      // Toggle dark mode
      document.body.classList.toggle('dark-mode');
      break;
      
    case 'toggle-pookie':
      // Toggle pookie mode
      const ribbonBtn = document.getElementById('ribbon-btn');
      if (ribbonBtn) {
        ribbonBtn.click();
      }
      break;
      
    // Theme actions
    case 'theme-alchemical':
    case 'theme-autumn':
    case 'theme-autumn-orchard':
    case 'theme-beachfront':
    case 'theme-blooming':
    case 'theme-blue-eclipse':
    case 'theme-burgundy':
    case 'theme-cherry':
    case 'theme-cobalt':
    case 'theme-coral':
      // Apply specific theme
      const themeName = action.replace('theme-', '');
      console.log(`Applying theme: ${themeName}`);
      // Here you would apply the specific theme
      break;
      
    // History Menu
    case 'history':
      // Open existing history
      if (typeof showHistory === 'function') {
        showHistory();
      }
      break;
      
    case 'clear-history':
      // Clear history using existing function
      if (typeof clearHistory === 'function') {
        clearHistory();
      }
      break;
      
    case 'export-history':
      // Export history
      const history = document.querySelector('.history').textContent;
      const blob = new Blob([history], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calculator-history-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      break;
      
    // Window Menu actions
    case 'window-history':
    case 'window-config':
    case 'window-aesthetics':
    case 'window-sounds':
    case 'window-keys':
    case 'window-developer':
      // Handle window submenu actions
      const windowAction = action.replace('window-', '');
      if (windowAction === 'history' && typeof showHistory === 'function') {
        showHistory();
      } else if (windowAction === 'config' && typeof showSettingsMenu === 'function') {
        showSettingsMenu();
      } else if (windowAction === 'aesthetics' && typeof showAestheticMenu === 'function') {
        showAestheticMenu();
      } else if (windowAction === 'sounds' && typeof showSoundsMenu === 'function') {
        showSoundsMenu();
      } else if (windowAction === 'keys' && typeof showKeysMenu === 'function') {
        showKeysMenu();
      } else if (windowAction === 'developer') {
        showMacOSWindow('Developer', `
          <div style="padding: 20px;">
            <h3>Developer Options</h3>
            <p>Developer tools and information</p>
          </div>
        `);
      }
      break;
      
    // Developer Menu
    case 'socials':
      showMacOSWindow('Socials', `
        <div style="padding: 20px;">
          <h3>Social Links</h3>
          <p>Connect with the developer</p>
        </div>
      `);
      break;
      
    case 'portfolio':
      showMacOSWindow('Portfolio', `
        <div style="padding: 20px;">
          <h3>Portfolio</h3>
          <p>View developer portfolio</p>
        </div>
      `);
      break;
      
    case 'resume':
      showMacOSWindow('Resume', `
        <div style="padding: 20px;">
          <h3>Resume</h3>
          <p>Developer resume</p>
        </div>
      `);
      break;
      
    // Existing actions from before
    case 'fullscreen':
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      break;
      
    case 'minimize':
      const calculatorEl = document.querySelector('.calculator');
      if (calculatorEl) {
        calculatorEl.classList.add('minimized');
        setTimeout(() => {
          calculatorEl.classList.remove('minimized');
        }, 2000);
      }
      break;
      
    case 'close-window':
      if (confirm('Are you sure you want to close calculator?')) {
        window.close();
      }
      break;
      
    case 'print':
      window.print();
      break;
      
    case 'save-page':
      const currentInputVal = document.querySelector('.current-input').textContent;
      const historyVal = document.querySelector('.history').textContent;
      const data = {
        input: currentInputVal,
        history: historyVal,
        timestamp: new Date().toISOString()
      };
      
      const dataBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const dataUrl = URL.createObjectURL(dataBlob);
      const dataA = document.createElement('a');
      dataA.href = dataUrl;
      dataA.download = `calculation-${Date.now()}.json`;
      dataA.click();
      URL.revokeObjectURL(dataUrl);
      break;
      
    case 'app-help':
      showMacOSWindow('Help', `
        <div style="padding: 20px;">
          <h3>Calculator Help</h3>
          <p><strong>Basic Operations:</strong></p>
          <ul>
            <li>Use number buttons for digits</li>
            <li>Use operator buttons (+, -, ×, ÷) for calculations</li>
            <li>Press = to get results</li>
            <li>Press AC to clear</li>
          </ul>
          <p><strong>Scientific Functions:</strong></p>
          <ul>
            <li>sin, cos, tan for trigonometry</li>
            <li>log, ln for logarithms</li>
            <li>√ for square root</li>
            <li>x² for square</li>
            <li>xʸ for power</li>
          </ul>
        </div>
      `);
      break;
      
    case 'shortcuts':
      showMacOSWindow('Keyboard Shortcuts', `
        <div style="padding: 20px;">
          <h3>Calculator Shortcuts</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td><strong>⌘N</strong></td><td>New Calculation</td></tr>
            <tr><td><strong>⌘S</strong></td><td>Save Calculation</td></tr>
            <tr><td><strong>⇧⌘S</strong></td><td>Take Snapshot</td></tr>
            <tr><td><strong>⌘Z</strong></td><td>Undo</td></tr>
            <tr><td><strong>⇧⌘Z</strong></td><td>Redo</td></tr>
            <tr><td><strong>⌘C</strong></td><td>Copy All Values</td></tr>
            <tr><td><strong>⇧⌘C</strong></td><td>Copy Answer</td></tr>
            <tr><td><strong>⌘V</strong></td><td>Paste All Values</td></tr>
            <tr><td><strong>⇧⌘V</strong></td><td>Paste Answer</td></tr>
            <tr><td><strong>⌘D</strong></td><td>Toggle Dark Mode</td></tr>
            <tr><td><strong>⌘P</strong></td><td>Toggle Pookie Mode</td></tr>
            <tr><td><strong>⌘H</strong></td><td>Open History</td></tr>
            <tr><td><strong>⌘+</strong></td><td>Zoom In</td></tr>
            <tr><td><strong>⌘-</strong></td><td>Zoom Out</td></tr>
            <tr><td><strong>⌘0</strong></td><td>Actual Size</td></tr>
            <tr><td><strong>⌃⌘F</strong></td><td>Full Screen</td></tr>
          </table>
        </div>
      `);
      break;
      
    case 'contact-support':
      showMacOSWindow('Contact Support', `
        <div style="padding: 20px;">
          <h3>Contact Support</h3>
          <p>For support and feedback:</p>
          <p><strong>Developer:</strong> Samad Khan</p>
          <p><strong>Calculator:</strong> Calovetor</p>
          <p>We appreciate your feedback and suggestions!</p>
        </div>
      `);
      break;
      
    default:
      console.log('Unhandled menu action:', action);
  }
}

function checkLandscapeMode() {
  const calculator = document.querySelector('.calculator');
  const menuBar = document.getElementById('mac-menu-bar');
  const isLandscape = window.innerWidth > window.innerHeight;
  
  if (isLandscape) {
    calculator.classList.add('landscape-mode');
  } else {
    calculator.classList.remove('landscape-mode');
  }
  
  // Apply menubar settings instead of hardcoding visibility
  if (menuBar && typeof applyMenubarSettings === 'function') {
    applyMenubarSettings();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for other scripts to load
  setTimeout(initializeMacMenuBar, 100);
  
  // Apply menubar settings after menubar is initialized
  setTimeout(() => {
    if (typeof applyMenubarSettings === 'function') {
      applyMenubarSettings();
    }
  }, 200);
});

// Add resize listener for landscape mode detection
window.addEventListener('resize', () => {
  checkLandscapeMode();
  
  // Update input mode for touch mode landscape behavior
  const currentMode = localStorage.getItem('calculatorInputMode') || 'mixed';
  if (currentMode === 'touch') {
    applyInputMode(currentMode);
  }
});

// Add CSS for landscape mode adjustments
const landscapeStyles = document.createElement('style');
landscapeStyles.textContent = `
  .calculator.landscape-mode {
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    margin: 0;
    border-radius: 0;
    padding-top: 32px;
  }
  
  .calculator:not(.landscape-mode) {
    padding-top: 0;
  }
  
  .calculator.landscape-mode .display-panel {
    height: calc(100vh - 32px);
  }
  
  .calculator.landscape-mode .buttons-panel {
    height: calc(100vh - 32px);
    overflow-y: auto;
  }
  
  @media (max-width: 768px) {
    .calculator.landscape-mode .buttons-panel {
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
    }
    
    .calculator.landscape-mode .buttons {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      padding: 10px;
    }
    
    .calculator.landscape-mode .btn {
      font-size: 14px;
      padding: 15px 10px;
    }
  }
  
  @media (max-width: 480px) {
    .calculator.landscape-mode .buttons {
      grid-template-columns: repeat(4, 1fr);
    }
    
    .calculator.landscape-mode .btn {
      font-size: 12px;
      padding: 12px 8px;
    }
  }
  
  /* Ensure menu bar is always on top when visible */
  .mac-menu-bar {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 9999 !important;
  }
  
  /* Enhanced compact mode styles */
  .mac-menu-bar.compact-mode {
    backdrop-filter: blur(8px);
    /* Remove background color override to keep normal mode colors */
  }
  
  .mac-menu-bar.compact-mode .menu-item {
    transition: all 0.2s ease;
  }
  
  .mac-menu-bar.compact-mode .menu-item:hover {
    background: rgba(128, 128, 128, 0.2);
    border-radius: 3px;
  }
  
  .mac-menu-bar.compact-mode .status-icon svg {
    transition: transform 0.2s ease;
  }
  
  .mac-menu-bar.compact-mode .status-icon:hover svg {
    transform: scale(0.9);
  }
  
  .mac-menu-bar.compact-mode .menu-clock {
    font-weight: 500;
    letter-spacing: 0.5px;
  }
  
  /* Position selector styles */
  .position-selector {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }
  
  .position-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.5);
    min-width: 50px;
  }
  
  .position-option:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: #007AFF;
    transform: translateY(-1px);
  }
  
  .position-option.active {
    background: #007AFF;
    border-color: #007AFF;
    color: white;
  }
  
  .position-icon {
    font-size: 16px;
    margin-bottom: 2px;
  }
  
  .position-option span {
    font-size: 10px;
    font-weight: 500;
  }
  
  .dark-mode .position-option {
    background: rgba(50, 50, 50, 0.8);
    border-color: #555;
    color: white;
  }
  
  .dark-mode .position-option:hover {
    background: rgba(70, 70, 70, 0.9);
    border-color: #007AFF;
  }
  
  .dark-mode .position-option.active {
    background: #007AFF;
    border-color: #007AFF;
    color: white;
  }
  
  /* Menubar position styles */
  .mac-menu-bar.position-top {
    top: 0;
    left: 0;
    right: 0;
    bottom: auto;
    width: 100%;
    height: auto;
    flex-direction: row;
  }
  
  .mac-menu-bar.position-bottom {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: auto;
    flex-direction: row;
  }
  
  .mac-menu-bar.position-left {
    top: 0;
    left: 0;
    right: auto;
    bottom: 0;
    width: 60px;
    height: 100vh;
    flex-direction: column;
  }
  
  .mac-menu-bar.position-right {
    top: 0;
    left: auto;
    right: 0;
    bottom: 0;
    width: 60px;
    height: 100vh;
    flex-direction: column;
  }
  
  .mac-menu-bar.position-left .menu-bar-content,
  .mac-menu-bar.position-right .menu-bar-content {
    flex-direction: column;
    height: 100%;
    padding: 10px 0;
  }
  
  .mac-menu-bar.position-left .menu-bar-left,
  .mac-menu-bar.position-right .menu-bar-left {
    flex-direction: column;
    gap: 8px;
  }
  
  .mac-menu-bar.position-left .menu-bar-right,
  .mac-menu-bar.position-right .menu-bar-right {
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
  }
`;
document.head.appendChild(landscapeStyles);