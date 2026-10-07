import * as bookingService from "../services/booking.service.js";

async function createBooking(req, res) {
  const data = await bookingService.createBooking(
    Number(req.auth.sub),
    req.validated.body,
  );
  return res.status(201).json({ success: true, data });
}

async function previewBooking(req, res) {
  const data = await bookingService.previewBooking(req.validated.body);
  return res.status(200).json({ success: true, data });
}

async function listMine(req, res) {
  const result = await bookingService.listCustomerBookings(
    Number(req.auth.sub),
    req.validated.query,
  );
  return res.status(200).json({ success: true, ...result });
}

async function getMine(req, res) {
  const data = await bookingService.getCustomerBooking(
    req.validated.params.bookingId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function cancelMine(req, res) {
  const data = await bookingService.cancelCustomerBooking(
    req.validated.params.bookingId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function rescheduleMine(req, res) {
  const data = await bookingService.rescheduleCustomerBooking(
    req.validated.params.bookingId,
    Number(req.auth.sub),
    req.validated.body.startAt,
  );
  return res.status(200).json({ success: true, data });
}

async function listBusiness(req, res) {
  const result = await bookingService.listBusinessBookings(
    req.validated.params.businessId,
    Number(req.auth.sub),
    req.validated.query,
  );
  return res.status(200).json({ success: true, ...result });
}

async function updateBusinessStatus(req, res) {
  const data = await bookingService.updateBookingStatus(
    req.validated.params.bookingId,
    req.validated.body.status,
    Number(req.auth.sub),
    { businessId: req.validated.params.businessId },
  );
  return res.status(200).json({ success: true, data });
}

async function listStaff(req, res) {
  const result = await bookingService.listStaffBookings(
    Number(req.auth.sub),
    req.validated.query,
  );
  return res.status(200).json({ success: true, ...result });
}

async function updateStaffStatus(req, res) {
  const data = await bookingService.staffUpdateStatus(
    req.validated.params.bookingId,
    req.validated.body.status,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

export {
  createBooking,
  previewBooking,
  listMine,
  getMine,
  cancelMine,
  rescheduleMine,
  listBusiness,
  updateBusinessStatus,
  listStaff,
  updateStaffStatus,
};
