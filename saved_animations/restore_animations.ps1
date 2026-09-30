Write-Host "Restoring animated components to src..." -ForegroundColor Cyan
Copy-Item -Path "saved_animations/index.animated.css" -Destination "src/index.css" -Force
Copy-Item -Path "saved_animations/CheckinPage.animated.jsx" -Destination "src/pages/CheckinPage.jsx" -Force
Copy-Item -Path "saved_animations/SpeakerPortalPage.animated.jsx" -Destination "src/pages/speaker/SpeakerPortalPage.jsx" -Force
Copy-Item -Path "saved_animations/FeedbackPage.animated.jsx" -Destination "src/pages/FeedbackPage.jsx" -Force
Copy-Item -Path "saved_animations/EventPortal.animated.jsx" -Destination "src/EventPortal.jsx" -Force
Copy-Item -Path "saved_animations/SpeakerAnnouncementsPage.animated.jsx" -Destination "src/pages/speaker/SpeakerAnnouncementsPage.jsx" -Force
Copy-Item -Path "saved_animations/SpeakerCertificatePage.animated.jsx" -Destination "src/pages/speaker/SpeakerCertificatePage.jsx" -Force
Copy-Item -Path "saved_animations/SpeakerCheckoutPage.animated.jsx" -Destination "src/pages/speaker/SpeakerCheckoutPage.jsx" -Force
Write-Host "Animations successfully restored!" -ForegroundColor Green
