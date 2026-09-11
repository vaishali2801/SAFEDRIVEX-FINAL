const alertService = require('../services/alertService');
const { successResponse, errorResponse } = require('../utils/response');

const getAlerts = async (req, res) => {
  try {
    const result = await alertService.getUserAlerts(req.userId, req.query);
    return successResponse(res, 'Alerts fetched', result);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch alerts', error);
  }
};

const markAsRead = async (req, res) => {
  try {
    const alert = await alertService.markAsRead(req.userId, req.params.id);
    if (!alert) return errorResponse(res, 'Alert not found', null, 404);
    return successResponse(res, 'Alert marked as read', alert);
  } catch (error) {
    return errorResponse(res, 'Failed to mark as read', error);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await alertService.markAllAsRead(req.userId);
    return successResponse(res, 'All alerts marked as read');
  } catch (error) {
    return errorResponse(res, 'Failed to mark all as read', error);
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await alertService.getUnreadCount(req.userId);
    return successResponse(res, 'Unread count fetched', { count });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch unread count', error);
  }
};

const deleteAlert = async (req, res) => {
  try {
    await alertService.deleteAlert(req.userId, req.params.id);
    return successResponse(res, 'Alert deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete alert', error);
  }
};

module.exports = {
  getAlerts,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteAlert,
};