// --- ACCESS CONTROL UTILITY ---

import { IMatter, IUserIndex } from "@teddy-city-hotels/shared-interfaces";

/**
 * Checks if a user has access to a given matter.
 * Access is granted if the matter has no restrictions, or if the user
 * is part of the matter's 'team' array or assigned 'department' array.
 * @param user The authenticated user object from req.user.
 * @param matter The matter data document.
 * @returns {boolean} True if the user has access, false otherwise.
 */
export function hasMatterAccess(user: IUserIndex, matter: IMatter): boolean {
  // If a matter has no team or department, it's considered accessible to all in the firm.
  if (!matter.assignedUserIds?.length && !matter.assignedDepartmentIds?.length) {
    return true;
  }

  // Check if the user is explicitly on the matter's team.
  const isTeamMember = matter.assignedUserIds?.some(id => id === user.id) || false;

  // Check if the user belongs to any of the matter's assigned departments.
  const isInDepartment = matter.assignedDepartmentIds?.includes(user.department || '') || false;

  return isTeamMember || isInDepartment;
}
