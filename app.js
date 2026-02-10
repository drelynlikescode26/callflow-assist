// Enhanced AT&T Call Flow Assistant - Production Ready
class CallFlowAssistant {
    // Animation constants - NO AUTO-ADVANCE
    static BUTTON_ANIMATION_DELAY = 100;
    static BUTTON_ANIMATION_OFFSET = 10;
    static NAVIGATION_DELAY_MS = 200;
    static SCRIPT_TRANSITION_DELAY = 150;

    constructor() {
        this.callFlowData = null;
        this.context = {
            repName: '',
            leadType: null,
            is55Plus: false,
            upgradeType: null,
            eventSale: false,
            customerName: '',
            notes: '',
            interestLevel: null,
            appointmentTime: null,
            callbackTime: null,
            rescheduleTime: null,
            visitType: 'store',
            outcome: null
        };
        this.currentNodeId = null;
        this.history = [];
        this.historyStates = [];
        this.init();
    }

    async init() {
        try {
            await this.loadCallFlowData();
            this.loadStateFromStorage();
            this.setupEventListeners();
            this.showSetupScreen();
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.showError('Failed to load call flow data. Please refresh the page.');
        }
    }

    async loadCallFlowData() {
        try {
            const response = await fetch('callflow-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.callFlowData = await response.json();
        } catch (error) {
            console.error('Error loading call flow data:', error);
            throw error;
        }
    }

    loadStateFromStorage() {
        try {
            const savedContext = localStorage.getItem('callflow_context');
            if (savedContext) {
                const parsed = JSON.parse(savedContext);
                // Only load non-call state (setup info)
                if (!this.currentNodeId) {
                    this.context.repName = parsed.repName || '';
                }
            }
        } catch (error) {
            console.warn('Could not load state from storage:', error);
        }
    }

    saveStateToStorage() {
        try {
            localStorage.setItem('callflow_context', JSON.stringify(this.context));
        } catch (error) {
            console.warn('Could not save state to storage:', error);
        }
    }

    setupEventListeners() {
        // Setup screen listeners
        this.setupRepNameInput();
        this.setupLeadTypeButtons();
        this.setupUpgradeButtons();
        this.setup55PlusToggle();
        this.setupEventSaleToggle();
        
        // Start call button
        const startCallBtn = document.getElementById('startCallBtn');
        startCallBtn.addEventListener('click', () => this.startCall());
        
        // Footer buttons
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => this.resetCall());
        
        const backBtn = document.getElementById('backBtn');
        backBtn.addEventListener('click', () => this.goBack());
        
        const newCallBtn = document.getElementById('newCallBtn');
        newCallBtn.addEventListener('click', () => this.resetCall());
        
        // Outcome buttons
        this.setupOutcomeButtons();
        
        // Copy buttons
        this.setupCopyButtons();
    }

    setupRepNameInput() {
        const repNameInput = document.getElementById('repName');
        repNameInput.addEventListener('input', () => {
            this.context.repName = repNameInput.value.trim();
            this.validateSetupForm();
        });
        
        // Load from storage if available
        if (this.context.repName) {
            repNameInput.value = this.context.repName;
        }
    }

