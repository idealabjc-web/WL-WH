@echo off
echo Restoring animated components to src...
copy /Y "saved_animations\index.animated.css" "src\index.css"
copy /Y "saved_animations\CheckinPage.animated.jsx" "src\pages\CheckinPage.jsx"
copy /Y "saved_animations\SpeakerPortalPage.animated.jsx" "src\pages\speaker\SpeakerPortalPage.jsx"
copy /Y "saved_animations\FeedbackPage.animated.jsx" "src\pages\FeedbackPage.jsx"
copy /Y "saved_animations\EventPortal.animated.jsx" "src\EventPortal.jsx"
copy /Y "saved_animations\SpeakerAnnouncementsPage.animated.jsx" "src\pages\speaker\SpeakerAnnouncementsPage.jsx"
copy /Y "saved_animations\SpeakerCertificatePage.animated.jsx" "src\pages\speaker\SpeakerCertificatePage.jsx"
copy /Y "saved_animations\SpeakerCheckoutPage.animated.jsx" "src\pages\speaker\SpeakerCheckoutPage.jsx"
echo Animations restored successfully!
pause
