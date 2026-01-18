import { useAuth } from '../contexts/AuthContext';

// Define role hierarchy
const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE'
};

// Define permissions for each feature
const PERMISSIONS = {
  // User Management
  VIEW_ALL_USERS: ['ADMIN'],
  CREATE_USER: ['ADMIN'],
  EDIT_USER: ['ADMIN'],
  DELETE_USER: ['ADMIN'],
  CHANGE_USER_ROLE: ['ADMIN'],
  
  // Team Management
  VIEW_TEAM: ['ADMIN', 'MANAGER'],
  MANAGE_TEAM: ['ADMIN', 'MANAGER'],
  VIEW_TEAM_TIME_ENTRIES: ['ADMIN', 'MANAGER'],
  APPROVE_TIMESHEET: ['ADMIN', 'MANAGER'],
  
  // Project Management
  CREATE_PROJECT: ['ADMIN', 'MANAGER'],
  EDIT_PROJECT: ['ADMIN', 'MANAGER'],
  DELETE_PROJECT: ['ADMIN'],
  ASSIGN_PROJECT_MEMBERS: ['ADMIN', 'MANAGER'],
  
  // Client Management
  CREATE_CLIENT: ['ADMIN', 'MANAGER'],
  EDIT_CLIENT: ['ADMIN', 'MANAGER'],
  DELETE_CLIENT: ['ADMIN'],
  
  // Reports
  VIEW_ALL_REPORTS: ['ADMIN', 'MANAGER'],
  VIEW_PERSONAL_REPORTS: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  EXPORT_REPORTS: ['ADMIN', 'MANAGER'],
  
  // Time Entries
  VIEW_OWN_TIME_ENTRIES: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  VIEW_ALL_TIME_ENTRIES: ['ADMIN'],
  EDIT_ANY_TIME_ENTRY: ['ADMIN'],
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission) => {
    if (!user) return false;
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles?.includes(user.role);
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  const isAdmin = () => user?.role === ROLES.ADMIN;
  const isManager = () => user?.role === ROLES.MANAGER;
  const isEmployee = () => user?.role === ROLES.EMPLOYEE;

  const canManageUsers = () => hasPermission('VIEW_ALL_USERS');
  const canManageTeam = () => hasPermission('MANAGE_TEAM');
  const canManageProjects = () => hasPermission('CREATE_PROJECT');
  const canViewReports = () => hasPermission('VIEW_ALL_REPORTS');

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
    isEmployee,
    canManageUsers,
    canManageTeam,
    canManageProjects,
    canViewReports,
    ROLES,
    PERMISSIONS,
  };
};

export default usePermissions;

