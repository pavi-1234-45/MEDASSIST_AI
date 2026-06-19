import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoToDashboard = () => {
    const role = localStorage.getItem("ma_role") || "patient";

    const dashboardRoutes = {
      patient: "/patient/dashboard",
      doctor: "/doctor/dashboard",
      caregiver: "/caregiver/dashboard",
      admin: "/admin/dashboard",
    };

    window.location.href = dashboardRoutes[role] || "/patient/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              Something went wrong.
            </h1>

            <p className="text-gray-600 mb-6">
              {this.state.error?.message || "Please refresh the page or return to dashboard."}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRefresh}
                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition"
              >
                Refresh Page
              </button>

              <button
                onClick={this.handleGoToDashboard}
                className="px-5 py-3 rounded-xl bg-teal-700 text-white font-medium hover:bg-teal-800 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
