import * as service from "../services/report.service.js";
async function adminSummary(req, res) {
  return res.json({
    success: true,
    data: await service.summary(req.validated.query),
  });
}
async function businessSummary(req, res) {
  return res.json({
    success: true,
    data: await service.businessSummary(
      req.validated.query,
      req.validated.params.businessId,
      Number(req.auth.sub),
    ),
  });
}
export { adminSummary, businessSummary };
