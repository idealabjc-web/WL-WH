# Saved Animations & Interactive 3D Effects Archive

This folder stores the complete animation & interactive system developed during this session for **WL-WH Dubai 2026**.

## What is Preserved Here
1. **Interactive 3D Badge Tilt & Flipping Physics**:
   - `CheckinPage.animated.jsx`: Real-time mouse tracking perspective tilt, dynamic light sheen reflections, front/back 3D flip card (Front: Speaker Pass & QR, Back: VIP Lounge, Stage AV specs, Wi-Fi), and real-time live countdown timer.
2. **Atmospheric Lighting & Bokeh**:
   - `SpeakerPortalPage.animated.jsx`: Dynamic sweeping beam, floating bokeh particles, and synced dark aesthetic matching the hero section.
3. **Keyframe Animations & CSS**:
   - `index.animated.css`: 3D perspective styles, `preserve-3d`, `backface-hidden`, beam keyframes, and smooth glow interactions.
4. **All Accompanying Pages**:
   - `EventPortal.animated.jsx`
   - `FeedbackPage.animated.jsx`
   - `SpeakerAnnouncementsPage.animated.jsx`
   - `SpeakerCertificatePage.animated.jsx`
   - `SpeakerCheckoutPage.animated.jsx`

---

## How to Restore These Animations Whenever You Want

### Option 1: Double-Click or Run the Batch Script
Run `restore_animations.bat` in this folder or from terminal:
```cmd
.\saved_animations\restore_animations.bat
```

### Option 2: Run the PowerShell Script
```powershell
powershell -ExecutionPolicy Bypass -File .\saved_animations\restore_animations.ps1
```

### Option 3: Manual Copy
Copy the files back to `src/`:
- `saved_animations/index.animated.css` -> `src/index.css`
- `saved_animations/CheckinPage.animated.jsx` -> `src/pages/CheckinPage.jsx`
- `saved_animations/SpeakerPortalPage.animated.jsx` -> `src/pages/speaker/SpeakerPortalPage.jsx`
- `saved_animations/FeedbackPage.animated.jsx` -> `src/pages/FeedbackPage.jsx`
- `saved_animations/EventPortal.animated.jsx` -> `src/EventPortal.jsx`
- `saved_animations/SpeakerAnnouncementsPage.animated.jsx` -> `src/pages/speaker/SpeakerAnnouncementsPage.jsx`
- `saved_animations/SpeakerCertificatePage.animated.jsx` -> `src/pages/speaker/SpeakerCertificatePage.jsx`
- `saved_animations/SpeakerCheckoutPage.animated.jsx` -> `src/pages/speaker/SpeakerCheckoutPage.jsx`
