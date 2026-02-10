# 📞 Call Flow Assistant

A lightweight interactive call flow assistant for AT&T sales reps — presents one prompt at a time based on customer responses, helping guide natural conversations and close appointments.

## Features

- **Decision Tree Navigation**: Guides sales reps through a structured conversation flow
- **State Tracking**: Tracks call progress through Opening → Service Type → 55+ Check → Close
- **Mobile-Friendly**: Responsive design optimized for mobile devices
- **Minimal UI**: Clean, distraction-free interface with one prompt at a time
- **JSON-Based Content**: Script content stored separately from UI logic
- **Fast & Lightweight**: No frameworks, just vanilla JavaScript

## Quick Start

1. **Open the application**: Simply open `index.html` in a web browser
2. **Or serve via HTTP**: 
   ```bash
   python3 -m http.server 8000
   # Then navigate to http://localhost:8000
   ```

## Usage

1. The assistant starts at the opening prompt
2. Read the script line displayed in the blue-bordered card
3. Click the appropriate response button based on customer's answer
4. The assistant automatically navigates to the next prompt
5. Progress indicator shows current state (Opening, Service Type, Senior Discount, Closing)
6. Use "Reset Call" button to start a new call at any time

## File Structure

```
callflow-assist/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── app.js             # Application logic and state management
├── callflow-data.json # Call flow decision tree and scripts
└── README.md          # This file
```

## Call Flow States

1. **Opening**: Initial greeting and interest check
2. **Service Type**: Identify customer interest (Internet, TV, Mobile)
3. **55+ Check**: Senior discount eligibility
4. **Offers**: Present senior or standard offers
5. **Close**: Book store visit (success) or schedule callback

## Customization

### Modifying Scripts

Edit `callflow-data.json` to customize:
- Script lines
- Response options
- Decision tree paths
- Number of states

### Styling

Edit `styles.css` to customize:
- Colors and themes
- Button styles
- Layout and spacing
- Mobile breakpoints

## Technical Details

- **No dependencies**: Pure HTML, CSS, and JavaScript
- **Mobile-first**: Responsive design with breakpoint at 480px
- **Separation of concerns**: Data (JSON) separate from logic (JS) and UI (HTML/CSS)
- **Smooth transitions**: CSS animations for better UX

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Screenshots

### Desktop View
![Opening State](https://github.com/user-attachments/assets/196276d8-cf83-4afa-b14b-291b5f87d364)

### Service Type Selection
![Service Type](https://github.com/user-attachments/assets/b60b8c92-84f5-4f9d-ba02-9767aedd6b6c)

### Senior Discount Check
![Age Check](https://github.com/user-attachments/assets/227759c2-71b8-4b7d-80bf-d7d2c6b223ff)

### Successful Close
![Close Success](https://github.com/user-attachments/assets/d3254ce2-6ac4-4f34-8461-8d4eff03abb7)

### Mobile View
![Mobile Responsive](https://github.com/user-attachments/assets/1837c7d0-a30a-4c4c-8a3f-cdcc892118c6)

## License

MIT
