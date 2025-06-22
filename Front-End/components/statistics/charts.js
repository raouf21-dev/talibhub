/**
 * charts.js
 * Manages chart display and task details visualization with internationalization support
 * @module ChartManager
 */

import { translationManager } from "../../translations/TranslationManager.js";

let chartInstances = {};

// Les traductions sont maintenant gérées par le nouveau système de traductions

/**
 * Chart visual configuration settings
 */
const chartConfig = {
  colors: {
    time: {
      background: "rgba(54, 162, 235, 0.6)",
      border: "rgba(54, 162, 235, 1)",
    },
    count: {
      background: "rgba(75, 192, 192, 0.6)",
      border: "rgba(75, 192, 192, 1)",
    },
  },
  dimensions: {
    defaultHeight: "300px",
    expandedHeight: "200px",
  },
};

/**
 * Validates if the date object is valid
 * @param {Date} date - Date to validate
 * @returns {boolean} True if date is valid
 */
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Gets the current language based on the new translation system
 * @returns {string} Current language code ('fr' or 'en')
 */
function getCurrentLanguage() {
  return translationManager.currentLang;
}

/**
 * Gets translation for a specific key using the new translation system
 * @param {string} key - Translation key
 * @returns {string} Translated text or key if translation not found
 */
function getTranslation(key) {
  if (!key)
    return translationManager.t(
      "content.charts.noDataAvailable",
      "No data available"
    );
  return translationManager.t(`content.charts.${key}`, key);
}

/**
 * Gets month key from index for translations
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string|null} Month key or null if invalid
 */
function getMonthKey(monthIndex) {
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  return monthIndex >= 0 && monthIndex < 12 ? months[monthIndex] : null;
}

/**
 * Safely gets month index from a date object
 * @param {Date} date - Date object
 * @returns {number} Month index (0-11) or -1 if invalid
 */
function safeGetMonth(date) {
  if (!isValidDate(date)) return -1;
  const month = date.getMonth();
  return month >= 0 && month <= 11 ? month : -1;
}

/**
 * Fonction de parsing de date avec gestion multi-formats
 * @param {string} dateStr - Date string à parser
 * @returns {Date|null} Objet Date ou null si invalide
 */
function safeParseDate(dateStr) {
  try {
    // Gestion multi-formats de date
    const parsed = new Date(dateStr);
    if (isValidDate(parsed)) return parsed;

    // Fallback pour les formats localisés (séparation par /, - ou espace)
    const parts = dateStr.split(/[\/\- ]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const fallback = new Date(`${year}-${month}-${day}`);
      return isValidDate(fallback) ? fallback : null;
    }
  } catch (error) {
    console.error("safeParseDate error:", error);
  }
  return null;
}

/**
 * Formats a date according to current language
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!isValidDate(date)) {
    console.warn("Invalid date passed to formatDate:", date);
    return getTranslation("invalidDate");
  }

  const currentLang = getCurrentLanguage();
  const day = date.getDate();
  const monthIndex = safeGetMonth(date);

  if (monthIndex === -1) {
    console.warn("Invalid month index in formatDate:", monthIndex);
    return getTranslation("invalidDate");
  }

  const year = date.getFullYear();
  const monthKey = getMonthKey(monthIndex);

  if (!monthKey) {
    console.warn("Invalid monthKey in formatDate:", monthKey);
    return getTranslation("invalidDate");
  }

  const monthName = getTranslation(monthKey);

  if (!monthName) {
    console.warn("Translation not found for monthKey:", monthKey);
    return getTranslation("invalidDate");
  }

  if (currentLang === "fr") {
    return `${day} ${monthName.toLowerCase()} ${year}`;
  } else {
    const capitalizedMonth =
      monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${capitalizedMonth} ${day}, ${year}`;
  }
}

/**
 * Formats month and year
 * @param {Date} date - Date to format
 * @returns {string} Formatted month and year
 */
