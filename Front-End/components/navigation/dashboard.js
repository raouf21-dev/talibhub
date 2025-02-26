// dashboard.js
import { navigateTo } from "../../utils/utils.js";

function initializeDashboard() {
  const dashboardSection = document.getElementById("dashboard");
    if (dashboardSection) {
        dashboardSection.addEventListener('click', function(event) {
            // Utilisez closest pour gérer les clics sur les enfants (comme SVG)
            const card = event.target.closest('.dashboard-card');
      if (card && card.dataset.destination) {
        console.log("Navigating to:", card.dataset.destination); // Pour le débogage
          navigateTo(card.dataset.destination);
        }
      }
    );
  }
}

export { initializeDashboard };
