// frontend/pages/admin/index.js
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import { fetchAllUsers, updateUserRoleStatus } from "../../lib/auth";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import Notification from "../../components/Notification"; // For showing update messages

const AdminPage = () => {
  const router = useRouter();
  const { user, isLoggedIn, loadingAuth, logout, updateUserContext } =
    useAuth(); // Also get updateUserContext
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    isLoading: false,
  });

  // Dummy roles and statuses for dropdowns
  const roles = ["Regular User", "Mentor", "Admin", "Speaker", "Organizer"];
  const statuses = ["pending", "active", "inactive", "rejected"];

  useEffect(() => {
    if (loadingAuth) return;

    // Redirect if not logged in or not an admin
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "admin") {
      setError(
        "Access Denied: You must be an administrator to view this page."
      );
      setLoadingData(false);
      return;
    }

    const loadUsers = async () => {
      setLoadingData(true);
      setError("");
      const result = await fetchAllUsers();
      if (result.success) {
        setUsers(result.users);
      } else {
        setError(result.message || "Failed to fetch users.");
        if (result.status === 401 || result.status === 403) {
          logout(); // Force logout if token is invalid or forbidden
        }
      }
      setLoadingData(false);
    };

    loadUsers();
  }, [isLoggedIn, loadingAuth, user, router, logout]);

  const handleRoleStatusChange = async (userId, currentRole, currentStatus, newRole, newStatus) => {
    if (!confirm(`Are you sure you want to change user ${userId}'s role to "${newRole}" and status to "${newStatus}"?`)) {
        return;
    }

    setNotification({ message: 'Updating user...', type: 'info', isLoading: true });

    const result = await updateUserRoleStatus(userId, newRole, newStatus);

    if (result.success) {
        setNotification({ message: result.message, type: 'success', isLoading: false });
        // Update the user list locally to reflect the change
        setUsers(prevUsers => prevUsers.map(u => 
            u.id === userId ? { ...u, role: newRole, status: newStatus } : u
        ));
        // If the admin updated their own role/status, update AuthContext with the NEW token and user data
        if (userId === user.id) {
            // Call AuthContext's login function with the new token
            // This will re-decode the token and update the user state + local storage
            if (result.token) {
                // Assuming contextLogin (or login function in AuthContext) can handle this
                updateUserContext(result.user); // Update user data first
                setAuthToken(result.token); // Store the new token directly
                // You might need to call setAuthUserFromToken directly if login doesn't re-set token
                // For now, let's keep it simple. AuthContext already calls setAuthToken.
            }
        }
    } else {
        setNotification({ message: result.message, type: 'error', isLoading: false });
    }
};

  if (loadingAuth || loadingData) {
    return (
      <LoadingSpinner
        message={
          loadingAuth ? "Verifying authentication..." : "Loading user data..."
        }
      />
    );
  }

  if (error) {
    return <ErrorMessage message={error} redirectToLogin={!isLoggedIn} />;
  }

  // Double check if user is admin after loading
  if (user?.role !== "admin") {
    return (
      <ErrorMessage
        message="Access Denied: You do not have administrative privileges."
        redirectToLogin={true}
      />
    );
  }

  return (
    <DashboardLayout
      title="Admin Panel - mAIple Conference Portal"
      description="Manage users, roles, and content."
    >
      <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-800 animate-fade-in-up">
        <h1 className="text-4xl font-extrabold text-white mb-6 font-montserrat drop-shadow-lg">
          Admin Panel
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed mb-8">
          Manage user roles and statuses.
        </p>

        <Notification
          message={notification.message}
          messageType={notification.type}
          isLoading={notification.isLoading}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Current Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Current Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {users.length > 0 ? (
                users.map((userItem) => (
                  <tr key={userItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {userItem.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {userItem.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {userItem.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {userItem.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <select
                        value={userItem.role}
                        onChange={(e) =>
                          handleRoleStatusChange(
                            userItem.id,
                            userItem.role,
                            userItem.status,
                            e.target.value,
                            userItem.status
                          )
                        }
                        className="block w-full py-2 px-3 border border-gray-600 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <select
                        value={userItem.status}
                        onChange={(e) =>
                          handleRoleStatusChange(
                            userItem.id,
                            userItem.role,
                            userItem.status,
                            userItem.role,
                            e.target.value
                          )
                        }
                        className="mt-2 block w-full py-2 px-3 border border-gray-600 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPage;
