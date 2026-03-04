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
      if (this.gesturesEnabled) {
        this.enableGestures();
      }
    }, 50);
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
      'gestures.mp3'
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
      'pookie-activation.mp3'
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

  loadTheme() {
    const savedTheme = localStorage.getItem('calculatorTheme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else if (savedTheme === 'pookie') {
      this.pookieMode = true;
      document.querySelector('.calculator').classList.add('pookie-mode');
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
    switch(theme) {
      case 'dark':
        body.classList.add('dark-mode');
        break;
      case 'pookie':
        if (calculator) {
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
      
      // Update theme in localStorage and settings menu
      localStorage.setItem('calculatorTheme', 'pookie');
      this.updateSettingsThemeSelection('pookie');
      
      console.log(`Pookie mode activated with ${pookiePalette.name} theme`);
    } else {
      calculator.classList.remove('pookie-mode');
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
function showIOSNotification(message, className = 'ios-notification', imageUrl = null) {
  // Remove any existing notifications with the same class
  const existingNotifications = document.querySelectorAll(`.${className}`);
  existingNotifications.forEach(notif => notif.remove());

  const notification = document.createElement('div');
  notification.className = `ios-notification ${className}`;
  
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
  
  // Initial state (hidden above with blur)
  notification.style.transform = 'translateX(-50%) translateY(-100%)';
  notification.style.opacity = '0';
  notification.style.filter = 'blur(4px)';
  notification.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), ' +
                                'opacity 0.6s ease, ' +
                                'filter 0.6s ease';
  
  // Add blur to main content
  mainContent.style.transition = 'filter 0.6s ease';
  mainContent.style.filter = 'blur(0)';
  
  // Animate in (swipe down + fade + blur)
  requestAnimationFrame(() => {
    setTimeout(() => {
      // Remove blur from notification
      notification.style.filter = 'blur(0)';
      // Apply blur to main content
      mainContent.style.filter = 'blur(4px)';
      // Slide down and fade in
      notification.style.transform = 'translateX(-50%) translateY(0)';
      notification.style.opacity = '1';
    }, 10);
  });
  
  // Auto remove with swipe up + fade + blur
  const removeNotification = () => {
    // Remove blur from main content
    mainContent.style.filter = 'blur(0)';
    // Apply blur and fade out to notification
    notification.style.filter = 'blur(4px)';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-100%)';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 600);
  };
  
  // Auto-remove after delay
  const autoRemoveTimer = setTimeout(removeNotification, 5000);
  
  // Also remove on click
  notification.addEventListener('click', () => {
    clearTimeout(autoRemoveTimer);
    removeNotification();
  });
}

// Initialize calculator globally
const calculator = new Calculator();

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Show welcome notification with image
  setTimeout(() => {
    showIOSNotification('', 'ios-notification-welcome', 'notifications/welcome.png');
  }, 1000);
  
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', (event) => {
      // Handle button click
      calculator.handleButtonClick(button);
    });
  });
  
  // Add corner button functionality
  const menuBtn = document.getElementById('menu-btn');
  const ribbonBtn = document.getElementById('ribbon-btn');
  
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      showIOSMenu();
    });
  }
  
  // Define functions first
  function showIOSMenu() {
    // Create iOS-style menu overlay
    const menuOverlay = document.createElement('div');
    menuOverlay.classList.add('ios-menu-overlay');
    
    const menuContainer = document.createElement('div');
    menuContainer.classList.add('ios-menu-container');
    
    // Add drag functionality
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let initialTransform = -260; // Initial position off-screen
    
    menuContainer.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].clientX;
      currentX = initialTransform;
    });
    
    menuContainer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - startX;
      currentX = Math.max(-260, Math.min(0, initialTransform + deltaX));
      menuContainer.style.transform = `translateX(${currentX}px)`;
    });
    
    menuContainer.addEventListener('touchend', () => {
      isDragging = false;
      if (currentX < -130) {
        // Close if dragged more than half
        closeIOSMenu();
      } else {
        // Snap back to open
        menuContainer.style.transform = 'translateX(0)';
      }
    });
    
    // Also add mouse events for desktop
    menuContainer.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      currentX = initialTransform;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      currentX = Math.max(-260, Math.min(0, initialTransform + deltaX));
      menuContainer.style.transform = `translateX(${currentX}px)`;
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      if (currentX < -130) {
        closeIOSMenu();
      } else {
        menuContainer.style.transform = 'translateX(0)';
      }
    });
    
    const menuOptions = [
      { text: 'Settings', action: 'settings' },
      { text: 'History', action: 'history' },
      { text: 'About', action: 'about' }
    ];
    
    menuOptions.forEach(option => {
      const menuItem = document.createElement('div');
      menuItem.classList.add('ios-menu-item');
      menuItem.textContent = option.text;
      menuItem.addEventListener('click', () => {
        handleMenuSelection(option.action);
        closeIOSMenu();
      });
      menuContainer.appendChild(menuItem);
    });
    
    menuOverlay.appendChild(menuContainer);
    document.body.appendChild(menuOverlay);
    
    // Set initial transform
    menuContainer.style.transform = `translateX(${initialTransform}px)`;
    
    // Animate in
    setTimeout(() => {
      menuOverlay.classList.add('active');
      menuContainer.style.transform = 'translateX(0)';
    }, 10);
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
    switch(action) {
      case 'settings':
        showSettingsMenu();
        break;
      case 'history':
        showHistory();
        break;
      case 'about':
        showPookieBox();
        break;
    }
  }
  
  async function showHistory() {
    try {
      // Load history lines and error messages from files
      const [historyLinesResponse, errorMessagesResponse] = await Promise.all([
        fetch('history_lines.txt'),
        fetch('error_messages.txt')
      ]);
      
      const historyLinesText = await historyLinesResponse.text();
      const errorMessagesText = await errorMessagesResponse.text();
      
      const historyLines = historyLinesText.split('\n').filter(line => line.trim() !== '');
      const errorMessages = errorMessagesText.split('\n').filter(line => line.trim() !== '');
      
      // Create history overlay
      const historyOverlay = document.createElement('div');
      historyOverlay.classList.add('history-overlay');
      
      const historyContainer = document.createElement('div');
      historyContainer.classList.add('history-container');
      
      // History header
      const historyHeader = document.createElement('div');
      historyHeader.classList.add('history-header');
      
      const historyTitle = document.createElement('h3');
      historyTitle.textContent = 'Calculation History';
      
      const historyCloseBtn = document.createElement('button');
      historyCloseBtn.classList.add('history-close');
      historyCloseBtn.textContent = '×';
      historyCloseBtn.addEventListener('click', () => {
        historyOverlay.classList.remove('active');
        setTimeout(() => historyOverlay.remove(), 300);
      });
      
      historyHeader.appendChild(historyTitle);
      historyHeader.appendChild(historyCloseBtn);
      
      // History items (show last 10 calculations)
      const historyItems = document.createElement('div');
      historyItems.classList.add('history-items');
      
      // Show up to 10 history items
      const itemsToShow = Math.min(calculator.history.length, 10);
      for (let i = 0; i < itemsToShow; i++) {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        
        // Get history line (cycle through available lines)
        const lineIndex = i % historyLines.length;
        const description = historyLines[lineIndex];
        
        historyItem.innerHTML = `
          <div class="history-calculation">${calculator.history[i].calculation}</div>
          <div class="history-description">${description}</div>
        `;
        
        // Add click event for iOS error
        historyItem.addEventListener('click', () => {
          const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
          showIOSError(randomError);
        });
        
        historyItems.appendChild(historyItem);
      }
      
      // If no history, show message
      if (itemsToShow === 0) {
        const noHistory = document.createElement('div');
        noHistory.classList.add('no-history');
        noHistory.textContent = 'No calculations yet! Start calculating to see your history here ✨';
        historyItems.appendChild(noHistory);
      }
      
      historyContainer.appendChild(historyHeader);
      historyContainer.appendChild(historyItems);
      historyOverlay.appendChild(historyContainer);
      document.body.appendChild(historyOverlay);
      
      // Animate in
      setTimeout(() => {
        historyOverlay.classList.add('active');
      }, 10);
      
      // Close on overlay click
      historyOverlay.addEventListener('click', (e) => {
        if (e.target === historyOverlay) {
          historyOverlay.classList.remove('active');
          setTimeout(() => historyOverlay.remove(), 300);
        }
      });
    } catch (error) {
      console.error('Error loading history data:', error);
      // Fallback to hardcoded arrays if files fail to load
      showHistoryFallback();
    }
  }
  
  function showHistoryFallback() {
    // Fallback function with hardcoded arrays
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
    
    // Same logic as above but with hardcoded arrays
    const historyOverlay = document.createElement('div');
    historyOverlay.classList.add('history-overlay');
    
    const historyContainer = document.createElement('div');
    historyContainer.classList.add('history-container');
    
    const historyHeader = document.createElement('div');
    historyHeader.classList.add('history-header');
    
    const historyTitle = document.createElement('h3');
    historyTitle.textContent = 'Calculation History';
    
    const historyCloseBtn = document.createElement('button');
    historyCloseBtn.classList.add('history-close');
    historyCloseBtn.textContent = '×';
    historyCloseBtn.addEventListener('click', () => {
      historyOverlay.classList.remove('active');
      setTimeout(() => historyOverlay.remove(), 300);
    });
    
    historyHeader.appendChild(historyTitle);
    historyHeader.appendChild(historyCloseBtn);
    
    const historyItems = document.createElement('div');
    historyItems.classList.add('history-items');
    
    const itemsToShow = Math.min(calculator.history.length, 10);
    for (let i = 0; i < itemsToShow; i++) {
      const historyItem = document.createElement('div');
      historyItem.classList.add('history-item');
      
      const lineIndex = i % historyLines.length;
      const description = historyLines[lineIndex];
      
      historyItem.innerHTML = `
        <div class="history-calculation">${calculator.history[i].calculation}</div>
        <div class="history-description">${description}</div>
      `;
      
      historyItem.addEventListener('click', () => {
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        showIOSError(randomError);
      });
      
      historyItems.appendChild(historyItem);
    }
    
    if (itemsToShow === 0) {
      const noHistory = document.createElement('div');
      noHistory.classList.add('no-history');
      noHistory.textContent = 'No calculations yet! Start calculating to see your history here ✨';
      historyItems.appendChild(noHistory);
    }
    
    historyContainer.appendChild(historyHeader);
    historyContainer.appendChild(historyItems);
    historyOverlay.appendChild(historyContainer);
    document.body.appendChild(historyOverlay);
    
    setTimeout(() => {
      historyOverlay.classList.add('active');
    }, 10);
    
    historyOverlay.addEventListener('click', (e) => {
      if (e.target === historyOverlay) {
        historyOverlay.classList.remove('active');
        setTimeout(() => historyOverlay.remove(), 300);
      }
    });
  }
  
  function showIOSError(message) {
    // Create iOS-style error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.classList.add('ios-error-overlay');
    
    const errorContainer = document.createElement('div');
    errorContainer.classList.add('ios-error-container');
    
    const errorIcon = document.createElement('div');
    errorIcon.classList.add('ios-error-icon');
    errorIcon.innerHTML = '🌸';
    
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('ios-error-message');
    errorMessage.textContent = message;
    
    const errorButton = document.createElement('button');
    errorButton.classList.add('ios-error-button');
    errorButton.textContent = 'OK';
    errorButton.addEventListener('click', () => {
      errorOverlay.classList.remove('active');
      setTimeout(() => errorOverlay.remove(), 300);
    });
    
    errorContainer.appendChild(errorIcon);
    errorContainer.appendChild(errorMessage);
    errorContainer.appendChild(errorButton);
    errorOverlay.appendChild(errorContainer);
    document.body.appendChild(errorOverlay);
    
    // Animate in
    setTimeout(() => {
      errorOverlay.classList.add('active');
    }, 10);
    
    // Close on overlay click
    errorOverlay.addEventListener('click', (e) => {
      if (e.target === errorOverlay) {
        errorOverlay.classList.remove('active');
        setTimeout(() => errorOverlay.remove(), 300);
      }
    });
  }
  
  function showPookieBox() {
    // Create pookie box overlay
    const pookieOverlay = document.createElement('div');
    pookieOverlay.classList.add('pookie-box-overlay');
    
    const pookieContainer = document.createElement('div');
    pookieContainer.classList.add('pookie-box-container');
    
    // Header with buttons
    const pookieHeader = document.createElement('div');
    pookieHeader.classList.add('pookie-box-header');
    
    const pookieTitle = document.createElement('div');
    pookieTitle.classList.add('pookie-box-title');
    pookieTitle.textContent = 'Developer.';
    
    const pookieButtons = document.createElement('div');
    pookieButtons.classList.add('pookie-box-buttons');
    
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('pookie-box-close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => {
      pookieOverlay.classList.remove('active');
      setTimeout(() => pookieOverlay.remove(), 300);
    });
    
    const openInChromeBtn = document.createElement('button');
    openInChromeBtn.classList.add('pookie-box-open');
    openInChromeBtn.textContent = 'Open in Chrome';
    openInChromeBtn.addEventListener('click', () => {
      window.open('https://samfolio.carrd.co/', '_blank');
    });
    
    pookieButtons.appendChild(openInChromeBtn);
    pookieButtons.appendChild(closeBtn);
    
    pookieHeader.appendChild(pookieTitle);
    pookieHeader.appendChild(pookieButtons);
    
    // Embed for the URL
    const pookieEmbed = document.createElement('embed');
    pookieEmbed.classList.add('pookie-box-iframe');
    pookieEmbed.src = 'https://samfolio.carrd.co/';
    pookieEmbed.frameBorder = '0';
    pookieEmbed.style.width = '100%';
    pookieEmbed.style.height = '100%';
    
    pookieContainer.appendChild(pookieHeader);
    pookieContainer.appendChild(pookieEmbed);
    pookieOverlay.appendChild(pookieContainer);
    document.body.appendChild(pookieOverlay);
    
    // Animate in
    setTimeout(() => {
      pookieOverlay.classList.add('active');
    }, 10);
    
    // Close on overlay click
    pookieOverlay.addEventListener('click', (e) => {
      if (e.target === pookieOverlay) {
        pookieOverlay.classList.remove('active');
        setTimeout(() => pookieOverlay.remove(), 300);
      }
    });
  }
  
  function showSettingsMenu() {
    // Create settings overlay
    const settingsOverlay = document.createElement('div');
    settingsOverlay.classList.add('settings-overlay');
    
    const settingsContainer = document.createElement('div');
    settingsContainer.classList.add('settings-container');
    
    // Settings header
    const settingsHeader = document.createElement('div');
    settingsHeader.classList.add('settings-header');
    
    const settingsTitle = document.createElement('h3');
    settingsTitle.textContent = 'Settings';
    
    const settingsCloseBtn = document.createElement('button');
    settingsCloseBtn.classList.add('settings-close');
    settingsCloseBtn.textContent = '×';
    settingsCloseBtn.addEventListener('click', closeSettingsMenu);
    
    settingsHeader.appendChild(settingsTitle);
    settingsHeader.appendChild(settingsCloseBtn);
    
    // Settings options
    const settingsOptions = document.createElement('div');
    settingsOptions.classList.add('settings-options');
    
    // Theme setting
    const themeOption = document.createElement('div');
    themeOption.classList.add('settings-option');
    const currentTheme = localStorage.getItem('calculatorTheme') || 'light';
    themeOption.innerHTML = `
      <label class="settings-label">
        <span>Theme</span>
        <select class="theme-select">
          <option value="light" ${currentTheme === 'light' && !calculator.pookieMode ? 'selected' : ''}>Light</option>
          <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
          <option value="pookie" ${calculator.pookieMode || currentTheme === 'pookie' ? 'selected' : ''}>Pookie</option>
        </select>
      </label>
    `;
    
    // Sound setting
    const soundOption = document.createElement('div');
    soundOption.classList.add('settings-option');
    soundOption.innerHTML = `
      <label class="settings-label">
        <span>Sound Effects</span>
        <input type="checkbox" class="sound-toggle" ${calculator.soundEnabled ? 'checked' : ''}>
      </label>
    `;
    
    // UI Sound Settings
    const uiSoundsOption = document.createElement('div');
    uiSoundsOption.classList.add('settings-option');
    uiSoundsOption.innerHTML = `
      <label class="settings-label">
        <span>UI Sounds</span>
        <input type="checkbox" class="ui-sounds-toggle" ${calculator.uiSoundsEnabled !== 'none' ? 'checked' : ''}>
      </label>
    `;
    
    // Touch Gestures
    const gesturesOption = document.createElement('div');
    gesturesOption.classList.add('settings-option');
    gesturesOption.innerHTML = `
      <label class="settings-label">
        <span>Touch Gestures</span>
        <input type="checkbox" class="gestures-toggle" ${calculator.gesturesEnabled ? 'checked' : ''}>
      </label>
    `;
    
    // Vibration setting
    const vibrationOption = document.createElement('div');
    vibrationOption.classList.add('settings-option');
    vibrationOption.innerHTML = `
      <label class="settings-label">
        <span>Vibration</span>
        <input type="checkbox" class="vibration-toggle" ${calculator.vibrationEnabled ? 'checked' : ''}>
      </label>
    `;
    
    settingsOptions.appendChild(themeOption);
    settingsOptions.appendChild(uiSoundsOption);
    settingsOptions.appendChild(vibrationOption);
    settingsOptions.appendChild(gesturesOption);
    
    settingsContainer.appendChild(settingsHeader);
    settingsContainer.appendChild(settingsOptions);
    settingsOverlay.appendChild(settingsContainer);
    document.body.appendChild(settingsOverlay);
    
    // Animate in
    setTimeout(() => {
      settingsOverlay.classList.add('active');
    }, 10);
    
    // Add event listeners
    const themeSelect = themeOption.querySelector('.theme-select');
    themeSelect.addEventListener('change', (e) => {
      changeTheme(e.target.value);
    });
    
    const soundToggle = soundOption.querySelector('.sound-toggle');
    soundToggle.addEventListener('change', (e) => {
      calculator.soundEnabled = e.target.checked;
      localStorage.setItem('calculatorSound', calculator.soundEnabled);
    });
    
    const uiSoundsToggle = uiSoundsOption.querySelector('.ui-sounds-toggle');
    uiSoundsToggle.addEventListener('change', (e) => {
      calculator.uiSoundsEnabled = e.target.checked ? 'all' : 'none';
      localStorage.setItem('calculatorUISounds', calculator.uiSoundsEnabled);
    });
    
    const vibrationToggle = vibrationOption.querySelector('.vibration-toggle');
    vibrationToggle.addEventListener('change', (e) => {
      calculator.vibrationEnabled = e.target.checked;
      localStorage.setItem('calculatorVibration', calculator.vibrationEnabled);
    });
    
    const gesturesToggle = gesturesOption.querySelector('.gestures-toggle');
    gesturesToggle.addEventListener('change', (e) => {
      calculator.gesturesEnabled = e.target.checked;
      localStorage.setItem('calculatorGestures', calculator.gesturesEnabled);
      if (calculator.gesturesEnabled) {
        calculator.enableGestures();
      } else {
        calculator.disableGestures();
      }
    });
    
    // Close on overlay click
    settingsOverlay.addEventListener('click', (e) => {
      if (e.target === settingsOverlay) {
        closeSettingsMenu();
      }
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
  
  if (ribbonBtn) {
    ribbonBtn.addEventListener('click', () => {
      calculator.togglePookieMode();
    });
  }
});
