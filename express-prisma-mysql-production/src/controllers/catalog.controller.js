import * as service from "../services/catalog.service.js";

async function listBusinesses(req, res) {
  return res
    .status(200)
    .json({
      success: true,
      ...(await service.listBusinesses(req.validated.query)),
    });
}
async function getBusiness(req, res) {
  return res
    .status(200)
    .json({
      success: true,
      data: await service.getBusiness(req.validated.params.businessId),
    });
}

export { listBusinesses, getBusiness };
