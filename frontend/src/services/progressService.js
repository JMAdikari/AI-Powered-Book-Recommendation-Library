import api from "./api";

export const progressService = {
  getWeekly: () => api.get("/progress/weekly"),
};