function formatMonthYear(date) {
  if (!isValidDate(date)) {
    console.warn("Invalid date passed to formatMonthYear:", date);
    return getTranslation("invalidDate");
  }

  const monthIndex = safeGetMonth(date);
  if (monthIndex === -1) {
    return getTranslation("invalidDate");
  }

  const monthKey = getMonthKey(monthIndex);
  if (!monthKey) {
    return getTranslation("invalidDate");
  }

  const currentLang = getCurrentLanguage();
  const monthName = getTranslation(monthKey);
  const year = date.getFullYear();

  return currentLang === "fr"
    ? `${monthName.toLowerCase()} ${year}`
    : `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}

/**
 * Formats week period
 * @param {Date} date - Date to format
 * @returns {string} Formatted week period
 */
function formatWeekPeriod(date) {
  if (!isValidDate(date)) {
    console.warn("Invalid date passed to formatWeekPeriod:", date);
    return getTranslation("invalidDate");
  }

  const formattedDate = formatDate(date);
  if (formattedDate === getTranslation("invalidDate")) {
    return getTranslation("invalidDate");
  }

  const weekText = getTranslation("week");
  return `${weekText} ${formattedDate}`;
}

/**
 * Translates chart labels
 * @param {Array<string>} labels - Labels to translate
 * @returns {Array<string>} Translated labels
 */
function translateChartLabels(labels) {
  if (!Array.isArray(labels)) return [getTranslation("noDataAvailable")];

  return labels.map((label) => {
    if (typeof label !== "string") return label;

    // Handle week format
    if (label.includes("Semaine du") || label.includes("Week of")) {
      const date = safeParseDate(label);
      return date ? formatWeekPeriod(date) : label;
    }

    // Handle ISO date format
    if (label.match(/\d{4}(-|\/)\d{2}(-|\/)\d{2}/)) {
      const date = safeParseDate(label);
      return date ? formatDate(date) : label;
    }

    // Handle month-year format
    if (label.match(/[A-Za-zÀ-ÿ]+\s+\d{4}/)) {
      const date = safeParseDate(label);
      return date ? formatMonthYear(date) : label;
    }

    return label;
  });
}

/**
 * Creates chart configuration
 * @param {string} [type='bar'] - Chart type
 * @returns {Object} Chart configuration
 */
function createChartConfig(type = "bar") {
  return {
    type,
    data: {
      labels: [],
      datasets: [
        {
          label: getTranslation("workTime"),
          data: [],
          backgroundColor: chartConfig.colors.time.background,
          borderColor: chartConfig.colors.time.border,
          borderWidth: 1,
          yAxisID: "y-time",
        },
        {
          label: getTranslation("countNumber"),
          data: [],
          backgroundColor: chartConfig.colors.count.background,
          borderColor: chartConfig.colors.count.border,
          borderWidth: 1,
          yAxisID: "y-count",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
      },
      scales: {
        "y-time": {
          type: "linear",
          position: "left",
          beginAtZero: true,
          title: {
            display: true,
            text: getTranslation("time"),
          },
        },
        "y-count": {
          type: "linear",
          position: "right",
          beginAtZero: true,
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: getTranslation("counts"),
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
      },
    },
  };
}

/**
 * Nouvelle fonction de gestion du fuseau horaire
 * @returns {string} Le fuseau horaire de l'utilisateur
 */
function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Main ChartManager module
 */
export const ChartManager = {
  init() {
    if (typeof Chart === "undefined") {
      throw new Error("Chart.js is not loaded!");
    }

    this.destroy();
    ["daily", "weekly", "monthly", "yearly"].forEach((period) => {
      const canvas = document.getElementById(`${period}Chart`);
      if (canvas) {
        const ctx = canvas.getContext("2d");
        chartInstances[period] = new Chart(ctx, createChartConfig());
      }
    });

    this.setupEventListeners();
    this.updateAllChartLabels();
    this.updatePeriodTitles();

    return chartInstances;
  },

  setupEventListeners() {
    window.addEventListener("resize", () => {
      Object.values(chartInstances).forEach((chart) => {
        if (chart?.canvas) chart.resize();
      });
    });

    document.addEventListener("languageChanged", () => {
      this.updateAllChartLabels();
      this.updatePeriodTitles();
    });

    const toggleButtons = document.querySelectorAll(".toggle-details-btn");
    console.debug(
      `[ChartManager] setupEventListeners: Found ${toggleButtons.length} toggle-details-btn elements`
    );

    toggleButtons.forEach((btn, index) => {
      console.debug(
        `[ChartManager] setupEventListeners: Setting up listener for button ${
          index + 1
        }`
      );
      btn.addEventListener("click", (e) => {
        console.debug(`[ChartManager] toggle-details-btn clicked:`, e.target);
        const chartSection = e.target.closest(".chart-section");
        if (!chartSection) {
          console.error(
            `[ChartManager] No chart-section found for clicked button`
          );
          return;
        }
        const periodNav = chartSection.querySelector(".period-navigation");
        if (!periodNav) {
          console.error(
            `[ChartManager] No period-navigation found in chart-section`
          );
          return;
        }
        const period = periodNav.dataset.period;
        console.debug(`[ChartManager] Toggling details for period: ${period}`);
        this.toggleTaskDetails(chartSection, period);
      });
    });
  },

  updateChart(period, labels, timeData, countData, taskDetails = []) {
    const chart = chartInstances[period];
    if (!chart) {
      console.error(`No chart found for period ${period}`);
      return;
    }

    try {
      const translatedLabels = translateChartLabels(labels);

      chart.data.labels = translatedLabels;
      chart.data.datasets[0].data = timeData;
      chart.data.datasets[1].data = countData;
      chart.update("active");

      const tbody = document.querySelector(`#${period}TaskDetails table tbody`);
      if (tbody) {
        if (taskDetails && taskDetails.length > 0) {
          tbody.innerHTML = taskDetails
            .map(
              (task) => `
                        <tr>
                            <td>${task.name || getTranslation("unnamed")}</td>
                            <td>${Math.round(
                              parseFloat(task.total_time) / 60
                            )}</td>
                            <td>${task.total_count}</td>
                        </tr>
                    `
            )
            .join("");
        } else {
          tbody.innerHTML = `
                        <tr>
                            <td colspan="3" class="text-center">
                                ${getTranslation("noDataAvailable")}
                            </td>
                        </tr>`;
        }
      }

      this.updatePeriodTitles();
    } catch (error) {
      console.error("Error updating chart:", error);
      if (chart) {
        chart.data.labels = [getTranslation("noDataAvailable")];
        chart.data.datasets[0].data = [0];
        chart.data.datasets[1].data = [0];
        chart.update("active");
      }
    }
  },

  updateAllChartLabels() {
    try {
      document.querySelectorAll("[data-action]").forEach((element) => {
        const key = element.getAttribute("data-action");
        if (key) {
          element.textContent = getTranslation(key);
        }
      });

      Object.entries(chartInstances).forEach(([period, chart]) => {
        if (chart) {
          chart.data.datasets[0].label = getTranslation("workTime");
          chart.data.datasets[1].label = getTranslation("countNumber");

          chart.options.scales["y-time"].title.text = getTranslation("time");
          chart.options.scales["y-count"].title.text = getTranslation("counts");

          if (chart.data.labels.length > 0) {
            chart.data.labels = translateChartLabels(chart.data.labels);
          }

          chart.update("none");
        }
      });
    } catch (error) {
      console.error("Error updating chart labels:", error);
    }
  },

  toggleTaskDetails(chartSection, period) {
    try {
      const isExpanded = chartSection.classList.toggle("details-visible");

      const button = chartSection.querySelector(".toggle-details-btn");
      const buttonText = button.querySelector("span");
      const buttonIcon = button.querySelector("svg");

      buttonText.textContent = isExpanded
        ? getTranslation("hideDetails")
        : getTranslation("viewDetails");

      buttonIcon.style.transform = isExpanded ? "rotate(180deg)" : "rotate(0)";

      const chartWrapper = chartSection.querySelector(".chart-wrapper");
      void chartWrapper.offsetWidth; // Force reflow

      setTimeout(() => {
        const chart = chartInstances[period];
        if (chart) {
          chart.resize();
          chart.update("none");
        }
      }, 300);
    } catch (error) {
      console.error("Error toggling task details:", error);
    }
  },

  updatePeriodTitles() {
    try {
      const periodDisplays = document.querySelectorAll(".period-display");
      periodDisplays.forEach((display) => {
        const dateAttr = display.getAttribute("data-date");

        if (dateAttr) {
          const date = safeParseDate(dateAttr);
          if (!date) {
            display.textContent = getTranslation("invalidDate");
            return;
          }

          const period = display.closest(".period-navigation")?.dataset.period;
          if (!period) return;

          let newText;
          switch (period) {
            case "weekly":
              newText = formatWeekPeriod(date);
              break;
            case "monthly":
              newText = formatMonthYear(date);
              break;
            case "yearly":
              newText = date.getFullYear().toString();
              break;
            default:
              newText = formatDate(date);
          }

          display.textContent = newText;
        }
      });
    } catch (error) {
      console.error("Error updating period titles:", error);
    }
  },

  destroy() {
    try {
      Object.values(chartInstances).forEach((chart) => {
        if (chart) chart.destroy();
      });
      chartInstances = {};

      window.removeEventListener("resize", () => {
        Object.values(chartInstances).forEach((chart) => {
          if (chart?.canvas) chart.resize();
        });
      });

      document.removeEventListener("languageChanged", () => {
        this.updateAllChartLabels();
        this.updatePeriodTitles();
      });
    } catch (error) {
      console.error("Error destroying charts:", error);
    }
  },
};
