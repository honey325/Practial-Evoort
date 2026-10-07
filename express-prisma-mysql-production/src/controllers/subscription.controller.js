import * as service from "../services/subscription.service.js";
async function listPlans(req, res) {
  return res.json({
    success: true,
    data: await service.listPlans(req.auth?.role === "SUPER_ADMIN"),
  });
}
async function createPlan(req, res) {
  return res
    .status(201)
    .json({
      success: true,
      data: await service.createPlan(req.validated.body),
    });
}
async function updatePlan(req, res) {
  return res.json({
    success: true,
    data: await service.updatePlan(
      req.validated.params.planId,
      req.validated.body,
    ),
  });
}
async function deletePlan(req, res) {
  await service.deletePlan(req.validated.params.planId);
  return res.status(204).send();
}
async function listSubscriptions(req, res) {
  return res.json({
    success: true,
    ...(await service.listSubscriptions(req.validated.query)),
  });
}
async function updateSubscriptionStatus(req, res) {
  return res.json({
    success: true,
    data: await service.updateSubscriptionStatus(
      req.validated.params.subscriptionId,
      req.validated.body.status,
    ),
  });
}
async function getBusinessSubscription(req, res) {
  return res.json({
    success: true,
    data: await service.getBusinessSubscription(
      req.validated.params.businessId,
      Number(req.auth.sub),
    ),
  });
}
async function subscribe(req, res) {
  return res
    .status(201)
    .json({
      success: true,
      data: await service.subscribe(
        req.validated.params.businessId,
        Number(req.auth.sub),
        req.validated.body.planId,
      ),
    });
}
export {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  listSubscriptions,
  updateSubscriptionStatus,
  getBusinessSubscription,
  subscribe,
};
