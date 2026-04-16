// Thin wrapper around GA4 gtag events.
// All tracking calls go through here so they're easy to find and update.

function gtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

export function trackEvent(eventName, params = {}) {
  gtag('event', eventName, params)
}

// Vendor profile opened
export function trackVendorProfileView(vendorId, vendorName, category) {
  trackEvent('vendor_profile_viewed', { vendor_id: vendorId, vendor_name: vendorName, category })
}

// Planner opened the booking intake form
export function trackBookingStarted(vendorId, vendorName) {
  trackEvent('booking_started', { vendor_id: vendorId, vendor_name: vendorName })
}

// Planner submitted the booking request
export function trackBookingCompleted(vendorId, vendorName) {
  trackEvent('booking_completed', { vendor_id: vendorId, vendor_name: vendorName })
}

// Planner opened the AI chat
export function trackChatOpened(vendorId, vendorName) {
  trackEvent('chat_opened', { vendor_id: vendorId, vendor_name: vendorName })
}

// Search performed on listing or home page
export function trackSearch(query, category, city) {
  trackEvent('search_performed', { query, category, city })
}

// Signup completed
export function trackSignup(role) {
  trackEvent('signup_completed', { role })
}
