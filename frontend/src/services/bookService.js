import api from "./api";

export const bookService = {
  search:     (query, page = 1, free = false) => api.get("/books/search", { params: { q: query, page, ...(free ? { free: "true" } : {}) } }),
  getById:    (id)              => api.get(`/books/${id}`),
  getContent: (id, page = 1)   => api.get(`/books/${id}/content`, { params: { page } }),
};
