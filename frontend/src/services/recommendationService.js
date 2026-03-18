import api from "./api";

export const recommendationService = {
  get:     () => api.get("/recommendations"),
  refresh: () => api.post("/recommendations/refresh"),
};
