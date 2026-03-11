let dashboardAlertTimeout = null;

export function showDashboardAlert(message) {
    const dashboardAlert = document.querySelector(".dashboard-alert");
    const dashboardAlertMessage = dashboardAlert?.querySelector("p");
    
    if (!dashboardAlert || !dashboardAlertMessage) {
        return;
    }

    dashboardAlertMessage.textContent = message || "Something went wrong.";
    dashboardAlert.classList.add("is-visible");

    if (dashboardAlertTimeout) {
        clearTimeout(dashboardAlertTimeout);
    }

    dashboardAlertTimeout = setTimeout(() => {
        dashboardAlert.classList.remove("is-visible");
    }, 2000);
}