export { sendEmail, sendBulkEmail } from "./send";
export type { SendEmailOptions, SendEmailResult } from "./send";

export { baseTemplate } from "./template";
export type { EmailTemplate } from "./template";

export { bookingConfirmationEmail } from "./bookingConfirmation";
export { bookingReminderEmail } from "./bookingReminder";
export { bookingCancellationEmail } from "./bookingCancellation";
export { vendorNewBookingEmail } from "./vendorNewBooking";
export { vendorCancellationEmail } from "./vendorCancellation";
export { reviewRequestEmail } from "./reviewRequest";
export { paymentReceiptEmail } from "./paymentReceipt";
export { vendorInvitationEmail } from "./vendorInvitation";
