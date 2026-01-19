// Example: How to use the notification system from anywhere in the app

import { sendNotification } from "@/components/notification-bell";

// Success notification
sendNotification({
  title: "Campaign Sent Successfully",
  message: "Your email campaign has been sent to 150 businesses",
  type: "success"
});

// Error notification
sendNotification({
  title: "Email Sending Failed",
  message: "Failed to send emails. Please check your email configuration",
  type: "error"
});

// Warning notification
sendNotification({
  title: "Low Credits",
  message: "You have only 50 email credits remaining",
  type: "warning"
});

// Info notification
sendNotification({
  title: "New Leads Available",
  message: "25 new businesses have been scraped and are ready for outreach",
  type: "info"
});
