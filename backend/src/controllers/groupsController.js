const {
  createErrorResponse,
  createSuccessResponse,
} = require("../utils/responseEnvelope");
const {
  createGroupRecord,
  deleteGroupRecord,
  listGroups,
  renameGroupRecord,
} = require("../services/groupsService");

function getStatusCode(error) {
  if (error.message === "Group not found.") {
    return 404;
  }

  if (error.message === "Group already exists.") {
    return 409;
  }

  if (
    error.message === "Group name is required." ||
    error.message === "Group name is too long." ||
    error.message === "Invalid group id."
  ) {
    return 400;
  }

  return 500;
}

async function listGroupsHandler(request, response) {
  try {
    const groups = await listGroups(request.user.userId);
    response.status(200).json(createSuccessResponse(groups));
  } catch (error) {
    response.status(getStatusCode(error)).json(createErrorResponse(error.message));
  }
}

async function createGroupHandler(request, response) {
  try {
    const group = await createGroupRecord(request.body, request.user.userId);
    response.status(201).json(createSuccessResponse(group));
  } catch (error) {
    response.status(getStatusCode(error)).json(createErrorResponse(error.message));
  }
}

async function renameGroupHandler(request, response) {
  try {
    const group = await renameGroupRecord(request.params.groupId, request.body, request.user.userId);
    response.status(200).json(createSuccessResponse(group));
  } catch (error) {
    response.status(getStatusCode(error)).json(createErrorResponse(error.message));
  }
}

async function deleteGroupHandler(request, response) {
  try {
    const result = await deleteGroupRecord(request.params.groupId, request.user.userId);
    response.status(200).json(createSuccessResponse(result));
  } catch (error) {
    response.status(getStatusCode(error)).json(createErrorResponse(error.message));
  }
}

module.exports = {
  createGroupHandler,
  deleteGroupHandler,
  listGroupsHandler,
  renameGroupHandler,
};