    setupLeadTypeButtons() {
        const buttons = document.querySelectorAll('[data-lead-type]');
        const upgradeSection = document.getElementById('upgradeTypeSection');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.context.leadType = btn.dataset.leadType;
                
                // Show/hide upgrade type section based on lead type
                if (this.context.leadType === 'wireless' || 
                    this.context.leadType === 'upgrades' ||
                    this.context.leadType === 'both') {
                    upgradeSection.style.display = 'block';
                } else {
                    upgradeSection.style.display = 'none';
                    this.context.upgradeType = null;
                    // Clear upgrade button selection
                    document.querySelectorAll('[data-upgrade]').forEach(b => b.classList.remove('active'));
                }
                
                this.validateSetupForm();
            });
        });
    }

    setupUpgradeButtons() {
        const buttons = document.querySelectorAll('[data-upgrade]');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.context.upgradeType = btn.dataset.upgrade;
            });
        });
    }

    setup55PlusToggle() {
        const toggle = document.getElementById('is55Plus');
        toggle.addEventListener('change', () => {
            this.context.is55Plus = toggle.checked;
        });
    }

    setupEventSaleToggle() {
        const toggle = document.getElementById('eventSale');
        toggle.addEventListener('change', () => {
            this.context.eventSale = toggle.checked;
        });
    }

    setupOutcomeButtons() {
        const outcomeButtons = document.querySelectorAll('.outcome-btn');
        outcomeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                outcomeButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.context.outcome = btn.dataset.outcome;
                
                // Show callback scheduler if callback outcome selected
                const callbackScheduler = document.getElementById('callbackScheduler');
                if (this.context.outcome === 'callback') {
                    callbackScheduler.classList.remove('hidden');
                } else {
                    callbackScheduler.classList.add('hidden');
                }
                
                // Generate summary after selecting outcome
                this.generateOutcomeSummary();
            });
        });
        
        // Callback time buttons
        const callbackButtons = document.querySelectorAll('.callback-time-btn');
        callbackButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                callbackButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.context.callbackTime = btn.dataset.callback;
                this.generateOutcomeSummary();
            });
        });
    }

    setupCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const copyType = btn.dataset.copy;
                this.copyToClipboard(copyType, btn);
            });
        });
    }

    async copyToClipboard(copyType, button) {
        let textToCopy = '';
        
        switch(copyType) {
            case 'salesforce':
                textToCopy = document.getElementById('salesforceSummary').value;
                break;
            case 'appointment':
                textToCopy = document.getElementById('appointmentText').value;
                break;
            case 'voicemail':
                textToCopy = document.getElementById('voicemailText').value;
                break;
        }
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            const originalText = button.textContent;
            button.textContent = '✓ Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard. Please copy manually.');
        }
    }

    validateSetupForm() {
        const startCallBtn = document.getElementById('startCallBtn');
        const isValid = this.context.leadType !== null && this.context.repName.length > 0;
        startCallBtn.disabled = !isValid;
    }

    showSetupScreen() {
        document.getElementById('setupScreen').classList.remove('hidden');
        document.getElementById('callScreen').classList.add('hidden');
        document.getElementById('summaryScreen').classList.add('hidden');
        document.getElementById('backBtn').style.display = 'none';
    }

    showCallScreen() {
        document.getElementById('setupScreen').classList.add('hidden');
        document.getElementById('callScreen').classList.remove('hidden');
        document.getElementById('summaryScreen').classList.add('hidden');
        document.getElementById('backBtn').style.display = 'block';
    }

    showSummaryScreen() {
        document.getElementById('setupScreen').classList.add('hidden');
        document.getElementById('callScreen').classList.add('hidden');
        document.getElementById('summaryScreen').classList.remove('hidden');
        document.getElementById('backBtn').style.display = 'none';
        
        // Show outcome selection
        document.getElementById('outcomeSelection').classList.remove('hidden');
    }

    startCall() {
        // Capture all setup fields
        this.context.repName = document.getElementById('repName').value.trim();
        this.context.customerName = document.getElementById('customerName').value.trim();
        this.context.notes = document.getElementById('setupNotes').value.trim();
        
        // Initialize call notes with setup notes
        if (this.context.notes) {
            document.getElementById('callNotes').value = this.context.notes;
        }
        
        // Save state
        this.saveStateToStorage();
        
        // Reset history
        this.history = [];
        this.historyStates = [];
        
        this.showCallScreen();
        
        // Navigate to first node
        const startNodeId = this.callFlowData.startNode || 'permission_check';
        this.navigateToNode(startNodeId);
    }

    navigateToNode(nodeId) {
        // Handle special navigation
        if (nodeId === 'lead_specific_pitch' && this.context.leadType === 'unknown') {
            nodeId = 'unknown_qualifier';
        }
        
        if (nodeId === 'lead_specific_pitch' && this.context.leadType === 'upgrades' && !this.context.upgradeType) {
            nodeId = 'upgrade_device_qualifier';
        }
        
        const node = this.callFlowData.nodes[nodeId];
        
        if (!node) {
            console.error(`Node not found: ${nodeId}`);
            this.showError('Invalid node. Restarting call.');
            setTimeout(() => this.resetCall(), 2000);
            return;
        }

        // Save current state to history BEFORE updating
        this.history.push(nodeId);
        this.historyStates.push(JSON.parse(JSON.stringify(this.context)));
        
        this.currentNodeId = nodeId;
        
        this.render();
    }

    render() {
        this.updateProgress();
        this.updateScript();
        this.updateOptions();
    }

    updateProgress() {
        const progressEl = document.getElementById('progress');
        const node = this.callFlowData.nodes[this.currentNodeId];
        const progressText = this.getProgressText(node.type);
        progressEl.textContent = progressText;
    }

    getProgressText(nodeType) {
        const progressMap = {
            'permission': '🔹 Opening',
            'intro': '🔹 Introduction',
            'pitch': '🔹 Value Pitch',
            'details': '🔹 Details',
            'qualifier': '🔹 Qualifying',
            'transition': '🔹 Transition to Close',
            'close': '✅ Closing',
            'success': '✅ Success!',
            'reschedule': '📅 Rescheduling'
        };
        return progressMap[nodeType] || '🔹 In Progress';
    }

    updateScript() {
        const scriptTextEl = document.getElementById('scriptText');
        const scriptCard = scriptTextEl.parentElement;
        const node = this.callFlowData.nodes[this.currentNodeId];
        
        // Remove previous state classes
        scriptCard.classList.remove('success', 'reschedule');
        
        // Add appropriate class based on node type
        if (node.type === 'success') {
            scriptCard.classList.add('success');
        } else if (node.type === 'reschedule') {
            scriptCard.classList.add('reschedule');
        }
        
        // Process script with dynamic content
        let script = this.processScript(node);
        
        // Update text with animation
        scriptTextEl.style.opacity = '0';
        setTimeout(() => {
            scriptTextEl.textContent = script;
            scriptTextEl.style.opacity = '1';
        }, CallFlowAssistant.SCRIPT_TRANSITION_DELAY);
    }

    processScript(node) {
        let script = node.script;
        
        // Replace customer and rep name placeholders
        script = script.replace(/\{\{CUSTOMER_NAME\}\}/g, this.context.customerName || 'there');
        script = script.replace(/\{\{REP_NAME\}\}/g, this.context.repName);
        
        // Handle dynamic content based on lead type
        if (node.dynamicContent && this.context.leadType) {
            const leadType = this.context.leadType;
            if (node.dynamicContent[leadType]) {
                script = node.dynamicContent[leadType];
            }
        }
        
        // Replace pricing placeholders (from JSON data)
        if (this.callFlowData.pricing) {
            script = script.replace(/\{\{WIRELESS_PRICE\}\}/g, this.callFlowData.pricing.wireless.perLine);
            script = script.replace(/\{\{FIBER_PRICE\}\}/g, this.callFlowData.pricing.fiber.starting);
        }
        
        // Add 55+ conditional inserts
        if (this.context.is55Plus && this.callFlowData.conditionalInserts) {
            const insert55Plus = this.callFlowData.conditionalInserts['55plus'];
            if (insert55Plus) {
                const wirelessInsert = insert55Plus.wireless || '';
                const fiberInsert = insert55Plus.fiber || '';
                script = script.replace(/\{\{55PLUS_WIRELESS\}\}/g, wirelessInsert);
                script = script.replace(/\{\{55PLUS_FIBER\}\}/g, fiberInsert);
            }
        } else {
            script = script.replace(/\{\{55PLUS_WIRELESS\}\}/g, '');
            script = script.replace(/\{\{55PLUS_FIBER\}\}/g, '');
        }
        
        // Add upgrade info
        if (this.context.upgradeType && this.context.upgradeType !== 'not_sure' && this.callFlowData.pricing.upgrades) {
            const upgradeInfo = this.callFlowData.pricing.upgrades[this.context.upgradeType] || '';
            script = script.replace(/\{\{UPGRADE_INFO\}\}/g, upgradeInfo);
            script = script.replace(/\{\{UPGRADE_DETAILS\}\}/g, upgradeInfo);
        } else {
            script = script.replace(/\{\{UPGRADE_INFO\}\}/g, '');
            script = script.replace(/\{\{UPGRADE_DETAILS\}\}/g, '');
        }
        
        // Visit details for confirmation
        if (script.includes('{{VISIT_DETAILS}}')) {
            let visitDetails = '';
            if (this.context.visitType === 'mobile') {
                visitDetails = "I'll come to your place";
            } else {
                visitDetails = "You can stop by our store";
            }
            script = script.replace(/\{\{VISIT_DETAILS\}\}/g, visitDetails);
        }
        
        if (script.includes('{{VISIT_ACTION}}')) {
            const visitAction = this.context.visitType === 'mobile' ? 'see me' : 'come in';
            script = script.replace(/\{\{VISIT_ACTION\}\}/g, visitAction);
        }
        
        // Add summary for confirmation
        if (script.includes('{{SUMMARY}}')) {
            const summary = this.generateSummaryText();
            script = script.replace(/\{\{SUMMARY\}\}/g, summary);
        }
        
        // Clean up any remaining placeholders
        script = script.replace(/\{\{[^}]+\}\}/g, '').replace(/\s+/g, ' ').trim();
        
        return script;
    }

    generateSummaryText() {
        const parts = [];
        
        if (this.context.customerName) {
            parts.push(`Customer: ${this.context.customerName}`);
        }
        
        if (this.context.leadType) {
            const leadTypeMap = {
                'wireless': 'Wireless Service',
                'fiber': 'Fiber Internet',
                'both': 'Wireless + Fiber Bundle',
                'upgrades': 'Device Upgrade',
                'unknown': 'General Inquiry'
            };
            parts.push(`Interest: ${leadTypeMap[this.context.leadType]}`);
        }
        
        if (this.context.is55Plus) {
            parts.push('55+ Discount Eligible');
        }
        
        if (this.context.upgradeType && this.context.upgradeType !== 'not_sure') {
            const upgradeMap = {
                'iphone': 'iPhone Upgrade',
                'android': 'Android Upgrade'
            };
            parts.push(upgradeMap[this.context.upgradeType] || this.context.upgradeType);
        }
        
        if (this.context.appointmentTime) {
            const timeMap = {
                'today': 'Today',
                'tomorrow': 'Tomorrow',
                'next_week': 'Next Week',
                'weekend': 'This Weekend'
            };
            parts.push(`Appointment: ${timeMap[this.context.appointmentTime]}`);
        }
        
        return parts.length > 0 ? '\n\n' + parts.join(' | ') : '';
    }

    updateOptions() {
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        const node = this.callFlowData.nodes[this.currentNodeId];
        
        if (!node.options || node.options.length === 0) {
            // NO AUTO-ADVANCE - Show summary screen only for terminal nodes
            if (node.type === 'success' || node.type === 'close') {
                // Add a manual "Complete Call" button instead of auto-advancing
                const completeBtn = document.createElement('button');
                completeBtn.className = 'option-btn';
                completeBtn.textContent = '✓ Complete Call';
                completeBtn.addEventListener('click', () => {
                    this.showSummaryScreen();
                });
                optionsContainer.appendChild(completeBtn);
            }
            return;
        }

        node.options.forEach((option, index) => {
            // Handle conditional options
            if (option.conditional) {
                if (option.conditional === 'eventSale' && !this.context.eventSale) {
                    return; // Skip this option
                }
            }
            
            const button = this.createOptionButton(option, index);
            optionsContainer.appendChild(button);
        });
    }

    createOptionButton(option, index) {
        const button = document.createElement('button');
        button.className = 'option-btn';
        
        // Process option text for placeholders
        let buttonText = option.text;
        if (buttonText.includes('{{EVENT_OPTION}}')) {
            buttonText = 'Can you come to me?';
        }
        button.textContent = buttonText;
        
        // Add animation
        button.style.opacity = '0';
        button.style.transform = `translateY(${CallFlowAssistant.BUTTON_ANIMATION_OFFSET}px)`;
        setTimeout(() => {
            button.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        }, CallFlowAssistant.BUTTON_ANIMATION_DELAY * index);
        
        button.addEventListener('click', () => {
            this.handleOptionClick(option);
        });
        
        return button;
    }

    handleOptionClick(option) {
        // Update context if option specifies it
        if (option.updateContext) {
            Object.assign(this.context, option.updateContext);
        }
        
        if (!option.next) {
            console.error('No next node specified');
            return;
        }
        
        // Add visual feedback
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.style.opacity = '0.5');
        
        setTimeout(() => {
            this.navigateToNode(option.next);
        }, CallFlowAssistant.NAVIGATION_DELAY_MS);
    }

    goBack() {
        if (this.history.length > 1) {
            // Remove current node
            this.history.pop();
            this.historyStates.pop();
            
            // Get previous node and state
            const previousNodeId = this.history[this.history.length - 1];
            const previousState = this.historyStates[this.historyStates.length - 1];
            
            // Restore previous state
            if (previousState) {
                this.context = JSON.parse(JSON.stringify(previousState));
            }
            
            // Remove from history (will be re-added by navigateToNode)
            this.history.pop();
            this.historyStates.pop();
            
            this.navigateToNode(previousNodeId);
        }
    }

    resetCall() {
        // Reset context but keep rep name
        const savedRepName = this.context.repName;
        
        this.context = {
            repName: savedRepName,
            leadType: null,
            is55Plus: false,
            upgradeType: null,
            eventSale: false,
            customerName: '',
            notes: '',
            interestLevel: null,
            appointmentTime: null,
            callbackTime: null,
            rescheduleTime: null,
            visitType: 'store',
            outcome: null
        };
        
        // Reset UI
        document.querySelectorAll('.setup-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('is55Plus').checked = false;
        document.getElementById('eventSale').checked = false;
        document.getElementById('customerName').value = '';
        document.getElementById('setupNotes').value = '';
        document.getElementById('callNotes').value = '';
        document.getElementById('upgradeTypeSection').style.display = 'none';
        
        // Keep rep name but validate form
        if (!savedRepName) {
            document.getElementById('repName').value = '';
            document.getElementById('startCallBtn').disabled = true;
        } else {
            this.validateSetupForm();
        }
        
        this.history = [];
        this.historyStates = [];
        this.showSetupScreen();
    }

    generateOutcomeSummary() {
        const summaryContent = document.getElementById('summaryContent');
        const copyTemplates = document.getElementById('copyTemplates');
        const salesforceSummary = document.getElementById('salesforceSummary');
        const appointmentTemplate = document.getElementById('appointmentTemplate');
        const voicemailTemplate = document.getElementById('voicemailTemplate');
        const appointmentText = document.getElementById('appointmentText');
        const voicemailText = document.getElementById('voicemailText');
        
        if (!this.context.outcome) {
            summaryContent.classList.add('hidden');
            copyTemplates.classList.add('hidden');
            return;
        }
        
        // Show summary content
        summaryContent.classList.remove('hidden');
        copyTemplates.classList.remove('hidden');
        
        // Build summary HTML
        const outcomeLabels = {
            'booked': 'Booked Visit',
            'callback': 'Callback Scheduled',
            'not_interested': 'Not Interested',
            'no_answer': 'No Answer',
            'voicemail': 'Left Voicemail',
            'wrong_number': 'Wrong Number'
        };
        
        let summaryHTML = `
            <div class="summary-item">
                <span class="summary-label">Call Outcome</span>
                <div class="summary-value">${outcomeLabels[this.context.outcome]}</div>
            </div>
        `;
        
        if (this.context.customerName) {
            summaryHTML += `
                <div class="summary-item">
                    <span class="summary-label">Customer Name</span>
                    <div class="summary-value">${this.context.customerName}</div>
                </div>
            `;
        }
        
        if (this.context.leadType) {
            const leadTypeMap = {
                'wireless': 'Wireless Service',
                'fiber': 'Fiber Internet',
                'both': 'Wireless + Fiber Bundle',
                'upgrades': 'Device Upgrade',
                'unknown': 'General Inquiry'
            };
            summaryHTML += `
                <div class="summary-item">
                    <span class="summary-label">Lead Type</span>
                    <div class="summary-value">${leadTypeMap[this.context.leadType]}</div>
                </div>
            `;
        }
        
        if (this.context.outcome === 'booked' && this.context.appointmentTime) {
            const timeMap = {
                'today': 'Today',
                'tomorrow': 'Tomorrow',
                'next_week': 'Next Week',
                'weekend': 'This Weekend'
            };
            summaryHTML += `
                <div class="summary-item">
                    <span class="summary-label">Appointment</span>
                    <div class="summary-value">${timeMap[this.context.appointmentTime]}</div>
                </div>
                <div class="summary-highlight">
                    ✅ Customer will visit the store ${timeMap[this.context.appointmentTime].toLowerCase()}.<br>
                    <strong>Ask for: ${this.context.repName}</strong>
                </div>
            `;
        }
        
        if (this.context.outcome === 'callback' && this.context.callbackTime) {
            const timeMap = {
                'later_today': 'Later Today',
                'tomorrow': 'Tomorrow',
                'weekend': 'This Weekend'
            };
            summaryHTML += `
                <div class="summary-item">
                    <span class="summary-label">Callback Scheduled</span>
                    <div class="summary-value">${timeMap[this.context.callbackTime]}</div>
                </div>
            `;
        }
        
        summaryContent.innerHTML = summaryHTML;
        
        // Generate Salesforce summary
        this.generateSalesforceSummary(salesforceSummary);
        
        // Show/hide templates based on outcome
        if (this.context.outcome === 'booked') {
            appointmentTemplate.style.display = 'block';
            this.generateAppointmentTemplate(appointmentText);
        } else {
            appointmentTemplate.style.display = 'none';
        }
        
        if (this.context.outcome === 'voicemail' || this.context.outcome === 'no_answer') {
            voicemailTemplate.style.display = 'block';
            this.generateVoicemailTemplate(voicemailText);
        } else {
            voicemailTemplate.style.display = 'none';
        }
    }

    generateSalesforceSummary(textarea) {
        const outcomeLabels = {
            'booked': 'BOOKED VISIT',
            'callback': 'CALLBACK SCHEDULED',
            'not_interested': 'NOT INTERESTED',
            'no_answer': 'NO ANSWER',
            'voicemail': 'LEFT VOICEMAIL',
            'wrong_number': 'WRONG NUMBER'
        };
        
        const leadTypeMap = {
            'wireless': 'Wireless',
            'fiber': 'Fiber',
            'both': 'Wireless + Fiber',
            'upgrades': 'Upgrade',
            'unknown': 'General'
        };
        
        let summary = `CALL SUMMARY - ${outcomeLabels[this.context.outcome]}\n`;
        summary += `Rep: ${this.context.repName}\n`;
        
        if (this.context.customerName) {
            summary += `Customer: ${this.context.customerName}\n`;
        }
        
        summary += `Lead Type: ${leadTypeMap[this.context.leadType] || 'N/A'}\n`;
        
        if (this.context.outcome === 'booked' && this.context.appointmentTime) {
            const timeMap = {
                'today': 'Today',
                'tomorrow': 'Tomorrow',
                'next_week': 'Next Week',
                'weekend': 'This Weekend'
            };
            summary += `Appointment: ${timeMap[this.context.appointmentTime]}\n`;
            summary += `Visit Type: ${this.context.visitType === 'mobile' ? 'Mobile Visit' : 'Store Visit'}\n`;
        }
        
        if (this.context.outcome === 'callback' && this.context.callbackTime) {
            const timeMap = {
                'later_today': 'Later Today',
                'tomorrow': 'Tomorrow',
                'weekend': 'This Weekend'
            };
            summary += `Callback: ${timeMap[this.context.callbackTime]}\n`;
        }
        
        if (this.context.is55Plus) {
            summary += `55+ Eligible: Yes\n`;
        }
        
        if (this.context.upgradeType) {
            summary += `Upgrade Interest: ${this.context.upgradeType.toUpperCase()}\n`;
        }
        
        const callNotes = document.getElementById('callNotes').value.trim();
        if (callNotes) {
            summary += `\nNotes:\n${callNotes}`;
        }
        
        textarea.value = summary;
    }

    generateAppointmentTemplate(textarea) {
        const timeMap = {
            'today': 'today',
            'tomorrow': 'tomorrow',
            'next_week': 'next week',
            'weekend': 'this weekend'
        };
        
        const visitType = this.context.visitType === 'mobile' ? 
            `I'll come to you ${timeMap[this.context.appointmentTime]}` :
            `Please stop by the AT&T store ${timeMap[this.context.appointmentTime]}`;
        
        let template = `Appointment Confirmed!\n\n`;
        template += `${this.context.customerName ? this.context.customerName + ', ' : ''}${visitType}. `;
        template += `Ask for ${this.context.repName}. `;
        template += `We'll review all available offers and get you set up with the best pricing.\n\n`;
        template += `Looking forward to seeing you!`;
        
        textarea.value = template;
    }

    generateVoicemailTemplate(textarea) {
        const customerName = this.context.customerName || 'there';
        const leadTypeMap = {
            'wireless': 'wireless service',
            'fiber': 'fiber internet',
            'both': 'wireless and fiber services',
            'upgrades': 'device upgrades',
            'unknown': 'our current offers'
        };
        
        let template = `Hi ${customerName}, this is ${this.context.repName} with AT&T. `;
        template += `I'm calling about some exclusive offers we have available for ${leadTypeMap[this.context.leadType] || 'AT&T services'}. `;
        template += `Give me a call back when you get a chance, or feel free to stop by our store and ask for me. `;
        template += `Looking forward to talking with you!`;
        
        textarea.value = template;
    }

    showError(message) {
        const scriptTextEl = document.getElementById('scriptText');
        scriptTextEl.textContent = message;
        scriptTextEl.style.color = '#dc3545';
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CallFlowAssistant();
});
